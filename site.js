// The Google Apps Script web app URL from test-list/SETUP.md (ends in /exec).
// While it's empty, the form explains that sign-up opens soon and sends nothing.
const FORM_ENDPOINT = '';

const MOVES = [['attack', 'Attack 1'], ['attack2', 'Attack 2'], ['attack3', 'Attack 3'], ['idle', 'Idle'], ['run', 'Run']];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Smooth scrolling (Lenis): eases wheel and trackpad scrolling; phones keep their native touch scrolling.
const lenis = !reduceMotion && window.Lenis ? new Lenis({ autoRaf: true, lerp: 0.1, anchors: { offset: -64 } }) : null;
function scrollToY(y) {
  if (lenis) lenis.scrollTo(y);
  else window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
}

// Header: transparent over the hero, solid once you scroll
const header = document.getElementById('site-header');
function updateHeader() { header.classList.toggle('solid', window.scrollY > 40); }

// Scroll stories: each [data-story] section pins its stage and shows one beat at a time.
// The section is (n beats × 75vh) taller than the screen; how far you've scrolled through it picks the beat.
const stories = [...document.querySelectorAll('[data-story]')].map((el) => {
  const beats = [...el.querySelectorAll('.beat')];
  const rail = el.querySelector('.rail');
  if (rail) rail.innerHTML = beats.map(() => '<i></i>').join('');
  return { el, beats, dots: rail ? [...rail.children] : [], nav: [...el.querySelectorAll('.cls-nav button')], top: 0, span: 1, index: -1 };
});

function measure() {
  stories.forEach((s) => {
    s.top = s.el.getBoundingClientRect().top + window.scrollY;
    s.span = Math.max(1, s.el.offsetHeight - window.innerHeight);
  });
}

function setBeat(s, i) {
  if (i === s.index) return;
  s.index = i;
  s.beats.forEach((b, j) => {
    b.classList.toggle('on', j === i);
    b.toggleAttribute('inert', j !== i);
  });
  s.dots.forEach((d, j) => d.classList.toggle('on', j === i));
  s.nav.forEach((b, j) => b.setAttribute('aria-current', String(j === i)));
  const current = s.nav[i];
  if (current) current.parentElement.scrollTo({ left: current.offsetLeft - (current.parentElement.clientWidth - current.offsetWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
}

function updateStories() {
  stories.forEach((s) => {
    const p = Math.min(1, Math.max(0, (window.scrollY - s.top) / s.span));
    setBeat(s, Math.min(s.beats.length - 1, Math.floor(p * s.beats.length)));
  });
}

// Jump buttons under the classes story scroll to the middle of that class's stretch
stories.forEach((s) => s.nav.forEach((b, i) => b.addEventListener('click', () => {
  scrollToY(s.top + s.span * (i + 0.5) / s.beats.length);
})));

let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { ticking = false; updateHeader(); updateStories(); });
}
window.addEventListener('scroll', onScroll, { passive: true });
// Phones fire resize as the address bar shows and hides; only re-measure when the width changes.
let lastWidth = window.innerWidth;
window.addEventListener('resize', () => {
  if (window.innerWidth === lastWidth) return;
  lastWidth = window.innerWidth;
  measure(); onScroll();
});
window.addEventListener('load', () => { measure(); onScroll(); });
measure();
updateHeader();
updateStories();

// Load and decode the class renders well before the classes story reaches the screen
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

// 3D viewer: a dialog with the class model. model-viewer (and the 2–3 MB models) only load when it's first opened.
const dialog = document.getElementById('viewer');
const mv = document.getElementById('mv');
const moves = document.getElementById('moves');
const state = { cls: 'gunner', move: 'attack' };
let viewerLoaded = false;

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
  if (!viewerLoaded) {
    viewerLoaded = true;
    const s = document.createElement('script');
    s.type = 'module';
    s.src = 'https://unpkg.com/@google/model-viewer@3.5.0/dist/model-viewer.min.js';
    document.head.append(s);
  }
  state.cls = b.dataset.view;
  state.move = 'attack';
  renderViewer();
  dialog.showModal();
  if (lenis) lenis.stop();
}));
document.getElementById('viewer-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => { if (lenis) lenis.start(); });
dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

// Sticky join bar (phones): shows once the hero is gone, hides while the form itself is on screen
const sticky = document.getElementById('sticky-cta');
const form = document.getElementById('signup');
const seen = { hero: true, form: false, story: false };
function updateSticky() {
  // also hidden while a scroll story is pinned, so it doesn't cover the stage
  const show = !seen.hero && !seen.form && !seen.story;
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
  const inStory = new Set();
  const storyIo = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) inStory.add(e.target); else inStory.delete(e.target); });
    seen.story = inStory.size > 0;
    updateSticky();
  }, { rootMargin: '-50% 0px -50% 0px' });
  stories.forEach((st) => storyIo.observe(st.el));
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
