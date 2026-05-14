// ============================================================
// 1. CONFIGURACIÓN GLOBAL
// ============================================================
const API_URL = 'https://script.google.com/macros/s/AKfycbydI3vX9VJlFk9ZqsO16DoMFEdqnCVs-_I4K6NgofsADIrHoIkHECOHMQ-_JxeXjf-kKQ/exec'; // ← tu URL actual
const TOKEN_URL = 'https://orange-sun-a67e.elgrandiyo.workers.dev/';
const LIVEKIT_URL = 'wss://melodia-pi-3mw6tr42.livekit.cloud';
const GLOBAL_ROOM = 'melodia-global';

let room = null;
let offsetServidor = 0;
let audioInterpreteActivo = false;

// Detectar si es la página principal (index.html)
const esPaginaPrincipal = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '';

// ============================================================
// 2. SINCRONIZACIÓN DE TIEMPO (siempre necesaria)
// ============================================================
const INICIO_MELODIA = new Date(Date.UTC(2027, 2, 14, 0, 0, 0));

async function sincronizarTiempo() {
  if (!API_URL) return;
  try {
    const res = await fetch(`${API_URL}?action=getServerTime`);
    const data = await res.json();
    offsetServidor = data.serverTime - Date.now();
  } catch (e) {
    console.warn('No se pudo sincronizar el tiempo');
  }
}
function ahoraReal() { return Date.now() + offsetServidor; }
function getSegundoGlobal() { return Math.floor((ahoraReal() - INICIO_MELODIA) / 1000); }

sincronizarTiempo();
setInterval(sincronizarTiempo, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) sincronizarTiempo(); });

// ============================================================
// 3. OBTENER INTÉRPRETES (CACHE)
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
  } catch (e) { console.warn('Error obteniendo intérpretes'); }
  return cacheInterpretes;
}

// ============================================================
// 4. TRADUCCIONES (data-i18n + JSON)
// ============================================================
let textos = {};
let idiomaActual = 'es';

async function cargarTraducciones() {
  try {
    const res = await fetch('traducciones.json');
    textos = await res.json();
    aplicarTraduccion();
  } catch (e) {
    console.warn('No se pudieron cargar las traducciones');
  }
}

function aplicarTraduccion() {
  if (!textos[idiomaActual]) return;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (textos[idiomaActual][key]) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = textos[idiomaActual][key];
      } else if (el.tagName === 'TITLE') {
        document.title = textos[idiomaActual][key];
      } else {
        el.innerHTML = textos[idiomaActual][key];
      }
    }
  });
  const btnAudio = document.getElementById('btnAudio');
  if (btnAudio && sonidoActivado !== undefined) {
    const key = sonidoActivado ? 'btn_audio_on' : 'btn_audio';
    if (textos[idiomaActual][key]) btnAudio.innerHTML = textos[idiomaActual][key];
  }
}

function cambiarIdioma(idioma, btn) {
  idiomaActual = idioma;
  aplicarTraduccion();
  localStorage.setItem('idioma', idioma);
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('activo'));
  if (btn) btn.classList.add('activo');
}

const idiomaGuardado = localStorage.getItem('idioma');
if (idiomaGuardado && ['es','en','fr','de','it','pt','ja','zh','ar'].includes(idiomaGuardado)) {
  idiomaActual = idiomaGuardado;
}

// ============================================================
// 5. NOTAS Y ALTURAS (solo para página principal)
// ============================================================
const NOTAS = {
  '0': 'Mi⁸', '1': 'Do', '2': 'Re', '3': 'Mi', '4': 'Fa',
  '5': 'Sol', '6': 'La', '7': 'Si', '8': 'Do⁸', '9': 'Re⁸'
};
const ALTURAS = {
  'Do': 114, 'Re': 104, 'Mi': 94, 'Fa': 84, 'Sol': 74,
  'La': 64, 'Si': 54, 'Do⁸': 44, 'Re⁸': 34, 'Mi⁸': 24
};

// ============================================================
// 6. GENERADOR DE π (worker) y PENTAGRAMA
// ============================================================
let worker = null;
try {
  worker = new Worker('worker/worker-pi.js');
} catch(e) {
  console.warn('Worker no cargado');
  if (document.getElementById('tiempoActual')) {
    document.getElementById('tiempoActual').innerHTML = '⚠️ Modo limitado (sin cálculo en tiempo real)';
  }
}
let modoVivo = false;
let intervaloPentagrama = null;

function iniciarActualizacionViva() {
  if (intervaloPentagrama) clearInterval(intervaloPentagrama);
  intervaloPentagrama = setInterval(() => {
    if (!modoVivo || !worker) return;
    const segundo = getSegundoGlobal();
    if (segundo >= 0) {
      worker.postMessage({ id: 'pentagrama', inicio: segundo - 2, cantidad: 5 });
    }
  }, 1000);
}

function activarModoVivo() {
  if (modoVivo) return;
  modoVivo = true;
  const countdownContainer = document.getElementById('countdownContainer');
  if (countdownContainer) countdownContainer.style.display = 'none';
  const estadoPrincipal = document.getElementById('estadoPrincipal');
  if (estadoPrincipal) estadoPrincipal.innerHTML = textos[idiomaActual]?.live || 'LIVE';
  const lugarPrincipal = document.getElementById('lugarPrincipal');
  if (lugarPrincipal) lugarPrincipal.innerHTML = textos[idiomaActual]?.desde_fecha || 'π está sonando ahora';
  iniciarActualizacionViva();
}

if (esPaginaPrincipal) {
  setInterval(() => {
    if (!modoVivo && ahoraReal() >= INICIO_MELODIA) {
      activarModoVivo();
    }
  }, 1000);
}

if (worker) {
  worker.onmessage = function(e) {
    if (!modoVivo) return;
    const digitos = e.data.digitos;
    if (!digitos || digitos.length < 3) return;
    const container = document.getElementById('notasPentagrama');
    if (!container) return;
    let html = '';
    digitos.forEach((d, i) => {
      if (d === undefined) return;
      const esActual = (i === 2);
      const nota = NOTAS[d] || '·';
      const notaTraducida = textos[idiomaActual]?.[`nota_${nota}`] || nota;
      const top = ALTURAS[nota] ?? 90;
      html += `<div class="nota-columna">
        <div class="nota-cabeza ${esActual ? 'actual' : ''}" style="top:${top}px;"></div>
        ${nota === 'Do' ? `<div class="linea-adicional" style="top:${top + 5}px;"></div>` : ''}
        <div class="nota-nombre">${notaTraducida}</div>
        <div class="nota-digito ${esActual ? 'actual' : ''}">${d}</div>
      </div>`;
    });
    container.innerHTML = html;
    const tiempoSpan = document.getElementById('tiempoActual');
    if (tiempoSpan) {
      tiempoSpan.innerHTML = `⏱️ segundo #${e.data.inicio+2} · π: ${digitos[2]} · 60 bpm`;
    }
    if (sonidoActivado) tocarNota(NOTAS[digitos[2]]);
  };
}

function generarPentagramaInicial() {
  const digitosDemo = ['·', '·', '3', '1', '4'];
  const container = document.getElementById('notasPentagrama');
  if (!container) return;
  let html = '';
  digitosDemo.forEach((d, i) => {
    const esActual = (i === 2);
    const nota = NOTAS[d] || '·';
    const notaTraducida = textos[idiomaActual]?.[`nota_${nota}`] || nota;
    const top = ALTURAS[nota] ?? 90;
    html += `<div class="nota-columna">
      <div class="nota-cabeza ${esActual ? 'actual' : ''}" style="top:${top}px;"></div>
      ${nota === 'Do' ? `<div class="linea-adicional" style="top:${top + 5}px;"></div>` : ''}
      <div class="nota-nombre">${notaTraducida}</div>
      <div class="nota-digito ${esActual ? 'actual' : ''}">${d}</div>
    </div>`;
  });
  container.innerHTML = html;
  if (document.getElementById('tiempoActual')) {
    document.getElementById('tiempoActual').innerHTML = `⏱️ segundo #0 · π: 3 · 60 bpm (esperando inicio)`;
  }
}

// ============================================================
// 7. AUDIO (PIANO) – solo si existe btnAudio
// ============================================================
let audioCtx = null, piano = null, sonidoActivado = false;

async function loadSoundfont() {
  if (window.Soundfont) return;
  return new Promise(resolve => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/soundfont-player/dist/soundfont-player.min.js';
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

async function iniciarAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  await audioCtx.resume();
  if (!piano) {
    await loadSoundfont();
    piano = await Soundfont.instrument(audioCtx, 'acoustic_grand_piano');
  }
  sonidoActivado = true;
  const key = sonidoActivado ? 'btn_audio_on' : 'btn_audio';
  if (textos[idiomaActual] && textos[idiomaActual][key]) {
    const btn = document.getElementById('btnAudio');
    if (btn) btn.innerHTML = textos[idiomaActual][key];
  }
}
function tocarNota(nota) {
  if (!sonidoActivado || !piano || !nota) return;
  const mapa = {
    'Do':'C4','Re':'D4','Mi':'E4','Fa':'F4','Sol':'G4',
    'La':'A4','Si':'B4','Do⁸':'C5','Re⁸':'D5','Mi⁸':'E5'
  };
  const midi = mapa[nota];
  if (!midi) return;
  const gain = audioInterpreteActivo ? 0.2 : 0.8;
  piano.play(midi, audioCtx.currentTime, { duration: 0.9, gain, attack: 0.01, release: 0.3 });
}
const btnAudio = document.getElementById('btnAudio');
if (btnAudio) {
  btnAudio.addEventListener('click', async () => {
    if (!piano) {
      await iniciarAudio();
    } else {
      sonidoActivado = !sonidoActivado;
    }
    const key = sonidoActivado ? 'btn_audio_on' : 'btn_audio';
    if (textos[idiomaActual] && textos[idiomaActual][key]) {
      btnAudio.innerHTML = textos[idiomaActual][key];
    } else {
      btnAudio.textContent = sonidoActivado ? '🔇 Silenciar' : '🔊 Activar sonido';
    }
  });
}

// ============================================================
// 8. LIVEKIT – CONEXIÓN A SALA GLOBAL (solo en principal)
// ============================================================
async function obtenerTokenEspectador(roomName) {
  const url = `${TOKEN_URL}?room=${encodeURIComponent(roomName)}&identity=viewer-${Math.random()}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.token;
}

async function conectarSalaGlobal() {
  if (!TOKEN_URL || !LIVEKIT_URL) return;
  if (room && room.name === GLOBAL_ROOM) return;
  if (room) { room.disconnect(); room = null; }
  try {
    const token = await obtenerTokenEspectador(GLOBAL_ROOM);
    const newRoom = new Livekit.Room();
    await newRoom.connect(LIVEKIT_URL, token);
    room = newRoom;
    room.on('trackSubscribed', () => actualizarPantallasSegunTiempo());
    room.on('participantConnected', () => actualizarPantallasSegunTiempo());
    room.on('participantDisconnected', () => actualizarPantallasSegunTiempo());
    setInterval(() => actualizarPantallasSegunTiempo(), 1000);
    actualizarPantallasSegunTiempo();
  } catch (err) {
    console.error('Error conectando a sala global:', err);
  }
}

async function actualizarPantallasSegunTiempo() {
  if (!room) return;
  const interpretes = await obtenerInterpretes();
  const ahora = getSegundoGlobal();

  const actual = interpretes.find(i => ahora >= i.inicioBloque + 300 && ahora < i.inicioBloque + 600);
  const siguiente = interpretes.find(i => ahora >= i.inicioBloque && ahora < i.inicioBloque + 300);

  room.participants.forEach(participant => {
    const identidad = participant.identity;
    const esActual = actual && identidad === actual.codigo;
    const esSiguiente = siguiente && identidad === siguiente.codigo;

    if (esActual) {
      const container = document.getElementById('videoPlaceholderPrincipal');
      if (container) container.innerHTML = '';
      participant.tracks.forEach(track => {
        if (track.kind === 'video') {
          const el = track.attach();
          el.style.width = '100%';
          el.style.height = '100%';
          if (container) container.appendChild(el);
        }
        if (track.kind === 'audio') audioInterpreteActivo = true;
      });
      const estado = document.getElementById('estadoPrincipal');
      const lugar = document.getElementById('lugarPrincipal');
      if (estado) estado.innerText = `🎵 ${actual.nombre}`;
      if (lugar) lugar.innerHTML = `Desde ${actual.lugar}`;
    } else if (esSiguiente) {
      const container = document.getElementById('videoPlaceholderEspera');
      if (container) container.innerHTML = '';
      participant.tracks.forEach(track => {
        if (track.kind === 'video') {
          const el = track.attach();
          el.muted = true;
          el.style.width = '100%';
          el.style.height = '100%';
          if (container) container.appendChild(el);
        }
      });
      const lugarEspera = document.querySelector('.video-box.small .lugar');
      if (lugarEspera) lugarEspera.innerHTML = `⏳ ${siguiente.nombre}`;
    }
  });

  if (!actual) {
    const container = document.getElementById('videoPlaceholderPrincipal');
    if (container) container.innerHTML = '<div class="simbolo-pi">π</div>';
    audioInterpreteActivo = false;
  }
  if (!siguiente) {
    const container = document.getElementById('videoPlaceholderEspera');
    if (container) container.innerHTML = '<div class="simbolo-pi">π</div>';
  }
}

// ============================================================
// 9. UI DE INTÉRPRETES (textos, sin vídeo)
// ============================================================
async function actualizarUIInterpretes() {
  if (!API_URL) return;
  const interpretes = await obtenerInterpretes();
  const segundo = getSegundoGlobal();
  const actual = interpretes.find(i => segundo >= i.inicioBloque + 300 && segundo < i.inicioBloque + 600);
  if (actual) {
    const estado = document.getElementById('estadoPrincipal');
    const lugar = document.getElementById('lugarPrincipal');
    if (estado) estado.innerText = `🎵 ${actual.nombre}`;
    if (lugar) lugar.innerHTML = `Desde ${actual.lugar}`;
  } else {
    const estado = document.getElementById('estadoPrincipal');
    const lugar = document.getElementById('lugarPrincipal');
    if (estado) estado.innerHTML = textos[idiomaActual]?.live || 'LIVE';
    if (lugar) lugar.innerHTML = textos[idiomaActual]?.desde_fecha || 'π está sonando ahora';
    audioInterpreteActivo = false;
  }
}
if (esPaginaPrincipal) {
  setInterval(actualizarUIInterpretes, 15000);
}

// ============================================================
// 10. CUENTA ATRÁS (solo si existen elementos)
// ============================================================
function actualizarCountdown() {
  const diff = INICIO_MELODIA - ahoraReal();
  const diasSpan = document.getElementById('dias');
  const horasSpan = document.getElementById('horas');
  const minutosSpan = document.getElementById('minutos');
  const segundosSpan = document.getElementById('segundos');
  if (!diasSpan) return; // si no está, salir
  if (diff <= 0) {
    diasSpan.textContent = '00';
    horasSpan.textContent = '00';
    minutosSpan.textContent = '00';
    segundosSpan.textContent = '00';
    return;
  }
  const dias = Math.floor(diff / 86400000);
  const horas = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const segs = Math.floor((diff % 60000) / 1000);
  diasSpan.textContent = dias;
  horasSpan.textContent = horas.toString().padStart(2,'0');
  minutosSpan.textContent = mins.toString().padStart(2,'0');
  segundosSpan.textContent = segs.toString().padStart(2,'0');
}
setInterval(actualizarCountdown, 1000);
actualizarCountdown();

// ============================================================
// 11. ACCESO INTÉRPRETE (solo si existe el formulario)
// ============================================================
const formAcceso = document.getElementById('formAccesoInterprete');
if (formAcceso) {
  formAcceso.addEventListener('submit', (e) => {
    e.preventDefault();
    let codigo = document.getElementById('codigoAcceso').value.trim();
    const turno = document.getElementById('turnoAcceso').value.trim();
    if (!codigo || !turno) {
      alert('Por favor, introduce tu código y el inicio de tu bloque.');
      return;
    }
    if (!/π-[A-Z0-9]{4,}/.test(codigo)) {
      alert('El código parece inválido. Debe empezar con π- seguido de letras y números.');
      return;
    }
    const url = `interprete.html?code=${encodeURIComponent(codigo)}&inicioBloque=${encodeURIComponent(turno)}`;
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  });
}

// ============================================================
// 12. INICIALIZACIÓN (siempre cargar traducciones y botones)
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  await cargarTraducciones();
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      cambiarIdioma(btn.dataset.lang, btn);
    });
    if (btn.dataset.lang === idiomaActual) btn.classList.add('activo');
  });
  if (esPaginaPrincipal) {
    generarPentagramaInicial();
    conectarSalaGlobal();
    actualizarUIInterpretes();
  }
});
