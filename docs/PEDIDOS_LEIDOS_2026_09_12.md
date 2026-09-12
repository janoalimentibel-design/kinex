# Pedidos de GitHub leídos — 12/09/2026

Lectura de los 8 Issues (abiertos) del repositorio y de la lista de comentarios de Issues (vacía). No se publicaron respuestas ni se cerraron Issues. El lote v3.34 cubre imágenes, no implementa los pedidos de planificación siguientes.

## Último pedido

- [#8, 11/09/2026](https://github.com/janoalimentibel-design/kinex/issues/8): se repite press banca plano en la semana; se pide una planificación integral y que los cambios manuales de músculos reorganicen los otros días.
- [#7, 04/09/2026](https://github.com/janoalimentibel-design/kinex/issues/7): cubrir todos los grupos antes de repetir los trabajados; ejemplo pecho+bíceps en vez de espalda+bíceps; adaptar los demás días al editar.

## Contexto anterior leído

- #6: ampliar Core al elegir Extendido y poder agregar ejercicios manualmente.
- #5: espalda repetida con los mismos ejercicios.
- #4: nueva semana para retomar entrenamiento.
- #3: evitar grupos repetidos consecutivamente tras cambios manuales.
- #2: no sugerir dominadas asistidas con banda.
- #1: reconstrucción incorrecta de días antiguos después de importar un backup.

## Qué información llega realmente

Los Issues #7 y #8 incluyen nombre de semana, focos, contador «Sesiones guardadas: 0» y fecha de envío; no incluyen sesiones, ejercicios hechos, cargas ni días concretos. El componente `src/components/Requests.tsx` construye ese texto y abre el formulario de GitHub. No sincroniza el historial del móvil con GitHub.

No inferir que el usuario no entrenó a partir de ese cero. No afirmar que se estudiaron sus sesiones personales usando estos mensajes. Para una revisión personalizada haría falta el backup o un resumen del dispositivo que contiene los entrenamientos, con autorización para compartirlo; no adjuntarlo automáticamente a un repositorio público.

## Siguiente revisión funcional (pendiente)

Reproducir #8 sobre el plan generado, comprobar la diferencia entre sesiones realizadas y días solamente planificados, y probar que editar un grupo reequilibra únicamente los días futuros no realizados. Proteger historial y prioridades semanales existentes. No declarar los ocho Issues resueltos por completar las imágenes.
