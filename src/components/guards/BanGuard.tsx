"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ShieldAlert } from "lucide-react";

export function BanGuard({ userId }: { userId: string }) {
  const [bannedReason, setBannedReason] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    let active = true;

    const checkBanStatus = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("is_banned, ban_reason")
        .eq("id", userId)
        .single();

      if (active && data?.is_banned) {
        setBannedReason(data.ban_reason || "Violazione del regolamento di Vexora.");
        await supabase.auth.signOut();
      }
    };

    checkBanStatus();

    const channel = supabase
      .channel(`ban-watch-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        async (payload) => {
          const updated = payload.new as { is_banned?: boolean; ban_reason?: string | null };
          if (updated.is_banned) {
            setBannedReason(updated.ban_reason || "Violazione del regolamento di Vexora.");
            await supabase.auth.signOut();
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  if (!bannedReason) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0c0d12]/95 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#13151d] border border-red-500/40 p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 text-red-400">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Account Sospeso</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Il tuo accesso a <span className="text-white font-medium">Vexora</span> è stato revocato dalla Direzione.
        </p>
        <div className="mt-4 rounded-xl bg-[#0f1014] border border-[#262833] p-3 text-left">
          <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
            Motivo del provvedimento
          </span>
          <p className="mt-1 text-sm text-red-300">{bannedReason}</p>
        </div>
        <button
          onClick={() => (window.location.href = "/login")}
          className="mt-6 w-full rounded-xl bg-[#5865f2] hover:bg-[#4752c4] py-2.5 text-sm font-semibold text-white transition cursor-pointer"
        >
          Torna alla schermata di accesso
        </button>
      </div>
    </div>
  );
}
