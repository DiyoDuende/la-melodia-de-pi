// ============================================================
// CONFIGURACIÓN
// ============================================================

const MODO_PRUEBA = true;

// ============================================================
// NOTAS Y ALTURAS
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

const MAPA_MIDI = {
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

// ============================================================
// GENERADOR DE DÍGITOS
// ============================================================

let indice = 0;
const DIGITOS_PRUEBA = ['0','1','2','3','4','5','6','7','8','9'];

function obtenerDigito() {
  const d = DIGITOS_PRUEBA[indice % DIGITOS_PRUEBA.length];
  indice++;
  return d;
}

// ============================================================
// AUDIO
// ============================================================

let audioCtx = null;
let piano = null;
let sonidoActivado = true;

function iniciarAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    console.log("🎧 AudioContext creado");
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume().then(() => {
      console.log("🔊 AudioContext reanudado");
    });
  } else {
    console.log("✅ AudioContext ya activo");
  }
}

function tocarNota(nota) {
  if (!sonidoActivado) return; // 🔑 IMPORTANTE

  if (!audioCtx) return;

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const frecuencias = {
    'Do': 261.63,
    'Re': 293.66,
    'Mi': 329.63,
    'Fa': 349.23,
    'Sol': 392.00,
    'La': 440.00,
    'Si': 493.88,
    'Do⁸': 523.25,
    'Re⁸': 587.33,
    'Mi⁸': 659.25
  };

  const freq = frecuencias[nota];
  if (!freq) return;

  console.log("🎵 Sonando:", nota, freq);

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.value = freq;

  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 1);
}

btn.onclick = async () => {
  iniciarAudio();

  // 🔑 Esto es CLAVE en navegadores modernos
  await audioCtx.resume();

  console.log("👆 Usuario interactuó, audio desbloqueado");

  iniciarPrueba();

  btn.disabled = true;
  btn.textContent = '🎶 Reproduciendo...';
};
function toggleMute() {
  sonidoActivado = !sonidoActivado;
  const btn = document.getElementById("btnMute");
  if (btn) {
    btn.textContent = sonidoActivado ? "🔊 Silenciar" : "🔇 Activar sonido";
  }
}

// ============================================================
// PENTAGRAMA
// ============================================================

function actualizarPentagrama(segundo) {
  const container = document.getElementById('notasPentagrama');
  if (!container) return;

  let html = '';

  for (let i = -2; i <= 2; i++) {
    const idx = segundo + i;
    if (idx < 0) continue;

    const digito = DIGITOS_PRUEBA[idx % 10];
    const nota = NOTAS[digito];
    const top = ALTURAS[nota];
    const esActual = (i === 0);

    html += `
      <div class="nota-columna">

        <div class="nota-cabeza ${esActual ? 'actual' : ''}" 
             style="top:${top}px;"></div>

        ${nota === 'Do' ? `
          <div class="linea-adicional" style="top:${top + 5}px;"></div>
        ` : ''}

        <div class="nota-nombre">${nota}</div>

        <div class="nota-digito ${esActual ? 'actual' : ''}">
          ${digito}
        </div>

      </div>
    `;
  }

  container.innerHTML = html;
}

// ============================================================
// REPRODUCCIÓN
// ============================================================

let intervalo = null;
let segundo = 0;

function iniciarPrueba() {
  if (intervalo) return;

  iniciarAudio();

  intervalo = setInterval(() => {
    const digito = obtenerDigito();
    const nota = NOTAS[digito];

    tocarNota(nota);
    actualizarPentagrama(segundo);

    const tiempo = document.getElementById('tiempoActual');
    if (tiempo) {
      tiempo.innerHTML =
        `⏱️ segundo #${segundo} · dígito: ${digito} · 60 bpm`;
    }

    segundo++;
  }, 1000);
}

// ============================================================
// ARRANQUE
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

  actualizarPentagrama(0);

  // BOTÓN INICIAR
  const btn = document.createElement('button');
  btn.textContent = '🎵 Iniciar prueba';
  btn.style.display = 'block';
  btn.style.margin = '20px auto';
  btn.onclick = () => {
    iniciarPrueba();
    btn.disabled = true;
    btn.textContent = '🎶 Reproduciendo...';
  };

  // BOTÓN MUTE
  const btnMute = document.createElement('button');
  btnMute.id = 'btnMute';
  btnMute.textContent = '🔊 Silenciar';
  btnMute.style.display = 'block';
  btnMute.style.margin = '10px auto';
  btnMute.onclick = toggleMute;

  const contenedor = document.querySelector('.pentagrama-section');
  if (contenedor) {
    contenedor.appendChild(btn);
    contenedor.appendChild(btnMute);
  }

});
