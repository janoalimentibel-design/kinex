# KINEX v3.35 — entrega de rutina semanal

## Qué se publica

Rutina del 28 de septiembre al 4 de octubre de 2026, distribuida en lunes,
martes, jueves y sábado. Solo se incluye la propuesta de ejercicios; el backup
personal usado para revisarla no se copia al repositorio, al build ni a GitHub.

- Lunes: espalda + bíceps; dominada estricta, remo sentado, curl y martillo.
- Martes: piernas + hombros; hip thrust, extensión de cuádriceps, curl acostado,
  press con mancuernas y elevaciones laterales.
- Jueves: pecho + tríceps; press inclinado, pec deck, jalón con barra y extensión
  por encima de la cabeza.
- Sábado: piernas + cuatro ejercicios de core; prensa, gemelos, plancha,
  plancha lateral, reverse crunch y giros rusos.
- Remo ergómetro disponible como complemento opcional desde Plan. No se cuenta
  como sesión principal de espalda ni se agrega a todos los días.

No se infieren cargas, recuperación, lesiones ni progresión de peso a partir
de simples tildes. La propuesta no sustituye una valoración presencial.
Referencia de criterios generales: [ACSM 2026](https://acsm.org/resistance-training-guidelines-update-2026/).

## Entrega y protección de datos

`applyPublishedRoutine` solo se ejecuta durante esa semana y automáticamente
si existe actividad local de la semana anterior. Plan ofrece un botón explícito
para instalaciones vacías. La revisión queda identificada como
`2026-09-28-r1` para no reaplicarse en cada apertura.

Se mantienen idénticos todos los días anteriores y cualquier día ya iniciado
o guardado. Solo se reemplazan borradores no empezados de los cuatro días.
Las escrituras del arranque son una transacción de sesiones y plan, sin borrar
almacenes. El enlace y la base IndexedDB siguen siendo los mismos.

Los tildes ahora cuentan para sesiones, calendario, historial y selección de
ejercicios, aunque no se haya usado el formulario de guardar sesión. Los
ejercicios solamente propuestos no se cuentan como realizados. El historial
usa los nombres/IDs registrados, no una nueva selección automática.

## Verificación

Pruebas unitarias para entrega idempotente, fechas límite, conservación de
sesiones comenzadas, tildes sin guardar, desmarcado, cuatro ejercicios de core,
máquinas prioritarias y cambios manuales en rutinas programadas.

Prueba móvil opcional con `KINEX_PRIVATE_BACKUP`: el JSON se lee de una ruta
privada fuera del repositorio. Se compara cada registro anterior completo
antes/después, se revisan las tarjetas del lunes y se verifica persistencia
tras recargar. No guardar ese JSON como fixture público.

## Pendiente — no confundir con esta entrega

No existe sincronización privada ni revisión remota automática los lunes.
GitHub recibe código y pedidos, no el historial del teléfono.

La solución sin exportaciones semanales tiene dos piezas separadas:

1. Planificador local que consulte los tildes al abrir la app cada nueva semana
   y ajuste únicamente los días pendientes. No requiere enviar datos ni crear
   una cuenta; puede funcionar sin conexión. Debe explicar qué registros usó.
2. Si se autoriza la revisión remota: almacenamiento privado con autenticación
   y autorización por usuario, sincronización incremental, resolución de
   conflictos, estado visible de última sincronización y pruebas de restauración.
   Requiere configurar y conectar un servicio una sola vez. Nunca poner
   credenciales privilegiadas ni backups en el repositorio público.

Esta versión entrega la rutina específica solicitada y corrige el conteo.
No presentar esas dos piezas pendientes como implementadas.
