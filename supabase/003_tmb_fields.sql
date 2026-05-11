-- Campos opcionais para pré-preencher o formulário de TMB
alter table profiles
  add column if not exists tmb_weight_kg  numeric,
  add column if not exists tmb_height_cm  numeric,
  add column if not exists tmb_age_years  integer,
  add column if not exists tmb_sex        text,
  add column if not exists tmb_activity   text;
