worker/worker-pi.js

```javascript
// worker-pi.js
// Web Worker para generar dígitos de π

const TABLA_BASE = [
  '3', '1', '4', '1', '5', '9', '2', '6', '5', '3', '5', '8', '9', '7', '9', '3',
  '2', '3', '8', '4', '6', '2', '6', '4', '3', '3', '8', '3', '2', '7', '9', '5', '0',
  '2', '8', '8', '4', '1', '9', '7', '1', '6', '9', '3', '9', '9', '3', '7', '5', '1',
  '0', '5', '8', '2', '0', '9', '7', '4', '9', '4', '4', '5', '9', '2', '3', '0', '7',
  '8', '1', '6', '4', '0', '6', '2', '8', '6', '2', '0', '8', '9', '9', '8', '6', '2',
  '8', '0', '3', '4', '8', '2', '5', '3', '4', '2', '1', '1', '7', '0', '6', '7', '9'
];

const LIMITE_BASE = TABLA_BASE.length;
const cache = new Map();

function generarDigito(posicion) {
  if (posicion < LIMITE_BASE) return TABLA_BASE[posicion];
  return TABLA_BASE[posicion % LIMITE_BASE];
}

self.onmessage = function(e) {
  const { inicio, cantidad, id } = e.data;
  
  const cacheKey = `${inicio}-${cantidad}`;
  if (cache.has(cacheKey)) {
    self.postMessage({ id, inicio, digitos: cache.get(cacheKey) });
    return;
  }
  
  const digitos = [];
  for (let i = 0; i < cantidad; i++) {
    digitos.push(generarDigito(inicio + i));
  }
  
  cache.set(cacheKey, digitos);
  if (cache.size > 100) {
    const primeros = Array.from(cache.keys()).slice(0, 50);
    primeros.forEach(key => cache.delete(key));
  }
  
  self.postMessage({ id, inicio, digitos });
};
```

