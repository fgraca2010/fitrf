-- ============================
-- FitRF – Migration 004: Atividades físicas + avatar
-- ============================

-- Coluna de avatar no perfil
alter table profiles
  add column if not exists avatar_url text;

-- Registro de atividades físicas
create table if not exists activity_logs (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users on delete cascade not null,
  date         date not null,
  activity     text not null,
  met          numeric not null,
  duration_min integer not null,
  calories     numeric not null,
  notes        text,
  created_at   timestamptz default now()
);

alter table activity_logs enable row level security;

create policy "activity_logs_own" on activity_logs for all
  using (auth.uid() = user_id);

-- Amigos podem ver atividades (mesma lógica das refeições)
create policy "activity_logs_friends_read" on activity_logs for select
  using (are_friends(auth.uid(), user_id));

-- ============================
-- Storage bucket para avatares
-- ============================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "avatars_public_read" on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_own_upload" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "avatars_own_update" on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "avatars_own_delete" on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
