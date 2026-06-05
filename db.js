// db.js — the castle's memory.
//
// We use SQLite (a whole database that lives in a single file) through the
// "better-sqlite3" library. Its queries are SYNCHRONOUS, so the code reads
// top-to-bottom with no callbacks or promises — easy to follow if you're
// learning. Every query uses a prepared statement with "?" placeholders:
// that's the right way to stop SQL-injection attacks. (You'll learn to *break*
// the wrong way in one of the castle rooms!)

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'castle.db');

function initDb() {
  // Design decision: a FRESH database every time the castle boots, so the
  // training lab always starts from a clean, known state. We delete any old
  // file (and its WAL side-files) before creating a new one.
  for (const suffix of ['', '-wal', '-shm', '-journal']) {
    const file = DB_PATH + suffix;
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }

  const db = new Database(DB_PATH);
  // Use the default rollback journal so the database is a single "castle.db"
  // file (no -wal / -shm side-files). Fine for this tiny single-user app.
  db.pragma('journal_mode = DELETE');
  db.pragma('foreign_keys = ON'); // actually enforce the user <-> score link

  // --- Schema ---------------------------------------------------------------
  // The "user" table holds at most two rows, both fixed by a CHECK:
  //   id 0 = "dragon" — a reserved castle character (seeded below). Not a player.
  //   id 1 = the single student who plays. Created when they enter at the gate.
  // The "score" table links back to a user.
  //
  //   user                 score
  //   ----                 -----
  //   id (0=dragon,        id        (unique id for this challenge entry)
  //       1=student) ◄───── user_id   (which user this score belongs to)
  //   nickname             name      (the challenge's name)
  //                        passed    (0 = not passed, 1 = passed)
  //
  // A user has many score rows — one per challenge. Each challenge is simply
  // passed or not. SQLite has no real boolean, so "passed" is an INTEGER
  // limited by a CHECK to 0 or 1.
  db.exec(`
    CREATE TABLE user (
      id       INTEGER PRIMARY KEY CHECK (id IN (0, 1)), -- 0 = dragon, 1 = student
      nickname TEXT    NOT NULL
    );

    CREATE TABLE score (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,        -- unique challenge entry id
      user_id INTEGER NOT NULL REFERENCES user(id),     -- links this score to a user
      name    TEXT    NOT NULL,                         -- the challenge's name
      passed  INTEGER NOT NULL DEFAULT 0                -- 0 = not passed, 1 = passed
              CHECK (passed IN (0, 1))
    );
  `);

  // Seed the reserved "dragon" character as the very first user (id 0). Nothing
  // uses it yet — it's here for a future part of the castle. The student is
  // added separately (id 1) when they enter at the gate.
  db.prepare('INSERT INTO user (id, nickname) VALUES (0, ?)').run('dragon');

  console.log('🗄️  Fresh castle database created (user + score tables, dragon seeded).');
  return db;
}

module.exports = { initDb };
