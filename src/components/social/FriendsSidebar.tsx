"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Friendship, Profile, RoomInvite } from "@/types/database";
import {
  Users,
  UserPlus,
  Check,
  X,
  MessageCircle,
  Gamepad2,
  Bell,
} from "lucide-react";

interface FriendsSidebarProps {
  currentUserId: string;
  activeRoomId?: string;
  onOpenDm: (friend: Profile) => void;
}

export function FriendsSidebar({
  currentUserId,
  activeRoomId,
  onOpenDm,
}: FriendsSidebarProps) {
  const supabase = createClient();

  const [friends, setFriends] = useState<Profile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [invites, setInvites] = useState<RoomInvite[]>([]);
  const [searchUsername, setSearchUsername] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadSocialData = useCallback(async () => {
    // 1. Amicizie accettate e richieste ricevute
    const { data: rows } = await supabase
      .from("friendships")
      .select("*, user:profiles!friendships_user_id_fkey(*), friend:profiles!friendships_friend_id_fkey(*)")
      .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`);

    if (rows) {
      const accepted: Profile[] = [];
      const incoming: Friendship[] = [];

      for (const r of rows as unknown as Friendship[]) {
        if (r.status === "accepted") {
          const other = r.user_id === currentUserId ? r.friend : r.user;
          if (other) accepted.push(other);
        } else if (r.status === "pending" && r.friend_id === currentUserId) {
          incoming.push(r);
        }
      }
      setFriends(accepted);
      setPendingRequests(incoming);
    }

    // 2. Inviti alle stanze ricevuti
    const { data: inviteRows } = await supabase
      .from("room_invites")
      .select("*, room:rooms(*), sender:profiles!room_invites_sender_id_fkey(*)")
      .eq("receiver_id", currentUserId)
      .eq("status", "pending");

    if (inviteRows) {
      setInvites(inviteRows as unknown as RoomInvite[]);
    }
  }, [currentUserId, supabase]);

  useEffect(() => {
    loadSocialData();

    const channel = supabase
      .channel(`social-sidebar-${currentUserId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, loadSocialData)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, loadSocialData)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_invites" }, loadSocialData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, loadSocialData, supabase]);

  const sendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const target = searchUsername.trim().toLowerCase();
    if (!target) return;

    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", target)
      .single();

    if (!targetProfile) {
      setFeedback("Utente non trovato.");
      return;
    }

    const { error } = await supabase.from("friendships").insert({
      user_id: currentUserId,
      friend_id: targetProfile.id,
      status: "pending",
    });

    if (error) {
      setFeedback("Richiesta già inviata o utente già amico.");
    } else {
      setFeedback("Richiesta inviata!");
      setSearchUsername("");
    }
  };

  const respondRequest = async (id: string, accept: boolean) => {
    if (accept) {
      await supabase.from("friendships").update({ status: "accepted" }).eq("id", id);
    } else {
      await supabase.from("friendships").delete().eq("id", id);
    }
    loadSocialData();
  };

  const inviteFriendToRoom = async (friendId: string) => {
    if (!activeRoomId) return;
    await supabase.from("room_invites").upsert({
      room_id: activeRoomId,
      sender_id: currentUserId,
      receiver_id: friendId,
      status: "pending",
    });
    setFeedback("Invito inviato in stanza!");
    setTimeout(() => setFeedback(null), 2500);
  };

  return (
    <aside className="w-full lg:w-80 shrink-0 rounded-2xl bg-[#13151d] border border-[#262833] p-4 flex flex-col gap-5 h-fit lg:sticky lg:top-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-[#5865f2]" />
          <h2 className="text-sm font-bold text-white">Barra Amici</h2>
        </div>
        <span className="text-xs text-zinc-400">
          {friends.filter((f) => f.status !== "offline").length} online
        </span>
      </div>

      {/* Aggiungi Amico */}
      <form onSubmit={sendFriendRequest} className="flex gap-2">
        <input
          type="text"
          value={searchUsername}
          onChange={(e) => setSearchUsername(e.target.value)}
          placeholder="Aggiungi per username..."
          className="flex-1 rounded-xl bg-[#0f1014] border border-[#262833] px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-[#5865f2] focus:outline-none"
        />
        <button
          type="submit"
          title="Invia richiesta"
          className="rounded-xl bg-[#5865f2] hover:bg-[#4752c4] px-3 py-2 text-white transition cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
        </button>
      </form>
      {feedback && <p className="text-[11px] text-indigo-300 -mt-3">{feedback}</p>}

      {/* Inviti alle Stanze */}
      {invites.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5" /> Inviti Live ({invites.length})
          </p>
          {invites.map((inv) => (
            <div
              key={inv.id}
              className="rounded-xl bg-[#181920] border border-amber-500/30 p-2.5 text-xs"
            >
              <p className="text-zinc-300">
                <span className="font-semibold text-white">{inv.sender?.username}</span> ti invita in{" "}
                <span className="text-indigo-300 font-medium">{inv.room?.title}</span>
              </p>
              {inv.room?.code && (
                <Link
                  href={`/room/${inv.room.code}`}
                  className="mt-2 inline-block w-full text-center rounded-lg bg-[#5865f2] hover:bg-[#4752c4] py-1.5 font-semibold text-white"
                >
                  Unisciti ora
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Richieste di amicizia */}
      {pendingRequests.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Richieste ({pendingRequests.length})
          </p>
          {pendingRequests.map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between rounded-xl bg-[#181920] border border-[#262833] px-3 py-2"
            >
              <span className="text-xs font-medium text-white">
                {req.user?.display_name || req.user?.username}
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => respondRequest(req.id, true)}
                  className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => respondRequest(req.id, false)}
                  className="p-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lista Amici */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          I tuoi Amici ({friends.length})
        </p>
        {friends.length === 0 ? (
          <p className="text-xs text-zinc-500">Nessun amico ancora. Aggiungine uno sopra!</p>
        ) : (
          friends.map((friend) => (
            <div
              key={friend.id}
              className="flex items-center justify-between rounded-xl bg-[#181920] border border-[#262833] p-2.5"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      friend.status === "online"
                        ? "bg-emerald-400"
                        : friend.status === "idle"
                        ? "bg-amber-400"
                        : friend.status === "dnd"
                        ? "bg-red-400"
                        : "bg-zinc-600"
                    }`}
                  />
                  <span className="text-xs font-semibold text-white truncate">
                    {friend.display_name || friend.username}
                  </span>
                </div>
                {friend.current_game ? (
                  <p className="text-[11px] text-indigo-300 flex items-center gap-1 mt-0.5 truncate">
                    <Gamepad2 className="h-3 w-3 shrink-0" />
                    {friend.current_game}
                  </p>
                ) : (
                  <p className="text-[11px] text-zinc-500 capitalize mt-0.5">{friend.status}</p>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {activeRoomId && (
                  <button
                    onClick={() => inviteFriendToRoom(friend.id)}
                    className="px-2 py-1 rounded-lg bg-[#5865f2]/20 hover:bg-[#5865f2] text-[10px] font-semibold text-indigo-200 hover:text-white transition cursor-pointer"
                  >
                    Invita
                  </button>
                )}
                <button
                  onClick={() => onOpenDm(friend)}
                  title="Messaggio diretto"
                  className="p-1.5 rounded-lg bg-[#0f1014] hover:bg-[#262833] text-zinc-300 transition cursor-pointer"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
