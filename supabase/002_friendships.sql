-- ============================
-- FitRF – Migration 002: Friendships (conexões entre perfis)
-- Execute no SQL Editor do Supabase APÓS o schema inicial (001)
-- ============================

-- Tabela de conexões entre usuários
create table if not exists friendships (
  id uuid default gen_random_uuid() primary key,
  requester_id uuid references auth.users on delete cascade not null,
  target_id    uuid references auth.users on delete cascade not null,
  status text not null default 'pending', -- 'pending' | 'accepted' | 'rejected'
  created_at timestamptz default now(),
  unique (requester_id, target_id),
  check (requester_id <> target_id)
);

alter table friendships enable row level security;

-- Leitura: qualquer parte da conexão pode ver
create policy "friendships_select" on friendships for select
  using (auth.uid() = requester_id or auth.uid() = target_id);

-- Criar solicitação: apenas o solicitante
create policy "friendships_insert" on friendships for insert
  with check (auth.uid() = requester_id);

-- Atualizar status: apenas o destinatário (aceitar/rejeitar)
create policy "friendships_update" on friendships for update
  using (auth.uid() = target_id);

-- Deletar (desfazer): qualquer parte
create policy "friendships_delete" on friendships for delete
  using (auth.uid() = requester_id or auth.uid() = target_id);

-- ============================
-- Função auxiliar: verifica amizade aceita entre dois usuários
-- ============================
create or replace function are_friends(a uuid, b uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from friendships
    where status = 'accepted'
      and (
        (requester_id = a and target_id = b) or
        (requester_id = b and target_id = a)
      )
  );
$$;

-- ============================
-- Ampliar RLS para amigos lerem dados uns dos outros
-- ============================

-- Perfis: amigos podem ler o perfil (nome + metas)
drop policy if exists "profiles_own" on profiles;
create policy "profiles_own" on profiles for all
  using (auth.uid() = id);

create policy "profiles_friends_read" on profiles for select
  using (are_friends(auth.uid(), id));

-- Meal logs: amigos podem ler
drop policy if exists "meal_logs_own" on meal_logs;
create policy "meal_logs_own" on meal_logs for all
  using (auth.uid() = user_id);

create policy "meal_logs_friends_read" on meal_logs for select
  using (are_friends(auth.uid(), user_id));

-- Meal log items: amigos podem ler (via meal_logs)
drop policy if exists "meal_log_items_own" on meal_log_items;
create policy "meal_log_items_own" on meal_log_items for all
  using (
    exists (select 1 from meal_logs where id = meal_log_id and user_id = auth.uid())
  );

create policy "meal_log_items_friends_read" on meal_log_items for select
  using (
    exists (
      select 1 from meal_logs ml
      where ml.id = meal_log_id and are_friends(auth.uid(), ml.user_id)
    )
  );

-- Marmitas: amigos podem ler
drop policy if exists "marmitas_own" on marmitas;
create policy "marmitas_own" on marmitas for all
  using (auth.uid() = user_id);

create policy "marmitas_friends_read" on marmitas for select
  using (are_friends(auth.uid(), user_id));

-- Marmita items: amigos podem ler
drop policy if exists "marmita_items_own" on marmita_items;
create policy "marmita_items_own" on marmita_items for all
  using (
    exists (select 1 from marmitas where id = marmita_id and user_id = auth.uid())
  );

create policy "marmita_items_friends_read" on marmita_items for select
  using (
    exists (
      select 1 from marmitas m
      where m.id = marmita_id and are_friends(auth.uid(), m.user_id)
    )
  );
