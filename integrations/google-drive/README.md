# Conexión personal (pendiente de activar y verificar)

Crear un proyecto de Apps Script propio con Code.gs y appsscript.json. Configurar
KINEX_TOKEN en Propiedades del script con 32 bytes aleatorios expresados en hex.
No guardar esa clave en Git, documentación, capturas ni parámetros de una URL.
Implementar como aplicación web ejecutada por el propietario, accesible para
cualquiera: el endpoint autentica cada POST con la clave. Autorizar únicamente
los scopes del manifiesto: archivos creados por la aplicación y solicitudes HTTP.
Los archivos no se comparten públicamente. No usar DriveApp ni permisos globales.

En KINEX → Plan, introducir como código personal un JSON con endpoint (URL /exec
del despliegue) y token. Al pulsar Conectar se autoriza el envío del historial,
plan y perfil. La clave se almacena en IndexedDB, fuera de respaldos/exportaciones.
Cada nueva conexión crea una copia independiente; no hay importación automática.
Desconectar detiene próximos envíos, no revoca un envío ya recibido ni borra Drive.
Para revocar la clave del servidor, cambiar KINEX_TOKEN o retirar el despliegue.

Antes de considerar activo: probar POST desde el origen real de Pages (incluidas
redirecciones y CORS), verificar un archivo privado con datos de prueba, buscarlo
y leerlo por el conector de Drive, conectar el teléfono y confirmar su primer
envío. Las pruebas locales no demuestran que Google permita el flujo desplegado.
Si CORS impide confirmar respuestas, no usar no-cors ni marcarlo sincronizado.
La sincronización funciona con la app abierta; no garantiza envíos en segundo
plano ni una revisión automática por un entrenador. Las recomendaciones requieren
consultar la copia más reciente y confirmar las indicaciones clínicas.
