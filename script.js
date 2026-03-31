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

// POSICIÓN REAL EN PENTAGRAMA
const POSICION_NOTAS = {
  'Do': 150,
  'Re': 140,
  'Mi': 130,
  'Fa': 120,
  'Sol': 110,
  'La': 100,
  'Si': 90,
  'Do⁸': 80,
  'Re⁸': 70,
  'Mi⁸': 60
};

// ============================================================
// CUENTA ATRÁS
// ============================================================

const INICIO_MELODIA = new Date(Date.UTC(2027, 2, 14, 0, 0, 0));

function actualizarCountdown() {
  const ahora = new Date();
  const diff = INICIO_MELODIA - ahora;

  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutos = Math.floor((diff / (1000 * 60)) % 60);
  const segundos = Math.floor((diff / 1000) % 60);

  document.getElementById('countdown').innerHTML =
    `${dias} ${horas} ${minutos} ${segundos}`;
}

setInterval(actualizarCountdown, 1000);
actualizarCountdown();

// ============================================================
// π BASE
// ============================================================

const PI = ['3','1','4','1','5','9','2','6','5','3','5'];

// ============================================================
// PENTAGRAMA
// ============================================================

const CENTRO = 2;
const TAM = 6;

function obtenerVentana(t) {
  let arr = [];
  for (let i = 0; i < TAM; i++) {
    let idx = t - CENTRO + i;
    if (idx < 0) arr.push(null);
    else arr.push(PI[idx % PI.length]);
  }
  return arr;
}

function render(t) {
  const datos = obtenerVentana(t);
  const cont = document.getElementById('notasPentagrama');

  let html = '';

  datos.forEach((d, i) => {
    let nota = '';
    let simbolo = '';
    let top = 130;

    if (d !== null) {
      nota = NOTAS[d];
      simbolo = '♩';
      top = POSICION_NOTAS[nota];
    }

    const actual = (i === CENTRO);

    html += `
      <div class="nota">
        <div class="nota-simbolo ${actual ? 'actual' : ''}" style="top:${top}px;">
          ${simbolo}
        </div>
        <div class="nota-nombre">${nota}</div>
        <div class="nota-digito ${actual ? 'actual' : ''}">${d || ''}</div>
      </div>
    `;
  });

  cont.innerHTML = html;

  document.getElementById('tiempoActual').innerHTML =
    `⏱️ segundo ${t}`;
}

// ============================================================
// INICIO
// ============================================================

let t = 0;
render(t);

setInterval(() => {
  t++;
  render(t);
}, 1000);
