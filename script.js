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
// GENERADOR DE PI (INFINITO)
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

function obtenerDigito(indice) {
  while (cachePi.length <= indice) {
    cachePi.push(piGen.next().value.toString());
  }
  return cachePi[indice];
}

// ============================================================
// AUDIO
// ============================================================

let audioCtx = null;
let piano = null;
let sonidoActivado = false;

async function iniciarAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  await audioCtx.resume();

  if (!piano) {
    piano = await Soundfont.instrument(audioCtx, 'acoustic_grand_piano');
    console.log("🎹 Piano listo");
  }

  sonidoActivado = true;
}

function tocarNota(nota) {
  if (!sonidoActivado || !piano) return;

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

  const midi = mapaMidi[nota];
  if (midi) piano.play(midi);
}

// ============================================================
// PENTAGRAMA
// ============================================================

function actualizarPentagrama(segundoActual) {
  const container = document.getElementById('notasPentagrama');
  if (!container) return;

  let html = '';

  for (let i = -2; i <= 2; i++) {
    const idx = segundoActual + i;
    if (idx < 0) continue;

    const digito = obtenerDigito(idx);
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
// MELODÍA
// ============================================================

let intervalo = null;
let segundoActual = 0;

function iniciarMelodia() {
  if (intervalo) clearInterval(intervalo);

  segundoActual = 0;

  intervalo = setInterval(() => {

    const digito = obtenerDigito(segundoActual);
    const nota = NOTAS[digito];

    if (nota) tocarNota(nota);

    actualizarPentagrama(segundoActual);

    const tiempo = document.getElementById('tiempoActual');
    if (tiempo) {
      tiempo.innerHTML =
        `⏱️ segundo #${segundoActual} · π: ${digito} · 60 bpm`;
    }

    segundoActual++;

  }, 1000);
}

// ============================================================
// ARRANQUE
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

  actualizarPentagrama(0);

  document.getElementById("btnAudio").onclick = async () => {
    await iniciarAudio();
    document.getElementById("btnAudio").textContent = "🔊 Sonido activo";
  };

  document.getElementById("btnIniciar").onclick = () => {
    iniciarMelodia();
  };

});
