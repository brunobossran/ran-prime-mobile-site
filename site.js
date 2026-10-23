// Set this to a form endpoint that accepts a JSON POST (Formspree, a Google Apps Script web app, or dev's API).
// While it's empty, the form explains that sign-up opens soon and sends nothing.
const FORM_ENDPOINT = '';

const CLASSES = [
  { id: 'brawler', name: 'Brawler', tag: 'Make every hit count.', meta: 'Close quarters · Gauntlets',
    desc: "Get close. Stand your ground. Fight with gauntlets and the unmistakable rhythm of RAN's hand-to-hand combat." },
  { id: 'swordsman', name: 'Swordsman', tag: 'Meet the fight head-on.', meta: 'Melee · Sword',
    desc: "Take up the blade and step into the front line with RAN's classic sword-wielding fighting style." },
  { id: 'archer', name: 'Archer', tag: 'Find your distance.', meta: 'Ranged · Bow',
    desc: 'Choose your position and let the arrows fly with the familiar bow-wielding ranged class.' },
  { id: 'shaman', name: 'Shaman', tag: 'Bring a different power.', meta: 'Staff & spells',
    desc: "Wield a staff and explore RAN's spell-focused path. A familiar presence in party play." },
  { id: 'extreme', name: 'Extreme', tag: 'Explore another path.', meta: 'Versatile · Sword',
    desc: 'Discover the Extreme class with its original EP7 appearance.' },
  { id: 'gunner', name: 'Gunner', tag: 'Change the pace.', meta: 'Firearms · Dual guns',
    desc: "Take aim with the Gunner's original firearms, plus EP7's intelligence-build summon system." },
];
const MOVES = [['attack', 'Attack 1'], ['attack2', 'Attack 2'], ['attack3', 'Attack 3'], ['idle', 'Idle'], ['run', 'Run']];

// Class viewer
const mv = document.getElementById('mv');
const tabs = document.getElementById('class-tabs');
const moves = document.getElementById('moves');
const state = { cls: 'gunner', move: 'attack' };

// Models are plain .glb files on the live site. The preview build ships them as base64 .glb.txt instead.
const modelCache = {};
function modelUrl(id) {
  if (!modelCache[id]) {
    modelCache[id] = fetch(`assets/models/${id}.glb`, { method: 'HEAD' })
      .then((r) => { if (!r.ok) throw new Error('no glb'); return `assets/models/${id}.glb`; })
      .catch(() => fetch(`assets/models/${id}.glb.txt`).then(async (r) => {
        const bin = atob((await r.text()).replace(/\s+/g, ''));
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return URL.createObjectURL(new Blob([bytes], { type: 'model/gltf-binary' }));
      }));
  }
  return modelCache[id];
}

let shownModel = null;
async function showModel(id) {
  if (shownModel === id) return;
  shownModel = id;
  mv.setAttribute('poster', `assets/renders/${id}-idle.png`);
  const url = await modelUrl(id);
  if (shownModel === id) mv.setAttribute('src', url);
}

CLASSES.forEach((c) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.dataset.id = c.id;
  b.innerHTML = `<img src="assets/renders/${c.id}-idle.png" alt="" loading="lazy">${c.name}`;
  b.addEventListener('click', () => { state.cls = c.id; renderClass(); });
  tabs.append(b);
});
MOVES.forEach(([id, label]) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.dataset.id = id;
  b.textContent = label;
  b.addEventListener('click', () => { state.move = id; renderClass(); });
  moves.append(b);
});

function renderClass() {
  const c = CLASSES.find((x) => x.id === state.cls);
  showModel(c.id);
  mv.setAttribute('animation-name', state.move);
  document.getElementById('c-name').textContent = c.name.toUpperCase();
  document.getElementById('c-tag').textContent = c.tag;
  document.getElementById('c-desc').textContent = c.desc;
  document.getElementById('c-meta').textContent = c.meta;
  tabs.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === state.cls)));
  moves.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === state.move)));
}
mv.addEventListener('load', () => {
  // Not every model has every move (Archer has one attack).
  const available = mv.availableAnimations;
  moves.querySelectorAll('button').forEach((b) => { b.disabled = !available.includes(b.dataset.id); });
  if (!available.includes(state.move)) { state.move = available.includes('attack') ? 'attack' : 'idle'; renderClass(); }
  mv.animationName = state.move;
  mv.play();
});
renderClass();

// Sticky join bar (phones): shows once the hero is gone, hides while the form itself is on screen
const sticky = document.getElementById('sticky-cta');
const seen = { hero: true, form: false };
function updateSticky() {
  const show = !seen.hero && !seen.form;
  sticky.classList.toggle('show', show);
  sticky.setAttribute('aria-hidden', String(!show));
  sticky.querySelector('a').tabIndex = show ? 0 : -1;
}
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { seen[e.target === form ? 'form' : 'hero'] = e.isIntersecting; });
    updateSticky();
  });
  io.observe(document.querySelector('.hero'));
  io.observe(document.getElementById('signup'));
}

// Sign-up form
const form = document.getElementById('signup');
const msg = document.getElementById('form-msg');
function say(text, kind) { msg.textContent = text; msg.className = `form-msg ${kind || ''}`; msg.hidden = false; }

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!form.checkValidity()) {
    const bad = form.querySelector(':invalid');
    say(bad.type === 'email' ? 'Enter a valid email address.' : bad.type === 'checkbox' ? 'Tick the box so we can email you about the test.' : 'Fill in your name, email and phone.', 'err');
    bad.focus();
    return;
  }
  if (!FORM_ENDPOINT) {
    say("Sign-up opens soon. Follow our Facebook page and we'll post the moment it does.", '');
    return;
  }
  const data = Object.fromEntries(new FormData(form));
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    const r = await fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
    if (!r.ok) throw new Error(r.status);
    form.reset();
    say("You're on the list. We'll email you when testing opens.", 'ok');
  } catch (err) {
    say("That didn't go through. Check your connection and try again, or message our Facebook page.", 'err');
  } finally {
    button.disabled = false;
  }
});
