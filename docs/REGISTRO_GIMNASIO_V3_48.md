# Tiempo, calorías y estado de envío v3.48

## Registro

`gymMinutes` es opcional y representa el tiempo total de estancia en el gimnasio,
incluidos bici y descansos. Se registra manualmente: los objetivos de las fichas y
los temporizadores de descanso no se convierten en minutos realizados.

El tiempo aeróbico sigue siendo la suma de actividades introducidas. No se suma al
tiempo del gimnasio, pues puede estar incluido en él. Las calorías de entrenamiento
conservan la opción de incluir el aeróbico para evitar duplicar el total del día.
Un campo vacío se mantiene sin registrar; un cero explícito se conserva.

Historial permite consultar semana actual, mes actual o todo hasta hoy. Presenta
los tiempos y calorías registrados por separado y señala la cobertura de los datos.
Los campos nuevos viajan en backups y en el envío privado; los backups anteriores
siguen siendo válidos y no reciben duraciones inventadas.

## Guardado y envío

Con Drive conectado, los cambios guardados de un día nuevo pueden producir una
primera copia automática aunque todavía falten las calorías o el tiempo del reloj.
Completar los ejercicios no completa esos campos. El formulario sin guardar es un
borrador y no forma parte de la copia enviada.

Si se añaden kcal o minutos después de un envío confirmado, al guardar quedan en el
dispositivo pendientes de envío. El estado junto al formulario lo indica y permite
Enviar cambios. La confirmación actualiza la copia existente; no crea otro día.
Cancelar o un fallo de red conserva los datos locales y la copia remota previa.
El estado Enviado se deriva de la última respuesta confirmada y de la coincidencia
con los datos actuales del día, nunca de un texto de éxito anterior.

El aviso de entrenamiento completado ofrece revisar la actividad y calorías antes
de enviar manualmente. Se mantiene el comportamiento de sincronización automática
existente, sin un nuevo aviso global al abrir la app.
