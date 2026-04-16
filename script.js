// ============================================================
// CONFIG
// ============================================================

let audioCtx = null;
let piano = null;
let sonidoActivado = true;
let intervalo = null;
let segundo = 0;

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

// ============================================================
// GENERADOR INFINITO DE PI
// ============================================================

function* generarPi() {
  let q=1n,r=0n,t=1n,k=1n,n=3n,l=3n;

  while(true){
    if(4n*q+r-t<n*t){
      yield Number(n);
      let nr=10n*(r-n*t);
      n=(10n*(3n*q+r))/t-10n*n;
      q=10n*q;
      r=nr;
    } else {
      let nr=(2n*q+r)*l;
      let nn=(q*(7n*k)+2n+r*l)/(t*l);
      q=q*k;
      t=t*l;
      l=l+2n;
      k=k+1n;
      n=nn;
      r=nr;
    }
  }
}

let piGen = null;
const cachePi = [];

function obtenerDigito(idx){
  while(cachePi.length <= idx){
    cachePi.push(piGen.next().value.toString());
  }
  return cachePi[idx];
}

// ============================================================
// AUDIO
// ============================================================

async function iniciarAudio(){

  if(!audioCtx){
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  await audioCtx.resume();

  // Cargar Soundfont si no está
  if(typeof Soundfont === "undefined"){
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/soundfont-player@0.12.0/dist/soundfont-player.min.js";
    document.head.appendChild(script);
    await new Promise(resolve => script.onload = resolve);
  }

  if(!piano){
    piano = await Soundfont.instrument(audioCtx,'acoustic_grand_piano');
    console.log("🎹 Piano listo");
  }
}

function tocarNota(nota){
  if(!sonidoActivado || !piano) return;

  const midi = MAPA_MIDI[nota];
  if(midi) piano.play(midi);
}

// ============================================================
// PENTAGRAMA (CORRECTO)
// ============================================================

function actualizarPentagrama(seg){

  const container = document.getElementById('notasPentagrama');
  if(!container) return;

  let html = '';

  for(let j = -2; j <= 2; j++){

    const idx = seg + j;
    if(idx < 0) continue;

    const d = obtenerDigito(idx);
    const nota = NOTAS[d];
    const top = ALTURAS[nota];
    const actual = (j === 0);

    html += `
      <div class="nota-columna">

        <div class="nota-cabeza ${actual ? 'actual' : ''}"
             style="top:${top}px;"></div>

        ${nota === 'Do' ? `
          <div class="linea-adicional" style="top:${top + 5}px;"></div>
        ` : ''}

        <div class="nota-nombre">${nota}</div>
        <div class="nota-digito">${d}</div>

      </div>
    `;
  }

  container.innerHTML = html;
}

// ============================================================
// MELODÍA
// ============================================================

function iniciarMelodia(){

  if(intervalo) return;

  piGen = generarPi();
  cachePi.length = 0;
  segundo = 0;

  intervalo = setInterval(() => {

    const d = obtenerDigito(segundo);
    const nota = NOTAS[d];

    tocarNota(nota);
    actualizarPentagrama(segundo);

    const tiempo = document.getElementById('tiempoActual');
    if(tiempo){
      tiempo.innerHTML = `⏱️ segundo ${segundo} · π: ${d}`;
    }

    segundo++;

  }, 1000);
}

// ============================================================
// CUENTA ATRÁS
// ============================================================

const FECHA = new Date("2027-03-14T00:00:00Z");

setInterval(() => {

  const ahora = new Date();
  const diff = FECHA - ahora;

  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff / 3600000) % 24;
  const m = Math.floor(diff / 60000) % 60;
  const s = Math.floor(diff / 1000) % 60;

  document.getElementById('dias').textContent = d;
  document.getElementById('horas').textContent = h;
  document.getElementById('minutos').textContent = m;
  document.getElementById('segundos').textContent = s;

}, 1000);

// ============================================================
// UI
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

  const cont = document.getElementById('controles');

  // BOTÓN INICIAR
  const btn = document.createElement('button');
  btn.textContent = "🎵 Iniciar";

  btn.onclick = async () => {
    await iniciarAudio();
    iniciarMelodia();
    btn.disabled = true;
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

  actualizarPentagrama(0);
});
