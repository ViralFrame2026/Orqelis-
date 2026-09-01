-- ORQELIS: relación estable archivo-producto y reemplazo atómico de imágenes.

create table if not exists public.product_image_filename_map (
  product_id uuid primary key references public.products(id) on delete cascade,
  image_filename text not null,
  image_filename_key text generated always as (lower(btrim(image_filename))) stored,
  created_at timestamptz not null default now(),
  constraint product_image_filename_map_valid_filename check (
    image_filename = btrim(image_filename)
    and char_length(image_filename) between 1 and 255
    and position('/' in image_filename) = 0
    and position(chr(92) in image_filename) = 0
    and image_filename ~* '\.(jpe?g|png|webp)$'
  )
);

create unique index if not exists product_image_filename_map_key_unique_idx
  on public.product_image_filename_map (image_filename_key);

alter table public.product_image_filename_map enable row level security;
revoke all on public.product_image_filename_map from anon, authenticated;
grant all on public.product_image_filename_map to service_role;

-- Recupera relaciones de una importación anterior solamente cuando la coincidencia
-- por nombre es única entre los productos que hoy tienen una miniatura Base64.
do $$
begin
  if to_regclass('public.catalog_image_import_queue') is not null then
    execute $backfill$
      with candidates as (
        select
          q.filename,
          p.id as product_id,
          count(*) over (partition by q.id) as matching_products
        from public.catalog_image_import_queue q
        join public.products p
          on lower(btrim(p.name)) = lower(btrim(q.product_name))
        where q.filename ~* '\.(jpe?g|png|webp)$'
          and exists (
            select 1
            from public.product_images pi
            where pi.product_id = p.id
              and pi.image_url like 'data:image/%'
          )
      )
      insert into public.product_image_filename_map (product_id, image_filename)
      select product_id, btrim(filename)
      from candidates
      where matching_products = 1
      on conflict do nothing
    $backfill$;
  end if;
end;
$$;

create or replace function public.replace_product_image(
  p_product_id uuid,
  p_image_url text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_image_id uuid;
begin
  if p_product_id is null or p_image_url is null or btrim(p_image_url) = '' then
    raise exception 'product id and image url are required';
  end if;

  if not exists (select 1 from public.products where id = p_product_id) then
    raise exception 'product not found';
  end if;

  delete from public.product_images where product_id = p_product_id;

  insert into public.product_images (product_id, image_url, position)
  values (p_product_id, p_image_url, 0)
  returning id into v_image_id;

  return v_image_id;
end;
$$;

revoke all on function public.replace_product_image(uuid, text) from public;
revoke all on function public.replace_product_image(uuid, text) from anon, authenticated;
grant execute on function public.replace_product_image(uuid, text) to service_role;
