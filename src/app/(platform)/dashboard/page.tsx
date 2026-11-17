"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Room } from "@/types/database";
import { ROOM_CATEGORIES } from "@/lib/utils";
import { CreateRoomModal } from "@/components/lobby/CreateRoomModal";
import { RoomCard } from "@/components/lobby/RoomCard";

export default function DashboardPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string>("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Tutte");

  const fetchRooms = useCallback(async () => {
    let query = supabase
      .from("rooms")
      .select("*, owner:profiles!rooms_owner_id_fkey(*)")
      .order("created_at", { ascending: false });

    if (selectedCategory !== "Tutte") {
      query = query.eq("category", selectedCategory);
    }

    const { data } = await query;
    if (data) setRooms(data as unknown as Room[]);
  }, [selectedCategory, supabase]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, [supabase]);

  useEffect(() => {
    fetchRooms();

    const channel = supabase
      .channel("lobby-rooms")
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, fetchRooms)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRooms, supabase]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Stanze Live (Lobby)</h1>
          <p className="text-sm text-zinc-400">
            Entra in una lobby attiva o avvia subito la tua stanza vocale o Watch Party.
          </p>
        </div>
        {userId && <CreateRoomModal userId={userId} />}
      </div>

      {/* Filtro Categorie */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {ROOM_CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition cursor-pointer ${
              selectedCategory === category
                ? "bg-[#5865f2] border-[#5865f2] text-white"
                : "bg-[#13151d] border-[#262833] text-zinc-400 hover:text-white"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Griglia Stanze */}
      {rooms.length === 0 ? (
        <div className="rounded-2xl bg-[#13151d] border border-[#262833] p-12 text-center">
          <p className="text-sm font-medium text-zinc-300">
            Nessuna stanza attiva in questa categoria.
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Creane una tu e invita i tuoi amici dalla barra laterale!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
    </div>
  );
}
