-- Harden internal database functions used by ORQELIS admin/API.

alter function public.set_updated_at()
  set search_path = public, pg_temp;

revoke execute on function public.consume_admin_api_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_admin_api_rate_limit(text, integer, integer)
  to service_role;

-- is_admin() is required by authenticated RLS policies, but should not be callable anonymously.
revoke execute on function public.is_admin()
  from public, anon;
grant execute on function public.is_admin()
  to authenticated, service_role;

-- Cover foreign keys used by commercial tracking queries.
create index if not exists leads_product_id_idx
  on public.leads(product_id);
create index if not exists sales_product_id_idx
  on public.sales(product_id);

-- Avoid re-evaluating auth.uid() for every row.
alter policy admin_users_read_self on public.admin_users
  using (user_id = (select auth.uid()));
