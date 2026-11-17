import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CookieBanner } from "@/components/legal/CookieBanner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vexora — Live Lobby, Watch Party & Voice Chat",
  description: "Stanze live unificate per categoria, watch party sincronizzati e amici sempre connessi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className="dark">
      <body className={`${inter.className} vexora-bg text-zinc-100 antialiased`}>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
