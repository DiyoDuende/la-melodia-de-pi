// ============================================================
// AUDIO
// ============================================================

let audioCtx, piano, sonidoActivado = false;

async function iniciarAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  await audioCtx.resume();

  const Soundfont = await import('https://cdn.jsdelivr.net/npm/soundfont-player@0.12.0/dist/soundfont-player.js');
  piano = await Soundfont.instrument(audioCtx, 'acoustic_grand_piano');
}

document.getElementById("btnAudio").onclick = async () => {
  if (!piano) await iniciarAudio();
  sonidoActivado = !sonidoActivado;
  btnAudio.textContent = sonidoActivado ? "🔇 Silenciar" : "🔊 Activar sonido";
};

// ============================================================
// PI
// ============================================================

function* generarPi() {
  let q=1n,r=0n,t=1n,k=1n,n=3n,l=3n;
  while(true){
    if(4n*q+r-t<n*t){
      yield Number(n);
      let nr=10n*(r-n*t);
      n=(10n*(3n*q+r))/t-10n*n;
      q=10n*q; r=nr;
    } else {
      let nr=(2n*q+r)*l;
      let nn=(q*(7n*k)+2n+r*l)/(t*l);
      q=q*k; t=t*l; l=l+2n; k=k+1n; n=nn; r=nr;
    }
  }
}

const piGen = generarPi();

const NOTAS = ['E5','C4','D4','E4','F4','G4','A4','B4','C5','D5'];

function tocar(d) {
  if (!sonidoActivado || !piano) return;
  piano.play(NOTAS[d], audioCtx.currentTime, {duration:0.8});
}

// ============================================================
// MELODÍA
// ============================================================

let segundo = 0;

setInterval(() => {
  const d = piGen.next().value;
  tocar(d);
  document.getElementById("tiempoActual").textContent =
    "Segundo " + segundo + " · π: " + d;
  segundo++;
}, 1000);

// ============================================================
// VIDEO (WEBRTC)
// ============================================================

let currentVideo;

function conectarAInterprete(codigo) {

  const peer = new Peer();

  peer.on('open', () => {

    const call = peer.call(codigo, null);

    call.on('stream', (stream) => {

      const container = document.getElementById("videoContainer");

      const video = document.createElement("video");
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      video.srcObject = stream;

      container.innerHTML = "";
      container.appendChild(video);

      currentVideo = video;
    });

  });
}

function activarAudioInterprete() {
  if (currentVideo) currentVideo.muted = false;
}

// 🔥 TEST AUTOMÁTICO
setTimeout(()=>{
  conectarAInterprete("test123");
},3000);
