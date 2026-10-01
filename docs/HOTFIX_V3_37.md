# KINEX v3.37 — grupos consecutivos

Issue revisado: #12; antecedentes #3, #7 y #8.

La rutina publicada fijaba pecho el jueves 1 de octubre, mientras el selector
libre del miércoles ignoraba las reservas del jueves. El selector tampoco
protegía la frontera domingo/lunes. Los borradores guardados no se
reevaluaban al cambiar otro día.

El selector excluye grupos de ambos días contiguos (grupos seleccionados y
actividad real, incluidas sustituciones). La revisión al abrir, importar o
editar repara conflictos en días pendientes, regenerando ejercicios y título.
Mantiene el día editado y no cambia fechas pasadas, días con actividad ni cardio.
Los cambios derivados de una edición se guardan junto a ella en una transacción.

La revisión utiliza el historial local del dispositivo. No supone acceso al
historial del móvil desde GitHub ni implementa sincronización remota. No se
incluyen backups privados. La variedad semanal solicitada en #11 y la
planificación integral de cobertura siguen siendo trabajos distintos; este
hotfix no afirma resolver todos los pedidos abiertos.

Verificación: regresiones del miércoles/jueves publicado, cambio de semana,
reparación de borradores existentes, cambios manuales, conservación de actividad,
ejercicios personalizados y persistencia tras recargar en viewport móvil.
