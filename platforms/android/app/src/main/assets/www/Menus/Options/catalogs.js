// catalogs.js – Katalogverwaltung (eigenes Untermenü): auflisten,
// hinzufügen/ersetzen (Excel/JSON), löschen.
import { CatalogStore } from "../../GameModes/Base/CatalogStore.js";
import { parseUpload } from "../../GameModes/Base/catalogImport.js";

const listEl = document.getElementById("catalogList");
const countEl = document.getElementById("catalogCount");
const titleEl = document.getElementById("uploadTitle");
const typeEl = document.getElementById("uploadType");
const replaceEl = document.getElementById("replaceTarget");
const fileEl = document.getElementById("uploadFile");
const importBtn = document.getElementById("importBtn");
const statusEl = document.getElementById("importStatus");

function renderList() {
  const catalogs = CatalogStore.listInstalled();
  listEl.innerHTML = "";
  replaceEl.innerHTML = '<option value="">Als neuen Katalog hinzufügen</option>';
  if (countEl) countEl.textContent = ` (${catalogs.length})`;

  if (catalogs.length === 0) {
    listEl.innerHTML = "<p class='catalog-info'>Noch keine Kataloge installiert.</p>";
    return;
  }

  for (const meta of catalogs) {
    const row = document.createElement("div");
    row.className = "catalog-row";

    const info = document.createElement("span");
    info.className = "catalog-info";
    info.innerHTML =
      `${meta.title}<br><small>${meta.type} · ${meta.books.length} Bücher · ${meta.questionCount} Fragen</small>`;
    row.appendChild(info);

    const del = document.createElement("button");
    del.className = "smallbtn";
    del.textContent = "Löschen";
    del.addEventListener("click", () => {
      if (confirm(`Katalog "${meta.title}" löschen?`)) {
        CatalogStore.remove(meta.id);
        renderList();
      }
    });
    row.appendChild(del);
    listEl.appendChild(row);

    const opt = document.createElement("option");
    opt.value = meta.id;
    opt.textContent = "Ersetzen: " + meta.title;
    replaceEl.appendChild(opt);
  }
}

async function doImport() {
  const file = fileEl.files[0];
  if (!file) {
    statusEl.textContent = "Bitte zuerst eine Excel- oder JSON-Datei wählen.";
    return;
  }
  const targetId = replaceEl.value;
  const targetMeta = targetId ? CatalogStore.getMeta(targetId) : null;
  const title = titleEl.value.trim() || (targetMeta ? targetMeta.title : file.name.replace(/\.[^.]+$/, ""));

  statusEl.textContent = "Importiere …";
  try {
    const { meta, data, report } = await parseUpload(file, {
      title,
      typeKey: typeEl.value,
      id: targetId || undefined,
    });

    if (!meta.questionCount) {
      statusEl.textContent =
        "Keine gültigen Fragen gefunden. Spalten prüfen: question, choice1–4, answer (1–4).";
      return;
    }

    CatalogStore.addOrReplace(meta, data);

    let msg = `✔ "${meta.title}": ${meta.questionCount} Fragen aus ${meta.books.length} Büchern.`;
    if (report && report.incomplete && report.incomplete.length) {
      msg += ` ⚠ ${report.incomplete.length} Zeile(n) ohne gültige Antwort übersprungen.`;
    }
    statusEl.textContent = msg;
    titleEl.value = "";
    fileEl.value = "";
    renderList();
  } catch (e) {
    console.error(e);
    statusEl.textContent = "Fehler beim Import: " + e.message;
  }
}

importBtn.addEventListener("click", doImport);

renderList();
