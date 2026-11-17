"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Room } from "@/types/database";
import { HlsPlayer } from "@/components/room/HlsPlayer";
import { LiveKitStage } from "@/components/room/LiveKitStage";
import { RoomChat } from "@/components/room/RoomChat";
import { InviteFriendModal } from "@/components/lobby/InviteFriendModal";
import { ArrowLeft, Trash2 } from "lucide-react";

export default function RoomPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [room, setRoom] = useState<Room | null>(null);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: roomData } = await supabase
        .from("rooms")
        .select("*")
        .eq("code", params.code)
        .single();

      if (!roomData) {
        router.push("/dashboard");
        return;
      }
      setRoom(roomData as Room);
    };

    init();

    const channel = supabase
      .channel(`room-watch-${params.code}`)
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "rooms",
          filter: `code=eq.${params.code}`,
        },
        () => {
          router.push("/dashboard");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.code, router, supabase]);

  const closeRoom = async () => {
    if (!room) return;
    await supabase.from("rooms").delete().eq("id", room.id);
    router.push("/dashboard");
  };

  if (!room || !userId) return null;

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-6rem)] min-h-[600px]">
      {/* Colonna Principale (Header Stanza + Area 4 Stage + Area 3 Utenti + Area 1 Toolbar a scomparsa) */}
      <div className="flex-1 flex flex-col gap-3 min-w-0 h-full">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#13151d] border border-[#262833] px-4 py-3 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 rounded-xl bg-[#181920] hover:bg-[#262833] text-zinc-300 transition cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white">{room.title}</h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#181920] border border-[#262833] text-zinc-400">
                  {room.code}
                </span>
              </div>
              <p className="text-xs text-zinc-400">{room.category}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <InviteFriendModal
              roomId={room.id}
              roomCode={room.code}
              currentUserId={userId}
            />

            {room.owner_id === userId && (
              <button
                onClick={closeRoom}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-300 transition cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Chiudi Stanza
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <LiveKitStage
            roomCode={room.code}
            onLeave={() => router.push("/dashboard")}
            watchPartySlot={
              room.type === "watch_party" && room.stream_url ? (
                <HlsPlayer url={room.stream_url} />
              ) : undefined
            }
          />
        </div>
      </div>

      {/* AREA 2: Chat della stanza all'estrema destra */}
      <div className="w-full lg:w-80 xl:w-96 shrink-0 h-80 lg:h-full">
        <RoomChat roomId={room.id} currentUserId={userId} />
      </div>
    </div>
  );
}