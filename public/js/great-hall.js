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
    <span class="door__sign">Enter</span>
    <span class="door__frame">
      <span class="door__leaf"></span>
      <span class="door__status">${c.passed ? 'Complete' : 'Incomplete'}</span>
    </span>
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
      celebrate();
      dragonSay('HUZZAH! A new badge is yours! 🎉🔥');
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
  'A true hacker is curious — never cruel.',
  'Only ever hack with permission.',
  'Read the source. Secrets hide in plain sight.',
  'The best password is long, strange, and secret.',
  'Check the comments — coders talk too much.',
  'Trust nothing that runs in your browser.',
  'Every locked door has a key… somewhere.',
  'Patience, young one. Flags reward the persistent.',
  'Inspect everything. Question everything.',
  'Roooar! (that is dragon for "good luck")',
  'I have guarded these flags for a thousand years.',
  'Capture the flag, earn your glory.',
  'Curiosity has opened more doors than any key.',
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

// --- Celebration: excited dragon + fireworks (on a fresh badge) -----------
const fxLayer = document.getElementById('fx');
const dragonEl = document.querySelector('.dragon');

function celebrate() {
  dragonEl.classList.add('celebrating');
  setTimeout(() => dragonEl.classList.remove('celebrating'), 3000);
  for (let i = 0; i < 7; i++) setTimeout(fireworkBurst, i * 220);
}

function fireworkBurst() {
  const fw = document.createElement('div');
  fw.className = 'firework';
  fw.style.left = `${12 + Math.random() * 76}%`;
  fw.style.top = `${8 + Math.random() * 42}%`;
  const hue = Math.floor(Math.random() * 360);
  const SPARKS = 18;
  for (let s = 0; s < SPARKS; s++) {
    const angle = (s / SPARKS) * Math.PI * 2;
    const dist = 36 + Math.random() * 34;
    const spark = document.createElement('span');
    spark.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    spark.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
    spark.style.color = `hsl(${hue + Math.random() * 40}, 100%, 65%)`;
    fw.appendChild(spark);
  }
  fxLayer.appendChild(fw);
  setTimeout(() => fw.remove(), 1100);
}

// --- Poke the dragon: a random funny reaction ----------------------------
const POSES = ['react-wobble', 'react-jump', 'react-squish', 'react-spin'];
const REACTIONS = [
  'Hey! No poking the guardian!',
  'That tickles! 🐉',
  'Rawr! You startled me.',
  'I am NOT a house pet.',
  'Boop! Right back at you.',
  'Ooh — do that again!',
  'Careful, I bite… gently.',
  '*flaps wings indignantly*',
  'A thousand years of guarding, and THIS is my life.',
];

dragonEl.style.cursor = 'pointer';
dragonEl.addEventListener('click', () => {
  dragonEl.classList.remove(...POSES);
  void dragonEl.offsetWidth; // restart the animation even on rapid clicks
  const pose = POSES[Math.floor(Math.random() * POSES.length)];
  dragonEl.classList.add(pose);
  setTimeout(() => dragonEl.classList.remove(pose), 750);
  dragonSay(REACTIONS[Math.floor(Math.random() * REACTIONS.length)]);
});

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
