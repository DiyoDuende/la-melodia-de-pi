// ============================================================
// TEST AUDIO DEFINITIVO
// ============================================================

let audioCtx;

document.addEventListener("DOMContentLoaded", () => {

  const btn = document.createElement("button");
  btn.textContent = "🔊 TEST SONIDO";
  btn.style.fontSize = "20px";
  btn.style.margin = "40px";

  btn.onclick = async () => {

    // 🔑 Crear contexto DENTRO del click (clave absoluta)
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    await audioCtx.resume();

    console.log("estado:", audioCtx.state);

    // 🎵 sonido simple
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.value = 440;

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 1);

    console.log("🎵 debería sonar");
  };

  document.body.appendChild(btn);
});
