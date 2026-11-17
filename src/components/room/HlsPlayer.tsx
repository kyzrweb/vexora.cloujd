"use client";

import React, { useEffect, useRef } from "react";
import Hls from "hls.js";
import { extractYouTubeId, isHlsStream } from "@/lib/utils";

interface HlsPlayerProps {
  url: string;
}

export function HlsPlayer({ url }: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const youtubeId = extractYouTubeId(url);
  const hlsStream = isHlsStream(url);

  useEffect(() => {
    if (!hlsStream || !videoRef.current) return;

    const video = videoRef.current;
    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch(() => {});
      });
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [url, hlsStream]);

  if (youtubeId) {
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-[#262833]">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
          title="Vexora Watch Party"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-[#262833]">
      <video
        ref={videoRef}
        src={!hlsStream ? url : undefined}
        controls
        playsInline
        className="w-full h-full object-contain"
      />
    </div>
  );
}
