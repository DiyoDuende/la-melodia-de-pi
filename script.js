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

// ============================================
// GENERADOR INFINITO DE DÍGITOS DE PI
// ============================================
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
        if (esActual) {
  const digitoReal = obtenerDigito(e.data.inicio + 2);
  const notaReal = NOTAS[digitoReal];

  if (notaReal) {
    tocarNota(notaReal);
  }
}
        const top = ALTURAS[nota] ?? 90;

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

  verificarInicio(); setInterval(verificarInicio, 1000); });


