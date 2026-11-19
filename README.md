# Essensbestellung

Die kleine Kochidee-Maschine: Rezepte sammeln, Zutaten als WhatsApp-Liste
kopieren und per gewichtetem Zufall entscheiden, was als Nächstes gekocht wird.

## Features

- **Drei Kategorien** – Normal, Zu dritt und Alleine, jeweils mit eigener
  Rezeptliste. Ein Rezept kann in mehreren Kategorien liegen.
- **Rezepte anlegen und bearbeiten** – Name, Zutatenliste, optionaler Link zum
  Originalrezept (z. B. Chefkoch) und optionaler Freitext zur Zubereitung.
- **Mengen direkt in der Zutat** – „4 Möhren“ ist einfach eine Zeile, keine
  getrennte Mengenspalte.
- **Zutaten für WhatsApp kopieren** – erzeugt genau dieses Format:
  ```
  * 4 Möhren
  * 1 Zwiebel
  * 200 ml Sahne
  ```
- **Gewichteter Vorschlag** – lange nicht gekochte Rezepte kommen zuerst. Das
  zuletzt gekochte Rezept wird beim nächsten Vorschlag hart ausgeschlossen,
  solange es Alternativen gibt.
- **Gekocht / Doch nicht gekocht** – ein Klick aktualisiert den Zeitpunkt des
  letzten Kochens; „Doch nicht gekocht“ nimmt den letzten Eintrag zurück und
  stellt das Rezept sofort wieder in die Auswahl.
- **Lokale SQLite-Datenbank** – alle Daten bleiben auf dem Rechner, ohne Cloud
  und ohne Anmeldung.

## Setup

Voraussetzungen: Node.js 20+ (getestet mit Node 24) und npm.

```bash
npm install
./start.sh
```

`start.sh` startet den Dev-Server auf <http://127.0.0.1:3001> und öffnet den
Browser. Port 3001 ist bewusst gewählt, damit die App parallel zu
`rate-your-picture` (Port 3000) laufen kann. Ohne Browser:

```bash
./start.sh --no-browser
```

Anderer Port:

```bash
ESSENSBESTELLUNG_PORT=3100 ./start.sh
```

Aktuelle Standardports der Projekte (alle können parallel laufen):

| Projekt | Port |
| --- | --- |
| rate-your-picture | 3000 |
| **essensbestellung** | **3001** |
| meta-meteo | 8000 |
| sidequest (Backend) | 8001 |
| sidequest (BRouter) | 17777 |
| waste-my-time | 8765 |
| tuerkmek | – (Telegram-Bot, Long Polling) |
| analyze-your-music | – (Scheduler-Skript) |

Alternativ direkt:

```bash
npm run dev
```

## Bedienung

1. Auf der Startseite eine Runde wählen: **Normal**, **Zu dritt** oder
   **Alleine**.
2. Auf der Kategorie-Seite **Vorschlag würfeln** drücken. Der Vorschlag zeigt
   Zutaten, Link und Zubereitung.
3. **Gekocht!** markiert das Gericht und feiert kurz. Mit **Nochmal** kommt ein
   anderer Vorschlag, mit **Doch nicht gekocht** wird die Markierung
   zurückgenommen.
4. Über **Neues Rezept** ein Rezept anlegen. Die Kategorie ist dabei schon
   vorausgewählt.
5. Im Rezept **Zutaten kopieren** drücken und die Liste in WhatsApp einfügen.

Der Kopieren-Button nutzt zuerst die moderne Clipboard-API. Wenn der Browser sie
blockiert (z. B. bei Aufruf über eine lokale IP ohne HTTPS), öffnet sich ein
Dialog mit bereits markiertem Text zum manuellen Kopieren.

## Zufallsauswahl

Die Auswahl ist bewusst nicht gleichverteilt:

- Nie gekochte Rezepte haben das höchste Gewicht.
- Ansonsten gilt `Gewicht = (Tage seit dem letzten Kochen + 2)²`, gedeckelt
  nach einem Jahr.
- Das Rezept mit dem jüngsten Koch-Event wird aus dem Kandidatenpool entfernt,
  solange mindestens eine Alternative übrig bleibt.
- „Nochmal“ schließt zusätzlich den aktuell gezeigten Vorschlag aus.

Jeder Kochvorgang wird als eigenes Event gespeichert. „Zuletzt gekocht“ ist
einfach das jüngste Event; „Doch nicht gekocht“ löscht das jüngste Event.

## Datenbank

Die SQLite-Datei wird beim ersten Zugriff automatisch angelegt:

```
data/essensbestellung.db
```

Sie ist in `.gitignore` eingetragen und gehört nicht ins Repository. Für ein
Backup den Server stoppen und die Datei (bei laufendem WAL-Modus zusammen mit
`-wal` und `-shm`) kopieren. Tabellen:

- `recipes` – Name, Link, Zubereitung, Erstellzeitpunkt
- `recipe_categories` – Rezept ↔ Kategorie
- `ingredients` – Zutatenzeilen mit Position
- `cook_events` – jeder Kochvorgang mit Zeitstempel

Ein anderer Speicherort lässt sich über `ESSENSBESTELLUNG_DB` setzen:

```bash
ESSENSBESTELLUNG_DB=/pfad/zur/datei.db ./start.sh
```

## Entwicklung

```bash
npm run dev     # Dev-Server
npm run build   # Produktions-Build
npm run start   # Produktions-Server
npm run lint    # ESLint
npm test        # Vitest (Gewichtung, Validierung, Datenbank, Formatierung)
```

Technik: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4,
better-sqlite3. Die Kategorie-Illustrationen sind handgebaute SVGs in
`public/images/categories/`.
