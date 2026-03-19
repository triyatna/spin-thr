require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const Database = require('better-sqlite3')
const path = require('path')

const db = new Database(path.join(__dirname, 'thr.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    ewallet_type TEXT NOT NULL,
    ewallet_number TEXT NOT NULL,
    token TEXT UNIQUE,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_prize INTEGER DEFAULT 0,
    spins_done INTEGER DEFAULT 0,
    finished INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS spin_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    spin_number INTEGER NOT NULL,
    grid TEXT NOT NULL,
    clusters TEXT NOT NULL,
    prize INTEGER DEFAULT 0,
    multiplier INTEGER DEFAULT 1,
    is_zonk INTEGER DEFAULT 0,
    is_free_spin INTEGER DEFAULT 0,
    is_rare INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id)
  );
`)

const defaults = [
  ['max_players', process.env.DEFAULT_MAX_PLAYERS || '3'],
  ['spin_count', process.env.DEFAULT_SPIN_COUNT || '6'],
  ['min_prize', process.env.DEFAULT_MIN_PRIZE || '5000'],
  ['max_prize', process.env.DEFAULT_MAX_PRIZE || '20000'],
  ['admin_wa', process.env.DEFAULT_ADMIN_WA || ''],
  ['admin_password', process.env.DEFAULT_ADMIN_PASSWORD || 'admin123'],
]

const insertSetting = db.prepare(
  'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
)
for (const [k, v] of defaults) {
  insertSetting.run(k, v)
}

// Add target_prize column to players if it doesn't exist
try {
  db.exec('ALTER TABLE players ADD COLUMN target_prize INTEGER DEFAULT 0');
} catch (e) {
  // Column already exists, ignore
}

module.exports = db
