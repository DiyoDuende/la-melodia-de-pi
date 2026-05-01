
// ============================================================
// CONFIGURACIÓN GLOBAL (cambia estas URLs por las tuyas)
// ============================================================
// const API_URL = 'https://script.google.com/macros/s/TU_ID/exec';
// const TOKEN_URL = 'https://tu-worker.workers.dev';
// const LIVEKIT_URL = 'wss://tu-dominio-livekit.com';

let room = null;
let currentEspera = null;
let offsetServidor = 0;

// ============================================================
// SINCRONIZACIÓN DE TIEMPO (crítica)
// ============================================================
async function sincronizarTiempo() {
  try {
    const res = await fetch(`${API_URL}?action=getServerTime`);
    function sincronizarTiempo() {
  offsetServidor = 0;
}
    const data = await res.json();
    offsetServidor = data.serverTime - Date.now();
  } catch (e) { console.warn('No se pudo sincronizar el tiempo'); }
}
function ahoraReal() { return Date.now() + offsetServidor; }
const INICIO_MELODIA = new Date(Date.UTC(2027, 2, 14, 0, 0, 0));
function getSegundoGlobal() { return Math.floor((ahoraReal() - INICIO_MELODIA) / 1000); }
sincronizarTiempo();
setInterval(sincronizarTiempo, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) sincronizarTiempo(); });

// ============================================================
// CACHE DE INTÉRPRETES (para reducir polling)
// ============================================================
let cacheInterpretes = [];
let lastFetch = 0;
async function obtenerInterpretes() {
  const ahora = Date.now();
  if (ahora - lastFetch < 10000) return cacheInterpretes;
  const res = await fetch(`${API_URL}?action=getInterpretes`);
  cacheInterpretes = await res.json();
  lastFetch = ahora;
  return cacheInterpretes;
}

// ============================================================
// MAPEO DE NOTAS Y GENERADOR DE π
// ============================================================
const NOTAS = {
  '0': 'Mi⁸', '1': 'Do', '2': 'Re', '3': 'Mi', '4': 'Fa',
  '5': 'Sol', '6': 'La', '7': 'Si', '8': 'Do⁸', '9': 'Re⁸'
};
const ALTURAS = {
  'Do': 114, 'Re': 104, 'Mi': 94, 'Fa': 84, 'Sol': 74,
  'La': 64, 'Si': 54, 'Do⁸': 44, 'Re⁸': 34, 'Mi⁸': 24
};
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
  while (cachePi.length <= indice) cachePi.push(piGen.next().value.toString());
  return cachePi[indice];
}

// ============================================================
// AUDIO π
// ============================================================
let audioCtx = null, piano = null, sonidoActivado = false, audioInterpreteActivo = false;
async function iniciarAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  await audioCtx.resume();
  if (!piano) {
    await loadSoundfont();
    piano = await Soundfont.instrument(audioCtx, 'acoustic_grand_piano');
    console.log("🎹 Piano listo");
  }
  sonidoActivado = true;
}
function loadSoundfont() {
  return new Promise((resolve) => {
    if (window.Soundfont) resolve();
    else {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/soundfont-player@0.12.0/dist/soundfont-player.min.js';
      script.onload = resolve;
      document.head.appendChild(script);
    }
  });
}
function tocarNota(nota) {
  if (!sonidoActivado || !piano) return;
  const mapaMidi = { 'Do':'C4','Re':'D4','Mi':'E4','Fa':'F4','Sol':'G4','La':'A4','Si':'B4','Do⁸':'C5','Re⁸':'D5','Mi⁸':'E5' };
  const midi = mapaMidi[nota];
  if (!midi) return;
  const volumen = audioInterpreteActivo ? 0.2 : 0.8;
  piano.play(midi, audioCtx.currentTime, { duration: 0.9, gain: volumen });
}
document.getElementById('btnAudio').addEventListener('click', async () => {
  if (!piano) await iniciarAudio();
  sonidoActivado = !sonidoActivado;
  document.getElementById('btnAudio').textContent = sonidoActivado ? '🔇 Silenciar' : '🔊 Activar sonido';
});

// ============================================================
// LIVEKIT - GESTIÓN PRINCIPAL + LIMPIEZA DE TRACKS
// ============================================================
function limpiarTracks(roomObj) {
  roomObj?.localParticipant?.tracks.forEach(pub => { pub.track?.stop(); });
}
async function conectarAInterprete(codigo, inicioSegundo) {
  const roomName = `turno-${inicioSegundo}`;
  if (room && room.name === roomName) return;
  if (room) {
    limpiarTracks(room);
    await room.disconnect();
    room = null;
  }
  const container = document.getElementById('videoPlaceholderPrincipal');
  container.innerHTML = '<div class="simbolo-pi">🔄 Conectando...</div>';
  const tokenRes = await fetch(`${TOKEN_URL}?room=${roomName}&identity=viewer-${Math.random()}`);
  const { token } = await tokenRes.json();
  room = new Livekit.Room();
  await room.connect(LIVEKIT_URL, token);
  let videoMostrado = false;
  room.on('trackSubscribed', (track) => {
    if (track.kind === 'video') {
      const el = track.attach();
      el.style.width = '100%';
      el.style.height = '100%';
      container.innerHTML = '';
      container.appendChild(el);
      videoMostrado = true;
    }
    if (track.kind === 'audio') audioInterpreteActivo = true;
  });
  setTimeout(() => {
    if (!videoMostrado && container.innerHTML === '<div class="simbolo-pi">🔄 Conectando...</div>') {
      container.innerHTML = '<div class="simbolo-pi">π</div>';
    }
  }, 5000);
}
async function gestionarEspera(siguiente) {
  const container = document.getElementById('videoPlaceholderEspera');
  if (!siguiente) {
    if (currentEspera) {
      limpiarTracks(currentEspera);
      await currentEspera.disconnect();
      currentEspera = null;
    }
    container.innerHTML = '<div class="simbolo-pi">π</div>';
    return;
  }
  const roomName = `turno-${siguiente.inicioSegundo}`;
  if (currentEspera && currentEspera.name === roomName) return;
  if (currentEspera) {
    limpiarTracks(currentEspera);
    await currentEspera.disconnect();
    currentEspera = null;
  }
  const tokenRes = await fetch(`${TOKEN_URL}?room=${roomName}&identity=viewer-waiting`);
  const { token } = await tokenRes.json();
  const waitRoom = new Livekit.Room();
  await waitRoom.connect(LIVEKIT_URL, token);
  container.innerHTML = '';
  waitRoom.on('trackSubscribed', (track) => {
    if (track.kind === 'video') {
      const el = track.attach();
      el.muted = true;
      el.style.width = '100%';
      el.style.height = '100%';
      container.appendChild(el);
    }
  });
  currentEspera = waitRoom;
}

// ============================================================
// ACTUALIZACIÓN UI (polling 15s con cache)
// ============================================================
async function actualizarUIInterpretes() {
  const interpretes = await obtenerInterpretes();
  const segundoGlobal = getSegundoGlobal();
  const actual = interpretes.find(i => segundoGlobal >= i.inicioSegundo && segundoGlobal < i.inicioSegundo + 300);
  const siguiente = interpretes.find(i => i.inicioSegundo === (actual?.inicioSegundo + 300));
  if (actual) {
    conectarAInterprete(actual.codigo, actual.inicioSegundo);
    document.getElementById('estadoPrincipal').innerText = `🎵 ${actual.nombre}`;
    document.getElementById('lugarPrincipal').innerHTML = `Desde ${actual.lugar}`;
  } else {
    document.getElementById('estadoPrincipal').innerHTML = '🔴 LIVE';
    document.getElementById('lugarPrincipal').innerHTML = 'π está sonando ahora';
    audioInterpreteActivo = false;
  }
  gestionarEspera(siguiente);
}
setInterval(actualizarUIInterpretes, 15000);

// ============================================================
// PENTAGRAMA EN VIVO (worker)
// ============================================================
let worker = new Worker('/la-melodia-de-pi/worker/worker-pi.js');
let modoVivo = false;
function verificarInicio() {
  if (Date.now() >= INICIO_MELODIA && !modoVivo) {
    modoVivo = true;
    document.getElementById('countdownContainer').style.display = 'none';
    setInterval(() => {
      const segundoGlobal = getSegundoGlobal();
      worker.postMessage({ id: 'pentagrama', inicio: segundoGlobal-2, cantidad:5 });
    }, 1000);
  }
}
worker.onmessage = function(e) {
  if (e.data.id === 'pentagrama' && modoVivo) {
    const digitos = e.data.digitos;
    const container = document.getElementById('notasPentagrama');
    if (!container) return;
    let html = '';
    digitos.forEach((d,i) => {
      const esActual = (i===2);
      const nota = NOTAS[d] || '·';
      const top = ALTURAS[nota] ?? 90;
      html += `<div class="nota-columna">
        <div class="nota-cabeza ${esActual?'actual':''}" style="top:${top}px;"></div>
        <div class="nota-nombre">${nota}</div>
        <div class="nota-digito ${esActual?'actual':''}">${d}</div>
      </div>`;
    });
    container.innerHTML = html;
    document.getElementById('tiempoActual').innerHTML = `⏱️ segundo #${e.data.inicio+2} · π: ${digitos[2]} · 60 bpm`;
    if (sonidoActivado) tocarNota(NOTAS[digitos[2]]);
  }
};
// ============================================================
// CUENTA ATRÁS
// ============================================================
function actualizarCountdown() {
  const diff = INICIO_MELODIA - Date.now();
  if (diff <= 0) {
    document.querySelectorAll('#dias,#horas,#minutos,#segundos').forEach(el=>el.textContent='00');
    return;
  }
  const dias = Math.floor(diff/86400000);
  const horas = Math.floor((diff%86400000)/3600000);
  const mins = Math.floor((diff%3600000)/60000);
  const segs = Math.floor((diff%60000)/1000);
  document.getElementById('dias').textContent = dias;
  document.getElementById('horas').textContent = horas.toString().padStart(2,'0');
  document.getElementById('minutos').textContent = mins.toString().padStart(2,'0');
  document.getElementById('segundos').textContent = segs.toString().padStart(2,'0');
}
setInterval(actualizarCountdown,1000);
actualizarCountdown();

// ============================================================
// TRADUCCIÓN
// ============================================================
let idiomaActual = 'es';
let textos = {};
fetch('traducciones.json').then(r=>r.json()).then(d=>{textos=d; aplicarTraduccion();});
function aplicarTraduccion() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (textos[idiomaActual] && textos[idiomaActual][key])
      el.innerText = textos[idiomaActual][key];
  });
}
function cambiarIdioma(lang, btn) {
  idiomaActual = lang;
  aplicarTraduccion();
  document.querySelectorAll('.lang-btn').forEach(b=>b.classList.remove('activo'));
  btn.classList.add('activo');
}
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => cambiarIdioma(btn.dataset.lang, btn));
});

// ============================================================
// ARRANQUE GLOBAL
// ============================================================
verificarInicio();
setInterval(actualizarUIInterpretes, 15000);
actualizarUIInterpretes();;

