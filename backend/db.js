const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dataDir = path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "supermarket.db");
const db = new sqlite3.Database(dbPath);

function initDb() {
  const sql = `
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL,
      seed INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      day_count INTEGER NOT NULL,
      opening_cash REAL NOT NULL,
      inventory_budget REAL NOT NULL,
      opening_inventory_cost REAL NOT NULL,
      config_json TEXT NOT NULL,
      is_submitted INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id INTEGER NOT NULL,
      sku TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit_cost REAL NOT NULL,
      unit_price REAL NOT NULL,
      initial_qty INTEGER NOT NULL,
      perishable INTEGER NOT NULL,
      shelf_life_days INTEGER,
      prior_daily REAL NOT NULL,
      FOREIGN KEY (run_id) REFERENCES runs(id)
    );

    CREATE TABLE IF NOT EXISTS sim_days (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id INTEGER NOT NULL,
      day_number INTEGER NOT NULL,
      sim_date TEXT NOT NULL,
      weekday TEXT NOT NULL,
      is_weekend INTEGER NOT NULL,
      customers INTEGER NOT NULL,
      transactions INTEGER NOT NULL,
      units_sold INTEGER NOT NULL,
      revenue REAL NOT NULL,
      cogs REAL NOT NULL,
      expiry_units INTEGER NOT NULL,
      expiry_value REAL NOT NULL,
      replenishment_units INTEGER NOT NULL,
      replenishment_spend REAL NOT NULL,
      opening_cash REAL NOT NULL,
      closing_cash REAL NOT NULL,
      closing_inventory_value REAL NOT NULL,
      lost_units INTEGER NOT NULL,
      mission_json TEXT NOT NULL,
      UNIQUE (run_id, day_number),
      FOREIGN KEY (run_id) REFERENCES runs(id)
    );

    CREATE TABLE IF NOT EXISTS daily_stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id INTEGER NOT NULL,
      day_number INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      opening_qty INTEGER NOT NULL,
      received_qty INTEGER NOT NULL,
      sold_qty INTEGER NOT NULL,
      expired_qty INTEGER NOT NULL,
      closing_qty INTEGER NOT NULL,
      lost_qty INTEGER NOT NULL,
      revenue REAL NOT NULL,
      cogs REAL NOT NULL,
      UNIQUE (run_id, day_number, product_id),
      FOREIGN KEY (run_id) REFERENCES runs(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id INTEGER NOT NULL,
      day_number INTEGER NOT NULL,
      mission TEXT NOT NULL,
      units INTEGER NOT NULL,
      revenue REAL NOT NULL,
      cogs REAL NOT NULL,
      FOREIGN KEY (run_id) REFERENCES runs(id)
    );

    CREATE TABLE IF NOT EXISTS transaction_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL,
      run_id INTEGER NOT NULL,
      day_number INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      qty INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      unit_cost REAL NOT NULL,
      revenue REAL NOT NULL,
      cogs REAL NOT NULL,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS replenishment_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      order_day INTEGER NOT NULL,
      arrival_day INTEGER NOT NULL,
      qty_requested INTEGER NOT NULL,
      qty_ordered INTEGER NOT NULL,
      unit_cost REAL NOT NULL,
      cost REAL NOT NULL,
      cash_before REAL NOT NULL,
      constrained INTEGER NOT NULL,
      reason TEXT NOT NULL,
      FOREIGN KEY (run_id) REFERENCES runs(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS brain_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id INTEGER NOT NULL,
      day_number INTEGER NOT NULL,
      product_id INTEGER,
      event_type TEXT NOT NULL,
      message TEXT NOT NULL,
      action TEXT NOT NULL,
      qty INTEGER,
      amount REAL,
      FOREIGN KEY (run_id) REFERENCES runs(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `;

  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

module.exports = { db, initDb, dbPath };
