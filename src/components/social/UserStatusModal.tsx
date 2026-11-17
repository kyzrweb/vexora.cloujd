"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Profile, UserStatus } from "@/types/database";
import { Gamepad2, X, Check } from "lucide-react";

interface UserStatusModalProps {
  profile: Profile;
  onUpdated: (updated: Profile) => void;
}

const STATUS_OPTIONS: { value: UserStatus; label: string; color: string }[] = [
  { value: "online", label: "Online", color: "bg-emerald-400" },
  { value: "idle", label: "Assente", color: "bg-amber-400" },
  { value: "dnd", label: "Non disturbare", color: "bg-red-400" },
  { value: "offline", label: "Invisibile", color: "bg-zinc-500" },
];

export function UserStatusModal({ profile, onUpdated }: UserStatusModalProps) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<UserStatus>(profile.status);
  const [displayName, setDisplayName] = useState(profile.display_name || profile.username);
  const [currentGame, setCurrentGame] = useState(profile.current_game || "");
  const [saving, setSaving] = useState(false);

  const currentDotColor =
    STATUS_OPTIONS.find((s) => s.value === profile.status)?.color || "bg-emerald-400";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { data, error } = await supabase
      .from("profiles")
      .update({
        status,
        display_name: displayName.trim() || profile.username,
        current_game: currentGame.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id)
      .select("*")
      .single();

    setSaving(false);
    if (!error && data) {
      onUpdated(data as Profile);
      setOpen(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 rounded-xl bg-[#13151d] hover:bg-[#181920] border border-[#262833] px-3 py-1.5 text-left transition cursor-pointer"
      >
        <div className="relative">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#5865f2] to-[#7c4dff] flex items-center justify-center text-xs font-bold text-white uppercase">
            {(profile.display_name || profile.username).slice(0, 2)}
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[#13151d] ${currentDotColor}`}
          />
        </div>
        <div className="hidden sm:block">
          <p className="text-xs font-bold text-white leading-tight">
            {profile.display_name || profile.username}
          </p>
          <p className="text-[11px] text-zinc-400 leading-tight mt-0.5">
            {profile.current_game ? `Gioca a ${profile.current_game}` : `@${profile.username}`}
          </p>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#13151d] border border-[#262833] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white">Profilo & Stato Attività</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Nome Visualizzato
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl bg-[#0f1014] border border-[#262833] px-3.5 py-2.5 text-sm text-white focus:border-[#5865f2] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Stato
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStatus(opt.value)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition cursor-pointer ${
                        status === opt.value
                          ? "bg-[#5865f2]/15 border-[#5865f2] text-white"
                          : "bg-[#0f1014] border-[#262833] text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${opt.color}`} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Gioco o Attività in Corso (opzionale)
                </label>
                <div className="relative">
                  <Gamepad2 className="h-4 w-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={currentGame}
                    onChange={(e) => setCurrentGame(e.target.value)}
                    placeholder="es. EA FC 26, Valorant, Watch Party..."
                    className="w-full rounded-xl bg-[#0f1014] border border-[#262833] pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#5865f2] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] py-2.5 text-sm font-semibold text-white transition cursor-pointer"
              >
                <Check className="h-4 w-4" />
                {saving ? "Salvataggio..." : "Salva Stato"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}