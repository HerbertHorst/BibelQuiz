// bibleBooks.js
// Kanonische Reihenfolge der Bibelbücher (deutsche Elberfelder-Namen) und ein
// Helfer, der eine Liste vorhandener Bücher in die Obergruppen
// "Altes Testament" / "Neues Testament" / "Sonstige" einteilt. Wird vom
// Bücher-Drawer genutzt, um ein-/ausklappbare Gruppen mit Checkboxen zu bauen.

// Reihenfolge wie in der Bibel; Schreibweise muss zu den Katalog-Buchnamen passen.
export const OT_BOOKS = [
  "1. Mose", "2. Mose", "3. Mose", "4. Mose", "5. Mose",
  "Josua", "Richter", "Ruth", "1. Samuel", "2. Samuel",
  "1. Könige", "2. Könige", "1. Chronik", "2. Chronik",
  "Esra", "Nehemia", "Esther", "Hiob", "Psalm", "Psalmen",
  "Sprüche", "Prediger", "Hoheslied", "Jesaja", "Jeremia",
  "Klagelieder", "Hesekiel", "Daniel", "Hosea", "Joel", "Amos",
  "Obadja", "Jona", "Micha", "Nahum", "Habakuk", "Zephanja",
  "Haggai", "Sacharja", "Maleachi",
];

export const NT_BOOKS = [
  "Matthäus", "Markus", "Lukas", "Johannes", "Apostelgeschichte",
  "Römer", "1. Korinther", "2. Korinther", "Galater", "Epheser",
  "Philipper", "Kolosser", "1. Thessalonicher", "2. Thessalonicher",
  "1. Timotheus", "2. Timotheus", "Titus", "Philemon", "Hebräer",
  "Jakobus", "1. Petrus", "2. Petrus", "1. Johannes", "2. Johannes",
  "3. Johannes", "Judas", "Offenbarung",
];

const otOrder = new Map(OT_BOOKS.map((b, i) => [b, i]));
const ntOrder = new Map(NT_BOOKS.map((b, i) => [b, i]));

// Deduplizierte kanonische Reihenfolge (ohne Schreibvarianten wie "Psalmen")
// für die Lernspiele "Bücher sortieren" und "AT oder NT?". Die obigen Listen
// dürfen Varianten enthalten, damit der Katalog-Abgleich greift – hier brauchen
// wir dagegen genau 39 + 27 = 66 eindeutige Bücher.
export const OT_BOOKS_ORDER = OT_BOOKS.filter((b) => b !== "Psalmen");
export const NT_BOOKS_ORDER = [...NT_BOOKS];
export const BIBLE_BOOKS_ORDER = [...OT_BOOKS_ORDER, ...NT_BOOKS_ORDER];

/**
 * Liefert "AT" / "NT" für ein bekanntes Buch, sonst null.
 * @param {string} book
 * @returns {"AT" | "NT" | null}
 */
export function testamentOf(book) {
  if (otOrder.has(book)) return "AT";
  if (ntOrder.has(book)) return "NT";
  return null;
}

/**
 * Teilt eine Liste von Buchnamen in Obergruppen für den Drawer ein.
 * Leere Gruppen werden weggelassen; Reihenfolge: AT, NT, Sonstige.
 * @param {string[]} books
 * @returns {{ id: string, label: string, books: string[] }[]}
 */
export function groupBooksByTestament(books) {
  const at = [];
  const nt = [];
  const other = [];

  for (const book of books) {
    if (otOrder.has(book)) at.push(book);
    else if (ntOrder.has(book)) nt.push(book);
    else other.push(book);
  }

  at.sort((a, b) => otOrder.get(a) - otOrder.get(b));
  nt.sort((a, b) => ntOrder.get(a) - ntOrder.get(b));
  other.sort((a, b) => a.localeCompare(b, "de"));

  const groups = [
    { id: "AT", label: "Altes Testament", books: at },
    { id: "NT", label: "Neues Testament", books: nt },
    { id: "OTHER", label: "Sonstige", books: other },
  ];
  return groups.filter((g) => g.books.length > 0);
}
