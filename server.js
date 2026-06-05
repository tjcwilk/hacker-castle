// server.js — the castle's front door.
//
// A small Express web server. It does two jobs:
//   1. Serves the static front-end (the pixel-art castle) from /public.
//   2. Offers a tiny JSON API the front-end can talk to.
// Everything runs in ONE process, in ONE container, on port 80.

const express = require('express');
const path = require('path');
const { initDb } = require('./db');
const challenges = require('./challenges');

const app = express();
const PORT = process.env.PORT || 80;

// Build a fresh database the moment the castle wakes up.
const db = initDb();

// Lets us read JSON bodies from POST requests (e.g. a student's nickname).
app.use(express.json());

// Serve the castle itself: index.html, CSS, JS, images, etc.
// "no-cache" tells browsers to re-check with the server before reusing a file,
// so an updated page never gets stuck behind a stale cached script.
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res) => res.setHeader('Cache-Control', 'no-cache'),
}));

// Clean URL for the Great Hall (inside the castle). The static middleware above
// already serves /great-hall.html; this lets the nicer "/great-hall" path work.
app.get('/great-hall', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'great-hall.html'));
});

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
// badges too, so the next person starts fresh. The reserved "dragon" user
// (id 0) is left untouched.
app.post('/api/leave', (req, res) => {
  db.prepare('DELETE FROM badges WHERE user_id = 1').run();
  db.prepare('DELETE FROM user WHERE id = 1').run();
  res.json({ ok: true });
});

// The list of challenges for the Great Hall badges board + room doors. We never
// send the secret flags — only public info + whether the student earned each.
app.get('/api/challenges', (req, res) => {
  const passed = new Set(
    db.prepare('SELECT name FROM badges WHERE user_id = 1 AND passed = 1')
      .all()
      .map((r) => r.name) // we store the challenge slug in badges.name
  );
  res.json(
    challenges.map((c) => ({
      slug: c.slug,
      name: c.name,
      icon: c.icon,
      blurb: c.blurb,
      passed: passed.has(c.slug),
    }))
  );
});

// Submit a secret flag. If it matches a challenge, mark that challenge passed
// for the student and light up its badge. The flag check is case-insensitive.
app.post('/api/flag', (req, res) => {
  const student = db.prepare('SELECT 1 FROM user WHERE id = 1').get();
  if (!student) {
    return res.status(401).json({ error: 'Enter the castle with a nickname first!' });
  }
  const flag = String(req.body.flag || '').trim();
  if (!flag) return res.status(400).json({ error: 'Type a flag to claim it.' });

  const match = challenges.find((c) => c.flag.toLowerCase() === flag.toLowerCase());
  if (!match) {
    return res.status(400).json({ error: 'That flag does not fit any lock. Keep hunting!' });
  }

  // Already earned? (We store the challenge slug in badges.name.)
  const existing = db.prepare('SELECT id, passed FROM badges WHERE user_id = 1 AND name = ?').get(match.slug);
  const alreadyHad = !!(existing && existing.passed);
  if (existing) {
    db.prepare('UPDATE badges SET passed = 1 WHERE id = ?').run(existing.id);
  } else {
    db.prepare('INSERT INTO badges (user_id, name, passed) VALUES (1, ?, 1)').run(match.slug);
  }
  res.json({ slug: match.slug, name: match.name, icon: match.icon, alreadyHad });
});

app.listen(PORT, () => {
  console.log(`🏰 Hacker Castle is open on port ${PORT}`);
});
