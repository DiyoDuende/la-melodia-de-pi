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

// ============================================================
// CUENTA ATRÁS (14 MARZO 2027)
// ============================================================

const INICIO_MELODIA = new Date(Date.UTC(2027, 2, 14, 0, 0, 0));

function actualizarCountdown() {
  const ahora = new Date();
  const diff = INICIO_MELODIA - ahora;

  if (diff <= 0) {
    document.getElementById('countdown').innerHTML = '¡YA HA EMPEZADO!';
    return;
  }

  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutos = Math.floor((diff / (1000 * 60)) % 60);
  const segundos = Math.floor((diff / 1000) % 60);

  const formato = (n) => n.toString().padStart(2, '0');
  
  document.getElementById('countdown').innerHTML = 
    `${dias} ${formato(horas)} ${formato(minutos)} ${formato(segundos)}`;
}

setInterval(actualizarCountdown, 1000);
actualizarCountdown();

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
      <div class="nota">
        <div class="nota-simbolo ${esActual ? 'actual' : ''}">♩</div>
        <div class="nota-nombre" translate="yes">${notaNombre}</div>
        <div class="nota-digito ${esActual ? 'actual' : ''} no-traducir">${d}</div>
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
