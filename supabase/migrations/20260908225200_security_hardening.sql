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
