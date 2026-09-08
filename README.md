# ORQELIS — tienda online, administración e IA

Aplicación web para comercios con tienda pública, panel de administración y una capa de automatización preparada para operar el catálogo mediante instrucciones en lenguaje natural.

Sitio de producción: https://orqelis-flame.vercel.app

## Experiencia pública

- `/` — presentación comercial de ORQELIS Software.
- `/demo` — demostración de la tienda online.
- `/admin` — panel privado de administración.

## Stack

- Next.js con App Router, React y TypeScript
- Tailwind CSS
- Supabase Database, Auth y Storage
- Lucide Icons
- Vercel

## Probar el proyecto

Requisitos: Node.js 20 o superior y npm.

```bash
npm install
npm run dev
```

Sin variables de Supabase, la tienda puede utilizar datos locales de demostración; `/admin` permanece protegido.

Para verificar antes de publicar:

```bash
npm run lint
npm test
npm run typecheck
npm run build
```

## Variables de entorno

Copiá `.env.example` como `.env.local` y completá las variables correspondientes a Supabase, URL pública y canales de contacto. Las claves administrativas son exclusivamente de servidor y nunca deben llevar el prefijo `NEXT_PUBLIC_` ni almacenarse en el repositorio.

## Administración

Desde el panel se pueden crear y editar productos, gestionar imágenes, precios, disponibilidad, ofertas, destacados y demás información del catálogo. La API administrativa segura vive bajo `/api/v1/admin/`.

## ORQELIS AI

La arquitectura está preparada para que un agente autorizado convierta instrucciones como “subí este producto”, “actualizá el stock”, “poné estos productos en oferta” o “dejá solamente estos productos publicados” en operaciones controladas sobre el catálogo. Las acciones sensibles o destructivas deben conservar mecanismos de confirmación y auditoría.

## Seguridad

Supabase Auth y las políticas RLS protegen las operaciones privadas. Las credenciales de servidor y claves administrativas no deben exponerse en el navegador ni subirse a GitHub.

## Despliegue

El proyecto está preparado para desplegarse en Vercel desde este repositorio. Configurá las variables de entorno del proyecto y mantené `NEXT_PUBLIC_SITE_URL` apuntando al dominio final.
