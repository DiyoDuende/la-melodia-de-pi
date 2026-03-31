// ============================================================
// NOTAS y MAPEO
// ============================================================
const NOTAS = {
  '0': 'Mi⁸', '1': 'Do', '2': 'Re', '3': 'Mi',
  '4': 'Fa', '5': 'Sol', '6': 'La', '7': 'Si',
  '8': 'Do⁸', '9': 'Re⁸'
};

// Dígitos de π (primeros 1000, para demo)
const DIGITOS_PI = [
  '3','1','4','1','5','9','2','6','5','3','5','8','9','7','9','3',
  '2','3','8','4','6','2','6','4','3','3','8','3','2','7','9','5','0',
  '2','8','8','4','1','9','7','1','6','9','3','9','9','3','7','5','1'
];

function obtenerDigito(segundo) {
  if (segundo < 0 || segundo >= DIGITOS_PI.length) return '·';
  return DIGITOS_PI[segundo];
}

// ============================================================
// CUENTA ATRÁS REAL
// ============================================================
const INICIO = new Date(Date.UTC(2027, 2, 14, 0, 0, 0));

function actualizarCountdown() {
  const ahora = new Date();
  const diff = INICIO - ahora;

  if (diff <= 0) {
    document.getElementById('countdown').innerHTML = '¡YA HA EMPEZADO!';
    return;
  }

  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const segs = Math.floor((diff / 1000) % 60);

  const f = n => n.toString().padStart(2, '0');
  document.getElementById('countdown').innerHTML = `${dias} ${f(horas)} ${f(mins)} ${f(segs)}`;
}
setInterval(actualizarCountdown, 1000);
actualizarCountdown();

// ============================================================
// PENTAGRAMA EN VIVO (según tiempo real)
// ============================================================
function actualizarPentagrama() {
  const ahora = Date.now();
  const segundoGlobal = Math.floor((ahora - INICIO) / 1000);

  // Mostramos 6 notas: 3 anteriores (o ·), actual, y 2 siguientes
  const indices = [
    segundoGlobal - 3, segundoGlobal - 2, segundoGlobal - 1,
    segundoGlobal,
    segundoGlobal + 1, segundoGlobal + 2
  ];
  const digitos = indices.map(i => obtenerDigito(i));

  const container = document.getElementById('notasPentagrama');
  let html = '';
  digitos.forEach((d, i) => {
    const esActual = (i === 3); // la cuarta es la actual
    const notaNombre = d !== '·' ? (NOTAS[d] || '·') : '·';
    html += `
      <div class="nota">
        <div class="nota-simbolo ${esActual ? 'actual' : ''}">♩</div>
        <div class="nota-nombre" translate="yes">${notaNombre}</div>
        <div class="nota-digito ${esActual ? 'actual' : ''} no-traducir">${d}</div>
      </div>
    `;
  });
  container.innerHTML = html;

  // Actualizar texto inferior
  const actual = digitos[3];
  document.getElementById('tiempoActual').innerHTML =
    `⏱️ segundo #${segundoGlobal.toLocaleString()} · π: ${actual} · 60 bpm`;
}

// Actualizar cada segundo, sincronizado
function iniciarReloj() {
  actualizarPentagrama();
  const ahora = Date.now();
  const msParaProx = 1000 - (ahora % 1000);
  setTimeout(iniciarReloj, msParaProx);
}
iniciarReloj();
