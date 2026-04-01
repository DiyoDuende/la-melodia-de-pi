// ============================================================
// CONFIGURACIÓN DE TRADUCCIÓN (SEGURA)
// ============================================================

if (typeof translate !== 'undefined') {
  translate.setUseVersion2();
  translate.selectiveTranslate.setExcludeTag('translate', 'no');
  translate.execute();
}

function cambiarIdioma(idioma, el) {
  if (typeof translate !== 'undefined') {
    translate.changeLanguage(idioma);
  }

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('activo');
  });

  if (el) el.classList.add('activo');
}

// ============================================================
// MAPEO DE NOTAS
// ============================================================

const POSICION_NOTA = {
  'Do': 140,
  'Re': 130,
  'Mi': 120,
  'Fa': 110,
  'Sol': 100,
  'La': 90,
  'Si': 80,
  'Do⁸': 70,
  'Re⁸': 60,
  'Mi⁸': 50
};

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

  const formato = (n) => n.toString().padStart(2, '0');

  document.getElementById('dias').textContent = dias;
  document.getElementById('horas').textContent = formato(horas);
  document.getElementById('minutos').textContent = formato(minutos);
  document.getElementById('segundos').textContent = formato(segundos);
}

// ✔ orden correcto
actualizarCountdown();
setInterval(actualizarCountdown, 1000);

// ============================================================
// PENTAGRAMA INICIAL
// ============================================================

function generarPentagramaInicial() {
  const digitos = ['3', '1', '4', '1', '5', '9'];
  const container = document.getElementById('notasPentagrama');

  let html = '';

  digitos.forEach((d, i) => {
    const esActual = (i === 2);
    const notaNombre = NOTAS[d] || '';

    html += `
      <div class="nota" style="position: relative;">
        <div class="nota-simbolo ${esActual ? 'actual' : ''}" 
             style="top:${POSICION_NOTA[notaNombre] || 120}px;">
          ♩
        </div>
        <div class="nota-nombre">${notaNombre}</div>
        <div class="nota-digito ${esActual ? 'actual' : ''}">${d}</div>
      </div>
    `;
  });

  container.innerHTML = html;
}

generarPentagramaInicial();

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

  document.getElementById('countdownContainer').style.display = 'none';
  document.getElementById('estadoPrincipal').innerHTML = '🔴 LIVE';
  document.getElementById('lugarPrincipal').innerHTML = 'π está sonando ahora';

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
    cantidad: 6
  });
}

if (worker) {
  worker.onmessage = function(e) {
    if (e.data.id === 'pentagrama' && modoVivo) {
      const digitos = e.data.digitos;
      const container = document.getElementById('notasPentagrama');

      let html = '';

      digitos.forEach((d, i) => {
        const esActual = (i === 2);
        const notaNombre = NOTAS[d] || '';

        html += `
          <div class="nota">
            <div class="nota-simbolo ${esActual ? 'actual' : ''}" 
                 style="top:${POSICION_NOTA[notaNombre] || 120}px;">
              ♩
            </div>
            <div class="nota-nombre">${notaNombre}</div>
            <div class="nota-digito ${esActual ? 'actual' : ''}">${d}</div>
          </div>
        `;
      });

      container.innerHTML = html;

      const segundoActual = e.data.inicio + 2;
      document.getElementById('tiempoActual').innerHTML =
        `⏱️ segundo #${segundoActual.toLocaleString()} · π: ${digitos[2]} · 60 bpm`;
    }
  };
}

setInterval(verificarInicio, 1000);
verificarInicio();
