'use strict';

/* ==========================================================================
   HAPPY BIRTHDAY NAINCY — ADVANCED ARCHERY & CELEBRATION
   ========================================================================== */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

// GSAP fallback in case of network latency
if (!window.gsap) {
  window.gsap = {
    set(targets, vars) { applyVars(targets, vars); },
    to(targets, vars) { return animateVars(targets, vars); },
    fromTo(targets, from, to) { applyVars(targets, from); return animateVars(targets, to); },
    timeline() {
      const queue = [];
      return {
        to(t, v) { queue.push(() => animateVars(t, v)); return this; },
        fromTo(t, f, v) { queue.push(() => { applyVars(t, f); return animateVars(t, v); }); return this; },
        call(fn) { queue.push(() => { fn(); return Promise.resolve(); }); return this; },
        play() { queue.reduce((p, task) => p.then(task), Promise.resolve()); return this; }
      };
    }
  };
}
function applyVars(targets, vars) {
  const list = typeof targets === 'string' ? $$(targets) : (Array.isArray(targets) ? targets : [targets]);
  list.forEach(el => {
    if (!el) return;
    const transform = [];
    Object.entries(vars).forEach(([k, v]) => {
      if (['duration', 'ease', 'delay', 'onComplete', 'stagger'].includes(k)) return;
      if (k === 'opacity') el.style.opacity = v;
      else if (k === 'scale') transform.push(`scale(${v})`);
      else if (k === 'x') transform.push(`translateX(${v}px)`);
      else if (k === 'y') transform.push(`translateY(${v}px)`);
      else if (k === 'rotation') transform.push(`rotate(${v}deg)`);
      else el.style[k] = typeof v === 'number' ? `${v}px` : v;
    });
    if (transform.length) el.style.transform = transform.join(' ');
  });
}
function animateVars(targets, vars) {
  applyVars(targets, vars);
  if (vars.onComplete) setTimeout(vars.onComplete, (vars.duration || 0) * 1000);
  return Promise.resolve();
}

/* --------------------------------------------------------------------------
   GLOBAL STATE & UTILITIES
---------------------------------------------------------------------------- */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const state = {
  scene: 'game',
  dragging: false,
  flying: false,
  hit: false,
  sfxEnabled: true,
  reduced: prefersReducedMotion,
  dpr: Math.min(window.devicePixelRatio || 1, 2),
  width: innerWidth,
  height: innerHeight,
  lastTime: performance.now()
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (min, max) => min + Math.random() * (max - min);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/* --------------------------------------------------------------------------
   DOM ELEMENTS
---------------------------------------------------------------------------- */
const particleCanvas = $('#particleCanvas');
const particleCtx = particleCanvas.getContext('2d');
const cursorCanvas = $('#cursorCanvas');
const cursorCtx = cursorCanvas.getContext('2d');

const gameScene = $('#gameScene');
const celebrationScene = $('#celebrationScene');
const heartTarget = $('#heartTarget');
const bowStage = $('#bowStage');
const arrowEl = $('#arrow');
const bowString = $('#bowString');
const aimGuide = $('#aimGuide');
const flash = $('#flash');

const audio = $('#birthdayMusic');
const playPauseBtn = $('#playPauseBtn');
const prevTrackBtn = $('#prevTrackBtn');
const nextTrackBtn = $('#nextTrackBtn');
const trackLabel = $('#trackLabel');
const sfxToggleBtn = $('#sfxToggleBtn');
const muteBtn = $('#muteBtn');
const volumeSlider = $('#volumeSlider');
const replayBtn = $('#replayBtn');
const restartBtn = $('#restartBtn');
const fullscreenBtn = $('#fullscreenBtn');

/* --------------------------------------------------------------------------
   WEB AUDIO SOUND FX ENGINE & MUSIC
---------------------------------------------------------------------------- */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const soundEngine = {
  playTwang() {
    if (!state.sfxEnabled) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  },
  playChime() {
    if (!state.sfxEnabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const now = audioCtx.currentTime + i * 0.08;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    });
  },
  playPuff() {
    if (!state.sfxEnabled) return;
    const bufferSize = audioCtx.sampleRate * 0.15;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    noise.connect(filter).connect(gain).connect(audioCtx.destination);
    noise.start();
  },
  playPop() {
    if (!state.sfxEnabled) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  }
};

const music = { isPlaying: false, muted: false, volume: 0.55 };
audio.loop = false; // Playlist advances to the next song instead of looping one track.
audio.volume = music.volume;

async function playMusic() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  music.isPlaying = true;
  playPauseBtn.textContent = '⏸';
  playPauseBtn.setAttribute('aria-label', 'Pause music');
  try {
    await audio.play();
  } catch (e) {
    console.log('Autoplay handled or blocked:', e);
  }
}
function pauseMusic() {
  music.isPlaying = false;
  audio.pause();
  playPauseBtn.textContent = '▶';
  playPauseBtn.setAttribute('aria-label', 'Play music');
}
function setMusicVolume(v) {
  music.volume = Number(v);
  audio.volume = music.volume;
}
function setMuted(muted) {
  music.muted = muted;
  audio.muted = muted;
  muteBtn.textContent = muted ? '🔇' : '🔊';
}

/* --------------------------------------------------------------------------
   CANVAS PARTICLE SYSTEM & FAIRY DUST
---------------------------------------------------------------------------- */
class ParticleSystem {
  constructor(ctx) {
    this.ctx = ctx;
    this.items = [];
    this.max = state.reduced ? 100 : 320;
  }
  add(p) {
    if (this.items.length > this.max) this.items.shift();
    this.items.push({
      x: 0, y: 0, vx: 0, vy: 0, size: 5, life: 1, ttl: 1, rot: 0, vr: 0,
      alpha: 1, type: 'spark', color: '#fff', gravity: 0, drag: 0.99, bloom: 0, ...p
    });
  }
  burst(x, y, count, type = 'heart') {
    const total = state.reduced ? Math.min(40, count) : count;
    for (let i = 0; i < total; i++) {
      const a = rand(0, Math.PI * 2);
      const speed = type === 'confetti' ? rand(100, 600) : rand(90, 750);
      this.add({
        x, y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - rand(40, 180),
        size: type === 'confetti' ? rand(5, 12) : rand(8, 22),
        ttl: rand(1, 3.2), life: rand(1, 3.2),
        rot: rand(0, Math.PI * 2), vr: rand(-8, 8),
        type,
        color: type === 'confetti' ? randomConfettiColor() : randomHeartColor(),
        gravity: type === 'confetti' ? rand(180, 500) : rand(30, 220),
        drag: .985,
        bloom: rand(10, 25)
      });
    }
  }
  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const p = this.items[i];
      p.life -= dt;
      if (p.life <= 0) { this.items.splice(i, 1); continue; }
      p.vy += p.gravity * dt;
      p.vx *= Math.pow(p.drag, dt * 60);
      p.vy *= Math.pow(p.drag, dt * 60);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      p.alpha = clamp(p.life / p.ttl, 0, 1);
    }
  }
  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, state.width, state.height);
    for (const p of this.items) drawParticle(ctx, p);
  }
}

function drawParticle(ctx, p) {
  ctx.save();
  ctx.globalAlpha = p.alpha;
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.shadowBlur = p.bloom;
  ctx.shadowColor = p.color;
  if (p.type === 'heart' || p.type === 'trail') {
    drawHeartShape(ctx, 0, 0, p.size, p.color);
  } else if (p.type === 'confetti') {
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size * .5, -p.size * .25, p.size, p.size * .5);
  } else if (p.type === 'lantern') {
    ctx.fillStyle = '#ffaa44';
    ctx.fillRect(-p.size * .4, -p.size * .6, p.size * .8, p.size * 1.2);
    ctx.fillStyle = '#ffd36f';
    ctx.beginPath(); ctx.arc(0, 0, p.size * .3, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawHeartShape(ctx, x, y, size, color) {
  const s = size / 32;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let t = 0; t <= Math.PI * 2 + .04; t += .18) {
    const px = 16 * Math.pow(Math.sin(t), 3);
    const py = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
    if (t === 0) ctx.moveTo(x + px*s, y + py*s); else ctx.lineTo(x + px*s, y + py*s);
  }
  ctx.closePath(); ctx.fill();
}

function randomHeartColor() { return ['#ff3d8a', '#ff8fbd', '#ffc2d9', '#d92672', '#ffd36f', '#fff'][Math.floor(rand(0, 6))]; }
function randomConfettiColor() { return ['#ff3d8a', '#ffd36f', '#ffffff', '#ff8fbd', '#b978ff', '#78d8ff'][Math.floor(rand(0, 6))]; }
const particles = new ParticleSystem(particleCtx);

/* Fairy Dust Cursor Trail */
const fairyDust = [];
window.addEventListener('pointermove', (e) => {
  if (state.reduced) return;
  fairyDust.push({
    x: e.clientX, y: e.clientY,
    vx: rand(-1.5, 1.5), vy: rand(-1.5, 1.5),
    size: rand(2, 6), life: 0.6, ttl: 0.6,
    color: randomHeartColor()
  });
}, { passive: true });

function updateFairyDust(dt) {
  cursorCtx.clearRect(0, 0, state.width, state.height);
  for (let i = fairyDust.length - 1; i >= 0; i--) {
    const p = fairyDust[i];
    p.life -= dt;
    if (p.life <= 0) { fairyDust.splice(i, 1); continue; }
    p.x += p.vx; p.y += p.vy;
    const alpha = p.life / p.ttl;
    cursorCtx.save();
    cursorCtx.globalAlpha = alpha;
    cursorCtx.fillStyle = p.color;
    cursorCtx.shadowBlur = 8;
    cursorCtx.shadowColor = p.color;
    cursorCtx.beginPath();
    cursorCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    cursorCtx.fill();
    cursorCtx.restore();
  }
}

/* --------------------------------------------------------------------------
   BOW AND ARROW ARCHERY MECHANICS (AIMED DIRECTLY TOWARDS HEART TARGET)
---------------------------------------------------------------------------- */
const arrow = {
  startNock: { x: 0, y: 0 },
  nock: { x: 0, y: 0 },
  velocity: { x: 0, y: 0 },
  rotation: 0,
  power: 0,
  maxPull: 180
};

function getHeartCenter() {
  const r = heartTarget.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, radius: r.width * 0.45 };
}

function getAnchor() {
  const s = bowStage.getBoundingClientRect();
  return { x: s.left + 82, y: s.bottom - 151 };
}

function getTargetAngle() {
  const anchor = getAnchor();
  const heart = getHeartCenter();
  return Math.atan2(heart.y - anchor.y, heart.x - anchor.x);
}

function measureArrow() {
  const rect = arrowEl.getBoundingClientRect();
  arrow.startNock = { x: rect.left + 16, y: rect.top + rect.height / 2 };
  arrow.nock = { ...arrow.startNock };
}

function setArrowFromNock(nock, angleRad) {
  const dx = nock.x - arrow.startNock.x;
  const dy = nock.y - arrow.startNock.y;
  arrow.rotation = angleRad;
  arrowEl.style.transform = `translate3d(${dx}px, ${dy}px, 0) rotate(${angleRad}rad)`;
}

function resetArrow(animated = true) {
  state.dragging = false; 
  state.flying = false; 
  arrow.velocity.x = 0; 
  arrow.velocity.y = 0; 
  arrow.power = 0;

  const targetAngle = getTargetAngle();
  
  const done = () => { 
    setArrowFromNock(arrow.startNock, targetAngle);
    measureArrow(); 
    updateBowString(null); 
  };

  if (animated) {
    gsap.to(arrowEl, { 
      x: 0, 
      y: 0, 
      rotation: targetAngle * (180 / Math.PI), 
      duration: 0.55, 
      ease: 'elastic.out(1, .65)', 
      onComplete: done 
    });
  } else {
    setArrowFromNock(arrow.startNock, targetAngle);
    done();
  }
  aimGuide.style.opacity = 0;
}

function updateBowString(nock) {
  if (!nock) { bowString.setAttribute('d', 'M82 24 Q82 140 82 256'); return; }
  const s = bowStage.getBoundingClientRect();
  const localX = clamp(nock.x - s.left, 18, 144);
  const localY = clamp(nock.y - s.top, 44, 234);
  bowString.setAttribute('d', `M82 24 Q${localX.toFixed(1)} ${localY.toFixed(1)} 82 256`);
}

function onPointerDown(e) {
  if (state.flying || state.hit || state.scene !== 'game') return;
  arrowEl.setPointerCapture(e.pointerId);
  state.dragging = true;
  measureArrow();
  updateDrag(e.clientX, e.clientY);
}

function onPointerMove(e) {
  if (!state.dragging) return;
  updateDrag(e.clientX, e.clientY);
}

function updateDrag(clientX, clientY) {
  const anchor = getAnchor();
  let pull = { x: clientX - anchor.x, y: clientY - anchor.y };
  const len = Math.hypot(pull.x, pull.y) || 1;
  if (len > arrow.maxPull) pull = { x: pull.x / len * arrow.maxPull, y: pull.y / len * arrow.maxPull };
  const nock = { x: anchor.x + pull.x, y: anchor.y + pull.y };
  
  // Velocity is directed towards the heart target
  const velocity = { x: anchor.x - nock.x, y: anchor.y - nock.y };
  const power = clamp(Math.hypot(velocity.x, velocity.y) / arrow.maxPull, 0, 1);
  const angle = Math.atan2(velocity.y, velocity.x);

  arrow.nock = nock;
  arrow.power = power;
  setArrowFromNock(nock, angle);
  updateBowString(nock);

  aimGuide.style.opacity = String(clamp(power * 1.2, 0, .86));
  aimGuide.style.width = `${80 + power * 220}px`;
  aimGuide.style.transform = `rotate(${angle}rad)`;
}

function onPointerUp() {
  if (!state.dragging) return;
  state.dragging = false;
  const anchor = getAnchor();
  const vx = (anchor.x - arrow.nock.x) * 11.2;
  const vy = (anchor.y - arrow.nock.y) * 11.2;
  if (arrow.power < 0.12) { resetArrow(true); return; }
  arrow.velocity = { x: vx, y: vy };
  state.flying = true;
  soundEngine.playTwang();
  aimGuide.style.opacity = 0;
  updateBowString(null);
}

function updateProjectile(dt) {
  if (!state.flying || state.dragging) return;
  arrow.velocity.y += 140 * dt;
  arrow.nock.x += arrow.velocity.x * dt;
  arrow.nock.y += arrow.velocity.y * dt;
  const angle = Math.atan2(arrow.velocity.y, arrow.velocity.x);
  setArrowFromNock(arrow.nock, angle);
  
  if (!state.reduced) {
    particles.add({
      x: arrow.nock.x + Math.cos(angle) * 170,
      y: arrow.nock.y + Math.sin(angle) * 170,
      vx: rand(-20, 20), vy: rand(-20, 20),
      size: rand(5, 11), ttl: .45, life: .45, type: 'trail',
      color: randomHeartColor(), bloom: 16
    });
  }
  
  if (checkHeartCollision()) onHeartHit();
  const off = arrow.nock.x > state.width + 260 || arrow.nock.x < -260 || arrow.nock.y > state.height + 180 || arrow.nock.y < -180;
  if (off) resetArrow(true);
}

function checkHeartCollision() {
  const tip = { x: arrow.nock.x + Math.cos(arrow.rotation) * 205, y: arrow.nock.y + Math.sin(arrow.rotation) * 205 };
  const h = getHeartCenter();
  return distance(tip, h) < h.radius;
}

/* --------------------------------------------------------------------------
   HIT CELEBRATION & TRANSITION
---------------------------------------------------------------------------- */
function onHeartHit() {
  if (state.hit) return;
  state.hit = true; state.flying = false;
  const h = getHeartCenter();
  playMusic();
  soundEngine.playChime();
  
  particles.burst(h.x, h.y, 300, 'heart');
  particles.burst(h.x, h.y, 140, 'spark');
  document.body.classList.add('shake');
  setTimeout(() => document.body.classList.remove('shake'), 460);

  gsap.timeline()
    .to(heartTarget, { scale: 1.38, duration: .24, ease: 'power2.out' })
    .to(heartTarget, { scale: .15, opacity: 0, filter: 'blur(12px)', duration: .5, ease: 'power3.in' });
  
  gsap.to(flash, { opacity: .95, duration: .18, ease: 'power2.out', onComplete: () => gsap.to(flash, { opacity: 0, duration: 1.35, ease: 'power2.out' }) });
  gsap.to(gameScene, { scale: 1.08, filter: 'blur(18px)', duration: 1.1, ease: 'power2.inOut' });
  
  setTimeout(showCelebration, 1700);
}

function showCelebration() {
  state.scene = 'celebration';
  document.body.classList.add('celebrating');
  celebrationScene.classList.add('is-active');
  celebrationScene.removeAttribute('aria-hidden');
  gameScene.classList.remove('is-active');
  gameScene.setAttribute('aria-hidden', 'true');

  gsap.fromTo('.celebration-intro', { y: 28, opacity: 0, scale: .96 }, { y: 0, opacity: 1, scale: 1, duration: 1.15, ease: 'power3.out' });
  gsap.fromTo('.celebration-nav', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1, delay: 0.2, ease: 'power3.out' });
  gsap.fromTo('.tab-viewport', { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 1.25, delay: 0.35, ease: 'power3.out' });
  
  confettiRain();
}

function confettiRain() {
  for (let w = 0; w < 5; w++) {
    setTimeout(() => {
      for (let i = 0; i < 90; i++) {
        particles.add({
          x: rand(0, state.width), y: rand(-60, -10),
          vx: rand(-70, 70), vy: rand(90, 280),
          size: rand(5, 12), ttl: rand(3, 5), life: rand(3, 5),
          type: 'confetti', color: randomConfettiColor(), gravity: rand(120, 260), bloom: 8
        });
      }
    }, w * 380);
  }
}

/* --------------------------------------------------------------------------
   INTERACTIVE CELEBRATION TABS & MODULES
---------------------------------------------------------------------------- */
// Tab Switching
$$('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.tab-btn').forEach(b => b.classList.remove('active'));
    $$('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    $(`#${btn.dataset.tab}`).classList.add('active');
    soundEngine.playPop();
  });
});

// Interactive Cake & Candles
const candles = $$('.candle');
const blowBtn = $('#blowCandlesBtn');

function blowCandle(c) {
  if (c.classList.contains('out')) return;
  c.classList.add('out');
  soundEngine.playPuff();
  checkAllCandles();
}

candles.forEach(c => c.addEventListener('click', () => blowCandle(c)));

blowBtn.addEventListener('click', () => {
  candles.forEach((c, idx) => {
    setTimeout(() => blowCandle(c), idx * 120);
  });
});

function checkAllCandles() {
  const allOut = candles.every(c => c.classList.contains('out'));
  if (allOut) {
    soundEngine.playChime();
    confettiRain();
    gsap.to('.cake-container', { scale: 1.08, duration: 0.3, yoyo: true, repeat: 1 });
    blowBtn.textContent = '✨ Wish Granted for Naincy! ✨';
    $('#wishGranted').classList.add('show');
  }
}

// Secret Letter Envelope
const waxSeal = $('#waxSeal');
const envelope = $('#envelope');

waxSeal.addEventListener('click', () => {
  envelope.classList.add('open');
  soundEngine.playChime();
  confettiRain();
});

// Gift Box Surprise
const giftBox = $('#giftBox');
const giftSurprise = $('#giftSurpriseContent');

giftBox.addEventListener('click', () => {
  giftBox.classList.add('opened');
  soundEngine.playPop();
  soundEngine.playChime();
  setTimeout(() => {
    giftSurprise.classList.remove('hidden');
    confettiRain();
  }, 400);
});

// Polaroid Photo Upload
const photoUploader = $('#photoUploader');
const polaroidGrid = $('#polaroidGrid');

photoUploader.addEventListener('change', (e) => {
  const files = Array.from(e.target.files || []).filter(file => file.type.startsWith('image/'));
  if (!files.length) return;

  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const newCard = document.createElement('div');
      newCard.className = 'polaroid-card';
      newCard.style.setProperty('--rot', `${rand(-4, 4)}deg`);

      const pin = document.createElement('div');
      pin.className = 'pin';
      pin.textContent = '📌';
      const imageWrap = document.createElement('div');
      imageWrap.className = 'polaroid-img-wrapper';
      const image = document.createElement('img');
      image.className = 'polaroid-img';
      image.src = evt.target.result;
      image.alt = 'Naincy Memory';
      const caption = document.createElement('div');
      caption.className = 'polaroid-caption';
      caption.textContent = 'Precious Moment ✨';

      imageWrap.appendChild(image);
      newCard.append(pin, imageWrap, caption);
      polaroidGrid.prepend(newCard);
      soundEngine.playPop();
    };
    reader.readAsDataURL(file);
  });

  // Allows the same photo to be selected again after it has been uploaded.
  e.target.value = '';
});

/* --------------------------------------------------------------------------
   PHOTO LIGHTBOX, VIDEO MESSAGE, SAVED WISHES & PLAYLIST
---------------------------------------------------------------------------- */
const lightbox = $('#mediaLightbox');
const lightboxImage = $('#lightboxImage');
const videoPanel = $('#videoPanel');
const birthdayVideo = $('#birthdayVideo');
const closeLightboxBtn = $('#closeLightboxBtn');
const openVideoBtn = $('#openVideoBtn');

function openLightboxImage(image) {
  lightboxImage.src = image.currentSrc || image.src;
  lightboxImage.alt = image.alt || 'Memory preview';
  lightboxImage.hidden = false;
  videoPanel.hidden = true;
  lightbox.hidden = false;
  document.body.style.overflow = 'hidden';
}
function openVideo() {
  lightboxImage.hidden = true;
  videoPanel.hidden = false;
  lightbox.hidden = false;
  document.body.style.overflow = 'hidden';
  pauseMusic();
  if (birthdayVideo) {
    birthdayVideo.currentTime = 0;
    birthdayVideo.load();
    birthdayVideo.play().catch(e => console.log('Video play error:', e));
  }
}
function closeLightbox() {
  lightbox.hidden = true;
  if (birthdayVideo) birthdayVideo.pause();
  document.body.style.overflow = '';
}
polaroidGrid.addEventListener('click', event => {
  const image = event.target.closest('.polaroid-img');
  if (image) openLightboxImage(image);
});
openVideoBtn.addEventListener('click', openVideo);
closeLightboxBtn.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });
window.addEventListener('keydown', event => { if (event.key === 'Escape' && !lightbox.hidden) closeLightbox(); });

const wishForm = $('#wishForm');
const wishName = $('#wishName');
const wishText = $('#wishText');
const wishList = $('#wishList');
const wishStatus = $('#wishStatus');
const FIREBASE_REST_URL = 'https://bdaykit911-default-rtdb.firebaseio.com/birthdayWishes.json';

function getFirebaseRef() {
  if (window.birthdayWishesDb) {
    return window.birthdayWishesDb.ref('birthdayWishes');
  }
  if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
    window.birthdayWishesDb = firebase.database();
    return window.birthdayWishesDb.ref('birthdayWishes');
  }
  return null;
}

function renderWishes(wishes) {
  if (!wishList) return;
  wishList.replaceChildren();
  if (!wishes || wishes.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-wishes-msg';
    empty.textContent = '✨ Be the first to leave a sweet birthday wish for Naincy! 💖';
    wishList.appendChild(empty);
    return;
  }

  wishes.forEach(wish => {
    const card = document.createElement('article');
    card.className = 'saved-wish-card';

    const header = document.createElement('div');
    header.className = 'saved-wish-header';

    const author = document.createElement('strong');
    author.className = 'saved-wish-author';
    author.textContent = wish.name || 'Anonymous';

    const time = document.createElement('span');
    time.className = 'saved-wish-time';
    if (wish.createdAt && typeof wish.createdAt === 'number') {
      const date = new Date(wish.createdAt);
      time.textContent = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } else {
      time.textContent = '✨';
    }

    header.append(author, time);

    const body = document.createElement('p');
    body.className = 'saved-wish-text';
    body.textContent = wish.text || '';

    card.append(header, body);
    wishList.appendChild(card);
  });
}

async function fetchWishesRest() {
  try {
    const res = await fetch(FIREBASE_REST_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data) {
      const wishes = [];
      Object.keys(data).forEach(key => {
        wishes.push({ id: key, createdAt: 0, ...data[key] });
      });
      wishes.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      renderWishes(wishes);
      if (wishStatus && !wishStatus.textContent) {
        wishStatus.textContent = '💖 Live birthday wishes loaded!';
      }
      return true;
    } else {
      renderWishes([]);
    }
  } catch (err) {
    console.warn('REST API fetch fallback error:', err);
  }
  return false;
}

function initWishesSync() {
  const ref = getFirebaseRef();
  if (ref) {
    try {
      ref.limitToLast(50).on('value', snapshot => {
        const wishes = [];
        snapshot.forEach(child => {
          wishes.push({ id: child.key, createdAt: 0, ...child.val() });
        });
        wishes.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        renderWishes(wishes);
        if (wishStatus) wishStatus.textContent = '💖 Live birthday wishes loaded!';
      }, error => {
        console.error('Firebase realtime listener error:', error);
        fetchWishesRest();
      });
    } catch (e) {
      console.error('Firebase attach listener error:', e);
      fetchWishesRest();
    }
  } else {
    fetchWishesRest();
  }
}

// Initial sync call
initWishesSync();

if (wishForm) {
  wishForm.addEventListener('submit', async event => {
    event.preventDefault();
    const name = wishName ? wishName.value.trim().replace(/\s+/g, ' ') : '';
    const text = wishText ? wishText.value.trim() : '';
    if (!name || !text) return;

    const submitButton = $('button[type="submit"]', wishForm);
    if (submitButton) submitButton.disabled = true;
    if (wishStatus) wishStatus.textContent = 'Sending your birthday wish… 💌';

    const newWish = {
      name: name.slice(0, 35),
      text: text.slice(0, 280),
      createdAt: Date.now()
    };

    let success = false;
    const ref = getFirebaseRef();
    if (ref) {
      try {
        await ref.push({
          ...newWish,
          createdAt: typeof firebase !== 'undefined' && firebase.database?.ServerValue ? firebase.database.ServerValue.TIMESTAMP : Date.now()
        });
        success = true;
      } catch (err) {
        console.warn('Firebase push failed, trying REST API POST...', err);
      }
    }

    if (!success) {
      try {
        const res = await fetch(FIREBASE_REST_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newWish)
        });
        if (res.ok) success = true;
      } catch (err) {
        console.error('REST API POST failed:', err);
      }
    }

    if (success) {
      wishForm.reset();
      soundEngine.playChime();
      if (wishStatus) wishStatus.textContent = 'Your lovely wish has been shared with Naincy! 💖';
      fetchWishesRest();
    } else {
      if (wishStatus) wishStatus.textContent = 'Could not send wish. Please check network connection.';
    }

    if (submitButton) submitButton.disabled = false;
  });
}

const playlist = [
  { title: 'Birthday Song', src: 'XmewgMToaDtGIrf5gYUeFuF6gjLVA_XCmbavAb3Pr6o.mp3' },
  { title: 'Favorite Song 2', src: 'song-2.mp3' },
  { title: 'Favorite Song 3', src: 'song-3.mp3' }
];
let activeTrack = 0;
function loadTrack(index, autoplay = music.isPlaying) {
  activeTrack = (index + playlist.length) % playlist.length;
  audio.src = playlist[activeTrack].src;
  trackLabel.textContent = playlist[activeTrack].title;
  if (autoplay) playMusic();
}
prevTrackBtn.addEventListener('click', () => loadTrack(activeTrack - 1));
nextTrackBtn.addEventListener('click', () => loadTrack(activeTrack + 1));
audio.addEventListener('ended', () => loadTrack(activeTrack + 1, true));
loadTrack(0, false);

const micBlowBtn = $('#micBlowBtn');
const micStatus = $('#micStatus');
const wishGranted = $('#wishGranted');
let microphoneStream;
let microphoneContext;
let microphoneAnalyser;
let micFrame;
let blowPowerFrames = 0;
function stopMicrophone() {
  cancelAnimationFrame(micFrame);
  microphoneStream?.getTracks().forEach(track => track.stop());
  microphoneStream = null;
  micBlowBtn.classList.remove('listening');
  micBlowBtn.textContent = '🎙️ Blow with Mic';
}
function monitorBlow() {
  const values = new Uint8Array(microphoneAnalyser.fftSize);
  const BLOW_THRESHOLD = 5; // Lower value: a normal gentle blow is enough.
  const REQUIRED_FRAMES = 4; // Short burst prevents normal room noise from triggering it.

  const check = () => {
    microphoneAnalyser.getByteTimeDomainData(values);
    let total = 0;
    for (const value of values) total += Math.abs(value - 128);
    const volume = total / values.length;

    blowPowerFrames = volume > BLOW_THRESHOLD
      ? blowPowerFrames + 1
      : Math.max(0, blowPowerFrames - 1);

    micStatus.textContent = `Listening… blow strength: ${Math.min(100, Math.round(volume * 10))}%`;

    if (blowPowerFrames >= REQUIRED_FRAMES) {
      candles.forEach((c, index) => setTimeout(() => blowCandle(c), index * 120));
      micStatus.textContent = 'Perfect blow! Your wish is on its way ✨';
      stopMicrophone();
      return;
    }
    micFrame = requestAnimationFrame(check);
  };
  check();
}
micBlowBtn.addEventListener('click', async () => {
  if (microphoneStream) { stopMicrophone(); micStatus.textContent = 'Microphone paused.'; return; }
  if (!navigator.mediaDevices?.getUserMedia) { micStatus.textContent = 'Microphone is not supported in this browser.'; return; }
  try {
    microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    microphoneContext = new (window.AudioContext || window.webkitAudioContext)();
    microphoneAnalyser = microphoneContext.createAnalyser();
    microphoneAnalyser.fftSize = 1024;
    microphoneContext.createMediaStreamSource(microphoneStream).connect(microphoneAnalyser);
    blowPowerFrames = 0; micBlowBtn.classList.add('listening'); micBlowBtn.textContent = '🎙️ Listening…';
    micStatus.textContent = 'Listening now — blow gently toward the mic!'; monitorBlow();
  } catch { micStatus.textContent = 'Please allow microphone permission, then try again.'; }
});

/* --------------------------------------------------------------------------
   LIFECYCLE & CONTROLS
---------------------------------------------------------------------------- */
function resizeCanvases() {
  state.width = innerWidth; state.height = innerHeight; state.dpr = Math.min(devicePixelRatio || 1, 2);
  for (const canvas of [particleCanvas, cursorCanvas]) {
    canvas.width = Math.floor(state.width * state.dpr);
    canvas.height = Math.floor(state.height * state.dpr);
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  }
  measureArrow();
  resetArrow(false);
}

function replayCelebration() {
  if (state.scene !== 'celebration') showCelebration();
  else { confettiRain(); }
  playMusic();
}

function restartGame() {
  state.scene = 'game'; state.hit = false; state.flying = false; state.dragging = false;
  document.body.classList.remove('celebrating');
  celebrationScene.classList.remove('is-active'); celebrationScene.setAttribute('aria-hidden', 'true');
  gameScene.classList.add('is-active'); gameScene.removeAttribute('aria-hidden');
  gsap.set(gameScene, { scale: 1, filter: 'blur(0px)', opacity: 1 });
  gsap.set(heartTarget, { scale: 1, opacity: 1, filter: 'drop-shadow(0 0 36px rgba(255, 61, 138, .85))' });
  resetArrow(false);
}


/*  animated SVG bow string */

const string=document.getElementById("bowString");

let pulling=false;

document.getElementById("bowSvg").addEventListener("mousedown",()=>{
    pulling=true;
    string.setAttribute("d","M90 20 Q145 140 90 260");
});

window.addEventListener("mouseup",()=>{

    if(!pulling) return;

    pulling=false;

    string.setAttribute("d","M90 20 Q90 140 90 260");

});






function toggleFullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
}

function tick(now) {
  const dt = Math.min((now - state.lastTime) / 1000, 0.033);
  state.lastTime = now;
  updateProjectile(dt);
  particles.update(dt);
  particles.draw();
  updateFairyDust(dt);
  requestAnimationFrame(tick);
}

arrowEl.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointermove', onPointerMove, { passive: true });
window.addEventListener('pointerup', onPointerUp);
window.addEventListener('resize', resizeCanvases, { passive: true });

playPauseBtn.addEventListener('click', () => music.isPlaying ? pauseMusic() : playMusic());
sfxToggleBtn.addEventListener('click', () => {
  state.sfxEnabled = !state.sfxEnabled;
  sfxToggleBtn.textContent = state.sfxEnabled ? '🔔' : '🔕';
});
muteBtn.addEventListener('click', () => setMuted(!music.muted));
volumeSlider.addEventListener('input', e => setMusicVolume(e.target.value));
replayBtn.addEventListener('click', replayCelebration);
restartBtn.addEventListener('click', restartGame);
fullscreenBtn.addEventListener('click', toggleFullscreen);

resizeCanvases();
gsap.fromTo('.hero-copy', { y: -20, opacity: 0, scale: .96 }, { y: 0, opacity: 1, scale: 1, duration: 1.1, ease: 'power3.out' });
gsap.fromTo(heartTarget, { scale: .7, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.1, delay: .25, ease: 'elastic.out(1, .65)' });
gsap.fromTo('.bow-stage', { x: -80, opacity: 0 }, { x: 0, opacity: 1, duration: 1, delay: .45, ease: 'power3.out', onComplete: () => resetArrow(false) });

requestAnimationFrame(tick);
