<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>README - La melodía de π</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0a0c10; color: #eef3f9; font-family: 'Inter', sans-serif; line-height: 1.6; padding: 40px 20px; }
        .container { max-width: 800px; margin: 0 auto; background: #0f141c; padding: 40px; border-radius: 12px; border: 1px solid #2a3a4a; }
        h1, h2 { color: #ffd966; margin-top: 1.5em; }
        h1 { text-align: center; margin-top: 0; }
        p, li { margin-bottom: 1em; color: #b0c9e8; }
        a { color: #ffd966; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .cita { font-style: italic; border-left: 3px solid #ffd966; padding-left: 20px; margin: 20px 0; color: #ffd966; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎵 La melodía de π</h1>
        <p style="text-align:center; margin-bottom: 30px;"><em>Una melodía infinita, tocada por personas finitas, unidas por un mismo pulso, en un mismo ahora.</em></p>

        <h2>✨ ¿Qué es esto?</h2>
        <p>"La melodía de π" es una obra musical colaborativa e infinita. Convertimos los dígitos decimales del número π en notas musicales y las reproducimos en tiempo real, una por segundo, las 24 horas del día, los 365 días del año. El proyecto arrancará el <strong>14 de marzo de 2027 a las 00:00 UTC</strong> (Día de Pi).</p>

        <h2>🎹 ¿Cómo funciona?</h2>
        <p>Los intérpretes se inscriben y se les asigna un turno de 5 minutos en orden de llegada. Durante su turno, tocan en vivo la secuencia de π que les corresponde, mientras la web emite la melodía global. El público puede ver en todo momento al intérprete actual y al siguiente en la cola.</p>

        <h2>🌍 ¿Quién puede participar?</h2>
        <p>Cualquier persona del mundo, sin límite de edad ni nivel musical. Solo necesitas un instrumento (o tu voz) y conexión a internet para transmitir tu video. La inscripción es gratuita.</p>

        <h2>🎼 ¿Qué debo tocar?</h2>
        <p>Cada dígito (0-9) se asigna a una nota musical: Do, Re, Mi, Fa, Sol, La, Si, y sus octavas. Recibirás por correo la partitura exacta de tus 300 notas (5 minutos × 60 segundos) antes de tu turno.</p>

        <h2>⚙️ Tecnología</h2>
        <p>La web genera los dígitos de π sobre la marcha con un algoritmo spigot infinito. El sonido se sintetiza con Soundfont Player (piano acústico). Los turnos se gestionan con una cola FIFO y cada intérprete recibe un código único para conectar su video.</p>

        <div class="cita">
            "Una melodía infinita, tocada por personas finitas, unidas por un mismo pulso, en un mismo ahora."
        </div>

        <p>¿Tienes dudas? Escríbenos a <a href="mailto:info@melodiadepi.org">info@melodiadepi.org</a></p>
    </div>
</body>
</html>
