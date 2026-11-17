"use client";

import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { RoomMessage } from "@/types/database";
import { formatTime } from "@/lib/utils";
import { Send } from "lucide-react";

interface RoomChatProps {
  roomId: string;
  currentUserId: string;
}

export function RoomChat({ roomId, currentUserId }: RoomChatProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*, profile:profiles(*)")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (data) setMessages(data as unknown as RoomMessage[]);
    };

    loadMessages();

    const channel = supabase
      .channel(`room-chat-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", payload.new.user_id)
            .single();

          const newMsg: RoomMessage = {
            ...(payload.new as RoomMessage),
            profile: profile || undefined,
          };
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setText("");

    await supabase.from("messages").insert({
      room_id: roomId,
      user_id: currentUserId,
      content,
    });
  };

  return (
    <div className="flex flex-col h-full rounded-xl bg-[#13151d] border border-[#262833] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#262833] flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
          Chat della Stanza
        </span>
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-xs text-zinc-500 text-center mt-8">
            Nessun messaggio ancora. Saluta la stanza!
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="text-sm">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-white text-xs">
                {msg.profile?.display_name || msg.profile?.username || "Utente"}
              </span>
              <span className="text-[10px] text-zinc-500">{formatTime(msg.created_at)}</span>
            </div>
            <p className="text-zinc-300 text-xs mt-0.5 break-words">{msg.content}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="p-3 border-t border-[#262833] flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Scrivi nella stanza..."
          className="flex-1 rounded-lg bg-[#0f1014] border border-[#262833] px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-[#5865f2] focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-[#5865f2] hover:bg-[#4752c4] px-3 py-2 text-white transition cursor-pointer"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
