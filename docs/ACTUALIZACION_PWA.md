# Actualización de KINEX instalada

## Corrección del 26 de octubre de 2026

La versión publicada es v3.43. La configuración autoUpdate activa el service worker nuevo, pero el registro generado no recarga el documento React ya abierto. Una app instalada puede continuar mostrando su interfaz anterior hasta volver a cargarla.

El shell ahora comprueba actualizaciones al arrancar, volver a primer plano, enfocar la ventana o recuperar internet. Cuando cambia un controlador existente muestra «Actualización lista» y «Recargar KINEX». No recarga automáticamente durante un entrenamiento, no elimina cachés ni cambia IndexedDB. Primera instalación y fallos de red no anuncian actualizaciones falsas.

Las versiones antiguas que todavía no recibieron este código necesitan cerrarse por completo y abrirse con internet; una primera apertura puede descargar el nuevo shell y una segunda mostrarlo. No borrar la app ni los datos de Safari para actualizar. Abrir otro navegador no demuestra que el almacenamiento de la app instalada esté actualizado.

## Referencias técnicas

- [Vite PWA: comprobaciones del service worker](https://vite-pwa-org.netlify.app/guide/periodic-sw-updates)
- [MDN: controllerchange](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/controllerchange_event)

## Verificación

Producción comprobada con HTML y bundle del despliegue d20128a: versión v3.43. 107 pruebas unitarias, build y smoke offline aprobados. Actualización real del worker: 2/2 casos en Chromium y 2/2 en WebKit aprobados. La prueba E2E usa dos generaciones ficticias de shell sobre el build real para comprobar cambio de service worker, aviso, ausencia de recarga automática y conservación de datos ficticios; no representa una inspección del iPhone del usuario.
