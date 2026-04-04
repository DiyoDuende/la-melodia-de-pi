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
  'Do': 128,
  'Re': 118,
  'Mi': 108,
  'Fa': 98,
  'Sol': 88,
  'La': 78,
  'Si': 68,
  'Do⁸': 58,
  'Re⁸': 48,
  'Mi⁸': 38
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

        <div class="nota-cabeza ${esActual ? 'actual' : ''}" 
             style="top:${top}px;"></div>

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

        html += `
          <div class="nota-columna">

            <div class="nota-cabeza ${esActual ? 'actual' : ''}" 
                 style="top:${top}px;"></div>

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
