"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  useLocalParticipant,
  VideoTrack,
  isTrackReference,
  TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import {
  Loader2,
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  PhoneOff,
  User,
} from "lucide-react";

interface LiveKitStageProps {
  roomCode: string;
  onLeave?: () => void;
  watchPartySlot?: React.ReactNode;
}

export function LiveKitStage({
  roomCode,
  onLeave,
  watchPartySlot,
}: LiveKitStageProps) {
  const [token, setToken] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(
          `/api/livekit/token?room=${encodeURIComponent(roomCode)}`
        );
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error || "Errore connessione vocale/video");
        if (mounted) setToken(data.token);
      } catch (err: unknown) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Impossibile ottenere il token LiveKit"
          );
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [roomCode]);

  if (error) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center rounded-2xl bg-[#13151d] border border-red-500/30 p-6 text-center">
        <p className="text-sm text-red-300">{error}</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-3 rounded-2xl bg-[#13151d] border border-[#262833]">
        <Loader2 className="h-7 w-7 animate-spin text-[#5865f2]" />
        <span className="text-xs text-zinc-400">
          Connessione alla stanza live...
        </span>
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={false}
      audio={true}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      onDisconnected={onLeave}
      className="h-full"
    >
      <StageContent onLeave={onLeave} watchPartySlot={watchPartySlot} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function StageContent({
  onLeave,
  watchPartySlot,
}: {
  onLeave?: () => void;
  watchPartySlot?: React.ReactNode;
}) {
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } =
    useLocalParticipant();

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  const screenTracks = tracks.filter(
    (t) => t.source === Track.Source.ScreenShare && isTrackReference(t)
  );
  const cameraTracks = tracks.filter((t) => t.source === Track.Source.Camera);

  const hasScreenShare = screenTracks.length > 0;
  const hasFeaturedContent = hasScreenShare || Boolean(watchPartySlot);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 3200);
  }, []);

  useEffect(() => {
    revealControls();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [revealControls]);

  const toggleControlsOnClick = () => {
    if (controlsVisible) {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      setControlsVisible(false);
    } else {
      revealControls();
    }
  };

  return (
    <div
      onMouseMove={revealControls}
      onMouseEnter={revealControls}
      onClick={toggleControlsOnClick}
      className="relative flex flex-col justify-between h-full min-h-[540px] rounded-2xl bg-[#13151d] border border-[#262833] p-4 overflow-hidden select-none"
    >
      {/* AREA 4: Posto centrale per Schermo Condiviso / Watch Party oppure Griglia Utenti */}
      <div className="flex-1 flex items-center justify-center min-h-0 w-full">
        {hasScreenShare ? (
          <div className="w-full h-full flex items-center justify-center rounded-xl bg-black border border-[#262833] overflow-hidden">
            {isTrackReference(screenTracks[0]) && (
              <VideoTrack
                trackRef={screenTracks[0]}
                className="w-full h-full max-h-[65vh] object-contain"
              />
            )}
          </div>
        ) : watchPartySlot ? (
          <div className="w-full max-w-4xl">{watchPartySlot}</div>
        ) : (
          /* Nessuna condivisione schermo: gli utenti occupano l'area principale 4 */
          <div
            className={`grid gap-4 w-full h-full place-items-center ${
              cameraTracks.length <= 1
                ? "grid-cols-1 max-w-2xl"
                : cameraTracks.length <= 4
                ? "grid-cols-1 sm:grid-cols-2"
                : "grid-cols-2 md:grid-cols-3"
            }`}
          >
            {cameraTracks.map((trackRef) => (
              <ParticipantTile
                key={trackRef.participant.identity}
                trackRef={trackRef}
                compact={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* AREA 3: Utenti spostati in basso a sinistra quando c'è Condivisione Schermo / Watch Party */}
      {hasFeaturedContent && cameraTracks.length > 0 && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-3 flex items-center gap-2.5 overflow-x-auto pb-1 z-10 max-w-full lg:max-w-[55%]"
        >
          {cameraTracks.map((trackRef) => (
            <ParticipantTile
              key={trackRef.participant.identity}
              trackRef={trackRef}
              compact={true}
            />
          ))}
        </div>
      )}

      {/* AREA 1: Barra degli strumenti a scomparsa (hover o clic sullo schermo) */}
      <div
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => {
          if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
          setControlsVisible(true);
        }}
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-2xl bg-[#181920]/95 backdrop-blur-md border border-[#262833] px-3 py-2 shadow-2xl transition-all duration-300 ${
          controlsVisible
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {/* Microfono */}
        <button
          type="button"
          onClick={() =>
            localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)
          }
          title={isMicrophoneEnabled ? "Disattiva microfono" : "Attiva microfono"}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition cursor-pointer ${
            isMicrophoneEnabled
              ? "bg-[#13151d] hover:bg-[#262833] text-white border border-[#262833]"
              : "bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40"
          }`}
        >
          {isMicrophoneEnabled ? (
            <Mic className="h-4 w-4 text-emerald-400" />
          ) : (
            <MicOff className="h-4 w-4 text-red-400" />
          )}
          <span className="hidden sm:inline">
            {isMicrophoneEnabled ? "Mic" : "Muto"}
          </span>
        </button>

        {/* Videocamera */}
        <button
          type="button"
          onClick={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
          title={isCameraEnabled ? "Spegni webcam" : "Accendi webcam"}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition cursor-pointer ${
            isCameraEnabled
              ? "bg-[#5865f2] text-white"
              : "bg-[#13151d] hover:bg-[#262833] text-zinc-300 border border-[#262833]"
          }`}
        >
          {isCameraEnabled ? (
            <Video className="h-4 w-4" />
          ) : (
            <VideoOff className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Cam</span>
        </button>

        {/* Condivisione Schermo */}
        <button
          type="button"
          onClick={() =>
            localParticipant.setScreenShareEnabled(!isScreenShareEnabled)
          }
          title={
            isScreenShareEnabled
              ? "Interrompi condivisione schermo"
              : "Condividi schermo"
          }
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition cursor-pointer ${
            isScreenShareEnabled
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              : "bg-[#13151d] hover:bg-[#262833] text-zinc-300 border border-[#262833]"
          }`}
        >
          <MonitorUp className="h-4 w-4" />
          <span className="hidden sm:inline">
            {isScreenShareEnabled ? "In condivisione" : "Schermo"}
          </span>
        </button>

        {/* Esci dalla chiamata */}
        <button
          type="button"
          onClick={onLeave}
          title="Abbandona stanza"
          className="flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-3.5 py-2.5 text-xs font-semibold text-white transition cursor-pointer"
        >
          <PhoneOff className="h-4 w-4" />
          <span className="hidden sm:inline">Esci</span>
        </button>
      </div>
    </div>
  );
}

function ParticipantTile({
  trackRef,
  compact,
}: {
  trackRef: TrackReferenceOrPlaceholder;
  compact: boolean;
}) {
  const hasVideo =
    isTrackReference(trackRef) &&
    trackRef.publication &&
    !trackRef.publication.isMuted;
  const isSpeaking = trackRef.participant.isSpeaking;
  const name =
    trackRef.participant.name || trackRef.participant.identity || "Utente";

  return (
    <div
      className={`relative rounded-xl bg-[#181920] overflow-hidden flex items-center justify-center transition ${
        compact
          ? "w-36 h-24 shrink-0"
          : "w-full h-full min-h-[240px] max-h-[420px]"
      } ${
        isSpeaking
          ? "border-2 border-[#5865f2] shadow-lg shadow-[#5865f2]/20"
          : "border border-[#262833]"
      }`}
    >
      {hasVideo && isTrackReference(trackRef) ? (
        <VideoTrack
          trackRef={trackRef}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-zinc-500">
          <div
            className={`${
              compact ? "h-10 w-10" : "h-20 w-20"
            } rounded-full bg-[#262833] flex items-center justify-center`}
          >
            <User className={compact ? "h-5 w-5" : "h-10 w-10"} />
          </div>
        </div>
      )}

      <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white truncate max-w-[85%]">
        {name}
      </span>
    </div>
  );
}