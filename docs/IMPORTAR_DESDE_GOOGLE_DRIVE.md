# Cargar el catálogo de ORQELIS desde Google Drive

Este método permite enviarle a la asistente **un solo enlace de Google Sheets**. La asistente revisa todos los artículos, descarga sus fotos desde Drive y te pide confirmación antes de crear productos.

## 1. Preparar la planilla

1. Abrí la [plantilla ordenada de ORQELIS](https://orqelis-flame.vercel.app/plantilla-catalogo-orqelis.xlsx).
2. Subila a Google Drive y elegí **Abrir con Google Sheets**. La primera pestaña es para productos y la segunda contiene instrucciones y ejemplos.
3. Usá una fila por producto y no cambies los nombres de las columnas de la fila 1.

Columnas obligatorias:

- `nombre`
- `categoria`: debe coincidir con una categoría que ya exista en ORQELIS, por ejemplo `Termos y mates`.
- `descripcion_corta`
- `descripcion`
- `precio`
- `estado`: para revisar sin mostrar el artículo en la tienda, usá `hidden`.

Columnas opcionales: `slug`, `sku`, `precio_anterior`, `cuotas`, `precio_cuota`, `stock`, `destacado`, `oferta`, `nuevo`, `etiquetas`, `caracteristicas` e `imagenes_drive`.

Para poner varias etiquetas, características o imágenes dentro de una celda, separalas con `|`.

## 2. Preparar las fotos

1. Creá una carpeta de Drive llamada, por ejemplo, `Fotos catálogo ORQELIS`.
2. Subí allí las imágenes JPG, PNG o WEBP. Cada archivo puede pesar hasta 10 MB.
3. En la carpeta, tocá **Compartir > Acceso general > Cualquier persona con el enlace > Lector**.
4. Copiá el enlace de cada **archivo de imagen** y pegalo en `imagenes_drive`. No pegues el enlace de la carpeta.
5. Si un producto tiene más de una foto, poné los enlaces en la misma celda separados por `|`. La primera será la imagen principal.

Compartir la carpeta como lectora hace que sus archivos hereden ese acceso. No permite editar ni borrar nada y el enlace no se publica automáticamente en buscadores, pero cualquier persona que lo reciba podrá ver las fotos.

Para que las fichas se vean bien:

- usá fotos nítidas, sin capturas de pantalla ni bordes;
- preferí 1200 × 1200 píxeles o más;
- mantené el mismo fondo y estilo entre productos;
- poné primero una foto general y después detalles, variantes o medidas;
- evitá texto pequeño dentro de la imagen.

## 3. Compartir y revisar

1. En la Google Sheet, tocá **Compartir > Acceso general > Cualquier persona con el enlace > Lector**.
2. Copiá el enlace de la planilla.
3. Desde tu GPT privado de ORQELIS, escribí: `Revisá este catálogo. No publiques todavía: [enlace]`.
4. La asistente te mostrará filas válidas, errores, posibles repetidos, cuántos productos quedarían visibles y cuáles no tienen foto.
5. Corregí la planilla si hace falta y pedile que la revise otra vez.

## 4. Publicar

Cuando el resumen esté bien, decile una de estas opciones:

- `Confirmo: publicá todas las filas revisadas.`
- `Confirmo: publicá solamente las filas 2, 4 y 7.`

La asistente vuelve a comprobar la planilla antes de crear nada. Si cambió desde la última revisión, detiene la publicación y genera una vista previa nueva. Los lotes son de hasta 20 productos y 50 fotos; si hay más, los divide en varios lotes y te informa el resultado de cada uno.

Usá `hidden` para cargar productos todavía no terminados. Usá `available` únicamente cuando el precio, las fotos y la descripción ya estén listos para verse en la tienda.

## Alternativa para una publicación individual

Si solo querés crear o editar un artículo, podés adjuntar la foto directamente al mensaje de ChatGPT. En ese flujo no necesitás Drive ni una URL pública; la asistente sube el archivo adjunto a ORQELIS después de tu confirmación.
