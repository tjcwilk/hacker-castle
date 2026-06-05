// server.js — the castle's front door.
//
// A small Express web server. It does two jobs:
//   1. Serves the static front-end (the pixel-art castle) from /public.
//   2. Offers a tiny JSON API the front-end can talk to.
// Everything runs in ONE process, in ONE container, on port 80.

const express = require('express');
const path = require('path');
const { initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 80;

// Build a fresh database the moment the castle wakes up.
const db = initDb();

// Lets us read JSON bodies from POST requests (e.g. a student's handle).
app.use(express.json());

// Serve the castle itself: index.html, CSS, JS, images, etc.
// "no-cache" tells browsers to re-check with the server before reusing a file,
// so an updated page never gets stuck behind a stale cached script.
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res) => res.setHeader('Cache-Control', 'no-cache'),
}));

// --- API skeleton ----------------------------------------------------------
// These are wired up and working so the whole stack is provably alive. The
// front-end's "Enter the Castle" gate already calls /api/enter.

// Is the castle awake? Handy for the lab's health checks.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', castle: 'hacker-castle', version: '0.1.0' });
});

// Who is the single user? Returns their nickname, or null if nobody has
// entered yet this session. The front-end uses this to say "welcome back".
app.get('/api/me', (req, res) => {
  const row = db.prepare('SELECT nickname FROM user WHERE id = 1').get();
  res.json({ nickname: row ? row.nickname : null });
});

// The single user enters by giving a nickname. There is only ever one user
// (row id 1), so we create it on first entry and update it after that.
// "returning" tells the front-end whether this person has been here before.
app.post('/api/enter', (req, res) => {
  const nickname = String(req.body.nickname || '').trim().slice(0, 24);
  if (!nickname) {
    return res.status(400).json({ error: 'The gatekeeper needs a name first!' });
  }
  const returning = !!db.prepare('SELECT 1 FROM user WHERE id = 1').get();
  db.prepare(`
    INSERT INTO user (id, nickname) VALUES (1, ?)
    ON CONFLICT(id) DO UPDATE SET nickname = excluded.nickname
  `).run(nickname);
  res.json({ nickname, returning });
});

// "Run away": the student leaves and is forgotten (a logout). We clear their
// scores too, so the next person starts fresh. The reserved "dragon" user
// (id 0) is left untouched.
app.post('/api/leave', (req, res) => {
  db.prepare('DELETE FROM score WHERE user_id = 1').run();
  db.prepare('DELETE FROM user WHERE id = 1').run();
  res.json({ ok: true });
});

// The notice board: who has passed which challenge. Empty for now, but wired.
app.get('/api/scores', (req, res) => {
  const rows = db.prepare(`
    SELECT u.nickname, s.name AS challenge, s.passed
    FROM score s
    JOIN user  u ON u.id = s.user_id
    ORDER BY u.nickname, s.name
  `).all();
  res.json(rows);
});

app.listen(PORT, () => {
  console.log(`🏰 Hacker Castle is open on port ${PORT}`);
});
