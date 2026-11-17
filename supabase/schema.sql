-- ==========================================
-- 1. ESTENSIONI
-- ==========================================
create extension if not exists "uuid-ossp";

-- ==========================================
-- 2. TABELLE PRINCIPALI
-- ==========================================

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  status text not null default 'offline' check (status in ('online', 'idle', 'dnd', 'offline')),
  current_game text,
  is_banned boolean not null default false,
  ban_reason text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.rooms (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  title text not null,
  type text not null default 'voice' check (type in ('voice', 'watch_party')),
  category text not null default 'Just Chatting',
  stream_url text,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  is_private boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.room_invites (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references public.rooms(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique(room_id, sender_id, receiver_id)
);

create table public.friendships (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  friend_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  constraint friendships_no_self check (user_id <> friend_id),
  unique(user_id, friend_id)
);

create table public.direct_messages (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references public.rooms(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table public.direction_reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid references public.profiles(id) on delete set null,
  target_user_id uuid references public.profiles(id) on delete set null,
  room_id uuid references public.rooms(id) on delete set null,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  handled_by text,
  created_at timestamptz not null default now()
);

-- ==========================================
-- 3. INDICI PER PERFORMANCE
-- ==========================================
create index idx_rooms_category on public.rooms(category);
create index idx_rooms_code on public.rooms(code);
create index idx_messages_room_id on public.messages(room_id, created_at);
create index idx_dm_users on public.direct_messages(sender_id, receiver_id, created_at);
create index idx_friendships_users on public.friendships(user_id, friend_id);

-- ==========================================
-- 4. TRIGGER CREAZIONE PROFILO AUTOMATICA
-- ==========================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_username text;
begin
  base_username := coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 4)
  );

  insert into public.profiles (id, username, display_name, avatar_url, status)
  values (
    new.id,
    lower(regexp_replace(base_username, '[^a-zA-Z0-9_]', '', 'g')),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'online'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- 5. FUNZIONE HELPER ANTI-BAN PER RLS
-- ==========================================
create or replace function public.is_not_banned()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select not coalesce(
    (select is_banned from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ==========================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ==========================================
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_invites enable row level security;
alter table public.friendships enable row level security;
alter table public.direct_messages enable row level security;
alter table public.messages enable row level security;
alter table public.direction_reports enable row level security;

create policy "Profili visibili agli utenti autenticati"
  on public.profiles for select to authenticated using (true);

create policy "Utente aggiorna solo il proprio profilo"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

create policy "Stanze pubbliche o invitate visibili"
  on public.rooms for select to authenticated
  using (
    public.is_not_banned() and (
      is_private = false
      or owner_id = auth.uid()
      or exists (
        select 1 from public.room_invites
        where room_id = rooms.id and receiver_id = auth.uid()
      )
    )
  );

create policy "Utenti non bannati creano stanze"
  on public.rooms for insert to authenticated
  with check (public.is_not_banned() and auth.uid() = owner_id);

create policy "Owner aggiorna la propria stanza"
  on public.rooms for update to authenticated
  using (public.is_not_banned() and auth.uid() = owner_id);

create policy "Owner elimina la propria stanza"
  on public.rooms for delete to authenticated
  using (auth.uid() = owner_id);

create policy "Inviti visibili a mittente e destinatario"
  on public.room_invites for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Utenti creano inviti per stanze"
  on public.room_invites for insert to authenticated
  with check (public.is_not_banned() and auth.uid() = sender_id);

create policy "Destinatario aggiorna stato invito"
  on public.room_invites for update to authenticated
  using (auth.uid() = receiver_id);

create policy "Amicizie visibili ai coinvolti"
  on public.friendships for select to authenticated
  using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Invio richiesta amicizia"
  on public.friendships for insert to authenticated
  with check (public.is_not_banned() and auth.uid() = user_id);

create policy "Accetta o modifica amicizia"
  on public.friendships for update to authenticated
  using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Rimuovi amicizia"
  on public.friendships for delete to authenticated
  using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "DM visibili a mittente e destinatario"
  on public.direct_messages for select to authenticated
  using (public.is_not_banned() and (auth.uid() = sender_id or auth.uid() = receiver_id));

create policy "Invio DM se non bannati"
  on public.direct_messages for insert to authenticated
  with check (public.is_not_banned() and auth.uid() = sender_id);

create policy "Segna DM come letto"
  on public.direct_messages for update to authenticated
  using (auth.uid() = receiver_id);

create policy "Messaggi stanza visibili agli autenticati non bannati"
  on public.messages for select to authenticated
  using (public.is_not_banned());

create policy "Invio messaggi stanza se non bannati"
  on public.messages for insert to authenticated
  with check (public.is_not_banned() and auth.uid() = user_id);

create policy "Creazione segnalazione"
  on public.direction_reports for insert to authenticated
  with check (public.is_not_banned() and auth.uid() = reporter_id);

create policy "Utente vede le proprie segnalazioni"
  on public.direction_reports for select to authenticated
  using (auth.uid() = reporter_id);

-- ==========================================
-- 7. ATTIVAZIONE SUPABASE REALTIME
-- ==========================================
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.room_invites;
alter publication supabase_realtime add table public.friendships;
alter publication supabase_realtime add table public.direct_messages;
alter publication supabase_realtime add table public.messages;
