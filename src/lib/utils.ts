export const ROOM_CATEGORIES = [
  "Tutte",
  "Just Chatting",
  "Gaming",
  "Watch Party",
  "Musica & Chill",
  "Studio & Lavoro",
  "Tornei & Eventi",
] as const;

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `VX-${suffix}`;
}

export function extractYouTubeId(url: string): string | null {
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export function isHlsStream(url: string): boolean {
  return url.toLowerCase().includes(".m3u8");
}

export function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
