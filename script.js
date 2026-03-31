// ============================================================
// CONFIGURACIÓN DE TRADUCCIÓN
// ============================================================

function cambiarIdioma(idioma) {
  if (typeof translate !== 'undefined') {
    translate.changeLanguage(idioma);
  }

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
// CUENTA ATRÁS
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
        <div class="nota-nombre">${notaNombre}</div>
        <div class="nota-digito ${esActual ? 'actual' : ''}">${d}</div>
      </div>
    `;
  });

  container.innerHTML = html;
}

generarPentagramaInicial();
