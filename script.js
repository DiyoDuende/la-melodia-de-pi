// ============================================================
// TRADUCCIÓN
// ============================================================

function cambiarIdioma(idioma, el) {
  alert("Traducción temporalmente desactivada");

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('activo');
  });

  if (el) el.classList.add('activo');
}

// ============================================================
// AUDIO + CONTROL
// ============================================================

function cargarSoundfontScript() {
  return new Promise((resolve, reject) => {
    if (typeof Soundfont !== "undefined") return resolve();

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/soundfont-player@0.12.0/dist/soundfont-player.min.js";

    script.onload = resolve;
    script.onerror = reject;

    document.head.appendChild(script);
  });
}

let audioCtx = null;
let piano = null;
let sonidoActivado = false; // empieza apagado

async function iniciarAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  await audioCtx.resume();

  try {
    await cargarSoundfontScript();
  } catch (e) {
    console.error("Error cargando Soundfont");
    return false;
  }

  if (!piano) {
    piano = await Soundfont.instrument(audioCtx, 'acoustic_grand_piano');
  }

  return true;
}

function tocarNota(nota) {
  if (!sonidoActivado || !piano) return;

  const MAPA_MIDI = {
    'Do':'C4','Re':'D4','Mi':'E4','Fa':'F4','Sol':'G4',
    'La':'A4','Si':'B4','Do⁸':'C5','Re⁸':'D5','Mi⁸':'E5'
  };

  const midi = MAPA_MIDI[nota];
  if (midi) piano.play(midi, audioCtx.currentTime, { duration: 0.9 });
}

// ============================================================
// BOTÓN AUDIO
// ============================================================

function setupAudioButton() {
  const btn = document.getElementById("btnAudio");
  if (!btn) return;

  btn.onclick = async () => {

    // Primer clic: inicializa audio
    if (!piano) {
      const ok = await iniciarAudio();
      if (!ok) return;
    }

    // Toggle sonido
    sonidoActivado = !sonidoActivado;

    btn.textContent = sonidoActivado
      ? "🔇 Silenciar"
      : "🔊 Activar sonido";
  };
}

// ============================================================
// GENERADOR PI
// ============================================================

function* generarPi() {
  let q = 1n, r = 0n, t = 1n, k = 1n, n = 3n, l = 3n;

  while (true) {
    if (4n*q + r - t < n*t) {
      yield Number(n);
      let nr = 10n*(r - n*t);
      n = (10n*(3n*q + r))/t - 10n*n;
      q = 10n*q;
      r = nr;
    } else {
      let nr = (2n*q + r)*l;
      let nn = (q*(7n*k) + 2n + r*l)/(t*l);
      q = q*k;
      t = t*l;
      l = l + 2n;
      k = k + 1n;
      n = nn;
      r = nr;
    }
  }
}

let piGen = generarPi();
const cachePi = [];

function obtenerDigitoPorIndice(idx) {
  while (cachePi.length <= idx) {
    cachePi.push(piGen.next().value.toString());
  }
  return cachePi[idx];
}

// ============================================================
// NOTAS
// ============================================================

const NOTAS = {
  '0': 'Mi⁸','1': 'Do','2': 'Re','3': 'Mi','4': 'Fa',
  '5': 'Sol','6': 'La','7': 'Si','8': 'Do⁸','9': 'Re⁸'
};

const ALTURAS = {
  'Do':114,'Re':104,'Mi':94,'Fa':84,'Sol':74,
  'La':64,'Si':54,'Do⁸':44,'Re⁸':34,'Mi⁸':24
};

// ============================================================
// CUENTA ATRÁS
// ============================================================

const INICIO_MELODIA = new Date(Date.UTC(2027, 2, 14, 0, 0, 0));

function actualizarCountdown() {
  const ahora = new Date();
  const diff = INICIO_MELODIA - ahora;

  const dias = document.getElementById('dias');
  const horas = document.getElementById('horas');
  const minutos = document.getElementById('minutos');
  const segundos = document.getElementById('segundos');

  if (!dias || !horas || !minutos || !segundos) return;

  if (diff <= 0) {
    dias.textContent = '00';
    horas.textContent = '00';
    minutos.textContent = '00';
    segundos.textContent = '00';
    return;
  }

  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const s = Math.floor((diff / 1000) % 60);

  const f = n => n.toString().padStart(2, '0');

  dias.textContent = d;
  horas.textContent = f(h);
  minutos.textContent = f(m);
  segundos.textContent = f(s);
}

// ============================================================
// PENTAGRAMA INICIAL
// ============================================================

function generarPentagramaInicial() {
  const digitos = ['·', '·', '3', '1', '4'];
  const container = document.getElementById('notasPentagrama');
  if (!container) return;

  let html = '';

  digitos.forEach((d, i) => {
    const esActual = (i === 2);
    const nota = NOTAS[d] || '·';
    const top = ALTURAS[nota] ?? 90;

    html += `
      <div class="nota-columna">
        <div class="nota-cabeza ${esActual ? 'actual' : ''}" style="top:${top}px;"></div>
        <div class="nota-nombre">${nota}</div>
        <div class="nota-digito ${esActual ? 'actual' : ''}">${d}</div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// ============================================================
// MODO EN VIVO
// ============================================================

let modoVivo = false;

function verificarInicio() {
  const ahora = new Date();
  if (ahora >= INICIO_MELODIA && !modoVivo) {
    modoVivo = true;
    iniciarModoVivo();
  }
}

function iniciarModoVivo() {
  const countdown = document.getElementById('countdownContainer');
  if (countdown) countdown.style.display = 'none';

  const estado = document.getElementById('estadoPrincipal');
  if (estado) estado.innerHTML = '🔴 LIVE';

  const lugar = document.getElementById('lugarPrincipal');
  if (lugar) lugar.innerHTML = 'π está sonando ahora';

  actualizarPentagramaVivo();
  setInterval(actualizarPentagramaVivo, 1000);
}

function actualizarPentagramaVivo() {

  const ahora = Date.now();
  const segundoGlobal = Math.floor((ahora - INICIO_MELODIA) / 1000);

  const container = document.getElementById('notasPentagrama');
  if (!container) return;

  let html = '';
  let digitos = [];

  for (let j = -2; j <= 2; j++) {
    const idx = segundoGlobal + j;
    if (idx < 0) continue;

    const d = obtenerDigitoPorIndice(idx);
    digitos.push(d);

    const esActual = (j === 0);
    const nota = NOTAS[d] || '·';
    const top = ALTURAS[nota] ?? 90;

    html += `
      <div class="nota-columna">
        <div class="nota-cabeza ${esActual ? 'actual' : ''}" style="top:${top}px;"></div>
        <div class="nota-nombre">${nota}</div>
        <div class="nota-digito ${esActual ? 'actual' : ''}">${d}</div>
      </div>
    `;
  }

  container.innerHTML = html;

  const tiempo = document.getElementById('tiempoActual');
  if (tiempo) {
    tiempo.innerHTML = `⏱️ segundo #${segundoGlobal} · π: ${digitos[2]} · 60 bpm`;
  }

  const notaActual = NOTAS[digitos[2]];
  tocarNota(notaActual);
}

// ============================================================
// INIT
// ============================================================

document.addEventListener("DOMContentLoaded", function () {

  actualizarCountdown();
  setInterval(actualizarCountdown, 1000);

  generarPentagramaInicial();

  verificarInicio();
  setInterval(verificarInicio, 1000);

  setupAudioButton();
});
