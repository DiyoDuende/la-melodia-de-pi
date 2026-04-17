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
// NOTAS Y ALTURAS
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

function generarPentagramaInicial() {
  const digitos = ['3', '1', '4', '1', '5', '9'];
  const container = document.getElementById('notasPentagrama');
  
  let html = '';
  digitos.forEach((d, i) => {
    const esActual = (i === 2);
    const notaNombre = NOTAS[d] || '·';
    
    html += `
      <div class="nota-columna">

        <div class="nota-cabeza ${esActual ? 'actual' : ''}" 
             style="top:${top}px;"></div>

        <div class="nota-nombre">${nota}</div>

        <div class="nota-digito ${esActual ? 'actual' : ''}">
          ${d}
        </div>

      </div>
    `;
  });
  
  container.innerHTML = html;
}

generarPentagramaInicial();

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

