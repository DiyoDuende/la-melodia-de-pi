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
// CONFIGURACIÓN DE TRADUCCIÓN
// ============================================================

translate.setUseVersion2();
translate.selectiveTranslate.setExcludeTag('translate', 'no');
translate.execute();

function cambiarIdioma(idioma) {
  translate.changeLanguage(idioma);
  
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('activo');
  });
  event.target.closest('.lang-btn').classList.add('activo');
}

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

const ALTURAS = {
  'Do': 110,
  'Re': 105,
  'Mi': 100,
  'Fa': 90,
  'Sol': 80,
  'La': 70,
  'Si': 60,
  'Do⁸': 50,
  'Re⁸': 40,
  'Mi⁸': 30
};

// ============================================================
// AUDIO (CORRECTO Y ROBUSTO)
// ============================================================

async function iniciarAudio() {

  // Crear contexto dentro del click
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  await audioCtx.resume();
  console.log("🔊 Audio activo:", audioCtx.state);

  // Cargar Soundfont
  try {
    await cargarSoundfontScript();
  } catch (e) {
    console.error(e);
    alert("❌ No se pudo cargar Soundfont (CDN bloqueado)");
    return;
  }

  if (typeof Soundfont === "undefined") {
    alert("❌ Soundfont no está disponible");
    return;
  }

  // Cargar instrumento
  if (!piano) {
    try {
      piano = await Soundfont.instrument(audioCtx, 'acoustic_grand_piano');
      console.log("🎹 Piano listo");
    } catch (err) {
      console.error(err);
      alert("❌ Error cargando instrumento piano");
    }
  }
}
// ============================================================
// CUENTA ATRÁS
// ============================================================

const INICIO_MELODIA = new Date(Date.UTC(2027, 2, 14, 0, 0, 0));

function actualizarCountdown() {
  const ahora = new Date();
  const diff = INICIO_MELODIA - ahora;

  const diasEl = document.getElementById('dias');
  const horasEl = document.getElementById('horas');
  const minutosEl = document.getElementById('minutos');
  const segundosEl = document.getElementById('segundos');

  if (!diasEl) return; // 🔴 evita error si no existe

  if (diff <= 0) {
    diasEl.textContent = '00';
    horasEl.textContent = '00';
    minutosEl.textContent = '00';
    segundosEl.textContent = '00';
    return;
  }

  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutos = Math.floor((diff / (1000 * 60)) % 60);
  const segundos = Math.floor((diff / 1000) % 60);

  const formato = n => n.toString().padStart(2, '0');

  diasEl.textContent = dias;
  horasEl.textContent = formato(horas);
  minutosEl.textContent = formato(minutos);
  segundosEl.textContent = formato(segundos);
}
// ============================================================
// PENTAGRAMA INICIAL
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
// MODO EN VIVO
// ============================================================

let modoVivo = false;
let worker;

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
  console.log('🎵 π HA EMPEZADO A SONAR');
  
  document.getElementById('countdownContainer').style.display = 'none';
  document.getElementById('estadoPrincipal').innerHTML = '🔴 LIVE';
  document.getElementById('estadoPrincipal').setAttribute('translate', 'yes');
  document.getElementById('lugarPrincipal').innerHTML = 'π está sonando ahora';
  
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
    cantidad: 6
  });
}

if (worker) {
  worker.onmessage = function(e) {
    if (e.data.id === 'pentagrama' && modoVivo) {
      const digitos = e.data.digitos;
      const container = document.getElementById('notasPentagrama');
      
      let html = '';
      digitos.forEach((d, i) => {
        const esActual = (i === 2);
        const notaNombre = NOTAS[d] || '·';
        
        html += `
          <div class="nota">
            <div class="nota-simbolo ${esActual ? 'actual' : ''}">♩</div>
            <div class="nota-nombre" translate="yes">${notaNombre}</div>
            <div class="nota-digito ${esActual ? 'actual' : ''} no-traducir">${d}</div>
          </div>
        `;
      });
      
      container.innerHTML = html;
      
      const segundoGlobal = e.data.inicio + 2;
      document.getElementById('tiempoActual').innerHTML = 
        `⏱️ segundo #${segundoGlobal.toLocaleString()} · π: ${digitos[2]} · 60 bpm`;
    }
  };
}

setInterval(verificarInicio, 1000);
verificarInicio();

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

    await iniciarAudio();

    if (!piano) {
      alert("❌ Error cargando el piano (Soundfont)");
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
