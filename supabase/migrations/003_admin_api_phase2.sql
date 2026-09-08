-- ORQELIS Fase 2: API administrativa, archivado, auditoria e infraestructura de proteccion.

alter type public.product_status add value if not exists 'archived';

alter table public.products
  add column if not exists sku text;

create unique index if not exists products_sku_unique_idx
  on public.products (lower(btrim(sku)))
  where sku is not null and btrim(sku) <> '';

create index if not exists products_name_normalized_idx
  on public.products (lower(btrim(name)));

create table if not exists public.admin_activity_log (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  source text not null check (source in ('admin_panel', 'api', 'ai')),
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_activity_log_created_at_idx
  on public.admin_activity_log (created_at desc);
create index if not exists admin_activity_log_entity_idx
  on public.admin_activity_log (entity_type, entity_id, created_at desc);

create table if not exists public.admin_api_idempotency (
  idempotency_key text not null,
  scope text not null,
  request_hash text not null,
  state text not null default 'pending' check (state in ('pending', 'completed')),
  response_status integer,
  response_body jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (idempotency_key, scope)
);

create index if not exists admin_api_idempotency_created_at_idx
  on public.admin_api_idempotency (created_at);

create table if not exists public.admin_api_rate_limits (
  bucket_key text not null,
  window_start timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  updated_at timestamptz not null default now(),
  primary key (bucket_key, window_start)
);

create index if not exists admin_api_rate_limits_updated_at_idx
  on public.admin_api_rate_limits (updated_at);

drop trigger if exists admin_api_idempotency_set_updated_at on public.admin_api_idempotency;
create trigger admin_api_idempotency_set_updated_at
  before update on public.admin_api_idempotency
  for each row execute function public.set_updated_at();

create or replace function public.consume_admin_api_rate_limit(
  p_bucket_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table(allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  if p_bucket_key is null or btrim(p_bucket_key) = '' then
    raise exception 'bucket key is required';
  end if;
  if p_limit < 1 or p_window_seconds < 1 then
    raise exception 'rate limit parameters must be positive';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / p_window_seconds) * p_window_seconds
  );

  insert into public.admin_api_rate_limits (bucket_key, window_start, request_count, updated_at)
  values (p_bucket_key, v_window_start, 1, now())
  on conflict (bucket_key, window_start)
  do update set
    request_count = public.admin_api_rate_limits.request_count + 1,
    updated_at = now()
  returning request_count into v_count;

  return query select
    v_count <= p_limit,
    greatest(p_limit - v_count, 0),
    v_window_start + make_interval(secs => p_window_seconds);
end;
$$;

revoke all on function public.consume_admin_api_rate_limit(text, integer, integer) from public;
grant execute on function public.consume_admin_api_rate_limit(text, integer, integer) to service_role;

alter table public.admin_activity_log enable row level security;
alter table public.admin_api_idempotency enable row level security;
alter table public.admin_api_rate_limits enable row level security;

drop policy if exists "admin_activity_log_admin_read" on public.admin_activity_log;
create policy "admin_activity_log_admin_read"
  on public.admin_activity_log for select to authenticated
  using (public.is_admin());

drop policy if exists "admin_activity_log_admin_insert" on public.admin_activity_log;
create policy "admin_activity_log_admin_insert"
  on public.admin_activity_log for insert to authenticated
  with check (public.is_admin());

grant select, insert on public.admin_activity_log to authenticated;
grant all on public.admin_activity_log to service_role;
grant all on public.admin_api_idempotency to service_role;
grant all on public.admin_api_rate_limits to service_role;

-- Los productos archivados quedan disponibles para administracion, pero nunca para la tienda publica.
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read"
  on public.products for select to anon, authenticated
  using (status::text not in ('hidden', 'archived'));

drop policy if exists "product_images_public_read" on public.product_images;
create policy "product_images_public_read"
  on public.product_images for select to anon, authenticated
  using (
    exists(
      select 1 from public.products p
      where p.id = product_id and p.status::text not in ('hidden', 'archived')
    )
  );

drop policy if exists "product_features_public_read" on public.product_features;
create policy "product_features_public_read"
  on public.product_features for select to anon, authenticated
  using (
    exists(
      select 1 from public.products p
      where p.id = product_id and p.status::text not in ('hidden', 'archived')
    )
  );

