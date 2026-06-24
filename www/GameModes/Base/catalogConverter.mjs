// Gemeinsames, umgebungsunabhängiges Konvertierungsmodul (Excel -> Katalog).
//
// Läuft sowohl in Node (Build-Skript) als auch im Browser (In-App-Upload):
// Es bekommt bereits geparste Tabellen-Zeilen übergeben (von SheetJS
// XLSX.utils.sheet_to_json) und kennt selbst kein Dateisystem.
//
// Zielformat (von der App erwartet): Kategorie -> Buch -> [Frage, ...]
//   { "Zitate_NT": { "Markus": [ { question, biblePassageTipp,
//     choice1..choice4, answer } ] } }

const MIN_ANSWER = 1;
const MAX_ANSWER = 4;

function cleanCell(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

// "1, 2"-artige Mehrfachantworten werden bewusst (noch) nicht unterstützt –
// die App wertet derzeit genau eine richtige Antwort (1..4) aus.
function toAnswerIndex(value) {
  const n = typeof value === "number" ? value : parseInt(String(value).trim(), 10);
  return Number.isInteger(n) && n >= MIN_ANSWER && n <= MAX_ANSWER ? n : null;
}

// Vereinheitlicht zahlenpräfixierte Bibelbücher: "1.Mose" -> "1. Mose",
// "2.Samuel" -> "2. Samuel". Idempotent ("1. Mose" bleibt "1. Mose").
// Andere Namen ("Matthäus", "Zahlen", "Josua") bleiben unverändert.
function normalizeNumberedBook(name) {
  return name.replace(/^(\d+)\.\s*/, "$1. ");
}

// Entfernt bekannte Tabellenblatt-Präfixe ("Allgemeine Fragen 1.Mose" -> "1.Mose")
// und vereinheitlicht anschließend zahlenpräfixierte Buchnamen.
export function normalizeBookName(sheetName, stripPrefixes = []) {
  let name = cleanCell(sheetName);
  for (const prefix of stripPrefixes) {
    if (name.startsWith(prefix)) {
      name = name.slice(prefix.length).trim();
      break;
    }
  }
  return normalizeNumberedBook(name);
}

// Eine Tabellenzeile (nach Header gekeyt) -> validierte Frage oder null.
export function rowToQuestion(row) {
  const question = cleanCell(row.question);
  const choices = [row.choice1, row.choice2, row.choice3, row.choice4].map(cleanCell);
  const answer = toAnswerIndex(row.answer);

  const isComplete = question && !choices.some((c) => c === "") && answer !== null;
  if (!isComplete) return null;

  return {
    question,
    biblePassageTipp: cleanCell(row.biblePassageTipp),
    choice1: choices[0],
    choice2: choices[1],
    choice3: choices[2],
    choice4: choices[3],
    answer,
  };
}

/**
 * Baut aus den Tabellen eines Workbooks einen Katalog + Metadaten.
 *
 * @param {Object.<string, Array<Object>>} sheets - sheetName -> Zeilenobjekte.
 * @param {Object} config - { id, category, type, title, introText, out, stripBookPrefixes }
 * @returns {{ catalog: Object, meta: Object, report: Object }}
 */
export function buildCatalog(sheets, config) {
  const { category, stripBookPrefixes = [] } = config;
  const books = {};
  const bookOrder = [];
  const report = {
    totalRows: 0,
    accepted: 0,
    skipped: 0,
    incomplete: [], // Zeilen mit Fragetext, aber unvollständig (z.B. ohne Antwort)
    duplicateQuestions: [],
  };
  const seen = new Map(); // Fragetext -> erstes Buch (Dubletten-Erkennung)

  for (const [sheetName, rows] of Object.entries(sheets)) {
    const book = normalizeBookName(sheetName, stripBookPrefixes);
    const list = [];

    for (const row of rows) {
      report.totalRows++;
      const question = rowToQuestion(row);
      if (!question) {
        report.skipped++;
        // Zeile hat Inhalt (Fragetext), wurde aber wegen fehlender Antwort /
        // fehlender Auswahl verworfen -> als Datenlücke melden.
        const questionText = cleanCell(row.question);
        if (questionText) {
          report.incomplete.push({ book, question: questionText });
        }
        continue;
      }
      if (seen.has(question.question)) {
        report.duplicateQuestions.push({
          question: question.question,
          firstIn: seen.get(question.question),
          alsoIn: book,
        });
      } else {
        seen.set(question.question, book);
      }
      list.push(question);
      report.accepted++;
    }

    if (list.length > 0) {
      books[book] = list;
      bookOrder.push(book);
    }
  }

  const catalog = { [category]: books };
  const meta = {
    id: config.id,
    title: config.title,
    type: config.type,
    introText: config.introText ?? "",
    category,
    file: config.out,
    books: bookOrder,
    questionCount: report.accepted,
    generatedAt: new Date().toISOString().slice(0, 10),
  };

  return { catalog, meta, report };
}
