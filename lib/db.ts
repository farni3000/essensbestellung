import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  link TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  servings INTEGER NOT NULL DEFAULT 4,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recipe_categories (
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('normal', 'zu-dritt', 'alleine')),
  PRIMARY KEY (recipe_id, category)
);

CREATE TABLE IF NOT EXISTS ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  amount REAL,
  unit TEXT NOT NULL DEFAULT '',
  text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cook_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  cooked_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recipe_categories_category
  ON recipe_categories(category);
CREATE INDEX IF NOT EXISTS idx_ingredients_recipe
  ON ingredients(recipe_id, position);
CREATE INDEX IF NOT EXISTS idx_cook_events_recipe
  ON cook_events(recipe_id, cooked_at);
`;

type DatabaseGlobal = typeof globalThis & {
  __essensbestellungDb?: Database.Database;
};

const globalForDb = globalThis as DatabaseGlobal;

/**
 * Amounts that the generic parser cannot infer from the old free-text lines.
 * This map is only used once by the schema migration (user_version 0 -> 1).
 */
const INFERRED_INGREDIENTS: Record<
  string,
  { amount: number | null; unit: string; name?: string }
> = {
  "Bandnudeln mit Erbsen, Schinken und Walnüssen::Knoblauch (falls nichts mehr da ist)":
    { amount: 1, unit: "Zehe" },
  "Bandnudeln mit Erbsen, Schinken und Walnüssen::Schinkenwürfel light": {
    amount: 100,
    unit: "g",
  },
  "Bandnudeln mit Erbsen, Schinken und Walnüssen::Bandnudeln": {
    amount: 300,
    unit: "g",
  },
  "Bandnudeln mit Erbsen, Schinken und Walnüssen::Walnüsse": {
    amount: 50,
    unit: "g",
  },
  "Bandnudeln mit Erbsen, Schinken und Walnüssen::Zwiebeln": {
    amount: 1,
    unit: "",
  },
  "Bandnudeln mit Erbsen, Schinken und Walnüssen::Thymian": {
    amount: 1,
    unit: "TL",
  },

  "Bolognese::Stangensellerie": { amount: 2, unit: "" },
  "Bolognese::Rote Paprika": { amount: 1, unit: "" },
  "Bolognese::Falscher Rotwein": { amount: 100, unit: "ml" },
  "Bolognese::Spaghetti": { amount: 400, unit: "g" },
  "Bolognese::Zwiebel": { amount: 1, unit: "" },
  "Bolognese::Knoblauch": { amount: 2, unit: "Zehen" },
  "Bolognese::Tomatenmark": { amount: 2, unit: "EL" },

  "Burritos::Rote Paprika": { amount: 1, unit: "" },
  "Burritos::Grüne Paprika": { amount: 1, unit: "" },
  "Burritos::400/500 g Hackfleisch": {
    amount: 450,
    unit: "g",
    name: "Hackfleisch",
  },
  "Burritos::Tortillas": { amount: 6, unit: "" },
  "Burritos::Crème fraîche": { amount: 1, unit: "Becher" },

  "Flammkuchen::Schinkenwürfel": { amount: 150, unit: "g" },
  "Flammkuchen::Camembert": { amount: 1, unit: "" },

  "Hähnchen Calvados::Hähnchenbrust (1 große ganze oder was Verpacktes)": {
    amount: 800,
    unit: "g",
  },

  "Hähnchen in Paprika::Kräuterschmelzkäse": { amount: 1, unit: "Packung" },

  "Lauch Suppe::Schmelzkäse": { amount: 1, unit: "Packung" },
  "Lauch Suppe::Crème fraîche": { amount: 1, unit: "Becher" },

  "Mettendchen + Möhrenkartoffeln::Mettendchen für 4 Personen": {
    amount: 4,
    unit: "",
    name: "Mettendchen",
  },
  "Mettendchen + Möhrenkartoffeln::Butter": { amount: 50, unit: "g" },
  "Mettendchen + Möhrenkartoffeln::Brühe": { amount: 1, unit: "TL" },

  "Spätzle + Hähnchen::Petersilie": { amount: 1, unit: "Bund" },

  "Steaks auf Rösties::TK-Rösties": { amount: 1, unit: "Packung" },

  "Stroganov::500–600 g Schweinefilet": {
    amount: 550,
    unit: "g",
    name: "Schweinefilet",
  },
  "Stroganov::Knoblauch (falls nichts mehr da ist)": {
    amount: 2,
    unit: "Zehen",
  },
  "Stroganov::Zwiebeln": { amount: 1, unit: "" },
  "Stroganov::Petersilie": { amount: 1, unit: "Bund" },
  "Stroganov::Tomatenmark": { amount: 1, unit: "EL" },

  "Türkisches Hackfleisch::Bunte Nudeln": { amount: 400, unit: "g" },
  "Türkisches Hackfleisch::Knoblauch (falls keiner mehr da ist)": {
    amount: 1,
    unit: "Zehe",
  },
};

const SIMPLE_INGREDIENT =
  /^(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|EL|TL|Dose|Dosen|Becher|Packung|Packungen|Päckchen|Glas|Gläser|Tube|Tuben|Bund|Bünde|Stange|Stangen|Zehe|Zehen|Stück|Scheibe|Scheiben)?\s+(.+)$/i;

function hasColumn(
  db: Database.Database,
  table: string,
  column: string,
): boolean {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{
    name: string;
  }>;
  return rows.some((row) => row.name === column);
}

function parseSimpleIngredient(
  text: string,
): { amount: number; unit: string; name: string } | null {
  const match = SIMPLE_INGREDIENT.exec(text.trim());
  if (!match) return null;

  const amount = Number.parseFloat(match[1].replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  return {
    amount,
    unit: match[2] ?? "",
    name: match[3].trim(),
  };
}

function migrateDatabase(db: Database.Database): void {
  const version = Number(db.pragma("user_version", { simple: true }));
  if (version >= 1) return;

  db.transaction(() => {
    const addedServings = !hasColumn(db, "recipes", "servings");
    if (addedServings) {
      db.exec(
        `ALTER TABLE recipes ADD COLUMN servings INTEGER NOT NULL DEFAULT 4`,
      );
    }
    if (!hasColumn(db, "ingredients", "amount")) {
      db.exec(`ALTER TABLE ingredients ADD COLUMN amount REAL`);
    }
    if (!hasColumn(db, "ingredients", "unit")) {
      db.exec(
        `ALTER TABLE ingredients ADD COLUMN unit TEXT NOT NULL DEFAULT ''`,
      );
    }

    if (addedServings) {
      db.exec(`
        UPDATE recipes SET servings = CASE
          WHEN EXISTS (
            SELECT 1 FROM recipe_categories rc
            WHERE rc.recipe_id = recipes.id AND rc.category = 'normal'
          ) THEN 4
          WHEN EXISTS (
            SELECT 1 FROM recipe_categories rc
            WHERE rc.recipe_id = recipes.id AND rc.category = 'zu-dritt'
          ) THEN 3
          ELSE 1
        END
      `);
    }

    const rows = db
      .prepare(
        `SELECT i.id, i.text, r.name AS recipe_name
         FROM ingredients i
         JOIN recipes r ON r.id = i.recipe_id
         WHERE i.amount IS NULL AND i.unit = ''`,
      )
      .all() as Array<{ id: number; text: string; recipe_name: string }>;

    const update = db.prepare(
      `UPDATE ingredients SET amount = ?, unit = ?, text = ? WHERE id = ?`,
    );

    for (const row of rows) {
      const parsed = parseSimpleIngredient(row.text);
      if (parsed) {
        update.run(parsed.amount, parsed.unit, parsed.name, row.id);
        continue;
      }

      const inferred =
        INFERRED_INGREDIENTS[`${row.recipe_name}::${row.text.trim()}`];
      if (!inferred) continue;

      update.run(
        inferred.amount,
        inferred.unit,
        inferred.name ?? row.text.trim(),
        row.id,
      );
    }

    db.pragma("user_version = 1");
  })();
}

function createDatabase(): Database.Database {
  const file =
    process.env.ESSENSBESTELLUNG_DB?.trim() ||
    path.join(process.cwd(), "data", "essensbestellung.db");

  fs.mkdirSync(path.dirname(file), { recursive: true });

  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  db.exec(SCHEMA);
  migrateDatabase(db);

  return db;
}

export function getDb(): Database.Database {
  if (!globalForDb.__essensbestellungDb) {
    globalForDb.__essensbestellungDb = createDatabase();
  }
  return globalForDb.__essensbestellungDb;
}
