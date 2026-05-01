// ============================================================
// CONFIGURACIÓN GLOBAL
// ============================================================
const API_URL = null; // ← pon tu URL cuando la tengas
const TOKEN_URL = null;
const LIVEKIT_URL = null;

let room = null;
let currentEspera = null;
let offsetServidor = 0;

// ============================================================
// TIEMPO
// ============================================================
async function sincronizarTiempo() {
  if (!API_URL) return offsetServidor = 0;

  try {
    const res = await fetch(`${API_URL}?action=getServerTime`);
    const data = await res.json();
    offsetServidor = data.serverTime - Date.now();
  } catch {
    console.warn('No se pudo sincronizar el tiempo');
    offsetServidor = 0;
  }
}

function ahoraReal() {
  return Date.now() + offsetServidor;
}

const INICIO_MELODIA = new Date(Date.UTC(2027, 2, 14, 0, 0, 0));

function getSegundoGlobal() {
  return Math.floor((ahoraReal() - INICIO_MELODIA) / 1000);
}

sincronizarTiempo();
setInterval(sincronizarTiempo, 60000);

// ============================================================
// INTÉRPRETES (SAFE MODE)
// ============================================================
let cacheInterpretes = [];
let lastFetch = 0;

async function obtenerInterpretes() {
  if (!API_URL) return [];

  const ahora = Date.now();
  if (ahora - lastFetch < 10000) return cacheInterpretes;

  try {
    const res = await fetch(`${API_URL}?action=getInterpretes`);
    cacheInterpretes = await res.json();
    lastFetch = ahora;
  } catch {
    console.warn('Error obteniendo intérpretes');
  }

  return cacheInterpretes;
}

// ============================================================
// NOTAS
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
// AUDIO
// ============================================================
let audioCtx=null, piano=null, sonidoActivado=false, audioInterpreteActivo=false;

async function iniciarAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  await audioCtx.resume();

  if (!piano) {
    await loadSoundfont();
    piano = await Soundfont.instrument(audioCtx, 'acoustic_grand_piano');
  }

  sonidoActivado = true;
}

function loadSoundfont() {
  return new Promise(resolve=>{
    if (window.Soundfont) return resolve();
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/soundfont-player/dist/soundfont-player.min.js';
    s.onload=resolve;
    document.head.appendChild(s);
  });
}

function tocarNota(nota) {
  if (!sonidoActivado || !piano || !nota) return;

  const mapa = {
    'Do':'C4','Re':'D4','Mi':'E4','Fa':'F4','Sol':'G4',
    'La':'A4','Si':'B4','Do⁸':'C5','Re⁸':'D5','Mi⁸':'E5'
  };

  const midi = mapa[nota];
  if (!midi) return;

  piano.play(midi, audioCtx.currentTime, {
    duration: 0.9,
    gain: audioInterpreteActivo ? 0.2 : 0.8
  });
}

document.getElementById('btnAudio').addEventListener('click', async ()=>{
  if (!piano) await iniciarAudio();
  sonidoActivado = !sonidoActivado;
});

// ============================================================
// LIVEKIT (DESACTIVADO SI NO CONFIGURADO)
// ============================================================
async function conectarAInterprete() {
  if (!TOKEN_URL || !LIVEKIT_URL) return;
}

// ============================================================
// UI INTÉRPRETES
// ============================================================
async function actualizarUIInterpretes() {
  if (!API_URL) return;

  const interpretes = await obtenerInterpretes();
  const segundo = getSegundoGlobal();

  const actual = interpretes.find(i =>
    segundo >= i.inicioSegundo && segundo < i.inicioSegundo + 300
  );

  if (actual) {
    document.getElementById('estadoPrincipal').innerText = `🎵 ${actual.nombre}`;
  }
}

setInterval(actualizarUIInterpretes, 15000);

// ============================================================
// WORKER + PENTAGRAMA
// ============================================================
let worker = null;
try {
  worker = new Worker('./worker/worker-pi.js');
} catch {
  console.warn('Worker no cargado');
}

let modoVivo = false;

function verificarInicio() {
  const diff = INICIO_MELODIA - ahoraReal();

  if (diff <= 0 && !modoVivo) {
    modoVivo = true;

    document.getElementById('countdownContainer').style.display = 'none';

    setInterval(()=>{
      if (!worker) return;

      const segundo = getSegundoGlobal();

      if (segundo < 0) return; // 🔴 evita basura

      worker.postMessage({
        id:'pentagrama',
        inicio:segundo-2,
        cantidad:5
      });

    },1000);
  }
}

setInterval(verificarInicio,1000);

if (worker) {
  worker.onmessage = function(e){
    if (!modoVivo) return;

    const digitos = e.data.digitos;
    if (!digitos || digitos.length < 3) return;

    const container = document.getElementById('notasPentagrama');
    if (!container) return;

    let html='';

    digitos.forEach((d,i)=>{
      if (d === undefined) return;

      const nota = NOTAS[d];
      if (!nota) return;

      const top = ALTURAS[nota] ?? 90;

      html += `
      <div class="nota-columna">
        <div class="nota-cabeza ${i===2?'actual':''}" style="top:${top}px;"></div>
        <div class="nota-nombre">${nota}</div>
        <div class="nota-digito ${i===2?'actual':''}">${d}</div>
      </div>`;
    });

    container.innerHTML = html;

    const actual = digitos[2];
    if (actual !== undefined) {
      document.getElementById('tiempoActual').innerHTML =
        `⏱️ segundo #${e.data.inicio+2} · π: ${actual} · 60 bpm`;

      tocarNota(NOTAS[actual]);
    }
  };
}

// ============================================================
// CUENTA ATRÁS
// ============================================================
function actualizarCountdown() {
  const diff = INICIO_MELODIA - Date.now();

  if (diff <= 0) return;

  const d=Math.floor(diff/86400000);
  const h=Math.floor((diff%86400000)/3600000);
  const m=Math.floor((diff%3600000)/60000);
  const s=Math.floor((diff%60000)/1000);

  document.getElementById('dias').textContent=d;
  document.getElementById('horas').textContent=h.toString().padStart(2,'0');
  document.getElementById('minutos').textContent=m.toString().padStart(2,'0');
  document.getElementById('segundos').textContent=s.toString().padStart(2,'0');
}

setInterval(actualizarCountdown,1000);
actualizarCountdown();

// ============================================================
// ARRANQUE
// ============================================================
verificarInicio();
actualizarUIInterpretes();
