import { DEFAULT_CATEGORIES } from '../utils/constants';

const DATABASE_VERSION = 5;

/**
 * Initialize and migrate the database schema.
 * Called by SQLiteProvider's onInit callback.
 */
export async function migrateDbIfNeeded(db) {
  // Enable WAL mode for better performance
  await db.execAsync(`PRAGMA journal_mode = 'wal';`);

  // Check current version
  const result = await db.getFirstAsync('PRAGMA user_version');
  let currentVersion = result?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentVersion === 0) {
    // --- Categories table ---
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        icon TEXT DEFAULT 'ellipsis-horizontal',
        color TEXT DEFAULT '#888888',
        is_default INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // --- Expenses table ---
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        category_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        notes TEXT DEFAULT '',
        is_recurring INTEGER DEFAULT 0,
        recurrence_interval TEXT DEFAULT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (category_id) REFERENCES categories(id)
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS incomes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        source TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // --- Budgets table ---
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        month TEXT NOT NULL,
        amount REAL NOT NULL,
        UNIQUE(category_id, month),
        FOREIGN KEY (category_id) REFERENCES categories(id)
      );
    `);

    // --- Settings table ---
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // --- Create indices for performance ---
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
      CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
      CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);
    `);

    // --- Seed default categories ---
    for (const cat of DEFAULT_CATEGORIES) {
      await db.runAsync(
        'INSERT OR IGNORE INTO categories (name, icon, color, is_default) VALUES (?, ?, ?, ?)',
        [cat.name, cat.icon, cat.color, cat.is_default]
      );
    }

    // --- Seed default settings ---
    await db.runAsync(
      'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
      ['currency', '₹']
    );
    await db.runAsync(
      'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
      ['darkMode', 'system']
    );
    await db.runAsync(
      'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
      ['onboarding_completed', 'false']
    );

    currentVersion = 1;
  }

  if (currentVersion === 1) {
    // Migration 2: Update default categories to refined monochrome shades
    for (const cat of DEFAULT_CATEGORIES) {
      await db.runAsync(
        'UPDATE categories SET color = ?, icon = ? WHERE name = ? AND is_default = 1',
        [cat.color, cat.icon, cat.name]
      );
    }
    currentVersion = 2;
  }

  if (currentVersion === 2) {
    // Migration 3: Give default categories distinct solid colors
    for (const cat of DEFAULT_CATEGORIES) {
      await db.runAsync(
        'UPDATE categories SET color = ? WHERE name = ? AND is_default = 1',
        [cat.color, cat.name]
      );
    }
    currentVersion = 3;
  }

  if (currentVersion === 3) {
    // Migration 4: Add income tracking
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS incomes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        source TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes(date);
    `);
    currentVersion = 4;
  }

  if (currentVersion === 4) {
    // Migration 5: Replace the old teal category palette
    for (const cat of DEFAULT_CATEGORIES) {
      await db.runAsync(
        'UPDATE categories SET color = ? WHERE name = ? AND is_default = 1',
        [cat.color, cat.name]
      );
    }
    currentVersion = 5;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
