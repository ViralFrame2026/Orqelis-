-- La función de reemplazo solo puede ejecutarse desde el servidor con service role.
revoke all on function public.replace_product_image(uuid, text) from public;
revoke all on function public.replace_product_image(uuid, text) from anon, authenticated;
grant execute on function public.replace_product_image(uuid, text) to service_role;

