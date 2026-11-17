"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Friendship, Profile } from "@/types/database";
import { UserPlus, X, Copy, Check, Send } from "lucide-react";

interface InviteFriendModalProps {
  roomId: string;
  roomCode: string;
  currentUserId: string;
}

export function InviteFriendModal({
  roomId,
  roomCode,
  currentUserId,
}: InviteFriendModalProps) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [invitedIds, setInvitedIds] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;

    const loadFriends = async () => {
      const { data } = await supabase
        .from("friendships")
        .select(
          "*, user:profiles!friendships_user_id_fkey(*), friend:profiles!friendships_friend_id_fkey(*)"
        )
        .eq("status", "accepted")
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`);

      if (data) {
        const list: Profile[] = [];
        for (const r of data as unknown as Friendship[]) {
          const other = r.user_id === currentUserId ? r.friend : r.user;
          if (other) list.push(other);
        }
        setFriends(list);
      }
    };

    loadFriends();
  }, [open, currentUserId, supabase]);

  const sendInvite = async (friendId: string) => {
    await supabase.from("room_invites").upsert({
      room_id: roomId,
      sender_id: currentUserId,
      receiver_id: friendId,
      status: "pending",
    });
    setInvitedIds((prev) => ({ ...prev, [friendId]: true }));
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] px-3 py-2 text-xs font-semibold text-white transition cursor-pointer"
      >
        <UserPlus className="h-3.5 w-3.5" />
        Invita
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#13151d] border border-[#262833] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">Invita Amici nella Stanza</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Codice rapido */}
            <div className="flex items-center justify-between rounded-xl bg-[#0f1014] border border-[#262833] px-3.5 py-2.5 mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                  Codice Stanza
                </p>
                <p className="text-sm font-mono font-bold text-white">{roomCode}</p>
              </div>
              <button
                type="button"
                onClick={copyCode}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#181920] hover:bg-[#262833] border border-[#262833] px-3 py-1.5 text-xs font-medium text-zinc-200 transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    Copiato
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copia
                  </>
                )}
              </button>
            </div>

            {/* Lista Amici invitabili */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {friends.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-6">
                  Nessun amico disponibile da invitare.
                </p>
              ) : (
                friends.map((f) => {
                  const sent = invitedIds[f.id];
                  return (
                    <div
                      key={f.id}
                      className="flex items-center justify-between rounded-xl bg-[#181920] border border-[#262833] px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            f.status === "online" ? "bg-emerald-400" : "bg-zinc-600"
                          }`}
                        />
                        <span className="text-xs font-semibold text-white">
                          {f.display_name || f.username}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={sent}
                        onClick={() => sendInvite(f.id)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                          sent
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-[#5865f2] hover:bg-[#4752c4] text-white"
                        }`}
                      >
                        <Send className="h-3 w-3" />
                        {sent ? "Inviato" : "Invita"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}