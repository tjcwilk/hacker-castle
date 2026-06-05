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
// Single user. The gate just asks for a nickname. Clicking "Enter the Castle"
// goes straight into the Great Hall if we already know the player; otherwise it
// opens the gate to ask for a name, then enters. The gate is also reused (via
// the "change name" link) to rename without entering.
const gate = document.getElementById('gate');
const gateForm = document.getElementById('gate-form');
const gateResult = document.getElementById('gate-result');
const entryTitle = document.getElementById('gate-entry-title');
const nicknameInput = document.getElementById('nickname');
const playerStatus = document.getElementById('player-status');
const playerName = document.getElementById('player-name');

let currentNickname = null; // the single user's saved name, once we know it
let renaming = false;       // gate opened to rename (don't enter on submit)

// Keep the hero's "Playing as ..." line in sync with the saved nickname.
function refreshHero() {
  if (currentNickname) {
    playerName.textContent = currentNickname;
    playerStatus.hidden = false;
  } else {
    playerStatus.hidden = true;
  }
}

function showGate({ changing = false } = {}) {
  renaming = changing;
  gate.hidden = false;
  gateResult.textContent = '';
  entryTitle.textContent = changing ? 'Change your name' : 'Who approaches the castle?';
  nicknameInput.value = changing && currentNickname ? currentNickname : '';
  nicknameInput.focus();
  nicknameInput.select();
}

const enterOverlay = document.getElementById('enter-overlay');
const landingEl = document.querySelector('.landing');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function closeGate() { gate.hidden = true; }

// Step "into" the castle: zoom the scene into the gate, fade to black, then go.
function enterHall() {
  closeGate();
  const gateArch = document.querySelector('.castle .gate');
  if (reduceMotion || !gateArch || !landingEl) {
    window.location.href = '/great-hall';
    return;
  }
  const r = gateArch.getBoundingClientRect();
  landingEl.style.transformOrigin =
    `${((r.left + r.width / 2) / window.innerWidth) * 100}% ` +
    `${((r.top + r.height / 2) / window.innerHeight) * 100}%`;
  landingEl.classList.add('entering');
  enterOverlay.classList.add('on');
  setTimeout(() => { window.location.href = '/great-hall'; }, 650);
}

// "Run away" = log out. Forget the saved nickname and reset the hero.
async function runAway() {
  try { await fetch('/api/leave', { method: 'POST' }); } catch { /* ignore */ }
  currentNickname = null;
  refreshHero();
}

// "Enter the Castle": straight in if we know them, else ask for a name first.
function enterCastle() {
  if (currentNickname) enterHall();
  else showGate();
}

document.querySelectorAll('[data-enter]').forEach((btn) =>
  btn.addEventListener('click', enterCastle)
);
document.querySelectorAll('[data-change]').forEach((btn) =>
  btn.addEventListener('click', () => showGate({ changing: true }))
);
document.querySelectorAll('[data-leave]').forEach((btn) =>
  btn.addEventListener('click', runAway)
);
document.getElementById('gate-cancel').addEventListener('click', closeGate);
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
    currentNickname = data.nickname;
    refreshHero();
    if (renaming) closeGate();  // just renamed — stay on the gate page
    else enterHall();           // entered a name — go inside
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
