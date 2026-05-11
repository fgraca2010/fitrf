-- ============================
-- FitRF – Schema Supabase
-- Execute no SQL Editor do Supabase
-- ============================

-- Tabela de perfis dos usuários
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  calorie_goal integer not null default 2000,
  protein_goal integer not null default 125,
  carbs_goal integer not null default 250,
  fat_goal integer not null default 55,
  created_at timestamptz default now()
);

-- Tabela de alimentos (TBCA + personalizados)
create table if not exists foods (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  calories_per_100g numeric not null,
  protein_per_100g numeric not null default 0,
  carbs_per_100g numeric not null default 0,
  fat_per_100g numeric not null default 0,
  fiber_per_100g numeric not null default 0,
  category text not null,
  source text not null default 'tbca',
  created_by uuid references auth.users,
  created_at timestamptz default now()
);

-- Tabela de registros de refeições (por dia e tipo)
create table if not exists meal_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  date date not null,
  meal_type text not null,
  created_at timestamptz default now()
);

-- Itens de cada refeição do diário
create table if not exists meal_log_items (
  id uuid default gen_random_uuid() primary key,
  meal_log_id uuid references meal_logs on delete cascade not null,
  food_id uuid references foods not null,
  quantity_g numeric not null,
  created_at timestamptz default now()
);

-- Tabela de marmitas
create table if not exists marmitas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  description text,
  created_at timestamptz default now()
);

-- Itens de cada marmita
create table if not exists marmita_items (
  id uuid default gen_random_uuid() primary key,
  marmita_id uuid references marmitas on delete cascade not null,
  food_id uuid references foods not null,
  quantity_g numeric not null
);

-- Planejador semanal
create table if not exists weekly_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  date date not null,
  meal_type text not null,
  marmita_id uuid references marmitas on delete set null,
  created_at timestamptz default now(),
  unique(user_id, date, meal_type)
);

-- ============================
-- Row Level Security (RLS)
-- ============================

alter table profiles enable row level security;
alter table foods enable row level security;
alter table meal_logs enable row level security;
alter table meal_log_items enable row level security;
alter table marmitas enable row level security;
alter table marmita_items enable row level security;
alter table weekly_plans enable row level security;

-- Profiles
create policy "profiles_own" on profiles for all using (auth.uid() = id);

-- Foods: todos autenticados podem ler; apenas o dono pode criar/editar/deletar custom
create policy "foods_read" on foods for select using (auth.role() = 'authenticated');
create policy "foods_insert" on foods for insert with check (auth.uid() = created_by or source = 'tbca');
create policy "foods_update" on foods for update using (auth.uid() = created_by);
create policy "foods_delete" on foods for delete using (auth.uid() = created_by);

-- Meal logs
create policy "meal_logs_own" on meal_logs for all using (auth.uid() = user_id);

-- Meal log items (via meal_logs)
create policy "meal_log_items_own" on meal_log_items for all using (
  exists (select 1 from meal_logs where id = meal_log_id and user_id = auth.uid())
);

-- Marmitas
create policy "marmitas_own" on marmitas for all using (auth.uid() = user_id);

-- Marmita items
create policy "marmita_items_own" on marmita_items for all using (
  exists (select 1 from marmitas where id = marmita_id and user_id = auth.uid())
);

-- Weekly plans
create policy "weekly_plans_own" on weekly_plans for all using (auth.uid() = user_id);

-- ============================
-- Trigger: cria perfil ao registrar usuário
-- ============================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
