# ORQELIS Admin API v1

API servidor-a-servidor para consultar y administrar el catálogo de ORQELIS. No integra todavía ningún proveedor de IA: cualquier asistente futuro debe consumir este contrato como cliente autorizado.

## URL base y autenticación

Producción:

```text
https://orqelis-flame.vercel.app/api/v1/admin
```

Todas las rutas, salvo `GET /health`, requieren:

```http
Authorization: Bearer <ORQELIS_ADMIN_API_KEY>
```

La clave vive únicamente en variables de entorno del servidor. No debe incluirse en JavaScript del navegador, URLs, capturas, logs ni repositorios. Puede enviarse `X-Orqelis-Source: ai` para identificar en auditoría a una IA autorizada; cualquier otro valor se registra como `api`.

## Respuestas

Éxito:

```json
{ "success": true, "data": {}, "warnings": [], "meta": {} }
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Hay datos inválidos o faltantes.",
    "details": [{ "field": "price", "message": "No puede ser negativo" }]
  }
}
```

Códigos habituales: `400` JSON o clave de idempotencia inválidos, `401` autenticación inválida, `404` entidad inexistente, `409` duplicado o conflicto de idempotencia, `413` archivo/cuerpo demasiado grande, `415` archivo inválido, `422` validación, `429` límite temporal, `503` configuración o conexión no disponible.

## Productos

### Consultar catálogo administrativo

`GET /products`

Filtros opcionales: `search`, `category` (UUID, slug o nombre), `status`, `featured`, `offer`, `limit` (1–200, por defecto 50) y `offset`. El alias `published` se normaliza a `available`.

```bash
curl -s "https://orqelis-flame.vercel.app/api/v1/admin/products?search=termo&status=published&limit=20" \
  -H "Authorization: Bearer <TOKEN>"
```

`GET /products/{id}` devuelve un producto completo. Las operaciones críticas siempre usan el UUID, no el nombre.

### Crear

`POST /products`

Campos obligatorios: `name`, `category`, `short_description`, `description`, `price` y `status`. `category` acepta UUID, slug o nombre exacto normalizado. `slug` es opcional y se genera desde el nombre. `sku` es opcional y puede ser `null`.

```bash
curl -X POST "https://orqelis-flame.vercel.app/api/v1/admin/products" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: carga-termo-2026-001" \
  -H "X-Orqelis-Source: ai" \
  -d '{
    "name": "Termo ejemplo 1.2 L",
    "sku": null,
    "category": "termos-y-mates",
    "short_description": "Ejemplo para integración",
    "description": "Descripción revisada del producto.",
    "price": "55.000",
    "previous_price": null,
    "installments": null,
    "installment_price": null,
    "stock": null,
    "status": "hidden",
    "featured": false,
    "offer": false,
    "is_new": true,
    "tags": ["termo"],
    "features": ["Capacidad 1.2 L"],
    "images": [{"url": "https://ejemplo.com/imagen.webp", "is_primary": true}]
  }'
```

Los precios toleran números o formatos inequívocos como `"55.000"` y `"55.000,50"`. Nunca se inventan precio, cuotas, stock, marca, modelo, capacidad, potencia ni garantía. Los campos opcionales comerciales ausentes quedan en `null`.

Un slug o SKU repetido bloquea la creación con `409`. Un nombre normalizado coincidente genera una advertencia, pero no bloquea productos legítimamente similares.

### Previsualizar sin publicar

`POST /products/preview` valida y normaliza el mismo objeto de creación, resuelve la categoría, ordena imágenes e informa `meta.can_create` y advertencias. No escribe datos.

### Editar y archivar

`PATCH /products/{id}` acepta cualquier subconjunto de los campos. Al enviar `features` o `images`, el arreglo reemplaza por completo el orden/conjunto anterior. La primera imagen es principal, salvo que otra tenga `is_primary: true`.

```bash
curl -X PATCH "https://orqelis-flame.vercel.app/api/v1/admin/products/<UUID>" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"price":"58.000","offer":true}'
```

`DELETE /products/{id}` realiza soft delete: cambia el estado a `archived` y conserva producto, imágenes, relaciones e historial.

Estados aceptados: `available`, `last_units`, `sold_out`, `coming_soon`, `hidden`, `archived`. También se normalizan alias comunes como `published`, `draft`, `disponible`, `agotado` y `archivado`.

## Operaciones masivas

`POST /products/bulk` acepta hasta 100 elementos:

```json
{ "products": [{ "name": "...", "category": "bazar", "short_description": "...", "description": "...", "price": 55000, "status": "hidden" }] }
```

Cada elemento se procesa por separado. La respuesta contiene `total_received`, `created`, `failed` y `results`. Si hay éxitos y errores devuelve `207 Multi-Status`. Se recomienda siempre `Idempotency-Key`.

`PATCH /products/bulk` acepta hasta 200 modificaciones, en cualquiera de estas formas:

```json
{ "ids": ["<UUID-1>", "<UUID-2>"], "changes": { "offer": true } }
```

```json
{ "updates": [{ "id": "<UUID>", "changes": { "price": 72000 } }] }
```

## Imágenes

`POST /uploads` usa `multipart/form-data`. El campo puede llamarse `file` o `files`; se aceptan hasta 10 archivos por solicitud, 10 MB cada uno, solamente JPG/JPEG, PNG o WEBP. Se comprueban MIME, extensión y firma binaria real, se sanea el nombre y se genera una ruta única.

```bash
curl -X POST "https://orqelis-flame.vercel.app/api/v1/admin/uploads" \
  -H "Authorization: Bearer <TOKEN>" \
  -F "files=@producto-frente.webp" \
  -F "files=@producto-detalle.jpg"
```

La respuesta entrega `url`, `storage_path`, nombre original, tamaño y MIME. Luego las URLs pueden asignarse a `images` al crear o editar un producto.

`POST /uploads/chatgpt` recibe JSON con `openaiFileIdRefs`, descarga únicamente referencias temporales alojadas por OpenAI, vuelve a comprobar tamaño, MIME y firma binaria, y usa el mismo bucket seguro. Esta ruta permite que el GPT tome la imagen adjunta del mensaje sin pedirle al usuario una URL pública.

```json
{ "openaiFileIdRefs": ["<REFERENCIA-DEL-ARCHIVO-ADJUNTO>"] }
```

## Importar catálogo desde Google Drive

`POST /imports/google-drive/preview` recibe `{ "sheet_url": "https://docs.google.com/spreadsheets/d/..." }`. La Google Sheet y la carpeta que contiene sus imágenes deben estar compartidas como `Cualquier persona con el enlace: Lector`. La ruta lee hasta 100 filas, valida campos, categorías, duplicados y enlaces de Drive, y devuelve `sheet_hash`, resumen y detalle por fila. No escribe en base de datos ni en Storage.

`POST /imports/google-drive/publish` recibe el mismo `sheet_url`, el `expected_sheet_hash` devuelto por la vista previa y hasta 20 `row_numbers`. Requiere `Idempotency-Key`. Si la planilla cambió, devuelve `409 SHEET_CHANGED` y no publica. Cada lote admite hasta 50 imágenes en total.

```json
{
  "sheet_url": "https://docs.google.com/spreadsheets/d/<ID>/edit#gid=0",
  "expected_sheet_hash": "<SHA-256-DEVUELTO-POR-PREVIEW>",
  "row_numbers": [2, 3, 4]
}
```

Durante la publicación, cada foto se descarga únicamente desde hosts permitidos de Google, con redirecciones controladas. Se comprueban tamaño máximo de 10 MB, firma binaria y formato JPG, PNG o WEBP antes de subirla a `product-images`. Si un producto falla después de la carga, sus archivos recién subidos se eliminan. Una respuesta parcial usa `207 Multi-Status`.

La plantilla y la guía para usuarios están en [plantilla-catalogo-orqelis.xlsx](../public/plantilla-catalogo-orqelis.xlsx) e [IMPORTAR_DESDE_GOOGLE_DRIVE.md](./IMPORTAR_DESDE_GOOGLE_DRIVE.md).

## Categorías

- `GET /categories`: listado y cantidad administrativa de productos.
- `POST /categories`: `{ "name": "Nombre", "slug": "opcional", "icon": "Package" }`.
- `PATCH /categories/{id}`: modificación parcial.

Nombre normalizado y slug se controlan para evitar duplicados.

## Idempotencia

`POST /products`, `POST /products/bulk` y `POST /categories` aceptan `Idempotency-Key` (8–160 caracteres alfanuméricos, `. _ : -`). Repetir la misma clave y el mismo cuerpo devuelve exactamente el resultado guardado y el header `X-Idempotent-Replayed: true`. Reutilizarla con otro cuerpo devuelve `409`.

## Límites y CORS

Los límites se calculan por credencial y tipo de operación: las lecturas permiten más tráfico que bulk o uploads. Un `429` incluye el momento estimado de reintento en `details`.

No se envía `Access-Control-Allow-Origin: *`. La API está pensada para integraciones servidor-a-servidor. Si en el futuro se requiere un cliente web autorizado, debe agregarse una lista explícita de orígenes permitidos y conservar Bearer, rate limiting y validación en servidor.

## Auditoría y health

Los cambios guardan acción, entidad, origen (`admin_panel`, `api`, `ai`), resumen seguro y fecha en `admin_activity_log`. No se guardan tokens ni secretos. El panel muestra los últimos eventos en `/admin/actividad`.

`GET /health` es público y devuelve únicamente booleanos de configuración/conexión, versión, estado y timestamp. Nunca devuelve nombres ni valores de secretos.

## Configuración

Variables solo-servidor:

```dotenv
SUPABASE_SERVICE_ROLE_KEY=
ORQELIS_ADMIN_API_KEY=
ORQELIS_CHATGPT_API_KEY=
```

`ORQELIS_CHATGPT_API_KEY` es una credencial separada para la Action de ChatGPT. Las solicitudes autenticadas con ella se registran automáticamente con origen `ai`.

Además deben existir `NEXT_PUBLIC_SUPABASE_URL` y la configuración pública ya usada por la tienda. Aplicar las migraciones de `supabase/migrations/` antes de desplegar. El contrato completo está en [openapi.yaml](./openapi.yaml).
