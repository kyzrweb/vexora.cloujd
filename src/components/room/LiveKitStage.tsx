"use client";

import React, { useEffect, useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Loader2 } from "lucide-react";

interface LiveKitStageProps {
  roomCode: string;
  onLeave?: () => void;
}

export function LiveKitStage({ roomCode, onLeave }: LiveKitStageProps) {
  const [token, setToken] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/livekit/token?room=${encodeURIComponent(roomCode)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Errore connessione vocale/video");
        if (mounted) setToken(data.token);
      } catch (err: unknown) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Impossibile ottenere il token LiveKit");
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [roomCode]);

  if (error) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-xl bg-[#13151d] border border-red-500/30 p-6 text-center">
        <p className="text-sm text-red-300">{error}</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl bg-[#13151d] border border-[#262833]">
        <Loader2 className="h-7 w-7 animate-spin text-[#5865f2]" />
        <span className="text-xs text-zinc-400">Connessione alla stanza live...</span>
      </div>
    );
  }

  return (
    <div className="h-full min-h-[420px] rounded-xl overflow-hidden border border-[#262833] bg-[#0f1014]" data-lk-theme="default">
      <LiveKitRoom
        video={false}
        audio={true}
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        onDisconnected={onLeave}
        className="h-full"
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
