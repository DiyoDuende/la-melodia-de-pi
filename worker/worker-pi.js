// worker-pi.js con buffer circular (sin fuga de memoria)
const MAX_CACHE = 10000;
let cache = new Array(MAX_CACHE);
let cacheStart = 0;
let cacheEnd = 0;

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

self.onmessage = (e) => {
  const { inicio, cantidad, id } = e.data;
  const result = [];
  for (let i = 0; i < cantidad; i++) {
    const pos = inicio + i;
    while (pos >= cacheEnd) {
      const newDigit = generator.next().value.toString();
      cache[cacheEnd % MAX_CACHE] = newDigit;
      cacheEnd++;
      if (cacheEnd - cacheStart > MAX_CACHE) cacheStart++;
    }
    if (pos < cacheStart) result.push('?');
    else result.push(cache[pos % MAX_CACHE]);
  }
  self.postMessage({ id, inicio, digitos: result });
};
