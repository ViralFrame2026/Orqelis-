# ORQELIS — tienda online y panel de ventas

Aplicación web mobile-first para publicar productos, recibir consultas por WhatsApp y administrar un catálogo de electro, bazar, hogar, termos, mates y personalizados. Incluye tienda pública, buscador, filtros, páginas de producto, entregas, SEO, autenticación y un panel privado.

Sitio de producción: [orqelis-flame.vercel.app](https://orqelis-flame.vercel.app)

## Stack

- Next.js con App Router, React y TypeScript
- Tailwind CSS
- Supabase Database, Auth y Storage
- Lucide Icons
- Preparado para desplegar en Vercel

## Probar el proyecto

Requisitos: Node.js 20 o superior y npm.

```bash
npm install
npm run dev
```

Abrí `http://localhost:3000`. Sin variables de Supabase, la tienda funciona en **modo demostración** con productos locales; `/admin` permanece bloqueado hasta completar la conexión.

Para verificar antes de publicar:

```bash
npm run lint
npm test
npm run typecheck
npm run build
```

## Conectar Supabase

1. Creá un proyecto en Supabase.
2. Aplicá en orden los archivos de `supabase/migrations/` (preferentemente con Supabase CLI).
3. En **Project Settings > API**, copiá la URL del proyecto y la clave pública `anon`.
4. Copiá `.env.example` como `.env.local` y completá:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_CLAVE_ANON
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_NUMBER=541155912747
NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/seba.r.z
SUPABASE_SERVICE_ROLE_KEY=
ORQELIS_ADMIN_API_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` y `ORQELIS_ADMIN_API_KEY` son exclusivamente de servidor: nunca deben llevar el prefijo `NEXT_PUBLIC_`, entrar al repositorio ni usarse en el navegador. La service role se utiliza solamente en las rutas administrativas autenticadas de la API.

La migración crea tablas, índices, políticas RLS, el bucket público `product-images`, categorías y el producto inicial solicitado. Los visitantes solo pueden leer productos visibles. Las escrituras requieren sesión y pertenecer a `admin_users`.

## Crear el primer administrador

1. En Supabase abrí **Authentication > Users** y creá un usuario con email y contraseña.
2. Copiá el UUID de ese usuario.
3. En SQL Editor ejecutá, reemplazando el valor:

```sql
insert into public.admin_users (user_id)
values ('UUID-DEL-USUARIO');
```

4. Entrá a `http://localhost:3000/admin`.

Estar autenticado no alcanza para editar: el UUID debe existir en `admin_users`.

## Administrar productos

Desde **Panel > Productos** se puede:

- crear y editar productos;
- cargar varias imágenes a Supabase Storage;
- definir precio contado, precio anterior y cuotas;
- cambiar disponibilidad;
- marcar oferta, nuevo o destacado;
- duplicar, ocultar o archivar sin borrar información.

El slug se genera automáticamente a partir del nombre si se deja vacío. Las características se cargan una por línea y las etiquetas separadas por comas.

## Configurar WhatsApp, Instagram y textos

Entrá a **Panel > Configuración**. Ahí se editan el nombre de tienda, WhatsApp, Instagram, textos de entrega/envío y email opcional. El teléfono debe incluir código de país y área, solo con números; por ejemplo, para Argentina comienza con `549`.

Mientras Supabase no esté conectado se usan los valores públicos de `.env.example`. Actualmente apuntan al WhatsApp `+54 11 5591-2747` y al Instagram `@seba.r.z`.

## Estructura principal

```text
src/
  app/                 rutas públicas y panel /admin
  components/          UI de tienda, home, layout y administración
  config/              valores de respaldo y puntos de entrega
  data/                catálogo de demostración
  lib/admin-api/       autenticación, validación, límites e idempotencia
  lib/supabase/        clientes de navegador, servidor y proxy de sesión
  services/            acceso a catálogo, configuración y autenticación
  types/               modelos TypeScript
  utils/               moneda, slugs y enlaces de WhatsApp
supabase/migrations/   esquema SQL y políticas RLS
public/products/       imágenes de muestra reemplazables
docs/                  documentación y contrato OpenAPI
tests/                 pruebas críticas de la API administrativa
```

## Desplegar en Vercel

1. Subí el proyecto a un repositorio Git.
2. Importalo desde Vercel.
3. Agregá las variables del archivo `.env.example` en **Project Settings > Environment Variables**. Marcá las dos claves administrativas como sensibles y solo de servidor.
4. Cambiá `NEXT_PUBLIC_SITE_URL` por el dominio final, sin barra al final.
5. En Supabase, agregá el dominio de Vercel en **Authentication > URL Configuration**.
6. Desplegá y revisá `/`, `/productos`, una ficha de producto y `/admin`.

Vercel detecta Next.js automáticamente. No hace falta una configuración de build especial.

## API administrativa

La API segura y versionada vive bajo `/api/v1/admin/`. Incluye productos, categorías, cargas de imágenes, operaciones masivas, previsualización, archivado, auditoría, rate limiting e idempotencia. Consultá [docs/ADMIN_API.md](docs/ADMIN_API.md) y [docs/openapi.yaml](docs/openapi.yaml) para el contrato completo y ejemplos sin secretos reales.

Para cargar muchos artículos desde una Google Sheet junto con sus fotos de Drive, usá la [guía de importación](docs/IMPORTAR_DESDE_GOOGLE_DRIVE.md) y la [plantilla Excel ordenada](public/plantilla-catalogo-orqelis.xlsx). El flujo siempre muestra una vista previa y exige confirmación antes de publicar.

## Antes de publicar

- Reemplazar el WhatsApp, Instagram, nombre comercial y email.
- Cargar fotos y productos reales desde el panel.
- Confirmar precios, financiación, stock y puntos de entrega.
- Definir dominio final y actualizar `NEXT_PUBLIC_SITE_URL`.
- Crear al menos un administrador autorizado.
- Revisar los enlaces de WhatsApp desde un teléfono real.

## Próxima fase recomendada

La base ya incluye `customers`, `leads` y `sales`. El siguiente paso de mayor impacto es registrar automáticamente qué producto genera cada consulta y convertirla en una oportunidad dentro del panel. Después conviene sumar ventas, estados de cobro/entrega, estadísticas y generación asistida de publicaciones para Marketplace, Instagram y estados de WhatsApp mediante APIs autorizadas.
