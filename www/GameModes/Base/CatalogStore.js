// CatalogStore.js
// Verwaltet mehrere Frage-Kataloge in localStorage statt eines einzigen Blobs:
//   catalog:index      -> JSON-Array der Metadaten (ein Eintrag je Katalog)
//   catalog:data:<id>  -> JSON der Katalogdaten { kategorie: { buch: [frage] } }
//   catalog:seeded     -> "1", sobald die mitgelieferten Kataloge geladen wurden
//
// Damit lassen sich Kataloge einzeln hinzufügen, ersetzen und löschen.

const INDEX_KEY = "catalog:index";
const SEEDED_KEY = "catalog:seeded";
const dataKey = (id) => "catalog:data:" + id;

export class CatalogStore {
  static listInstalled() {
    try {
      return JSON.parse(localStorage.getItem(INDEX_KEY)) || [];
    } catch {
      return [];
    }
  }

  static has(id) {
    return this.listInstalled().some((m) => m.id === id);
  }

  static getMeta(id) {
    return this.listInstalled().find((m) => m.id === id) || null;
  }

  static getData(id) {
    try {
      return JSON.parse(localStorage.getItem(dataKey(id)));
    } catch {
      return null;
    }
  }

  // Fügt einen Katalog hinzu oder ersetzt einen bestehenden (gleiche id).
  static addOrReplace(meta, data) {
    if (!meta || !meta.id) throw new Error("Katalog-Metadaten ohne id.");
    localStorage.setItem(dataKey(meta.id), JSON.stringify(data));
    const index = this.listInstalled().filter((m) => m.id !== meta.id);
    index.push(meta);
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  }

  static remove(id) {
    localStorage.removeItem(dataKey(id));
    const index = this.listInstalled().filter((m) => m.id !== id);
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  }

  // Lädt einmalig die mitgelieferten Kataloge (Seed). Spätere Löschungen durch
  // den Nutzer bleiben bestehen, weil danach das Seeded-Flag gesetzt ist.
  static async ensureSeeded() {
    if (localStorage.getItem(SEEDED_KEY) === "1") return;
    try {
      const { BUNDLED_MANIFEST, BUNDLED_CATALOGS } = await import(
        "../../data/bundled.mjs"
      );
      for (const meta of BUNDLED_MANIFEST.catalogs) {
        const data = BUNDLED_CATALOGS[meta.id];
        if (data && !this.has(meta.id)) this.addOrReplace(meta, data);
      }
    } catch (e) {
      // Kein harter Fehler: Die App funktioniert auch mit manuell hinzugefügten
      // Katalogen weiter. Wir loggen die Ursache aber sichtbar.
      console.error("Mitgelieferte Kataloge konnten nicht geladen werden:", e);
    } finally {
      localStorage.setItem(SEEDED_KEY, "1");
    }
  }

  // Vereinigt alle installierten Kataloge zu { kategorie: { buch: [frage] } }
  // und liefert Maps kategorie -> introText bzw. -> type für Anzeige/Filter.
  static getMerged() {
    const merged = {};
    const introByCategory = {};
    const typeByCategory = {};

    for (const meta of this.listInstalled()) {
      const data = this.getData(meta.id);
      if (!data) continue;
      for (const [category, books] of Object.entries(data)) {
        introByCategory[category] = meta.introText || "";
        typeByCategory[category] = meta.type || "";
        merged[category] = merged[category] || {};
        for (const [book, questions] of Object.entries(books)) {
          merged[category][book] = (merged[category][book] || []).concat(questions);
        }
      }
    }
    return { merged, introByCategory, typeByCategory };
  }

  // Verfügbare Typen mit ihren Büchern (für die Auswahl-UI), z. B.
  //   [ { type: "Zitate", books: ["Matthäus", ...] }, ... ]
  static listTypesAndBooks() {
    const byType = new Map();
    for (const meta of this.listInstalled()) {
      const type = meta.type || "Sonstige";
      if (!byType.has(type)) byType.set(type, new Set());
      (meta.books || []).forEach((b) => byType.get(type).add(b));
    }
    return [...byType.entries()].map(([type, books]) => ({
      type,
      books: [...books],
    }));
  }
}
