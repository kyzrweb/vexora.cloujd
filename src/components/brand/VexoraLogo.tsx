import React from "react";

interface VexoraLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function VexoraLogo({ size = "md", showText = true }: VexoraLogoProps) {
  const dimensions = {
    sm: "h-8 w-8 text-xs rounded-lg",
    md: "h-10 w-10 text-sm rounded-xl",
    lg: "h-12 w-12 text-base rounded-2xl",
  }[size];

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  }[size];

  return (
    <div className="inline-flex items-center gap-3 select-none">
      <div
        className={`${dimensions} flex items-center justify-center font-black tracking-tighter text-white bg-gradient-to-br from-[#5865f2] via-[#7c4dff] to-[#d946ef] shadow-lg shadow-[#5865f2]/25`}
      >
        VX
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`${textSizes} font-bold tracking-tight text-white leading-none`}>
            VEXORA
          </span>
          <span className="text-[10px] font-medium tracking-widest uppercase text-zinc-400 mt-0.5">
            Live Lobby
          </span>
        </div>
      )}
    </div>
  );
}
