# Vexora (`vexorastreaming.cloud`) — Starter Kit

Piattaforma web/desktop con **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS**, **Supabase** (Auth, Postgres, RLS, Realtime), **LiveKit** e **Bot Discord Direzione**.

## Avvio Rapido

1. **Database Supabase**
   - Apri il *SQL Editor* su Supabase ed esegui il file `supabase/schema.sql`.
2. **Configurazione Web App**
   - Copia `.env.example` in `.env.local` e inserisci le chiavi Supabase e LiveKit.
   - Installa le dipendenze e avvia:
     ```bash
     npm install
     npm run dev
     ```
3. **Sostituzione Componenti Legali**
   - Sostituisci `src/components/legal/CookieBanner.tsx` e `src/components/legal/LegalModals.tsx` con i tuoi file definitivi.
4. **Bot Discord Direzione (`discord-bot/`)**
   - Entra in `discord-bot/`, crea `.env` con `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, poi esegui:
     ```bash
     npm install
     npm start
     ```
