// landing.js — runs the landing page.
//
//   1. Builds the castle from blocks and drops it onto the page.
//   2. Wires the "Enter the Castle" gate to the real /api/enter endpoint.

// --- 1. Build the castle -------------------------------------------------
// Kept as a plain string so it's easy to read and tweak. Each tower/wall is a
// block; the CSS gives them crenellations, windows, a gate and a flag.
const CASTLE_HTML = `
  <div class="castle">
    <div class="tower">
      <span class="window w1"></span>
      <span class="window w2"></span>
    </div>
    <div class="wall"></div>
    <div class="tower tower--main">
      <div class="flagpole"><div class="flag"></div></div>
      <span class="window w1"></span>
      <div class="gate"></div>
    </div>
    <div class="wall"></div>
    <div class="tower">
      <span class="window w1"></span>
      <span class="window w2"></span>
    </div>
  </div>`;

document.querySelector('.castle-mount').innerHTML = CASTLE_HTML;

// --- 2. The gate ---------------------------------------------------------
// Single user. The gate has two states:
//   A) entry    — type or change your nickname
//   B) greeting — "Welcome [back], <name>!" with a "Change name" button
const gate = document.getElementById('gate');
const gateEntry = document.getElementById('gate-entry');
const gateGreeting = document.getElementById('gate-greeting');
const gateForm = document.getElementById('gate-form');
const gateResult = document.getElementById('gate-result');
const greetingText = document.getElementById('greeting-text');
const entryTitle = document.getElementById('gate-entry-title');
const nicknameInput = document.getElementById('nickname');
const playerStatus = document.getElementById('player-status');
const playerName = document.getElementById('player-name');

let currentNickname = null; // the single user's saved name, once we know it

// Keep the hero's "Playing as ..." line in sync with the saved nickname.
function refreshHero() {
  if (currentNickname) {
    playerName.textContent = currentNickname;
    playerStatus.hidden = false;
  } else {
    playerStatus.hidden = true;
  }
}

function showEntry({ changing = false } = {}) {
  gate.hidden = false;
  gateGreeting.hidden = true;
  gateEntry.hidden = false;
  gateResult.textContent = '';
  entryTitle.textContent = changing ? 'Change your name' : 'Who approaches the castle?';
  nicknameInput.value = changing && currentNickname ? currentNickname : '';
  nicknameInput.focus();
  nicknameInput.select();
}

function showGreeting(nickname, returning) {
  currentNickname = nickname;
  refreshHero();
  greetingText.textContent = `${returning ? 'Welcome back' : 'Welcome'}, ${nickname}!`;
  gate.hidden = false;
  gateEntry.hidden = true;
  gateGreeting.hidden = false;
}

function closeGate() {
  gate.hidden = true;
}

// "Run away" = log out. Forget the saved nickname and reset the hero.
async function runAway() {
  try { await fetch('/api/leave', { method: 'POST' }); } catch { /* ignore */ }
  currentNickname = null;
  refreshHero();
  closeGate();
}

// The big "Enter the Castle" button: greet if we know them, else ask.
function openGate() {
  if (currentNickname) showGreeting(currentNickname, true);
  else showEntry();
}

document.querySelectorAll('[data-enter]').forEach((btn) =>
  btn.addEventListener('click', openGate)
);
document.querySelectorAll('[data-change]').forEach((btn) =>
  btn.addEventListener('click', () => showEntry({ changing: true }))
);
document.querySelectorAll('[data-leave]').forEach((btn) =>
  btn.addEventListener('click', runAway)
);
document.getElementById('gate-cancel').addEventListener('click', closeGate);
document.getElementById('gate-continue').addEventListener('click', closeGate);
gate.addEventListener('click', (e) => { if (e.target === gate) closeGate(); });

gateForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nickname = nicknameInput.value.trim();
  if (!nickname) return;
  gateResult.textContent = 'Opening the gate…';
  try {
    const res = await fetch('/api/enter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'The gate stayed shut.');
    showGreeting(data.nickname, data.returning);
  } catch (err) {
    gateResult.textContent = `⚠ ${err.message}`;
  }
});

// --- 3. On load: just learn the saved nickname (if any) and show the hero
// status. We do NOT prompt here — the gate only opens when the player clicks
// "Enter the Castle" (and only asks for a name if they haven't set one).
(async function init() {
  try {
    const res = await fetch('/api/me');
    const data = await res.json();
    currentNickname = data.nickname || null;
  } catch { currentNickname = null; }

  refreshHero();
})();
