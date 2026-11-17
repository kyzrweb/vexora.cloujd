"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types/database";
import { VexoraLogo } from "@/components/brand/VexoraLogo";
import { BanGuard } from "@/components/guards/BanGuard";
import { FriendsSidebar } from "@/components/social/FriendsSidebar";
import { DirectMessageDrawer } from "@/components/social/DirectMessageDrawer";
import { UserStatusModal } from "@/components/social/UserStatusModal";
import { LogOut } from "lucide-react";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const params = useParams<{ code?: string }>();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | undefined>(undefined);
  const [dmFriend, setDmFriend] = useState<Profile | null>(null);

  useEffect(() => {
    const loadMe = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        const prof = data as Profile;
        setProfile(prof);
        if (prof.status === "offline" && !prof.is_banned) {
          await supabase
            .from("profiles")
            .update({ status: "online" })
            .eq("id", prof.id);
        }
      }
    };
    loadMe();
  }, [router, supabase]);

  useEffect(() => {
    if (!params?.code) {
      setActiveRoomId(undefined);
      return;
    }
    supabase
      .from("rooms")
      .select("id")
      .eq("code", params.code)
      .single()
      .then(({ data }) => setActiveRoomId(data?.id));
  }, [params?.code, supabase]);

  const handleLogout = async () => {
    if (profile) {
      await supabase
        .from("profiles")
        .update({ status: "offline", current_game: null })
        .eq("id", profile.id);
    }
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <BanGuard userId={profile.id} />

      <header className="border-b border-[#262833] bg-[#0c0d12]/85 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard">
            <VexoraLogo size="sm" />
          </Link>

          <div className="flex items-center gap-3">
            <UserStatusModal
              profile={profile}
              onUpdated={(updated) => setProfile(updated)}
            />

            <button
              onClick={handleLogout}
              title="Esci"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#13151d] hover:bg-red-500/15 border border-[#262833] hover:border-red-500/40 px-3 py-2 text-xs text-zinc-300 hover:text-red-300 transition cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Esci</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-6">
        <main className="flex-1 min-w-0">{children}</main>
        <FriendsSidebar
          currentUserId={profile.id}
          activeRoomId={activeRoomId}
          onOpenDm={(f) => setDmFriend(f)}
        />
      </div>

      <DirectMessageDrawer
        currentUserId={profile.id}
        friend={dmFriend}
        onClose={() => setDmFriend(null)}
      />
    </div>
  );
}