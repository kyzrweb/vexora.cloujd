import React from "react";
import Link from "next/link";
import { Room } from "@/types/database";
import { Mic, Tv, Lock, ArrowRight } from "lucide-react";

export function RoomCard({ room }: { room: Room }) {
  return (
    <div className="group rounded-2xl bg-[#13151d] border border-[#262833] hover:border-[#5865f2]/60 p-5 flex flex-col justify-between transition">
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#181920] border border-[#262833] px-2.5 py-1 text-[11px] font-semibold text-zinc-300">
            {room.type === "watch_party" ? (
              <Tv className="h-3.5 w-3.5 text-fuchsia-400" />
            ) : (
              <Mic className="h-3.5 w-3.5 text-[#5865f2]" />
            )}
            {room.category}
          </span>
          <div className="flex items-center gap-1.5">
            {room.is_private && <Lock className="h-3.5 w-3.5 text-amber-400" />}
            <span className="text-[11px] font-mono text-zinc-500">{room.code}</span>
          </div>
        </div>

        <h3 className="mt-3 text-base font-bold text-white line-clamp-1">
          {room.title}
        </h3>
        <p className="mt-1 text-xs text-zinc-400">
          Host:{" "}
          <span className="text-zinc-200 font-medium">
            {room.owner?.display_name || room.owner?.username || "Utente"}
          </span>
        </p>
      </div>

      <Link
        href={`/room/${room.code}`}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#181920] group-hover:bg-[#5865f2] border border-[#262833] group-hover:border-[#5865f2] py-2 text-xs font-semibold text-white transition"
      >
        Entra nella Lobby
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
