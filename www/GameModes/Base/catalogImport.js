// catalogImport.js
// Importiert hochgeladene Dateien als Katalog – Excel (via SheetJS/globalThis.XLSX)
// oder JSON. Nutzt das gemeinsame Konvertierungsmodul (catalogConverter.mjs),
// damit In-App-Upload und Build-Skript identisch konvertieren.

import { buildCatalog } from "./catalogConverter.mjs";

// Typ-Voreinstellungen: bestimmen den Einleitungstext pro Katalog.
export const TYPE_PRESETS = {
  zitate: { type: "Zitate", introText: "Wer hat gesagt:" },
  wo_steht: { type: "Wo steht", introText: "Wo steht:" },
  allgemein: { type: "Allgemeine Fragen", introText: "" },
};

export function slugify(text) {
  return (
    String(text)
      .toLowerCase()
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "katalog"
  );
}

function excelToSheets(arrayBuffer) {
  const XLSX = globalThis.XLSX;
  if (!XLSX) {
    throw new Error("Excel-Bibliothek (SheetJS) nicht geladen.");
  }
  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
  const sheets = {};
  for (const name of workbook.SheetNames) {
    sheets[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: "" });
  }
  return sheets;
}

// Baut Metadaten aus bereits fertigen Katalogdaten (für JSON-Uploads).
function metaFromData(data, base) {
  const books = [];
  let count = 0;
  for (const category of Object.values(data)) {
    for (const [book, questions] of Object.entries(category)) {
      if (!books.includes(book)) books.push(book);
      count += questions.length;
    }
  }
  return {
    ...base,
    category: Object.keys(data)[0] || base.category,
    books,
    questionCount: count,
    generatedAt: new Date().toISOString().slice(0, 10),
  };
}

function jsonToCatalog(text, config) {
  const parsed = JSON.parse(text);
  const values = Object.values(parsed);
  let data;
  if (Array.isArray(parsed)) {
    data = { [config.category]: { [config.title]: parsed } }; // flache Frageliste
  } else if (values.length && Array.isArray(values[0])) {
    data = { [config.category]: parsed }; // 1 Ebene: { Buch: [Fragen] }
  } else {
    data = parsed; // 2 Ebenen: { Kategorie: { Buch: [Fragen] } }
  }
  const meta = metaFromData(data, {
    id: config.id,
    title: config.title,
    type: config.type,
    introText: config.introText,
    category: config.category,
    file: config.out,
  });
  return { meta, data };
}

/**
 * Liest eine hochgeladene Datei und liefert { meta, data, report? }.
 * @param {File} file
 * @param {{ title: string, typeKey: string, id?: string }} form
 */
export async function parseUpload(file, form) {
  const preset = TYPE_PRESETS[form.typeKey] || TYPE_PRESETS.allgemein;
  const id = form.id || slugify(form.title);
  const config = {
    id,
    out: id + ".json",
    category: id,
    type: preset.type,
    title: form.title || id,
    introText: preset.introText,
  };

  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".json")) {
    return jsonToCatalog(await file.text(), config);
  }

  const sheets = excelToSheets(await file.arrayBuffer());
  const { catalog, meta, report } = buildCatalog(sheets, config);
  return { meta, data: catalog, report };
}
