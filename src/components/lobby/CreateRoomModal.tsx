"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateRoomCode, ROOM_CATEGORIES } from "@/lib/utils";
import { RoomType } from "@/types/database";
import { Plus, X, Mic, Tv, Lock, Globe } from "lucide-react";

export function CreateRoomModal({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<RoomType>("voice");
  const [category, setCategory] = useState<string>("Just Chatting");
  const [streamUrl, setStreamUrl] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    const code = generateRoomCode();
    const { data, error } = await supabase
      .from("rooms")
      .insert({
        code,
        title: title.trim(),
        type,
        category,
        stream_url: type === "watch_party" ? streamUrl.trim() || null : null,
        owner_id: userId,
        is_private: isPrivate,
      })
      .select("code")
      .single();

    setLoading(false);
    if (!error && data) {
      setOpen(false);
      router.push(`/room/${data.code}`);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#5865f2]/20 transition cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        Crea Stanza Live
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#13151d] border border-[#262833] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Nuova Stanza Live</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Titolo Stanza
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="es. Chill serale & Ranked"
                  className="w-full rounded-xl bg-[#0f1014] border border-[#262833] px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#5865f2] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType("voice")}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition cursor-pointer ${
                    type === "voice"
                      ? "bg-[#5865f2]/15 border-[#5865f2] text-white"
                      : "bg-[#0f1014] border-[#262833] text-zinc-400"
                  }`}
                >
                  <Mic className="h-4 w-4" />
                  Vocale & Screen
                </button>
                <button
                  type="button"
                  onClick={() => setType("watch_party")}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition cursor-pointer ${
                    type === "watch_party"
                      ? "bg-[#5865f2]/15 border-[#5865f2] text-white"
                      : "bg-[#0f1014] border-[#262833] text-zinc-400"
                  }`}
                >
                  <Tv className="h-4 w-4" />
                  Watch Party
                </button>
              </div>

              {type === "watch_party" && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Link YouTube o Stream (.m3u8)
                  </label>
                  <input
                    type="url"
                    required
                    value={streamUrl}
                    onChange={(e) => setStreamUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... oppure .m3u8"
                    className="w-full rounded-xl bg-[#0f1014] border border-[#262833] px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#5865f2] focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl bg-[#0f1014] border border-[#262833] px-3.5 py-2.5 text-sm text-white focus:border-[#5865f2] focus:outline-none"
                >
                  {ROOM_CATEGORIES.filter((c) => c !== "Tutte").map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-[#0f1014] border border-[#262833] p-3">
                <div className="flex items-center gap-2.5">
                  {isPrivate ? (
                    <Lock className="h-4 w-4 text-amber-400" />
                  ) : (
                    <Globe className="h-4 w-4 text-emerald-400" />
                  )}
                  <div>
                    <p className="text-xs font-semibold text-white">
                      {isPrivate ? "Stanza Privata (Solo su invito)" : "Lobby Pubblica"}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {isPrivate
                        ? "Visibile solo agli amici che inviti"
                        : "Visibile nella bacheca Vexora"}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="h-4 w-4 accent-[#5865f2]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#5865f2] hover:bg-[#4752c4] py-2.5 text-sm font-semibold text-white transition cursor-pointer"
              >
                {loading ? "Avvio stanza..." : "Avvia Stanza"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
