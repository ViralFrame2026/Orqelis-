-- ORQELIS: esquema inicial, seguridad RLS, Storage y datos base.
create extension if not exists "pgcrypto";

do $$ begin
  create type public.product_status as enum ('available', 'last_units', 'sold_out', 'coming_soon', 'hidden');
exception when duplicate_object then null;
end $$;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text not null default 'Package',
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  short_description text not null default '',
  description text not null default '',
  price numeric(12,2) not null check (price >= 0),
  previous_price numeric(12,2) check (previous_price is null or previous_price >= 0),
  installments integer check (installments is null or installments > 0),
  installment_price numeric(12,2) check (installment_price is null or installment_price >= 0),
  category_id uuid not null references public.categories(id) on delete restrict,
  stock integer check (stock is null or stock >= 0),
  status public.product_status not null default 'available',
  featured boolean not null default false,
  offer boolean not null default false,
  is_new boolean not null default false,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_features (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  feature text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text not null default '',
  updated_at timestamptz not null default now()
);

-- Tabla separada: estar autenticado no alcanza; el usuario también debe figurar acá.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Entidades preparadas para CRM y ventas de la siguiente fase.
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  instagram_handle text,
  email text,
  locality text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  source text not null default 'whatsapp',
  status text not null default 'new',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  total numeric(12,2) not null check (total >= 0),
  payment_status text not null default 'pending',
  delivery_status text not null default 'to_coordinate',
  notes text,
  sold_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_status_idx on public.products(status);
create index if not exists products_featured_idx on public.products(featured) where featured = true;
create index if not exists products_offer_idx on public.products(offer) where offer = true;
create index if not exists product_images_product_id_idx on public.product_images(product_id, position);
create index if not exists product_features_product_id_idx on public.product_features(product_id);
create index if not exists leads_customer_id_idx on public.leads(customer_id);
create index if not exists sales_customer_id_idx on public.sales(customer_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at before update on public.settings for each row execute function public.set_updated_at();
drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at before update on public.customers for each row execute function public.set_updated_at();
drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at before update on public.leads for each row execute function public.set_updated_at();
drop trigger if exists sales_set_updated_at on public.sales;
create trigger sales_set_updated_at before update on public.sales for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.admin_users where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_features enable row level security;
alter table public.settings enable row level security;
alter table public.admin_users enable row level security;
alter table public.customers enable row level security;
alter table public.leads enable row level security;
alter table public.sales enable row level security;

drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories for select to anon, authenticated using (true);
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products for select to anon, authenticated using (status <> 'hidden');
drop policy if exists "product_images_public_read" on public.product_images;
create policy "product_images_public_read" on public.product_images for select to anon, authenticated using (exists(select 1 from public.products p where p.id = product_id and p.status <> 'hidden'));
drop policy if exists "product_features_public_read" on public.product_features;
create policy "product_features_public_read" on public.product_features for select to anon, authenticated using (exists(select 1 from public.products p where p.id = product_id and p.status <> 'hidden'));
drop policy if exists "settings_public_read" on public.settings;
create policy "settings_public_read" on public.settings for select to anon, authenticated using (true);
drop policy if exists "admin_users_read_self" on public.admin_users;
create policy "admin_users_read_self" on public.admin_users for select to authenticated using (user_id = auth.uid());

do $$
declare table_name text;
begin
  foreach table_name in array array['categories','products','product_images','product_features','settings','customers','leads','sales'] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_admin_all', table_name);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', table_name || '_admin_all', table_name);
  end loop;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product_images_storage_public_read" on storage.objects;
create policy "product_images_storage_public_read" on storage.objects for select to public using (bucket_id = 'product-images');
drop policy if exists "product_images_storage_admin_insert" on storage.objects;
create policy "product_images_storage_admin_insert" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "product_images_storage_admin_update" on storage.objects;
create policy "product_images_storage_admin_update" on storage.objects for update to authenticated using (bucket_id = 'product-images' and public.is_admin()) with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "product_images_storage_admin_delete" on storage.objects;
create policy "product_images_storage_admin_delete" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());

insert into public.categories (id, name, slug, icon) values
  ('10000000-0000-4000-8000-000000000001', 'Electrodomésticos', 'electrodomesticos', 'Blender'),
  ('10000000-0000-4000-8000-000000000002', 'Electrónica', 'electronica', 'Headphones'),
  ('10000000-0000-4000-8000-000000000003', 'Bazar', 'bazar', 'CookingPot'),
  ('10000000-0000-4000-8000-000000000004', 'Hogar', 'hogar', 'House'),
  ('10000000-0000-4000-8000-000000000005', 'Termos y mates', 'termos-y-mates', 'CupSoda'),
  ('10000000-0000-4000-8000-000000000006', 'Personalizados', 'personalizados', 'Sparkles'),
  ('10000000-0000-4000-8000-000000000007', 'Ofertas', 'ofertas', 'BadgePercent')
on conflict (id) do update set name = excluded.name, slug = excluded.slug, icon = excluded.icon;

insert into public.products (
  id, name, slug, short_description, description, price, previous_price,
  installments, installment_price, category_id, stock, status, featured, offer, is_new, tags
) values (
  '20000000-0000-4000-8000-000000000001',
  'Termo simil STL 1.2L + Mate personalizado',
  'termo-simil-stl-1-2l-mate-personalizado',
  'Un set matero completo, resistente y personalizado para regalar o disfrutar todos los días.',
  E'Termo simil STL de 1.2 litros acompañado de mate personalizado.\n\nEstampa realizada en DTF UV resistente a altas temperaturas.\n\nIdeal para uso personal o regalo.',
  55000, 62000, 2, 30000,
  '10000000-0000-4000-8000-000000000005', 8, 'available', true, true, true,
  array['termo','mate','personalizado','regalo','dtf uv']
) on conflict (id) do update set name = excluded.name, price = excluded.price, updated_at = now();

insert into public.product_images (id, product_id, image_url, position) values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '/products/termo-mate.svg', 0),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', '/products/termo-detalle.svg', 1)
on conflict (id) do nothing;

insert into public.product_features (id, product_id, feature) values
  ('40000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Capacidad 1.2 litros'),
  ('40000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'Mate incluido'),
  ('40000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', 'Diferentes diseños disponibles'),
  ('40000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001', 'Estampa DTF UV'),
  ('40000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000001', 'Resistente a altas temperaturas'),
  ('40000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000001', 'Entrega rápida')
on conflict (id) do nothing;

insert into public.settings (key, value) values
  ('store_name', 'ORQELIS'),
  ('whatsapp_number', '549XXXXXXXXXX'),
  ('instagram_url', 'https://instagram.com/TU_USUARIO'),
  ('shipping_text', 'También realizamos envíos a todo Argentina. Consultanos por WhatsApp indicando tu localidad para calcular costo y modalidad de envío.'),
  ('delivery_text', 'Entregas de un día para el otro, sujetas a disponibilidad y coordinación previa.'),
  ('email', '')
on conflict (key) do nothing;

-- Después de crear el usuario en Authentication > Users, autorizalo con:
-- insert into public.admin_users (user_id) values ('UUID-DEL-USUARIO');
