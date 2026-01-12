import { Database } from "bun:sqlite";
import { join } from "path";
import { homedir } from "os";

let db: Database | null = null;

/**
 * Get or create singleton database instance with strict mode enabled
 */
export function getDatabase(): Database {
  if (db) {
    return db;
  }

  const dbPath = process.env["DATABASE_PATH"] || join(homedir(), "receipts.db");
  db = new Database(dbPath, { strict: true });
  
  // Enable foreign keys
  db.run("PRAGMA foreign_keys = ON");
  
  return db;
}

/**
 * Initialize database schema - create tables if they don't exist
 */
export function initDatabase(): void {
  const database = getDatabase();
  
  // Create receipts table
  database.run(`
    CREATE TABLE IF NOT EXISTS receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      merchant_name TEXT,
      receipt_date TEXT,
      total_amount REAL,
      currency TEXT DEFAULT 'USD',
      raw_text TEXT,
      processed_at TEXT DEFAULT CURRENT_TIMESTAMP,
      processing_status TEXT DEFAULT 'pending'
    )
  `);
  
  // Create receipt_items table
  database.run(`
    CREATE TABLE IF NOT EXISTS receipt_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      quantity REAL DEFAULT 1,
      unit_price REAL,
      total_price REAL NOT NULL,
      category TEXT,
      FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE
    )
  `);
  
  // Create indexes
  database.run(`
    CREATE INDEX IF NOT EXISTS idx_receipts_filename ON receipts(filename)
  `);
  
  database.run(`
    CREATE INDEX IF NOT EXISTS idx_receipts_date ON receipts(receipt_date)
  `);
  
  database.run(`
    CREATE INDEX IF NOT EXISTS idx_items_receipt ON receipt_items(receipt_id)
  `);
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
