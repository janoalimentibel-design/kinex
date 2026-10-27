# Revisión móvil v3.47

## Problemas corregidos

- Una conexión antigua con envíos previos, pero sin comparación por día, se
  interpretaba como si todas las fechas hubieran cambiado. El inicio mostraba un
  aviso extenso que desplazaba el entrenamiento.
- El control nativo de fecha podía superar su espacio en Safari y solaparse con
  la flecha siguiente. Las flechas de texto dependían de la tipografía del sistema.
- El selector de apariencia ocupaba una segunda fila permanente en el teléfono.

## Comportamiento

Hoy no muestra el aviso de reenvío al abrir. La protección de la copia privada se
mantiene: las modificaciones de registros ya enviados requieren confirmación al
pulsar Enviar datos. Una conexión antigua sin comparación confirmada pide permiso
para actualizar la copia anterior en su primer envío manual; no inventa fechas
modificadas ni declara un envío exitoso antes de la respuesta de Drive.

Las comparaciones separan los registros realizados de los cambios de planificación
y normalizan el orden de los campos. Los fallos y cancelaciones mantienen los datos
locales y la copia remota anterior.

La cabecera usa un botón de apariencia que abre las tres opciones existentes.
La navegación semanal emplea controles de tamaño definido, iconos SVG y un campo
nativo de fecha contenido en su columna. Los días se pueden recorrer con teclado.
Los controles usan tipografía del sistema, áreas táctiles adecuadas y colores para
ambos temas; se contemplan zonas seguras y orientación horizontal.

## Validación

Datos ficticios, incluida una conexión antigua con cincuenta sesiones. Pruebas de
arranque, recarga, evento online, edición, cancelación, error y reintento de envío.
Revisión de rectángulos de controles y pulsaciones, además del ancho de la página.
Pruebas a 320, 390 y 430 px, orientación horizontal y texto ampliado, con Chromium
y WebKit. Revisión visual de Hoy, Biblioteca, Historial, Plan y Pedidos.

WebKit automatizado comprueba el motor y la distribución; no equivale a una prueba
manual en un iPhone físico. No se incluyeron datos personales ni capturas del usuario
en el repositorio.

El recorrido completo en Chromium incluye uso sin conexión. La comprobación adicional
sin conexión en WebKit automatizado encontró un error interno del navegador al
recargar; no se presenta ese caso como aprobado ni como una reproducción de fallo
en un iPhone físico.
