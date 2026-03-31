* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: #0a0c10;
  color: #eef3f9;
  font-family: 'Inter', 'Courier New', monospace;
  line-height: 1.5;
  padding: 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  border: 2px solid #2a3a4a;
  padding: 30px;
}

/* HEADER */
.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 20px;
}

.logo {
  font-size: 1.5rem;
  letter-spacing: 2px;
  color: #b0c9e8;
  font-weight: 300;
}

/* CUENTA ATRÁS */
.countdown-grande {
  text-align: center;
  margin: 40px 0;
  padding: 30px;
  background: #0f141c;
  border: 1px solid #2a3a4a;
}

.countdown-numeros {
  font-family: monospace;
  font-size: 3rem;
  color: #ffd966;
}

/* VIDEOS */
.videos {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.video-box {
  border: 2px solid #3a4a5a;
  background: #0f141c;
  aspect-ratio: 16/9;
}

/* PENTAGRAMA */
.pentagrama-section {
  border: 2px solid #3a4a5a;
  padding: 30px;
  margin: 30px 0;
  background: #0f141c;
}

.pentagrama-lineas {
  position: relative;
  height: 180px;
}

.linea {
  height: 2px;
  background: #3a4a5a;
  margin: 18px 0;
}

/* CONTENEDOR NOTAS */
.notas-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
}

/* CADA NOTA */
.nota {
  position: relative;
  width: 60px;
  height: 180px;
}

/* FIGURA MUSICAL */
.nota-simbolo {
  position: absolute;
  font-size: 2rem;
  left: 50%;
  transform: translateX(-50%);
  color: #b0c9e8;
}

.nota-simbolo.actual {
  color: #ffd966;
  transform: translateX(-50%) scale(1.2);
}

/* NOMBRE DE LA NOTA */
.nota-nombre {
  position: absolute;
  bottom: 30px;
  width: 100%;
  text-align: center;
  font-size: 0.9rem;
  color: #7f8fa3;
}

/* DÍGITO PI */
.nota-digito {
  position: absolute;
  bottom: 0;
  width: 100%;
  text-align: center;
  font-size: 1.2rem;
  font-family: monospace;
  color: #5f7faf;
}

.nota-digito.actual {
  color: #ffd966;
}

/* TIEMPO */
.tiempo-info {
  text-align: right;
  margin-top: 10px;
  color: #5f7faf;
}

/* RESPONSIVE */
@media (max-width: 700px) {
  .videos {
    grid-template-columns: 1fr;
  }
}
