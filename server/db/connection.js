const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const dbConfig = require('../config/db.config');

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS customers (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_code        TEXT NOT NULL UNIQUE,
    full_name            TEXT NOT NULL,
    mobile_number        TEXT NOT NULL UNIQUE,
    whatsapp_number      TEXT,
    email                TEXT,
    house_number         TEXT NOT NULL,
    street               TEXT NOT NULL,
    area                 TEXT NOT NULL,
    city                 TEXT NOT NULL,
    pincode              TEXT NOT NULL,
    delivery_preference  TEXT NOT NULL CHECK (delivery_preference IN ('morning', 'evening')),
    daily_quantity       REAL NOT NULL,
    password_hash        TEXT NOT NULL,
    created_at           TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile_number);
  CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(customer_code);

  CREATE TABLE IF NOT EXISTS orders (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    order_code        TEXT NOT NULL UNIQUE,
    customer_id       INTEGER NOT NULL,
    product_id        TEXT NOT NULL,
    product_name      TEXT NOT NULL,
    quantity_label    TEXT NOT NULL,
    notes             TEXT,
    status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled')),
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
  CREATE INDEX IF NOT EXISTS idx_orders_code ON orders(order_code);
`;

let dbInstance = null;

function ensureDirExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * Returns the single shared database handle for the app, opening and
 * migrating it on first use. This is the ONLY function repositories call
 * to reach the database — nothing outside this file knows whether it's
 * talking to local SQLite or (later) a cloud database.
 */
function getDb() {
  if (dbInstance) return dbInstance;

  if (dbConfig.mode === 'cloud') {
    // Swap point for a future cloud database: connect using
    // dbConfig.cloud.connectionString here and return a handle whose
    // prepare(sql).get/all/run() shape matches node:sqlite's, so
    // customerRepository.js needs no changes.
    throw new Error(
      'DB_MODE=cloud is set but no cloud database is wired up yet. ' +
      'Set DB_MODE=local (or remove it) to use the local SQLite database.'
    );
  }

  ensureDirExists(dbConfig.local.filePath);
  dbInstance = new DatabaseSync(dbConfig.local.filePath);
  dbInstance.exec('PRAGMA journal_mode = WAL;');
  dbInstance.exec('PRAGMA foreign_keys = ON;');
  dbInstance.exec(SCHEMA);
  return dbInstance;
}

module.exports = { getDb };
