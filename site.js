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
let onClassChange = null; // set by the character loops section below

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

// model-viewer loads the first time someone opens the 3D dialog.
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

// Character loops: each character is an animated WebP (one idle cycle, then an attack) with a transparent background,
// laid over its still render. Animated images play everywhere without autoplay rules, so the motion can't be blocked.
// The hero loads right away; a class loads when it's first shown in the carousel.
function playLoop(slot) {
  if (slot.querySelector('.loop')) return;
  const im = new Image();
  im.className = 'loop'; im.alt = ''; im.decoding = 'async';
  im.onload = () => slot.classList.add('is-playing');
  im.src = `assets/anim/${slot.dataset.loop}.webp`;
  slot.append(im);
}
const startHero = () => document.querySelectorAll('.char[data-loop]').forEach(playLoop);
if (document.readyState === 'complete') startHero(); else window.addEventListener('load', startHero);
if ('IntersectionObserver' in window) {
  const figs = slides.map((sl) => sl.querySelector('.fig'));
  let clsSeen = false, settle = 0;
  const loadCurrent = () => { if (clsSeen) playLoop(figs[current]); };
  onClassChange = () => { clearTimeout(settle); settle = setTimeout(loadCurrent, 150); };
  new IntersectionObserver(([e]) => { clsSeen = e.isIntersecting; loadCurrent(); }, { rootMargin: '-10% 0px' })
    .observe(document.getElementById('classes'));
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

// Extra email checks before anything is sent: Gmail's naming rules, common domain typos, and whether the
// email's domain exists (asks Google Public DNS; only the part after @ is sent). Real addresses always pass.
const TYPOS = {
  'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gnail.com': 'gmail.com',
  'gmaill.com': 'gmail.com', 'gmail.co': 'gmail.com', 'gmail.con': 'gmail.com', 'gmail.cm': 'gmail.com', 'gmail.om': 'gmail.com',
  'icloud.co': 'icloud.com', 'icloud.con': 'icloud.com', 'iclod.com': 'icloud.com', 'icould.com': 'icloud.com',
};
const KNOWN_DOMAINS = ['gmail.com', 'googlemail.com', 'icloud.com', 'me.com', 'mac.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];

function emailProblem(email) {
  const [user, domain] = email.toLowerCase().split('@');
  if (TYPOS[domain]) return `Did you mean ${user}@${TYPOS[domain]}? Check your email and try again.`;
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    const letters = user.replace(/\./g, '');
    if (!/^[a-z0-9][a-z0-9.]*$/.test(user) || /\.\.|\.$/.test(user) || letters.length < 6 || letters.length > 30) {
      return "That isn't a real Gmail address. Gmail names are 6 to 30 letters, numbers or dots. Check it and try again.";
    }
  }
  return '';
}

// True only when DNS says the domain can't receive email. If the check itself fails, the sign-up goes through.
async function domainMissing(domain) {
  if (KNOWN_DOMAINS.includes(domain)) return false;
  const ask = async (type) => (await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`, { signal: AbortSignal.timeout(4000) })).json();
  try {
    const mx = await ask('MX');
    if (mx.Status === 3) return true;
    if (mx.Status !== 0 || (mx.Answer || []).length) return false;
    const a = await ask('A');
    return a.Status === 3 || (a.Status === 0 && !(a.Answer || []).length);
  } catch (err) {
    return false;
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!form.checkValidity()) {
    const bad = form.querySelector(':invalid:not(fieldset)');
    const emailTypo = bad.type === 'email' && bad.value;
    say(emailTypo ? 'That email address doesn\'t look right. Check it and try again.' : PROBLEMS[bad.id] || 'Fill in the highlighted field.', 'err');
    bad.focus();
    return;
  }
  const emailInput = form.querySelector('input[name="email"]:not(:disabled)');
  const email = emailInput.value.trim().toLowerCase();
  const domain = email.split('@')[1];
  const problem = emailProblem(email);
  if (problem) {
    say(problem, 'err');
    emailInput.focus();
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
    if (await domainMissing(domain)) {
      say(`We couldn't find the email provider "@${domain}". Check your email and try again.`, 'err');
      emailInput.focus();
      return;
    }
    // text/plain keeps this a "simple" request, which Google Apps Script accepts without a CORS preflight.
    const r = await fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data) });
    const res = await r.json();
    if (!res.ok && res.error === 'email') {
      say("That email address doesn't look right. Check it and try again.", 'err');
      emailInput.focus();
      return;
    }
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
