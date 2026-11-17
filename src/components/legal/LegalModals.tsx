"use client";

import React, { useState } from "react";

export function LegalModals() {
  const [openModal, setOpenModal] = useState<"privacy" | "terms" | null>(null);

  return (
    <>
      <div className="flex items-center justify-center gap-4 text-xs text-zinc-500">
        <button
          type="button"
          onClick={() => setOpenModal("terms")}
          className="hover:text-zinc-300 transition cursor-pointer"
        >
          Termini di Servizio
        </button>
        <span>•</span>
        <button
          type="button"
          onClick={() => setOpenModal("privacy")}
          className="hover:text-zinc-300 transition cursor-pointer"
        >
          Privacy Policy
        </button>
      </div>

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#13151d] border border-[#262833] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">
              {openModal === "terms" ? "Termini di Servizio — Vexora" : "Privacy Policy — Vexora"}
            </h3>
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
              Sostituisci questo file con il tuo componente LegalModals.tsx definitivo.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setOpenModal(null)}
                className="px-4 py-2 rounded-lg bg-[#5865f2] hover:bg-[#4752c4] text-sm font-medium text-white transition cursor-pointer"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
