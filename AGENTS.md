<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Essensbestellung – Agent Notes

Lokale Single-User-App zum Sammeln von Rezepten und gewichteten Vorschlagen.
Deutschsprachige UI, keine Authentifizierung, keine Cloud.

## Stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4 (Theme-Tokens in `app/globals.css`)
- better-sqlite3, DB-Datei unter `data/essensbestellung.db`
- Vitest für Unit- und Repository-Tests

## Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm test
./run.sh [--no-browser]     # Port über ESSENSBESTELLUNG_PORT
```

## Struktur

- `app/page.tsx` – Startseite mit den drei Kategorie-Karten
- `app/k/[category]/page.tsx` – Kategorie-Seite, lädt Rezepte serverseitig
- `app/rezept/neu/page.tsx` – Neues Rezept, optional `?kategorie=...`
- `app/rezept/[id]/page.tsx` – Rezept-Detail
- `components/CategoryView.tsx` – Kategorie-UI, Würfeln, Quick-Cook, Toasts
- `components/SuggestionModal.tsx` – Vorschlags-Dialog mit Gekocht/Undo
- `components/RecipeDetail.tsx` – Detailansicht und Inline-Bearbeitung
- `components/RecipeForm.tsx` – Erstellen/Bearbeiten, dynamische Zutatenzeilen
- `components/CopyIngredientsButton.tsx` – Clipboard inkl. Fallback-Dialog
- `lib/db.ts` – DB-Singleton, Schema, Pragmas
- `lib/recipes.ts` – Repository (CRUD, Kochen, Undo, Vorschlag)
- `lib/actions.ts` – Server Actions, Validierung, `revalidatePath`
- `lib/weighting.ts` – reine Gewichtungs-/Auswahl-Logik
- `lib/validation.ts` – Eingabevalidierung und Link-Normalisierung
- `lib/format.ts` – „zuletzt gekocht“ und WhatsApp-Format
- `public/images/categories/*.svg` – handgebaute Kategorie-Illustrationen

## Datenfluss

Server-Komponenten lesen über `lib/recipes.ts`. Client-Komponenten rufen die
Server Actions aus `lib/actions.ts` auf und rufen danach `router.refresh()` auf.
Die Actions revalidieren `/`, alle Kategorie-Seiten und ggf. das Rezept-Detail.

## Datenbank

Tabellen: `recipes`, `recipe_categories`, `ingredients`, `cook_events`.
Zeitstempel sind ISO-UTC-Strings. `lastCookedAt` ist das Maximum der
`cook_events`; `cookCount` deren Anzahl. „Doch nicht gekocht“ löscht das jüngste
Event. Rezept-IDs sind UUIDs. Fremdschlüssel sind aktiviert (`ON DELETE CASCADE`).

Kategorien: `normal`, `zu-dritt`, `alleine` (überall dieselben Slugs, auch in
URLs). Ein Rezept kann mehrere Kategorien haben.

## Regeln

- Zufall: nie gekocht = Maximalgewicht; sonst `(Tage + 2)²`, gedeckelt nach 365
  Tagen. Das jüngste Koch-Event wird hart ausgeschlossen, solange Alternativen
  bleiben. `excludeIds` (aktueller Vorschlag) wird zusätzlich berücksichtigt.
- Zutaten sind reine Strings, Menge steht direkt im Text („4 Möhren“).
- WhatsApp-Copy ist exakt `* <Zutat>` pro Zeile.
- Links werden mit `https://` ergänzt und nur für `http`/`https` akzeptiert.
- Mindestens eine Kategorie und eine Zutat sind Pflicht.
- Die DB-Datei und WAL-Dateien sind gitignored. Keine Seed-Daten im Repo.

## UI

- Design: Creme-Hintergrund, Tomate/Olive/Senf, 2px Ink-Rahmen, harte
  Offset-Schatten, `rounded-[2rem]`, Baloo 2 als Display-Schrift.
- Wiederverwendbare CSS-Klassen: `.btn`, `.btn-primary`, `.btn-secondary`,
  `.btn-ghost`, `.field`, `.card-hard`, `.card-soft`, `.chip`, `.label`.
- `next/image` verwenden, keine rohen `<img>`-Tags.
- Interaktive Views sind Client-Komponenten; Datenzugriff bleibt in Server-
  Komponenten bzw. Server Actions.
