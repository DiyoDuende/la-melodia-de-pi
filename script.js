// ============================================================
// TRADUCCIÓN (SIN CAMBIOS)
// ============================================================

function cambiarIdioma(idioma, el) {
  alert("Traducción temporalmente desactivada");

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('activo');
  });

  if (el) el.classList.add('activo');
}

// ============================================================
// PI INFINITO + AUDIO
// ============================================================

// --- Carga dinámica Soundfont ---
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

// --- Audio ---
let audioCtx = null;
let piano = null;
let sonidoActivado = true;

async function iniciarAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  await audioCtx.resume();

  try {
    await cargarSoundfontScript();
  } catch (e) {
    console.error("Error cargando Soundfont");
    return;
  }

  if (!piano) {
    piano = await Soundfont.instrument(audioCtx, 'acoustic_grand_piano');
  }
}

function tocarNota(nota) {
  if (!sonidoActivado || !piano) return;

  const MAPA_MIDI = {
    'Do':'C4','Re':'D4','Mi':'E4','Fa':'F4','Sol':'G4',
    'La':'A4','Si':'B4','Do⁸':'C5','Re⁸':'D5','Mi⁸':'E5'
  };

  const midi = MAPA_MIDI[nota];
  if (midi) {
    piano.play(midi, audioCtx.currentTime, { duration: 0.9 });
  }
}

// ============================================================
// GENERADOR PI (GIBBONS)
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
// MAPEO DE NOTAS (SIN CAMBIOS)
// ============================================================

const NOTAS = {
  '0': 'Mi⁸',
  '1': 'Do',
  '2': 'Re',
  '3': 'Mi',
  '4': 'Fa',
  '5': 'Sol',
  '6': 'La',
  '7': 'Si',
  '8': 'Do⁸',
  '9': 'Re⁸'
};

const ALTURAS = {
  'Do': 114,
  'Re': 104,
  'Mi': 94,
  'Fa': 84,
  'Sol': 74,
  'La': 64,
  'Si': 54,
  'Do⁸': 44,
  'Re⁸': 34,
  'Mi⁸': 24
};

// ============================================================
// CUENTA ATRÁS (SIN CAMBIOS)
// ============================================================

const INICIO_MELODIA = new Date(Date.UTC(2027, 2, 14, 0, 0, 0));

function actualizarCountdown() {
  const ahora = new Date();
  const diff = INICIO_MELODIA - ahora;

  if (diff <= 0) {
    document.getElementById('dias').textContent = '00';
    document.getElementById('horas').textContent = '00';
    document.getElementById('minutos').textContent = '00';
    document.getElementById('segundos').textContent = '00';
    return;
  }

  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutos = Math.floor((diff / (1000 * 60)) % 60);
  const segundos = Math.floor((diff / 1000) % 60);

  const formato = n => n.toString().padStart(2, '0');

  document.getElementById('dias').textContent = dias;
  document.getElementById('horas').textContent = formato(horas);
  document.getElementById('minutos').textContent = formato(minutos);
  document.getElementById('segundos').textContent = formato(segundos);
}

// ============================================================
// PENTAGRAMA INICIAL (SIN CAMBIOS)
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

        ${nota === 'Do' ? `
          <div class="linea-adicional" style="top:${top + 5}px;"></div>
        ` : ''}

        <div class="nota-nombre">${nota}</div>

        <div class="nota-digito ${esActual ? 'actual' : ''}">
          ${d}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// ============================================================
// MODO EN VIVO (MODIFICADO)
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
  console.log('🎵 π HA EMPEZADO');

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

        ${nota === 'Do' ? `
          <div class="linea-adicional" style="top:${top + 5}px;"></div>
        ` : ''}

        <div class="nota-nombre">${nota}</div>
        <div class="nota-digito ${esActual ? 'actual' : ''}">
          ${d}
        </div>
      </div>
    `;
  }

  container.innerHTML = html;

  const tiempo = document.getElementById('tiempoActual');
  if (tiempo) {
    tiempo.innerHTML =
      `⏱️ segundo #${segundoGlobal} · π: ${digitos[2]} · 60 bpm`;
  }

  // 🔊 SONIDO
  const notaActual = NOTAS[digitos[2]];
  tocarNota(notaActual);
}

// ============================================================
// ARRANQUE GLOBAL
// ============================================================

document.addEventListener("DOMContentLoaded", function () {

  actualizarCountdown();
  setInterval(actualizarCountdown, 1000);

  generarPentagramaInicial();

  verificarInicio();
  setInterval(verificarInicio, 1000);

  // Activar audio con interacción
  document.body.addEventListener('click', iniciarAudio, { once: true });
});
