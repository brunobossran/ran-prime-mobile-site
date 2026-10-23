// The Google Apps Script web app URL from test-list/SETUP.md (ends in /exec).
// While it's empty, the form explains that sign-up opens soon and sends nothing.
const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzmSpeKMghGIt9oRUD5Ro8K1KBUIUfeSnjgk2xADtQuiINCsxrBXgHHX2fnzTb9fbvDvA/exec';

const MOVES = [['attack', 'Attack 1'], ['attack2', 'Attack 2'], ['attack3', 'Attack 3'], ['idle', 'Idle'], ['run', 'Run']];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Smooth scrolling (Lenis): eases wheel and trackpad scrolling; phones keep their native touch scrolling.
const lenis = !reduceMotion && window.Lenis ? new Lenis({ autoRaf: true, lerp: 0.1, anchors: { offset: -64 } }) : null;

// Header: transparent over the hero, solid once you scroll
const header = document.getElementById('site-header');
function updateHeader() { header.classList.toggle('solid', window.scrollY > 40); }
let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { ticking = false; updateHeader(); });
}, { passive: true });
updateHeader();

// Classes: swipe the track on phones, or use the arrows and portrait buttons. The page scrolls normally around it.
const track = document.getElementById('cls-track');
const slides = [...track.querySelectorAll('.cls')];
const picks = [...document.querySelectorAll('#cls-nav button')];
const prev = document.getElementById('cls-prev');
const next = document.getElementById('cls-next');
let current = -1;
let onClassChange = null; // set by the live 3D section below

function showClass(i) {
  track.scrollTo({ left: slides[i].offsetLeft, behavior: reduceMotion ? 'auto' : 'smooth' });
}
function markClass(i) {
  if (i === current) return;
  current = i;
  slides.forEach((sl, j) => {
    sl.classList.toggle('on', j === i);
    sl.toggleAttribute('inert', j !== i);
  });
  picks.forEach((b, j) => b.setAttribute('aria-current', String(j === i)));
  prev.disabled = i === 0;
  next.disabled = i === slides.length - 1;
  const nav = picks[i].parentElement;
  nav.scrollTo({ left: picks[i].offsetLeft - (nav.clientWidth - picks[i].offsetWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
  if (onClassChange) onClassChange(i);
}
let trackTicking = false;
track.addEventListener('scroll', () => {
  if (trackTicking) return;
  trackTicking = true;
  requestAnimationFrame(() => { trackTicking = false; markClass(Math.round(track.scrollLeft / track.clientWidth)); });
}, { passive: true });
picks.forEach((b, i) => b.addEventListener('click', () => showClass(i)));
prev.addEventListener('click', () => showClass(Math.max(0, current - 1)));
next.addEventListener('click', () => showClass(Math.min(slides.length - 1, current + 1)));
markClass(0);

// Load and decode the class renders well before the classes section reaches the screen, so swiping never waits on an image
const clsImgs = [...document.querySelectorAll('.cls-art img')];
if ('IntersectionObserver' in window) {
  const pre = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    pre.disconnect();
    clsImgs.forEach((img) => { img.loading = 'eager'; img.decode().catch(() => {}); });
  }, { rootMargin: '150% 0px' });
  pre.observe(document.getElementById('classes'));
}

// Hero dust: a few slow gold motes in the spotlight. Off for reduced motion and while the hero is off screen.
const dust = document.getElementById('dust');
if (dust && !reduceMotion) {
  const ctx = dust.getContext('2d');
  let motes = [];
  let running = false;
  function sizeDust() {
    const dpr = 1; // soft motes don't need retina sharpness, and 1x keeps every frame cheap
    dust.width = dust.clientWidth * dpr;
    dust.height = dust.clientHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(36, dust.clientWidth / 22));
    motes = Array.from({ length: count }, () => ({
      x: Math.random() * dust.clientWidth,
      y: Math.random() * dust.clientHeight,
      r: Math.random() * 1.6 + 0.4,
      vy: Math.random() * 0.25 + 0.06,
      vx: (Math.random() - 0.5) * 0.12,
      a: Math.random() * 0.5 + 0.15,
    }));
  }
  function frame() {
    if (!running) return;
    const w = dust.clientWidth, h = dust.clientHeight;
    ctx.clearRect(0, 0, w, h);
    motes.forEach((m) => {
      m.y -= m.vy; m.x += m.vx;
      if (m.y < -4) { m.y = h + 4; m.x = Math.random() * w; }
      // brighter under the spotlight at the top centre
      const light = 1 - Math.min(1, Math.abs(m.x - w / 2) / (w * 0.6));
      ctx.globalAlpha = m.a * (0.35 + 0.65 * light);
      ctx.fillStyle = '#f7d488';
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fill();
    });
    requestAnimationFrame(frame);
  }
  sizeDust();
  let dustWidth = dust.clientWidth;
  window.addEventListener('resize', () => { if (dust.clientWidth !== dustWidth) { dustWidth = dust.clientWidth; sizeDust(); } });
  new IntersectionObserver(([e]) => {
    const was = running;
    running = e.isIntersecting;
    if (running && !was) requestAnimationFrame(frame);
  }).observe(dust);
}

// model-viewer is loaded once, after the page itself has loaded; the live characters and the 3D dialog both use it.
let mvReady = null;
function loadModelViewer() {
  if (!mvReady) {
    const s = document.createElement('script');
    s.type = 'module';
    s.src = 'https://unpkg.com/@google/model-viewer@3.5.0/dist/model-viewer.min.js';
    document.head.append(s);
    mvReady = customElements.whenDefined('model-viewer');
  }
  return mvReady;
}

// 3D viewer: a dialog with the class model to rotate and try each move.
const dialog = document.getElementById('viewer');
const mv = document.getElementById('mv');
const moves = document.getElementById('moves');
const state = { cls: 'gunner', move: 'attack' };

// Models are plain .glb files on the live site. The preview build ships them as base64 .glb.txt instead.
const modelCache = {};
function modelUrl(id) {
  if (!modelCache[id]) {
    modelCache[id] = fetch(`assets/models/${id}.glb`, { method: 'HEAD' })
      .then((r) => { if (!r.ok) throw new Error('no glb'); return `assets/models/${id}.glb`; })
      .catch(() => fetch(`assets/models/${id}.glb.txt`).then(async (r) => {
        if (!r.ok) throw new Error('no glb.txt');
        const bin = atob((await r.text()).replace(/\s+/g, ''));
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return URL.createObjectURL(new Blob([bytes], { type: 'model/gltf-binary' }));
      }).catch(() => `assets/models/${id}.glb`));
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

MOVES.forEach(([id, label]) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.dataset.id = id;
  b.textContent = label;
  b.addEventListener('click', () => { state.move = id; renderViewer(); });
  moves.append(b);
});

function renderViewer() {
  showModel(state.cls);
  mv.setAttribute('animation-name', state.move);
  document.getElementById('v-name').textContent = state.cls.charAt(0).toUpperCase() + state.cls.slice(1);
  moves.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === state.move)));
}
mv.addEventListener('load', () => {
  // Not every model has every move (Archer has one attack).
  const available = mv.availableAnimations;
  moves.querySelectorAll('button').forEach((b) => { b.disabled = !available.includes(b.dataset.id); });
  if (!available.includes(state.move)) { state.move = available.includes('attack') ? 'attack' : 'idle'; renderViewer(); }
  mv.animationName = state.move;
  mv.play();
});

document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => {
  loadModelViewer();
  state.cls = b.dataset.view;
  state.move = 'attack';
  renderViewer();
  dialog.showModal();
  if (lenis) lenis.stop();
}));
document.getElementById('viewer-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => { if (lenis) lenis.start(); });
dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

// Live characters: the hero Gunners and the class on screen are animated 3D models. Each slot shows its still render
// first; the model fades in over it once loaded, idles, and throws an attack every few seconds.
// model-viewer stops drawing a model that's off screen, so only what you can see costs anything.
const FIT = { gunner: 0.895, 'gunner-female': 0.895, brawler: 0.815, swordsman: 0.715, archer: 0.818, shaman: 0.828, extreme: 0.713 };
function makeLiveModel() {
  const el = document.createElement('model-viewer');
  el.className = 'live-model';
  el.setAttribute('aria-hidden', 'true');
  el.setAttribute('interaction-prompt', 'none');
  el.setAttribute('disable-zoom', '');
  el.setAttribute('shadow-intensity', '0');
  el.setAttribute('exposure', '1.15');
  el.setAttribute('tone-mapping', 'neutral');
  el.setAttribute('environment-image', 'neutral');
  el.setAttribute('min-field-of-view', '10deg');
  el.setAttribute('max-camera-orbit', 'auto auto 1000m');
  el.setAttribute('loading', 'eager');
  const life = { timer: 0, attacks: [] };
  // Camera framed from the model's own size: feet on the bottom edge. Each model's bounding box includes weapon parts,
  // so FIT (measured share of the frame the figure fills at the base framing) evens out how big each character looks.
  function frame() {
    const d = el.getDimensions(), c = el.getBoundingBoxCenter();
    const fit = FIT[el.dataset.id] || 0.85;
    const span = (d.y / 0.9) * (fit / 0.87), fov = 16;
    const radius = (span / 2) / Math.tan((fov * Math.PI) / 360);
    el.fieldOfView = `${fov}deg`;
    el.cameraTarget = `${c.x}m ${c.y - d.y / 2 + span / 2 - span * 0.01}m ${c.z}m`;
    el.cameraOrbit = `15deg 88deg ${radius}m`;
    el.jumpCameraToGoal();
  }
  function idle() {
    clearTimeout(life.timer);
    el.animationName = 'idle';
    el.play();
    if (life.attacks.length) life.timer = setTimeout(attack, 3500 + Math.random() * 2500);
  }
  function attack() {
    el.animationName = life.attacks[Math.floor(Math.random() * life.attacks.length)];
    el.play({ repetitions: 1 });
  }
  el.addEventListener('finished', idle);
  el.addEventListener('load', () => {
    life.attacks = el.availableAnimations.filter((a) => a.startsWith('attack'));
    frame();
    idle();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.classList.add('ready');
      el.parentElement.classList.add('is-live');
    }));
  });
  el.show = async (slot, id) => {
    clearTimeout(life.timer);
    el.classList.remove('ready');
    if (el.parentElement && el.parentElement !== slot) el.parentElement.classList.remove('is-live');
    slot.append(el);
    el.dataset.id = id;
    const url = await modelUrl(id);
    if (el.getAttribute('src') === url) { el.classList.add('ready'); slot.classList.add('is-live'); idle(); }
    else el.setAttribute('src', url);
  };
  return el;
}

if (!reduceMotion && 'IntersectionObserver' in window) {
  const startLive = () => loadModelViewer().then(() => {
    document.querySelectorAll('.char[data-model]').forEach((slot) => makeLiveModel().show(slot, slot.dataset.model));
  });
  if (document.readyState === 'complete') startLive();
  else window.addEventListener('load', startLive);

  // One live model for the classes carousel; it moves to whichever class is showing once a swipe settles
  let classModel = null, settle = 0;
  const placeClassModel = (i) => classModel.show(slides[i].querySelector('.cls-art'), slides[i].dataset.id);
  const liveIo = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    liveIo.disconnect();
    loadModelViewer().then(() => {
      classModel = makeLiveModel();
      placeClassModel(current);
      onClassChange = (i) => { clearTimeout(settle); settle = setTimeout(() => placeClassModel(i), 180); };
    });
  }, { rootMargin: '-15% 0px' });
  liveIo.observe(document.getElementById('classes'));
}

// Sticky join bar (phones): shows once the hero is gone, hides while the form itself is on screen
const sticky = document.getElementById('sticky-cta');
const form = document.getElementById('signup');
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
  io.observe(form);
}

// Sign-up form: Android and iPhone collect different emails (Google Play tests invite by Google account, TestFlight by Apple ID)
const msg = document.getElementById('form-msg');
function say(text, kind) { msg.textContent = text; msg.className = `form-msg ${kind || ''}`; msg.hidden = false; }

function platform() { return form.querySelector('input[name="platform"]:checked').value; }
function showPlatform() {
  const current = platform();
  form.querySelectorAll('.group').forEach((g) => {
    const on = g.dataset.platform === current;
    g.hidden = !on;
    g.querySelectorAll('input, select').forEach((el) => { el.disabled = !on; });
  });
  msg.hidden = true;
}
form.querySelectorAll('input[name="platform"]').forEach((r) => r.addEventListener('change', showPlatform));
showPlatform();

const PROBLEMS = {
  'f-name': 'Enter your Facebook name.',
  'f-a-email': 'Enter the Google account email from your Play Store.',
  'f-i-email': 'Enter your Apple ID email.',
  'f-a-model': 'Enter your phone model.',
  'f-i-model': 'Enter your iPhone or iPad model.',
  'f-a-ver': 'Choose your Android version.',
  'f-i-ver': 'Choose your iOS version.',
  'f-consent': 'Tick the box so we can email you about the test.',
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!form.checkValidity()) {
    const bad = form.querySelector(':invalid:not(fieldset)');
    const emailTypo = bad.type === 'email' && bad.value;
    say(emailTypo ? 'That email address doesn\'t look right. Check it and try again.' : PROBLEMS[bad.id] || 'Fill in the highlighted field.', 'err');
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
    // text/plain keeps this a "simple" request, which Google Apps Script accepts without a CORS preflight.
    const r = await fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data) });
    const res = await r.json();
    if (!res.ok) throw new Error(res.error || r.status);
    const ios = data.platform === 'ios';
    form.reset();
    showPlatform();
    say(res.duplicate
      ? "You're already on the list. We'll be in touch when testing opens."
      : ios
        ? "You're on the list. When testing opens, your TestFlight invite goes to your Apple ID email."
        : "You're on the list. When testing opens, we'll email your Google account a link to the Play Store test.", 'ok');
  } catch (err) {
    say("That didn't go through. Check your connection and try again, or message our Facebook page.", 'err');
  } finally {
    button.disabled = false;
  }
});
