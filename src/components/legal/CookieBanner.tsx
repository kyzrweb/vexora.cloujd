"use client";

import React, { useState, useEffect } from "react";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("vexora_cookie_consent");
    if (!consent) setVisible(true);
  }, []);

  if (!visible) return null;

  const accept = () => {
    localStorage.setItem("vexora_cookie_consent", "accepted");
    setVisible(false);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 rounded-xl bg-[#13151d] border border-[#262833] p-4 shadow-2xl">
      <p className="text-xs text-zinc-300 leading-relaxed">
        Vexora utilizza cookie tecnici essenziali per l&apos;autenticazione e il funzionamento delle stanze live.
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <button
          onClick={accept}
          className="px-3 py-1.5 rounded-lg bg-[#5865f2] hover:bg-[#4752c4] text-xs font-semibold text-white transition cursor-pointer"
        >
          Accetta
        </button>
      </div>
    </div>
  );
}
