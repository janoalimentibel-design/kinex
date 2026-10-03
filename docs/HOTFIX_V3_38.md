# KINEX v3.38 — edición, historial y guardado

## Fallos corregidos

- Cambiar un ejercicio utiliza el ID visible y reemplaza una única posición.
  Los reemplazos sucesivos no acumulan ejercicios ni apuntan a un ID antiguo.
- Quitar del día está disponible para cualquier ejercicio, incluidos los
  automáticos y programados. Quitar el último deja la lista vacía; el selector
  no vuelve a rellenarla al marcar, navegar ni recargar.
- Las selecciones explícitas admiten ejercicios de cualquier grupo o modo.
  Las variantes y la biblioteca usan la misma operación de edición.
- Los días históricos muestran todos los ejercicios registrados aunque el
  campo de grupos haya quedado desactualizado. También se muestran los IDs
  históricos que ya no están en el catálogo.
- Marcar/desmarcar congela la lista visible y se procesa en una cola de
  transacciones, leyendo la base actual para no perder toques rápidos o
  cambios de otra pestaña. Un fallo revierte la operación completa.
- Guardar métricas conserva los registros existentes; no sustituye el
  historial por una lista nueva. Los días con datos pero sin actividad
  marcada pueden abrirse desde Historial, diferenciados de entrenamientos.
- Cambiar grupos/formato/modo pide explícitamente otra sugerencia y conserva
  la actividad anterior en Historial. Las elecciones manuales no se cambian
  por el reequilibrio automático.
- Cardio solo admite Extendido sin acceder a un segundo grupo inexistente.
  Calendario y etiquetas usan fechas locales. Pedidos tolera fallos de
  almacenamiento/portapapeles y no roba el foco desde una pestaña oculta.

## Versiones locales y compatibilidad

IndexedDB añade un almacén de revisiones en una actualización aditiva. Cada
cambio de sesión conserva el estado anterior y los ejercicios personalizados
necesarios en la misma transacción. La importación también conserva las
sesiones previas antes de reemplazarlas. «Deshacer / versiones del día» permite
inspeccionar y restaurar una copia sin reemplazar otros días. El estado que
se sustituye al restaurar también queda guardado.

Los backups v0/v1/v2 siguen admitidos. Los campos selectedExercises y
manuallyEdited se incluyen en el backup v2. El archivo exportado contiene
el estado actual; las revisiones permanecen en el dispositivo.

Las revisiones comienzan con esta versión. No recuperan datos eliminados
antes de su instalación. No se ha inspeccionado la base real del teléfono:
el caso del lunes se verifica con registros sintéticos de pecho/bíceps y
no se presenta como recuperación confirmada del entrenamiento del usuario.

## Verificación

Se revisaron Hoy, Biblioteca, Historial/calendario, Plan, Pedidos, los diálogos,
la persistencia, importación/exportación, migración y service worker. Pruebas
nuevas cubren reemplazos sucesivos, eliminación total, agregado posterior,
toques rápidos, edición de días antiguos, restauración y recarga, grupos
cruzados, cardio Extendido, borradores y selección manual en backups.

Las pruebas de navegador pasan a ser requisito previo al despliegue junto
con las unitarias, la comprobación de assets y el build. La prueba adicional
que requiere un backup privado sigue siendo opcional; ningún dato privado
se añade al repositorio.
