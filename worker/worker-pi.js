// worker-pi.js - generador infinito de dígitos de π (spigot)
function* generarPi() {
  let q = 1n, r = 0n, t = 1n, k = 1n, n = 3n, l = 3n;
  while (true) {
    if (4n * q + r - t < n * t) {
      yield Number(n);
      let nr = 10n * (r - n * t);
      n = (10n * (3n * q + r)) / t - 10n * n;
      q = 10n * q;
      r = nr;
    } else {
      let nr = (2n * q + r) * l;
      let nn = (q * (7n * k) + 2n + r * l) / (t * l);
      q = q * k;
      t = t * l;
      l = l + 2n;
      k = k + 1n;
      n = nn;
      r = nr;
    }
  }
}

const generator = generarPi();
const cache = [];

self.onmessage = function(e) {
  const { inicio, cantidad, id } = e.data;
  const result = [];
  for (let i = 0; i < cantidad; i++) {
    const pos = inicio + i;
    while (cache.length <= pos) {
      cache.push(generator.next().value.toString());
    }
    result.push(cache[pos]);
  }
  self.postMessage({ id, inicio, digitos: result });
};
