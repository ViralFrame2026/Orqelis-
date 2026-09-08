import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const root = "C:/Users/posca 904/OneDrive - UBA/Documents/ChatGPT/BAZAR EMPRENDIMIENTO";
const outputDir = `${root}/outputs/orqelis-template-20260823`;
const publicPath = `${root}/public/plantilla-catalogo-orqelis.xlsx`;

await fs.mkdir(outputDir, { recursive: true });

const workbook = Workbook.create();
const catalog = workbook.worksheets.add("CATALOGO");
const help = workbook.worksheets.add("INSTRUCCIONES");

const headers = [
  "nombre",
  "categoria",
  "precio",
  "estado",
  "descripcion_corta",
  "descripcion",
  "imagenes_drive",
  "stock",
  "sku",
  "slug",
  "precio_anterior",
  "cuotas",
  "precio_cuota",
  "destacado",
  "oferta",
  "nuevo",
  "etiquetas",
  "caracteristicas",
];

catalog.getRange("A1:R101").values = [
  headers,
  ...Array.from({ length: 100 }, () => Array(18).fill(null)),
];

const table = catalog.tables.add("A1:R101", true, "CatalogoORQELIS");
table.style = "TableStyleMedium2";
table.showFilterButton = true;

catalog.showGridLines = false;
catalog.freezePanes.freezeRows(1);
catalog.freezePanes.freezeColumns(2);

catalog.getRange("A1:F1").format = {
  fill: "#C8462D",
  font: { bold: true, color: "#FFFFFF", size: 10 },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  wrapText: true,
};
catalog.getRange("G1").format = {
  fill: "#E76A35",
  font: { bold: true, color: "#FFFFFF", size: 10 },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  wrapText: true,
};
catalog.getRange("H1:R1").format = {
  fill: "#5B4036",
  font: { bold: true, color: "#FFFFFF", size: 10 },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  wrapText: true,
};
catalog.getRange("A1:R1").format.rowHeight = 38;
catalog.getRange("A2:R101").format = {
  font: { color: "#332722", size: 10 },
  verticalAlignment: "top",
  borders: {
    insideHorizontal: { style: "thin", color: "#E8DDD7" },
  },
};
for (let row = 2; row <= 101; row += 1) {
  catalog.getRange(`A${row}:R${row}`).format.fill = row % 2 === 0 ? "#FFF5EE" : "#FFFFFF";
}
catalog.getRange("A2:R101").format.rowHeight = 30;
catalog.getRange("E2:G101").format.wrapText = true;
catalog.getRange("Q2:R101").format.wrapText = true;

const widths = {
  A: 190, B: 140, C: 100, D: 115, E: 230, F: 300, G: 290, H: 75, I: 110,
  J: 140, K: 110, L: 75, M: 110, N: 85, O: 75, P: 75, Q: 180, R: 230,
};
for (const [column, width] of Object.entries(widths)) {
  catalog.getRange(`${column}:${column}`).format.columnWidthPx = width;
}

catalog.getRange("C2:C101").format.numberFormat = '"$"#,##0';
catalog.getRange("K2:K101").format.numberFormat = '"$"#,##0';
catalog.getRange("M2:M101").format.numberFormat = '"$"#,##0';
catalog.getRange("H2:H101").format.numberFormat = "#,##0";
catalog.getRange("L2:L101").format.numberFormat = "#,##0";

catalog.getRange("B2:B101").dataValidation = {
  rule: { type: "list", values: ["Electrodomésticos", "Bazar", "Hogar", "Termos y mates", "Personalizados"] },
};
catalog.getRange("D2:D101").dataValidation = {
  rule: { type: "list", values: ["hidden", "available", "last_units", "sold_out", "coming_soon", "archived"] },
};
for (const range of ["N2:N101", "O2:O101", "P2:P101"]) {
  catalog.getRange(range).dataValidation = { rule: { type: "list", values: ["no", "si"] } };
}
catalog.getRange("H2:H101").dataValidation = {
  rule: { type: "whole", operator: "between", formula1: 0, formula2: 1000000 },
};
catalog.getRange("L2:L101").dataValidation = {
  rule: { type: "whole", operator: "between", formula1: 1, formula2: 120 },
};

catalog.getRange("D2:D101").conditionalFormats.add("containsText", {
  text: "available",
  format: { fill: "#DDF3E4", font: { color: "#1E6A3A", bold: true } },
});
catalog.getRange("D2:D101").conditionalFormats.add("containsText", {
  text: "hidden",
  format: { fill: "#F2E9E4", font: { color: "#75584C" } },
});
catalog.getRange("D2:D101").conditionalFormats.add("containsText", {
  text: "sold_out",
  format: { fill: "#FCE3E0", font: { color: "#A33227", bold: true } },
});

for (const column of ["A", "B", "C", "D", "E", "F"]) {
  catalog.getRange(`${column}2:${column}101`).conditionalFormats.addCustom(
    `=AND(COUNTA($A2:$R2)>0,${column}2="")`,
    { fill: "#FFF0CC", font: { color: "#8A4F12" } },
  );
}
catalog.getRange("I2:I101").conditionalFormats.addCustom(
  '=AND($I2<>"",COUNTIF($I$2:$I$101,$I2)>1)',
  { fill: "#FCE3E0", font: { color: "#A33227", bold: true } },
);

help.showGridLines = false;
help.getRange("A1:F1").merge();
help.getRange("A1").values = [["ORQELIS · Plantilla para cargar productos"]];
help.getRange("A1:F1").format = {
  fill: "#C8462D",
  font: { bold: true, color: "#FFFFFF", size: 18 },
  horizontalAlignment: "left",
  verticalAlignment: "center",
};
help.getRange("A1:F1").format.rowHeight = 48;

help.getRange("A2:F2").merge();
help.getRange("A2").values = [["Completá la hoja CATALOGO. Los campos naranjas son obligatorios; los marrones son opcionales."]];
help.getRange("A2:F2").format = {
  fill: "#FFF3EC",
  font: { color: "#6C3C2B", size: 11 },
  verticalAlignment: "center",
};
help.getRange("A2:F2").format.rowHeight = 34;

help.getRange("A4:F4").merge();
help.getRange("A4").values = [["PASOS RÁPIDOS"]];
help.getRange("A4:F4").format = {
  fill: "#5B4036",
  font: { bold: true, color: "#FFFFFF", size: 11 },
  verticalAlignment: "center",
};

const steps = [
  "1. Escribí un producto por fila en CATALOGO. No cambies los títulos de la fila 1.",
  "2. Para cargar sin mostrar todavía en la tienda, elegí estado hidden.",
  "3. Compartí la carpeta de fotos y esta planilla como: Cualquier persona con el enlace · Lector.",
  "4. Pegá enlaces de archivos de Drive en imagenes_drive. Si hay varios, separalos con |.",
  "5. Enviá el enlace de la planilla al GPT de ORQELIS y pedile que revise sin publicar.",
  "6. Publicá únicamente después de revisar y confirmar las filas correctas.",
];
for (let index = 0; index < steps.length; index += 1) {
  const row = index + 5;
  help.getRange(`A${row}:F${row}`).merge();
  help.getRange(`A${row}`).values = [[steps[index]]];
  help.getRange(`A${row}:F${row}`).format = {
    fill: index % 2 === 0 ? "#FFFDFB" : "#FAF5F2",
    font: { color: "#3F302A", size: 10 },
    verticalAlignment: "center",
    wrapText: true,
    borders: { bottom: { style: "thin", color: "#E9DDD7" } },
  };
  help.getRange(`A${row}:F${row}`).format.rowHeight = 28;
}

help.getRange("A12:D12").values = [["Campo", "¿Obligatorio?", "Qué escribir", "Ejemplo"]];
help.getRange("A12:D12").format = {
  fill: "#E76A35",
  font: { bold: true, color: "#FFFFFF" },
  verticalAlignment: "center",
};
const fieldGuide = [
  ["nombre", "Sí", "Nombre comercial claro", "Termo acero 1,2 L"],
  ["categoria", "Sí", "Elegí una opción de la lista", "Termos y mates"],
  ["precio", "Sí", "Número sin inventar", 55000],
  ["estado", "Sí", "hidden para revisar; available para mostrar", "hidden"],
  ["descripcion_corta", "Sí", "Una frase breve para la tarjeta", "Conserva frío y calor"],
  ["descripcion", "Sí", "Descripción completa y comprobada", "Acero inoxidable..."],
  ["imagenes_drive", "Recomendado", "Enlaces a archivos; separar varios con |", "https://drive.google.com/file/d/..."],
  ["stock", "No", "Cantidad disponible", 10],
  ["sku", "No", "Código único del producto", "TER-1200-NEG"],
  ["slug", "No", "Dejar vacío para generarlo automáticamente", "termo-acero-12-l"],
  ["precio_anterior", "No", "Precio anterior si está en oferta", 65000],
  ["cuotas", "No", "Cantidad de cuotas", 3],
  ["precio_cuota", "No", "Valor de cada cuota", 22000],
  ["destacado", "No", "si o no", "no"],
  ["oferta", "No", "si o no", "no"],
  ["nuevo", "No", "si o no", "si"],
  ["etiquetas", "No", "Separar varias con |", "termo|regalo"],
  ["caracteristicas", "No", "Separar varias con |", "Acero|1,2 L|Con manija"],
];
help.getRange("A13:D30").values = fieldGuide;
help.getRange("A13:D30").format = {
  font: { color: "#3F302A", size: 10 },
  verticalAlignment: "top",
  wrapText: true,
  borders: { insideHorizontal: { style: "thin", color: "#E9DDD7" } },
};
help.getRange("B13:B30").conditionalFormats.add("containsText", {
  text: "Sí",
  format: { fill: "#FFF0E6", font: { color: "#A33B22", bold: true } },
});
help.getRange("A32:F32").merge();
help.getRange("A32").values = [["MENSAJES PARA USAR EN CHATGPT"]];
help.getRange("A32:F32").format = {
  fill: "#5B4036",
  font: { bold: true, color: "#FFFFFF", size: 11 },
};
help.getRange("A33:F33").merge();
help.getRange("A33").values = [["Revisá este catálogo. No publiques todavía: [pegá aquí el enlace de la planilla]"]];
help.getRange("A34:F34").merge();
help.getRange("A34").values = [["Confirmo: publicá todas las filas revisadas."]];
help.getRange("A33:F34").format = {
  fill: "#FFF3EC",
  font: { color: "#6C3C2B", italic: true, size: 10 },
  verticalAlignment: "center",
};
help.getRange("A33:F34").format.rowHeight = 28;

help.getRange("A:A").format.columnWidthPx = 145;
help.getRange("B:B").format.columnWidthPx = 105;
help.getRange("C:C").format.columnWidthPx = 350;
help.getRange("D:D").format.columnWidthPx = 225;
help.getRange("E:F").format.columnWidthPx = 90;
help.getRange("A13:D30").format.rowHeight = 34;
help.freezePanes.freezeRows(2);

const inspectCatalog = await workbook.inspect({
  kind: "table",
  range: "CATALOGO!A1:R8",
  include: "values,formulas",
  tableMaxRows: 8,
  tableMaxCols: 18,
});
console.log(inspectCatalog.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

for (const [sheetName, range, filename] of [
  ["CATALOGO", "A1:J10", "preview-catalogo.png"],
  ["INSTRUCCIONES", "A1:F34", "preview-instrucciones.png"],
]) {
  const preview = await workbook.render({ sheetName, range, scale: 1, format: "png" });
  await fs.writeFile(`${outputDir}/${filename}`, new Uint8Array(await preview.arrayBuffer()));
}

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(`${outputDir}/plantilla-catalogo-orqelis.xlsx`);
await output.save(publicPath);
await Promise.allSettled([
  fs.rm(`${outputDir}/plantilla-catalogo-orqelis.xlsx.inspect.ndjson`),
  fs.rm(`${publicPath}.inspect.ndjson`),
]);

console.log(`OUTPUT=${outputDir}/plantilla-catalogo-orqelis.xlsx`);
console.log(`PUBLIC=${publicPath}`);
