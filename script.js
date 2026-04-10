// ============================================================
// CONFIG
// ============================================================

const MODO_PRUEBA = true;
const DURACION_TURNO = 10;

let audioCtx = null;
let piano = null;
let sonidoActivado = true;
let intervalo = null;
let segundo = 0;

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

const MAPA_MIDI = {
  'Do':'C4','Re':'D4','Mi':'E4','Fa':'F4','Sol':'G4',
  'La':'A4','Si':'B4','Do⁸':'C5','Re⁸':'D5','Mi⁸':'E5'
};

// ============================================================
// GENERADOR PRUEBA
// ============================================================

let i = 0;
const CICLO = ['0','1','2','3','4','5','6','7','8','9'];

function getDigito() {
  const d = CICLO[i % 10];
  i++;
  return d;
}

// ============================================================
// AUDIO
// ============================================================

function iniciarAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    console.log("🎧 Audio creado");
  }

  return audioCtx.resume().then(() => {
    console.log("🔊 Audio activo");
  });
}

function cargarPiano() {
  if (!piano) {
    return Soundfont.instrument(audioCtx, 'acoustic_grand_piano')
      .then(inst => {
        piano = inst;
        console.log("🎹 Piano listo");
      });
  }
  return Promise.resolve();
}

function tocarNota(nota) {
  if (!sonidoActivado || !piano) return;

  const midi = MAPA_MIDI[nota];
  if (midi) {
    piano.play(midi, audioCtx.currentTime, { gain: 1 });
  }
}

// ============================================================
// PENTAGRAMA
// ============================================================

function actualizarPentagrama(seg) {
  const container = document.getElementById('notasPentagrama');
  if (!container) return;

  let html = '';

  for (let j = -2; j <= 2; j++) {
    const idx = seg + j;
    if (idx < 0) continue;

    const d = CICLO[idx % 10];
    const nota = NOTAS[d];
    const top = ALTURAS[nota];
    const actual = j === 0;

    html += `
      <div class="nota-columna">
        <div class="nota-cabeza ${actual?'actual':''}" style="top:${top}px;"></div>
        <div class="nota-nombre">${nota}</div>
        <div class="nota-digito ${actual?'actual':''}">${d}</div>
      </div>
    `;
  }

  container.innerHTML = html;
}

// ============================================================
// REPRODUCCIÓN
// ============================================================

function iniciarMelodia() {
  if (intervalo) return;

  intervalo = setInterval(() => {
    const d = getDigito();
    const nota = NOTAS[d];

    tocarNota(nota);
    actualizarPentagrama(segundo);

    const t = document.getElementById('tiempoActual');
    if (t) t.innerHTML = `⏱️ segundo #${segundo} · π: ${d}`;

    segundo++;
  }, 1000);
}

// ============================================================
// UI
// ============================================================

function crearBotones() {
  const cont = document.getElementById('controles');

  // INICIAR
  const btn = document.createElement('button');
  btn.textContent = "🎵 Iniciar prueba";

  btn.onclick = async () => {
    await iniciarAudio();       // 🔑 CLAVE
    await cargarPiano();        // 🔑 CLAVE

    iniciarMelodia();

    btn.disabled = true;
    btn.textContent = "🎶 Reproduciendo...";
  };

  // MUTE
  const mute = document.createElement('button');
  mute.textContent = "🔊 Silenciar";

  mute.onclick = () => {
    sonidoActivado = !sonidoActivado;
    mute.textContent = sonidoActivado ? "🔊 Silenciar" : "🔇 Activar";
  };

  cont.appendChild(btn);
  cont.appendChild(mute);
}

// ============================================================
// INIT
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  crearBotones();
  actualizarPentagrama(0);
});
