"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LegalModals } from "@/components/legal/LegalModals";
import { Users, Radio, ShieldCheck, MessageSquare, Loader2 } from "lucide-react";

const FEATURE_CARDS = [
  {
    title: "Stai Insieme",
    description: "Chiamate vocali, webcam e condivisione schermo.",
    icon: Users,
    iconColor: "text-[#6366f1]",
  },
  {
    title: "Live & Partite",
    description: "YouTube, flussi HLS (.m3u8) e schermo condiviso.",
    icon: Radio,
    iconColor: "text-[#f43f5e]",
  },
  {
    title: "Lobby per Categorie",
    description: "Filtra le stanze pubbliche o creane una privata.",
    icon: ShieldCheck,
    iconColor: "text-[#eab308]",
  },
  {
    title: "Amici & Chat",
    description: "Aggiungi amici e invitali con un clic nelle tue stanze.",
    icon: MessageSquare,
    iconColor: "text-[#10b981]",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      if (isRegister) {
        const cleanUser = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
        if (cleanUser.length < 3) {
          throw new Error("Lo username deve contenere almeno 3 caratteri alfanumerici.");
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: cleanUser,
              display_name: username.trim(),
            },
          },
        });
        if (error) throw error;
        setInfoMsg("Registrazione completata! Controlla la tua email o effettua l'accesso.");
        setIsRegister(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        if (data.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("is_banned, ban_reason")
            .eq("id", data.user.id)
            .single();

          if (profile?.is_banned) {
            await supabase.auth.signOut();
            throw new Error(
              `Account sospeso: ${profile.ban_reason || "Violazione dei termini di Vexora."}`
            );
          }

          await supabase
            .from("profiles")
            .update({ status: "online" })
            .eq("id", data.user.id);
        }

        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Errore durante l'autenticazione.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px] rounded-2xl bg-[#13151d]/95 border border-[#262833] p-7 shadow-2xl">
        {/* Header Logo + Titolo */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="h-11 w-11 rounded-xl flex items-center justify-center font-black text-base tracking-tight text-white bg-gradient-to-br from-[#5865f2] via-[#7c4dff] to-[#d946ef] shadow-lg shadow-[#5865f2]/25 shrink-0">
            VX
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">Vexora</h1>
            <p className="text-xs font-mono text-[#7c85f3]">vexorastreaming.cloud</p>
          </div>
        </div>

        {/* Form Login / Registrazione */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nome utente (es. marco_vx)"
              className="w-full rounded-xl bg-[#0f1014] border border-[#262833] px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-[#5865f2] focus:outline-none transition"
            />
          )}

          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Indirizzo email"
            className="w-full rounded-xl bg-[#0f1014] border border-[#262833] px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-[#5865f2] focus:outline-none transition"
          />

          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (minimo 6 caratteri)"
            className="w-full rounded-xl bg-[#0f1014] border border-[#262833] px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-[#5865f2] focus:outline-none transition"
          />

          {errorMsg && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300">
              {errorMsg}
            </div>
          )}

          {infoMsg && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-300">
              {infoMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-60 py-3 text-sm font-semibold text-white transition cursor-pointer mt-1"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isRegister ? "Registrati su Vexora" : "Accedi a Vexora"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg(null);
              setInfoMsg(null);
            }}
            className="text-xs text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
          >
            {isRegister
              ? "Hai già un account? Accedi ora"
              : "Non hai un account? Registrati ora"}
          </button>
        </div>
      </div>

      {/* Box Informativo Sottostante */}
      <div className="w-full max-w-[680px] mt-6 rounded-2xl bg-[#13151d]/90 border border-[#262833] p-6 sm:p-7 shadow-xl">
        <div className="text-center max-w-lg mx-auto">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#7c85f3]">
            COS&apos;È E COSA FA VEXORA?
          </h2>
          <p className="mt-2 text-xs sm:text-[13px] text-zinc-400 leading-relaxed">
            Un&apos;unica piattaforma per creare stanze vocali e video con gli amici oppure guardare partite, live e cinema sincronizzati divisi per categoria.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="rounded-xl bg-[#181920]/90 border border-[#262833] p-3.5"
              >
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${card.iconColor} shrink-0`} />
                  <h3 className="text-xs font-bold text-white">{card.title}</h3>
                </div>
                <p className="mt-1.5 text-[11px] text-zinc-400 leading-relaxed">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-4 border-t border-[#262833]/70">
          <LegalModals />
        </div>
      </div>
    </div>
  );
}