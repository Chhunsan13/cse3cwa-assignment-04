const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dataDir = path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "supermarket.db");
const db = new sqlite3.Database(dbPath);

function initDb() {
  return new Promise((resolve, reject) => {
    db.run("PRAGMA foreign_keys = ON", (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

module.exports = { db, initDb, dbPath };
