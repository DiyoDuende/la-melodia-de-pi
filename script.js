// ============================================================
// CARGA SEGURA DE SOUNDFONT
// ============================================================

function cargarSoundfontScript() {
  return new Promise((resolve, reject) => {
    if (typeof Soundfont !== "undefined") {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/soundfont-player@0.12.0/dist/soundfont-player.min.js";

    script.onload = () => {
      console.log("✅ Soundfont cargado");
      resolve();
    };

    script.onerror = () => {
      reject("❌ Error cargando Soundfont");
    };

    document.head.appendChild(script);
  });
}
// ============================================================
// CONFIG
// ============================================================

const MODO_PRUEBA = true;

let audioCtx = null;
let piano = null;
let sonidoActivado = true;
let intervalo = null;
let segundo = 0;

// ============================================================
// NOTAS
// ============================================================

const NOTAS = {
  '0':'Mi⁸','1':'Do','2':'Re','3':'Mi','4':'Fa',
  '5':'Sol','6':'La','7':'Si','8':'Do⁸','9':'Re⁸'
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
// AUDIO (CORRECTO)
// ============================================================

async function iniciarAudio() {

  // 🔑 Crear SIEMPRE dentro del click
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  await audioCtx.resume();

  console.log("🔊 Audio activo:", audioCtx.state);

  // 🔑 Esperar a que Soundfont exista
  if (typeof Soundfont === "undefined") {
    console.error("❌ Soundfont NO cargado");
    return;
  }

  if (!piano) {
    piano = await Soundfont.instrument(audioCtx, 'acoustic_grand_piano');
    console.log("🎹 Piano listo");
  }
}

function tocarNota(nota) {
  if (!sonidoActivado || !piano) return;

  const midi = MAPA_MIDI[nota];
  if (midi) piano.play(midi, audioCtx.currentTime);
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
// MELODÍA
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

  // BOTÓN INICIO
  const btn = document.createElement('button');
  btn.textContent = "🎵 Iniciar prueba";

  btn.onclick = async () => {

    await iniciarAudio(); // 🔑 AQUÍ ESTÁ TODO

    if (!piano) {
      alert("Error cargando el piano (Soundfont)");
      return;
    }

    iniciarMelodia();

    btn.disabled = true;
    btn.textContent = "🎶 Reproduciendo...";
  };

  // BOTÓN MUTE
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
