# v3.36 — cambiar grupos en una rutina programada

Corrige el pedido [#10](https://github.com/janoalimentibel-design/kinex/issues/10).
Al cambiar grupos, la aplicación conservaba `programmed` de la rutina anterior.
El selector filtraba esa lista por los grupos nuevos y podía devolver cero
ejercicios, ocultando las tarjetas y sus botones para agregar ejercicios.

El cambio de grupos, modo, formato o grupo extra ahora invalida la lista fijada
y su título. Conserva los tildes, la foto del historial, métricas y registros por
serie existentes. También hay una recuperación de visualización para borradores
que quedaron incoherentes en versiones anteriores.

Los ocho selectores de grupo son botones accesibles con estado seleccionado.

Verificación: 61 pruebas unitarias y 13 pruebas de navegador, incluida una nueva
regresión móvil que carga la rutina publicada, marca dominadas, cambia a
pecho/tríceps, recarga, cambia a formato Largo y comprueba que la dominada sigue
registrada en Historial. La rutina de esta semana no cambia de contenido.
