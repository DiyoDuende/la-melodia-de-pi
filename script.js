// ============================================================
// 1. CONFIGURACIÓN GLOBAL
// ============================================================
const API_URL = 'https://script.google.com/macros/s/AKfycbydI3vX9VJlFk9ZqsO16DoMFEdqnCVs-_I4K6NgofsADIrHoIkHECOHMQ-_JxeXjf-kKQ/exec';
const TOKEN_URL = 'https://orange-sun-a67e.elgrandiyo.workers.dev/';
const LIVEKIT_URL = 'wss://melodia-pi-3mw6tr42.livekit.cloud';
const GLOBAL_ROOM = 'melodia-global';

let room = null;
let offsetServidor = 0;
let audioInterpreteActivo = false;
let sonidoActivado = false;
let textos = {};
let idiomaActual = 'es';
let modoVivo = false;
let worker = null;
let intervaloPentagrama = null;

// Detectar si es la página principal (index.html)
const esPaginaPrincipal = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '';

// ============================================================
// 2. SINCRONIZACIÓN DE TIEMPO
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
// 4. NOTAS Y ALTURAS
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
// 5. TRADUCCIONES
// ============================================================
async function cargarTraducciones() {
  try {
    const res = await fetch('traducciones.json');
    textos = await res.json();
    aplicarTraduccion();
    if (!modoVivo) generarPentagramaInicial();
    else if (worker) {
      const segundo = getSegundoGlobal();
      worker.postMessage({ id: 'pentagrama', inicio: segundo - 2, cantidad: 5 });
    }
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

  if (modoVivo && worker) {
    const segundo = getSegundoGlobal();
    worker.postMessage({ id: 'pentagrama', inicio: segundo - 2, cantidad: 5 });
  } else {
    generarPentagramaInicial();
  }
}

const idiomaGuardado = localStorage.getItem('idioma');
if (idiomaGuardado && ['es','en','fr','de','it','pt','ja','zh','ar'].includes(idiomaGuardado)) {
  idiomaActual = idiomaGuardado;
}

// ============================================================
// 6. PENTAGRAMA + WORKER
// ============================================================
try {
  worker = new Worker('worker/worker-pi.js');
} catch(e) {
  console.warn('Worker no cargado');
  if (document.getElementById('tiempoActual')) {
    document.getElementById('tiempoActual').innerHTML = '⚠️ Modo limitado (sin cálculo en tiempo real)';
  }
}

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
// 7. AUDIO (PIANO) - con manejo de restricciones de navegador
// ============================================================
let audioCtx = null, piano = null;

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
  await audioCtx.resume(); // necesario para iOS
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
  try {
    piano.play(midi, audioCtx.currentTime, { duration: 0.9, gain, attack: 0.01, release: 0.3 });
  } catch(e) { console.warn('Error al tocar nota:', e); }
}

// Botón de audio con protección para iOS (necesita interacción táctil)
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
// 8. LIVEKIT – CONEXIÓN A SALA GLOBAL (con reconexión)
// ============================================================
async function obtenerTokenEspectador(roomName) {
  const url = `${TOKEN_URL}?room=${encodeURIComponent(roomName)}&identity=viewer-${Math.random()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error al obtener token');
  const data = await res.json();
  return data.token;
}

let reconnectTimer = null;

async function conectarSalaGlobal() {
  if (!TOKEN_URL || !LIVEKIT_URL) return;
  if (room && room.name === GLOBAL_ROOM) return;
  if (room) {
    room.disconnect();
    room = null;
  }
  try {
    const token = await obtenerTokenEspectador(GLOBAL_ROOM);
    const newRoom = new Livekit.Room();
    // Eventos para detectar desconexión y reconectar
    newRoom.on('disconnected', () => {
      console.warn('Sala global desconectada, reintentando en 5 segundos');
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => conectarSalaGlobal(), 5000);
    });
    newRoom.on('trackSubscribed', () => actualizarPantallasSegunTiempo());
    newRoom.on('participantConnected', () => actualizarPantallasSegunTiempo());
    newRoom.on('participantDisconnected', () => actualizarPantallasSegunTiempo());
    await newRoom.connect(LIVEKIT_URL, token);
    room = newRoom;
    setInterval(() => actualizarPantallasSegunTiempo(), 1000);
    actualizarPantallasSegunTiempo();
  } catch (err) {
    console.error('Error conectando a sala global:', err);
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => conectarSalaGlobal(), 10000);
  }
}

function limpiarContenedor(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    // Detener y eliminar cualquier elemento de video dentro
    const videos = container.querySelectorAll('video');
    videos.forEach(video => {
      video.pause();
      video.srcObject = null;
      video.remove();
    });
    container.innerHTML = '<div class="simbolo-pi">π</div>';
  }
}

async function actualizarPantallasSegunTiempo() {
  if (!room) return;
  const interpretes = await obtenerInterpretes();
  const ahora = getSegundoGlobal();

  const actual = interpretes.find(i => ahora >= i.inicioBloque + 300 && ahora < i.inicioBloque + 600);
  const siguiente = interpretes.find(i => ahora >= i.inicioBloque && ahora < i.inicioBloque + 300);

  const participants = Array.from(room.participants.values());

  for (const participant of participants) {
    const identidad = participant.identity;
    const esActual = actual && identidad === actual.codigo;
    const esSiguiente = siguiente && identidad === siguiente.codigo;

    if (esActual) {
      const container = document.getElementById('videoPlaceholderPrincipal');
      if (!container) continue;
      // Limpiar solo si no es el mismo participante (evita parpadeo)
      if (container.dataset.currentParticipant !== identidad) {
        limpiarContenedor('videoPlaceholderPrincipal');
        container.dataset.currentParticipant = identidad;
      }
      // Obtener tracks de video y audio
      const videoTrack = participant.getTracks().find(track => track.kind === 'video');
      if (videoTrack) {
        const el = videoTrack.attach();
        el.style.width = '100%';
        el.style.height = '100%';
        el.autoplay = true;
        el.playsInline = true; // importante para iOS
        container.appendChild(el);
        audioInterpreteActivo = true;
      }
      const estadoEl = document.getElementById('estadoPrincipal');
      if (estadoEl) estadoEl.innerText = `🎵 ${actual.nombre}`;
      const lugarEl = document.getElementById('lugarPrincipal');
      if (lugarEl) lugarEl.innerHTML = `Desde ${actual.lugar}`;
    } else if (esSiguiente) {
      const container = document.getElementById('videoPlaceholderEspera');
      if (!container) continue;
      if (container.dataset.currentParticipant !== identidad) {
        limpiarContenedor('videoPlaceholderEspera');
        container.dataset.currentParticipant = identidad;
      }
      const videoTrack = participant.getTracks().find(track => track.kind === 'video');
      if (videoTrack) {
        const el = videoTrack.attach();
        el.style.width = '100%';
        el.style.height = '100%';
        el.autoplay = true;
        el.playsInline = true;
        el.muted = true; // silencio en espera (forzado)
        container.appendChild(el);
      }
      const lugarEspera = document.querySelector('.video-box.small .lugar');
      if (lugarEspera) lugarEspera.innerHTML = `⏳ ${siguiente.nombre}`;
    }
  }

  if (!actual) {
    limpiarContenedor('videoPlaceholderPrincipal');
    const container = document.getElementById('videoPlaceholderPrincipal');
    if (container) delete container.dataset.currentParticipant;
    audioInterpreteActivo = false;
  }
  if (!siguiente) {
    limpiarContenedor('videoPlaceholderEspera');
    const container = document.getElementById('videoPlaceholderEspera');
    if (container) delete container.dataset.currentParticipant;
  }
}

// ============================================================
// 9. UI DE INTÉRPRETES (textos)
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
// 10. CUENTA ATRÁS
// ============================================================
function actualizarCountdown() {
  const diff = INICIO_MELODIA - ahoraReal();
  const diasSpan = document.getElementById('dias');
  const horasSpan = document.getElementById('horas');
  const minutosSpan = document.getElementById('minutos');
  const segundosSpan = document.getElementById('segundos');
  if (!diasSpan) return;
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
// 11. ACCESO INTÉRPRETE
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
// 12. INICIALIZACIÓN
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  if (document.getElementById('notasPentagrama')) {
    generarPentagramaInicial();
  }
  cargarTraducciones();
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      cambiarIdioma(btn.dataset.lang, btn);
    });
    if (btn.dataset.lang === idiomaActual) btn.classList.add('activo');
  });
  if (esPaginaPrincipal) {
    conectarSalaGlobal();
    actualizarUIInterpretes();
  }
});
