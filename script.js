// ============================================================
// CONFIGURACIÓN DE TRADUCCIÓN
// ============================================================

function cambiarIdioma(idioma, el) {
  alert("Traducción temporalmente desactivada");

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('activo');
  });

  if (el) el.classList.add('activo');
}

// ============================================================
// MAPEO DE NOTAS
// ============================================================

const MODO_PRUEBA = true;
let segundoPrueba = 0;

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
// CUENTA ATRÁS
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
// AUDIO
// ============================================================

let audioCtx;
let piano = null;

function iniciarAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    Soundfont.instrument(audioCtx, 'acoustic_grand_piano')
      .then(inst => {
        piano = inst;
        console.log("🎹 Piano listo");
      });
  }
}

document.addEventListener('click', iniciarAudio);

function tocarNota(nota) {
  if (!piano) return;

  const mapaMidi = {
    'Do': 'C4',
    'Re': 'D4',
    'Mi': 'E4',
    'Fa': 'F4',
    'Sol': 'G4',
    'La': 'A4',
    'Si': 'B4',
    'Do⁸': 'C5',
    'Re⁸': 'D5',
    'Mi⁸': 'E5'
  };

  const notaMidi = mapaMidi[nota];
  if (notaMidi) {
    piano.play(notaMidi);
  }
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

    // 🎹 SONIDO
    if (esActual) {
      tocarNota(nota);
    }

    html += `
      <div class="nota-columna">

        <div class="nota-cabeza ${esActual ? 'actual' : ''}" 
             style="top:${top}px;"></div>

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
// MODO EN VIVO
// ============================================================

let modoVivo = false;
let worker = null;

if (typeof Worker !== 'undefined') {
  worker = new Worker('worker/worker-pi.js');
}

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

  if (worker) {
    actualizarPentagramaVivo();
    setInterval(actualizarPentagramaVivo, 1000);
  }
}

function actualizarPentagramaVivo() {
  if (!worker) return;

  const ahora = Date.now();
  const segundoGlobal = Math.floor((ahora - INICIO_MELODIA) / 1000);

  worker.postMessage({
    id: 'pentagrama',
    inicio: segundoGlobal - 2,
    cantidad: 5
  });
}

if (worker) {
  worker.onmessage = function(e) {

    if (e.data.id === 'pentagrama' && modoVivo) {

      const digitos = e.data.digitos;
      const container = document.getElementById('notasPentagrama');

      if (!container) return;

      let html = '';

      digitos.forEach((d, i) => {

        const esActual = (i === 2);
        const nota = NOTAS[d] || '·';
        const top = ALTURAS[nota] ?? 90;

        // 🎹 SONIDO EN VIVO
        if (esActual) {
          tocarNota(nota);
        }

        html += `
          <div class="nota-columna">

            <div class="nota-cabeza ${esActual ? 'actual' : ''}" 
                 style="top:${top}px;"></div>

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

      const tiempo = document.getElementById('tiempoActual');
      if (tiempo) {
        const segundoActual = e.data.inicio + 2;
        tiempo.innerHTML =
          `⏱️ segundo #${segundoActual} · π: ${digitos[2]} · 60 bpm`;
      }
    }
  };
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
});
