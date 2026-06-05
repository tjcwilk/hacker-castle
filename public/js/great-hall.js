// great-hall.js — runs the castle's Great Hall.
//   1. Guards the page (need a nickname, else back to the gate).
//   2. Fills the badges board and the archway doors from /api/challenges.
//   3. Lets the student claim a secret flag, lighting up its badge.
//   4. Gives the dragon guardian things to say.

// --- Badges board + room doors -------------------------------------------
const badgesEl = document.getElementById('badges');
const doorsEl = document.getElementById('doors');
let challenges = [];

// "The Cipher Dungeon" -> "Cipher Dungeon" so it fits a door plaque.
const shortName = (name) => name.replace(/^The\s+/i, '');

function badgeMarkup(c) {
  return `<div class="badge ${c.passed ? 'earned' : 'locked'}" data-slug="${c.slug}">
    <div class="badge__icon">${c.passed ? c.icon : '🔒'}</div>
    <div class="badge__name">${shortName(c.name)}</div>
  </div>`;
}

function doorMarkup(c) {
  // Each door leads to that challenge's room page (placeholders for now).
  return `<a class="door ${c.passed ? 'done' : ''}" href="/rooms/${c.slug}.html" data-slug="${c.slug}">
    <span class="door__frame"><span class="door__leaf"></span></span>
    <span class="door__plaque">${shortName(c.name)}</span>
  </a>`;
}

function render() {
  badgesEl.innerHTML = challenges.map(badgeMarkup).join('');
  doorsEl.innerHTML = challenges.map(doorMarkup).join('');
}

async function loadChallenges() {
  const res = await fetch('/api/challenges');
  challenges = await res.json();
  render();
}

// --- Claiming a flag -----------------------------------------------------
const flagForm = document.getElementById('flag-form');
const flagInput = document.getElementById('flag-input');
const flagMsg = document.getElementById('flag-msg');

flagForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const flag = flagInput.value.trim();
  if (!flag) return;
  flagMsg.className = 'flag-msg';
  flagMsg.textContent = 'checking…';
  try {
    const res = await fetch('/api/flag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flag }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'That flag did not fit.');

    flagInput.value = '';
    flagMsg.className = 'flag-msg ok';
    flagMsg.textContent = data.alreadyHad
      ? `Already claimed: ${shortName(data.name)} ✓`
      : `Flag captured! ${shortName(data.name)} ✦`;

    const c = challenges.find((x) => x.slug === data.slug);
    if (c) c.passed = true;
    render();

    if (!data.alreadyHad) {
      const badge = badgesEl.querySelector(`[data-slug="${data.slug}"]`);
      if (badge) {
        badge.classList.add('just-earned');
        setTimeout(() => badge.classList.remove('just-earned'), 700);
      }
      dragonSay('A true flag! Well fought. 🔥');
    } else {
      dragonSay('You already hold that one.');
    }
  } catch (err) {
    flagMsg.className = 'flag-msg bad';
    flagMsg.textContent = `✗ ${err.message}`;
    dragonSay('That is no flag of mine…');
  }
});

// --- Dragon chatter ------------------------------------------------------
const speechEl = document.getElementById('dragon-speech');
const IDLE_LINES = [
  'I guard this hall.',
  'Bring a flag to the badges board.',
  'Choose a door, brave one.',
  'The braver the hacker, the brighter the badges.',
];
let idleIdx = 0;

function dragonSay(text) {
  speechEl.textContent = text;
  speechEl.dataset.sticky = '1';
  setTimeout(() => delete speechEl.dataset.sticky, 4500);
}
setInterval(() => {
  if (speechEl.dataset.sticky) return;
  idleIdx = (idleIdx + 1) % IDLE_LINES.length;
  speechEl.textContent = IDLE_LINES[idleIdx];
}, 5000);

// --- Boot ----------------------------------------------------------------
(async function init() {
  try {
    const me = await (await fetch('/api/me')).json();
    if (!me.nickname) { window.location.href = '/'; return; }
    document.getElementById('who').textContent = me.nickname;
  } catch {
    window.location.href = '/';
    return;
  }
  await loadChallenges();
})();
