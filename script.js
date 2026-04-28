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

let audioCtx = null;
let piano = null;
let sonidoActivado = false;
// ============================================================
// VIDEO + INTÉRPRETES
// ============================================================

let currentPeer = null;
let currentCall = null;
let currentVideoElement = null;

let turnoActual = 0;
let intervaloTurno = null;

let audioInterpreteActivo = false;

const DURACION_TURNO = 300; // 5 min
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
    'Do':'C4',
    'Re':'D4',
    'Mi':'E4',
    'Fa':'F4',
    'Sol':'G4',
    'La':'A4',
    'Si':'B4',
    'Do⁸':'C5',
    'Re⁸':'D5',
    'Mi⁸':'E5'
  };

  const midi = mapaMidi[nota];
  if (!midi) return;

  // si hay intérprete sonando,
  // π baja volumen
  const volumen =
    audioInterpreteActivo ? 0.2 : 0.8;

  piano.play(
    midi,
    audioCtx.currentTime,
    {
      duration:0.9,
      gain:volumen
    }
  );
}

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

iniciarTurnos();
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

// ============================================================
// VIDEO / TURNOS / WEBRTC
// ============================================================

function getSegundoGlobal(){
  return Math.floor(
    (Date.now() - INICIO_MELODIA) / 1000
  );
}

function conectarAInterprete(codigo){
  // Validar que codigo existe
  if(!codigo){
    console.error('Código de intérprete inválido');
    return;
  }

  // Limpiar conexiones previas
  if(currentCall){
    currentCall.close();
    currentCall = null;
  }
  
  if(currentPeer){
    currentPeer.destroy();
    currentPeer = null;
  }

  if(currentVideoElement){
    currentVideoElement.srcObject = null; // Detener stream
    currentVideoElement.remove();
    currentVideoElement = null;
  }

  audioInterpreteActivo = false;

  try {
    const peer = new Peer();

    peer.on('open', () => {
      const call = peer.call(codigo, null);

      if(!call){
        console.error('No se pudo iniciar la llamada');
        return;
      }

      // Manejar stream
      call.on('stream', (remoteStream) => {
        const container = document.querySelector(
          '.video-box:first-child .video-placeholder'
        );

        if(!container){
          console.warn('Contenedor de video no encontrado');
          return;
        }

        const video = document.createElement('video');
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        video.style.width = '100%';
        video.style.height = '100%';

        container.innerHTML = '';
        container.appendChild(video);

        video.srcObject = remoteStream;
        currentVideoElement = video;
      });

      // Manejar errores en la llamada
      call.on('error', (err) => {
        console.error('Error en la llamada WebRTC:', err);
      });

      currentCall = call;
    });

    // Manejar errores del peer
    peer.on('error', (err) => {
      console.error('Error en Peer:', err);
    });

    currentPeer = peer;

  } catch(error){
    console.error('Error al conectar intérprete:', error);
  }
}

function activarAudioDelInterprete(){
  if(currentVideoElement){
    currentVideoElement.muted = false;
    audioInterpreteActivo = true;
  } else {
    console.warn('Elemento de video no disponible');
  }
}

function actualizarUIInterpretes(){
  try {
    const interpretes = JSON.parse(
      localStorage.getItem('colaInterpretes') || '[]'
    );

    if(!interpretes.length){
      console.warn('No hay intérpretes en la cola');
      return;
    }

    // Validar índices
    const actual = interpretes[
      turnoActual % interpretes.length
    ];
    
    const siguiente = interpretes[
      (turnoActual + 1) % interpretes.length
    ];

    // Actualizar estado principal
    const estado = document.getElementById('estadoPrincipal');
    if(estado){
      estado.innerHTML = `🎵 ${actual.nombre || 'Intérprete'}`;
    }

    // Actualizar ubicación
    const lugar = document.getElementById('lugarPrincipal');
    if(lugar){
      lugar.innerHTML = `Desde ${actual.ubicacion || 'Mundo'}`;
    }

    // Actualizar siguiente en espera
    const espera = document.querySelector(
      '.video-box.small .lugar'
    );
    if(espera){
      espera.innerHTML = `⏳ ${siguiente.nombre || 'Próximo'}`;
    }

    // Conectar con el intérprete actual
    conectarAInterprete(actual.codigo);

  } catch(error){
    console.error('Error actualizando UI de intérpretes:', error);
  }
}

function cambiarInterprete(){
  turnoActual++;
  actualizarUIInterpretes();

  // Esperar a que el stream esté listo antes de activar audio
  setTimeout(() => {
    activarAudioDelInterprete();
  }, 1500);
}

function iniciarTurnos(){
  if(intervaloTurno){
    clearInterval(intervaloTurno);
    intervaloTurno = null;
  }

  const segundoGlobal = getSegundoGlobal();

  turnoActual = Math.floor(
    segundoGlobal / DURACION_TURNO
  );

  actualizarUIInterpretes();

  // Cambiar intérprete cada DURACION_TURNO segundos
  intervaloTurno = setInterval(
    cambiarInterprete,
    DURACION_TURNO * 1000
  );
}
