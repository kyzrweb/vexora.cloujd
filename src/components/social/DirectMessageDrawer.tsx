"use client";

import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DirectMessage, Profile } from "@/types/database";
import { formatTime } from "@/lib/utils";
import { X, Send } from "lucide-react";

interface DirectMessageDrawerProps {
  currentUserId: string;
  friend: Profile | null;
  onClose: () => void;
}

export function DirectMessageDrawer({
  currentUserId,
  friend,
  onClose,
}: DirectMessageDrawerProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!friend) return;

    const loadDms = async () => {
      const { data } = await supabase
        .from("direct_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${friend.id}),and(sender_id.eq.${friend.id},receiver_id.eq.${currentUserId})`
        )
        .order("created_at", { ascending: true })
        .limit(100);

      if (data) setMessages(data as DirectMessage[]);
    };

    loadDms();

    const channel = supabase
      .channel(`dm-${currentUserId}-${friend.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages" },
        (payload) => {
          const msg = payload.new as DirectMessage;
          const isRelevant =
            (msg.sender_id === currentUserId && msg.receiver_id === friend.id) ||
            (msg.sender_id === friend.id && msg.receiver_id === currentUserId);
          if (isRelevant) {
            setMessages((prev) => [...prev, msg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, friend, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!friend) return null;

  const sendDm = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setText("");

    await supabase.from("direct_messages").insert({
      sender_id: currentUserId,
      receiver_id: friend.id,
      content,
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 sm:w-96 rounded-2xl bg-[#13151d] border border-[#262833] shadow-2xl overflow-hidden flex flex-col h-96">
      <div className="px-4 py-3 bg-[#181920] border-b border-[#262833] flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-white">
            {friend.display_name || friend.username}
          </p>
          <p className="text-[10px] text-zinc-400">@{friend.username}</p>
        </div>
        <button onClick={onClose} className="text-zinc-400 hover:text-white cursor-pointer">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          return (
            <div
              key={m.id}
              className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-3 py-2 text-xs ${
                  mine
                    ? "bg-[#5865f2] text-white"
                    : "bg-[#181920] border border-[#262833] text-zinc-200"
                }`}
              >
                {m.content}
              </div>
              <span className="text-[10px] text-zinc-500 mt-0.5">
                {formatTime(m.created_at)}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendDm} className="p-2.5 border-t border-[#262833] flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Scrivi un messaggio..."
          className="flex-1 rounded-lg bg-[#0f1014] border border-[#262833] px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-[#5865f2] focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-[#5865f2] hover:bg-[#4752c4] px-3 py-1.5 text-white cursor-pointer"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
