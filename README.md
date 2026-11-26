# Essensbestellung

Die kleine Kochidee-Maschine: Rezepte sammeln, Zutaten als WhatsApp-Liste
kopieren und per gewichtetem Zufall entscheiden, was als Nächstes gekocht wird.

## Features

- **Drei Kategorien** – Normal, Zu dritt und Alleine, jeweils mit eigener
  Rezeptliste. Ein Rezept kann in mehreren Kategorien liegen.
- **Rezepte anlegen und bearbeiten** – Name, Zutatenliste, optionaler Link zum
  Originalrezept (z. B. Chefkoch) und optionaler Freitext zur Zubereitung.
- **Mengen mit Einheit** – jede Zutat hat Menge, Einheit und Namen. Zutaten
  ohne sinnvolle Menge (z. B. Preiselbeermarmelade) bleiben einfach ohne Menge
  stehen.
- **Portionen skalieren** – Rezepte speichern, für wie viele Personen ihre
  Mengen gedacht sind. Über den Personen-Stepper lässt sich die Zutatenliste
  live anpassen: Normal startet bei 4, Zu dritt bei 3 und Alleine bei 1 Person.
- **Zutaten für WhatsApp kopieren** – erzeugt genau dieses Format:
  ```
  🍽️ Essensbestellung! 🛒
  * 4 Möhren
  * 1 Zwiebel
  * 200 ml Sahne
  ```
  Die Mengen entsprechen dabei der aktuell gewählten Personenzahl.
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
./run.sh
```

`run.sh` startet den Dev-Server auf <http://127.0.0.1:3001> und öffnet den
Browser. Port 3001 ist bewusst gewählt, damit die App parallel zu
`rate-your-picture` (Port 3000) laufen kann. Ohne Browser:

```bash
./run.sh --no-browser
```

Anderer Port:

```bash
ESSENSBESTELLUNG_PORT=3100 ./run.sh
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
   vorausgewählt; die Personenzahl für die Zutaten lässt sich separat einstellen.
5. Im Rezept **Zutaten kopieren** drücken und die Liste in WhatsApp einfügen.
   Mit dem Personen-Stepper bei den Zutaten kann man die Mengen vorher
   skalieren.

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

## Mengen und Portionen

Jede Zutat besteht aus Menge, Einheit und Namen. Rezepte speichern zusätzlich
eine Basis-Personenzahl:

- Normal-Rezepte starten mit 4 Personen.
- Zu-dritt-Rezepte starten mit 3 Personen.
- Alleine-Rezepte starten mit 1 Person.

Die Personenzahl lässt sich beim Anlegen und Bearbeiten ändern. In der
Rezeptansicht und im Vorschlags-Dialog skaliert der Stepper die Mengen live;
der WhatsApp-Export verwendet die eingestellte Portion. Gewichte und
Flüssigkeiten werden sinnvoll gerundet, Zählbares und Packungseinheiten in
Vierteln dargestellt (z. B. „¼ Becher Sahne“).

Bleibt die Menge leer, wird die Zutat nicht skaliert. Das ist für Dinge wie
Preiselbeermarmelade, Salz oder „etwas Petersilie“ gedacht.

## Datenbank

Die SQLite-Datei wird beim ersten Zugriff automatisch angelegt:

```
data/essensbestellung.db
```

Sie ist in `.gitignore` eingetragen und gehört nicht ins Repository. Für ein
Backup den Server stoppen und die Datei (bei laufendem WAL-Modus zusammen mit
`-wal` und `-shm`) kopieren. Tabellen:

- `recipes` – Name, Link, Zubereitung, Basis-Personenzahl, Erstellzeitpunkt
- `recipe_categories` – Rezept ↔ Kategorie
- `ingredients` – Zutaten mit Position, Menge, Einheit und Namen
- `cook_events` – jeder Kochvorgang mit Zeitstempel

Ein anderer Speicherort lässt sich über `ESSENSBESTELLUNG_DB` setzen:

```bash
ESSENSBESTELLUNG_DB=/pfad/zur/datei.db ./run.sh
```

## Entwicklung

```bash
npm run dev     # Dev-Server
npm run build   # Produktions-Build
npm run start   # Produktions-Server
npm run lint    # ESLint
npm test        # Vitest (Gewichtung, Validierung, Datenbank, Formatierung, Mengen)
```

Technik: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4,
better-sqlite3. Die Kategorie-Illustrationen sind handgebaute SVGs in
`public/images/categories/`.
