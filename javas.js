// ==========================================
// WEB AUDIO API - ZERO EXTERNAL AUDIO DEPENDENCY
// ==========================================
let audioCtx = null;
let trapBeatTimer = null;
let isTrapBeatRunning = false;
let hitCount = 0;
let hornCount = 0;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function initToxicAudio() {
  getAudioContext();
  document.getElementById('sound-banner').style.display = 'none';
  playAirhorn();
}

// 1. MLG AIRHORN (Iconic 5-blast sequence)
function playAirhorn() {
  const ctx = getAudioContext();
  hornCount++;
  document.getElementById('stat-horns').innerText = hornCount;

  const pitches = [466.16, 466.16, 466.16, 0, 466.16, 0, 466.16, 554.37, 466.16];
  const times =   [0,      0.12,   0.24,   0.36, 0.40,  0.52, 0.56,  0.72,   0.90];
  const durations=[0.10,   0.10,   0.10,   0,    0.10,  0,    0.14,  0.16,   0.45];

  times.forEach((t, i) => {
    if (pitches[i] === 0) return;
    const now = ctx.currentTime + t;
    const dur = durations[i];

    // Dual oscillators for that brassy blaring horn texture
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';

    osc1.frequency.setValueAtTime(pitches[i], now);
    osc2.frequency.setValueAtTime(pitches[i] * 1.006, now); // Detune for fat brass

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + dur);
    osc2.stop(now + dur);
  });
}

// 2. HITMARKER SOUND (Sharp 1.2kHz tick)
function playHitmarker() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(1400, now);
  osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.05);
}

// 3. BASS NUKE / 808 DISTORTION DROP
function playBassNuke() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // Sub oscillator
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const shaper = ctx.createWaveShaper();

  // Distortion curve
  const n = 256;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; ++i) {
    const x = (i * 2) / n - 1;
    curve[i] = (3 + 20) * x * 20 * (Math.PI / 180) / (Math.PI + 20 * Math.abs(x));
  }
  shaper.curve = curve;
  shaper.oversample = '4x';

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(160, now);
  osc.frequency.exponentialRampToValueAtTime(32, now + 0.8);

  gain.gain.setValueAtTime(0.7, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

  osc.connect(shaper);
  shaper.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 1.2);

  triggerScreenShake();
}

// 4. QUICKSCOPE SNIPER SHOT
function playSniperShot() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // Noise buffer for blast
  const bufferSize = ctx.sampleRate * 0.3;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1000, now);
  filter.frequency.exponentialRampToValueAtTime(100, now + 0.3);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.6, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start(now);
  noise.stop(now + 0.3);

  // Low kick thud
  const kick = ctx.createOscillator();
  const kickGain = ctx.createGain();
  kick.frequency.setValueAtTime(180, now);
  kick.frequency.exponentialRampToValueAtTime(30, now + 0.25);
  kickGain.gain.setValueAtTime(0.7, now);
  kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

  kick.connect(kickGain);
  kickGain.connect(ctx.destination);

  kick.start(now);
  kick.stop(now + 0.25);
}

// 5. SAD VIOLIN (Tremolo minor scale)
function playSadViolin() {
  const ctx = getAudioContext();
  const notes = [440, 415, 392, 349, 330]; // A4, G#4, G4, F4, E4
  const durations = [0.4, 0.4, 0.4, 0.4, 0.9];
  let t = ctx.currentTime;

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator(); // Vibrato
    const lfoGain = ctx.createGain();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);

    // Vibrato setup
    lfo.frequency.setValueAtTime(6.5, t); // 6.5 Hz vibrato
    lfoGain.gain.setValueAtTime(8, t);
    lfo.connect(osc.frequency);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + durations[i]);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    lfo.start(t);
    osc.stop(t + durations[i]);
    lfo.stop(t + durations[i]);

    t += durations[i] * 0.9;
  });
}

// 6. MLG WOW SYNTH
function playWowSynth() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);

  gain.gain.setValueAtTime(0.01, now);
  gain.gain.linearRampToValueAtTime(0.4, now + 0.15);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.5);
}

// 7. SANIC FAST SPEED SOUND
function playSanicSpeed() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.linearRampToValueAtTime(2400, now + 0.4);

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.45);
}

// 8. SYNTHESIZED TRAP BEAT LOOP (No audio files needed!)
function toggleTrapBeat() {
  const ctx = getAudioContext();
  if (isTrapBeatRunning) {
    clearInterval(trapBeatTimer);
    isTrapBeatRunning = false;
    document.getElementById('beat-label').innerText = 'TRAP BEAT';
    return;
  }

  isTrapBeatRunning = true;
  document.getElementById('beat-label').innerText = 'ЗУПИНИТИ';
  
  let step = 0;
  const stepDuration = 140; // ~140 BPM 16th notes

  trapBeatTimer = setInterval(() => {
    const now = ctx.currentTime;

    // Kick on steps 0, 8, 10
    if (step === 0 || step === 8 || step === 10) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    }

    // Snare on step 4, 12
    if (step === 4 || step === 12) {
      playHitmarker();
    }

    // Hi-hat on every step, faster roll on 14-15
    if (step % 2 === 0 || step >= 14) {
      const hatOsc = ctx.createOscillator();
      const hatGain = ctx.createGain();
      hatOsc.type = 'sawtooth';
      hatOsc.frequency.setValueAtTime(7000 + Math.random() * 2000, now);
      hatGain.gain.setValueAtTime(0.08, now);
      hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      hatOsc.connect(hatGain);
      hatGain.connect(ctx.destination);
      hatOsc.start(now);
      hatOsc.stop(now + 0.04);
    }

    step = (step + 1) % 16;
  }, stepDuration);
}

// ==========================================
// INTERACTIVE HITMARKERS ON CLICK
// ==========================================
document.addEventListener('click', (e) => {
  // Don't duplicate for button clicks
  if (e.target.closest('#sound-banner')) return;

  hitCount++;
  document.getElementById('stat-hits').innerText = hitCount;
  playHitmarker();

  // Create hitmarker graphic
  const hm = document.createElement('div');
  hm.className = 'hitmarker';
  hm.style.left = `${e.clientX}px`;
  hm.style.top = `${e.clientY}px`;
  hm.innerHTML = `
    <svg viewBox="0 0 40 40" style="width:100%; height:100%;">
      <line x1="5" y1="5" x2="15" y2="15" stroke="#ffffff" stroke-width="3"/>
      <line x1="35" y1="5" x2="25" y2="15" stroke="#ffffff" stroke-width="3"/>
      <line x1="5" y1="35" x2="15" y2="25" stroke="#ffffff" stroke-width="3"/>
      <line x1="35" y1="35" x2="25" y2="25" stroke="#ffffff" stroke-width="3"/>
    </svg>
  `;
  document.body.appendChild(hm);
  setTimeout(() => hm.remove(), 350);

  // Create floating meme trail particle
  spawnParticle(e.clientX, e.clientY);
});

// Cursor Particle Trail
const memeIcons = ['🐸', '🔺', '💯', '🔫', '✨', '🔥', '🧀', '🕶️', '🌀'];
function spawnParticle(x, y) {
  const p = document.createElement('div');
  p.className = 'trail-particle';
  p.innerText = memeIcons[Math.floor(Math.random() * memeIcons.length)];
  p.style.left = `${x}px`;
  p.style.top = `${y}px`;
  const tx = (Math.random() - 0.5) * 120;
  const ty = (Math.random() - 0.5) * 120 - 40;
  p.style.setProperty('--tx', `${tx}px`);
  p.style.setProperty('--ty', `${ty}px`);
  document.body.appendChild(p);
  setTimeout(() => p.remove(), 700);
}

// ==========================================
// FIDGET SPINNER LOGIC
// ==========================================
let spinnerRPM = 0;
let spinnerAngle = 0;
const spinnerSvg = document.getElementById('spinner-svg');
const rpmCounter = document.getElementById('rpm-counter');
const rpmStatus = document.getElementById('rpm-status');

function spinFaster() {
  spinnerRPM += 1250;
  playSanicSpeed();
  if (spinnerRPM > 9000) {
    rpmStatus.innerText = "🚨 IT'S OVER 9000000000! ТАК ТРИМАТИ! 🚨";
    rpmStatus.style.color = "#ff0000";
    triggerScreenShake();
  } else if (spinnerRPM > 4000) {
    rpmStatus.innerText = "🔥 НАДЗВУКОВИЙ БАБУСИН СПІНЕР! 🔥";
    rpmStatus.style.color = "#ff00ff";
  }
}

// Animation Loop for spinner
setInterval(() => {
  if (spinnerRPM > 0) {
    spinnerAngle = (spinnerAngle + (spinnerRPM / 60)) % 360;
    spinnerSvg.style.transform = `rotate(${spinnerAngle}deg)`;
    spinnerRPM = Math.max(0, Math.floor(spinnerRPM * 0.96)); // Friction
    rpmCounter.innerText = spinnerRPM.toLocaleString();
    if (spinnerRPM === 0) {
      rpmStatus.innerText = "Крути скоріше, діду!";
      rpmStatus.style.color = "#00ff00";
    }
  }
}, 30);

// ==========================================
// VISUAL CHAOS & FILTERS
// ==========================================
function updateFry(val) {
  document.getElementById('fry-val').innerText = val + '%';
  const body = document.getElementById('page-body');
  body.style.filter = `contrast(${val * 2.5}%) saturate(${val * 3.5}%) brightness(${100 + (val-100)*0.15}%)`;
}

function toggleEarthquake() {
  document.body.classList.toggle('earthquake');
  playBassNuke();
}

function triggerScreenShake() {
  document.body.classList.add('earthquake');
  setTimeout(() => {
    document.body.classList.remove('earthquake');
  }, 700);
}

// ==========================================
// RETRO WINDOWS POPUPS
// ==========================================
const scamTitles = [
  "🎁 ВИ ВИГРАЛИ 1,000,000 БЕЗКОШТОВНИХ СПІНЕРІВ!",
  "⚡ О БОЖЕ! ВАШ ФЛЕШ-ПЛЕЄР ЗАСТАРІВ!",
  "⚠️ ТЕЛЕФОНУЙТЕ У FAZE CLAN НЕГАЙНО!",
  "🐸 DAT BOI ХОЧЕ ЗНАТИ ВАШЕ МІСЦЕЗНАХОДЖЕННЯ"
];

function spawnPopup() {
  playAirhorn();
  const pop = document.getElementById('retro-popup');
  pop.style.display = 'block';
  pop.style.top = `${Math.random() * 50 + 15}%`;
  pop.style.left = `${Math.random() * 50 + 15}%`;
}

function closePopup() {
  playHitmarker();
  document.getElementById('retro-popup').style.display = 'none';
  // Toxic trick: 50% chance to immediately spawn two more!
  if (Math.random() > 0.5) {
    setTimeout(spawnPopup, 400);
  }
}

function scamAction() {
  playBassNuke();
  alert("ВІТАЄМО! СПІНЕРИ ВЖЕ ЛЕТЯТЬ ДО ВАС НА ВЕРТОЛЬОТІ З 2017 РОКУ!");
  closePopup();
}
