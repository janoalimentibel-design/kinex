# START HERE — KINEX para Claude Code

## Instrucción principal

Estás trabajando dentro de la carpeta raíz de **KINEX A2.8 — Batch 2 finalizado**.

Esta carpeta es el paquete canónico y autosuficiente del proyecto. No dependas de conversaciones anteriores, archivos de Downloads ni versiones A1/A2.6/A2.7 externas. Todo lo necesario para entender el estado actual está aquí.

Antes de modificar código:

1. Lee este archivo completo.
2. Lee `INFORME_COMPLETO.md` completo.
3. Lee `VERIFICACION.md` completo.
4. Lee `README.md` completo.
5. Inspecciona `index.html`.
6. Inspecciona todos los archivos de `src/`.
7. Inspecciona `tests/kinex.test.js`.
8. Revisa la estructura de `assets/exercises/`.
9. Ejecuta `npm test`.
10. No modifiques nada hasta poder resumir correctamente el estado, la arquitectura y los riesgos.

Si algún archivo mencionado no existe, detente e informa exactamente cuál falta. No inventes su contenido ni busques una versión anterior fuera de esta carpeta.

## Qué es KINEX

KINEX es una app personal mobile-first de entrenamiento, fuerza, control y movimiento. Está enfocada en:

- recuperación y control lumbar;
- estabilidad de la rodilla derecha;
- regreso progresivo a escalada y pádel;
- entrenamiento con dominadas, flexiones, bandas, calistenia, máquinas y poleas;
- selección de sesiones según tiempo y material;
- registro de dolor, energía, notas e historial.

No debe transformarse visualmente en una app médica. Su estética actual oscura/neón y su UX fitness deben conservarse.

La app no diagnostica ni sustituye indicaciones médicas o de fisioterapia.

## Estado canónico

Versión actual: **KINEX A2.8 — Batch 2 finalizado**.

No continúes desde A1, A2.6 ni A2.7. Esas versiones son antecedentes. El código vigente está únicamente en esta carpeta A2.8.

Estado funcional:

- 81 ejercicios.
- 7 grupos: Piernas, Espalda, Pecho, Hombro, Bíceps, Tríceps y Core.
- Tabs: Hoy, Biblioteca, Historial y Plan.
- Formatos: Base, Extendido y Largo.
- Modos: Con peso, Sin peso y Mixto.
- Cambio y agregado de ejercicios.
- Checks y progreso de sesión.
- Registro de lumbar antes/después, rodilla, energía y notas.
- Exportación e importación JSON.
- Persistencia local mediante `localStorage`.
- 18 fotografías para 6 ejercicios.
- 6 tests automáticos pasando al cerrar este paquete.

## Batches de imágenes terminados

### Batch 1

- Flexiones.
- Dominadas estrictas.
- Step-Up bajo.

### Batch 2

- Dead Bug.
- Bird Dog.
- Wall Sit.

Cada ejercicio integrado tiene tres assets externos:

- Inicio.
- Medio.
- Final.

Las imágenes están en `assets/exercises/<ejercicio>/` y sus rutas se registran en `src/data/images.js`.

Problema histórico importante: anteriormente se entregaron fases repetidas o casi idénticas. Nunca agregues un nuevo batch sin abrir la app y comprobar visualmente en móvil que Inicio, Medio y Final muestran posiciones distintas y técnicamente coherentes.

## Archivos que contienen el proyecto

### Aplicación

- `index.html`: estructura principal y entrada de la app.
- `src/styles.css`: diseño visual completo.
- `src/app.js`: comportamiento principal, render y eventos.
- `src/session.js`: utilidades de sesión.
- `src/storage.js`: persistencia local.
- `src/data/exercises.js`: catálogo completo de 81 ejercicios, grupos y formatos.
- `src/data/images.js`: mapa de imágenes por ejercicio y fase.
- `src/ui/media.js`: componentes de thumbnails y galerías.

### Calidad y contexto

- `tests/kinex.test.js`: tests existentes.
- `INFORME_COMPLETO.md`: historia, análisis técnico, deuda y roadmap.
- `VERIFICACION.md`: checklist y evidencias de revisión.
- `README.md`: ejecución rápida.
- `verification/`: capturas móviles de los ejercicios con imágenes.

### Assets

- `assets/exercises/`: imágenes utilizadas por la aplicación.

No existe un backend. No existen secretos ni API keys requeridas. La aplicación actual es local-first y funciona sin una cuenta.

## Cómo ejecutar

No abras `index.html` directamente con `file://`, porque utiliza módulos ES.

Desde la carpeta que contiene el directorio del proyecto, levanta un servidor HTTP. Si ya estás dentro de la raíz A2.8 puedes usar:

```bash
python3 -m http.server 4173
```

Luego abre:

```text
http://127.0.0.1:4173/
```

Si el servidor se inicia desde la carpeta superior `outputs`, abre:

```text
http://127.0.0.1:4173/KINEX_A2.8_Batch2_finalizado/
```

## Cómo ejecutar tests

Dentro de la raíz del proyecto:

```bash
npm test
```

Resultado esperado del paquete entregado:

```text
6 tests passing
```

También valida sintaxis con:

```bash
node --check src/app.js
```

## Compatibilidad de datos

La app mantiene deliberadamente la clave de `localStorage` heredada de A2.6 para no perder datos existentes.

No cambies la clave, el formato del backup ni la estructura de las sesiones sin:

1. introducir `schemaVersion`;
2. crear una migración;
3. mantener importación de backups anteriores;
4. añadir tests de migración.

Los datos del usuario son más importantes que una refactorización limpia.

## Restricciones de producto

No cambies sin aprobación explícita:

- nombre KINEX;
- subtítulo “Fuerza · control · movimiento”;
- estética oscura/neón;
- navegación Hoy/Biblioteca/Historial/Plan;
- siete grupos visibles;
- formatos Base/Extendido/Largo;
- modos Con peso/Sin peso/Mixto;
- regla de dos grupos por sesión;
- compatibilidad de backups;
- disponibilidad manual de ejercicios avanzados;
- exclusión de ejercicios avanzados en sugerencias automáticas iniciales.

## Reglas de las imágenes

Para cada ejercicio nuevo:

1. Crear exactamente tres fases: Inicio, Medio y Final.
2. Usar fotos limpias sin texto, flechas, flyers ni marcas de agua.
3. Mantener persona, ropa, fondo, luz y encuadre coherentes.
4. No reutilizar un mismo archivo para dos fases.
5. No aceptar fases casi idénticas aunque tengan hashes diferentes.
6. Comprobar técnica y anatomía.
7. Integrar como archivos en `assets/exercises/`, nunca como base64.
8. Registrar rutas en `src/data/images.js`.
9. Añadir test de existencia y rutas distintas.
10. Abrir la galería real a aproximadamente 390 × 844 px.
11. Guardar captura en `verification/`.
12. No declarar un batch finalizado hasta completar esta revisión.

## Deuda técnica conocida

No interpretes A2.8 como producto terminado. Los problemas principales están documentados en `INFORME_COMPLETO.md` y son:

- `src/app.js` concentra demasiadas responsabilidades.
- Se conservan handlers inline y funciones expuestas en `window`.
- Hay HTML generado mediante strings.
- Algunos valores del usuario requieren sanitización antes de publicar.
- `localStorage` debe migrar a IndexedDB para una app robusta.
- Los backups no tienen `schemaVersion` formal.
- Faltan tests de navegador para flujos completos.
- Faltan accesibilidad, PWA, service worker y despliegue.
- Las imágenes PNG son pesadas y deben optimizarse.
- Muchas fichas de ejercicios todavía usan instrucciones técnicas genéricas.
- El motor de sugerencias aún no incorpora toda la información de dolor, fatiga, RPE/RIR y progresión.

## Dirección recomendada

Antes de seguir agregando muchos batches, profesionaliza la base:

1. Congela A2.8 como referencia estable.
2. Crea una nueva rama o carpeta de migración.
3. Migra a Vite + TypeScript + React.
4. Conserva exactamente la UX y los datos actuales durante la migración.
5. Usa IndexedDB/Dexie y validación Zod.
6. Añade `schemaVersion` y migraciones de backups.
7. Convierte la app en PWA offline.
8. Añade Vitest, Testing Library y Playwright.
9. Optimiza imágenes a WebP/AVIF y thumbnails.
10. Continúa Batch 3 sobre la nueva base profesional.

Esta recomendación no autoriza por sí sola una reescritura destructiva. Primero presenta un plan de migración, identifica riesgos y demuestra compatibilidad con los backups.

## Qué debe hacer Claude Code al recibir esta carpeta

Primera respuesta esperada, antes de editar:

1. Confirmar que leyó los cuatro documentos principales.
2. Enumerar los archivos de código encontrados.
3. Confirmar que detectó 81 ejercicios y 6 ejercicios con imágenes completas.
4. Informar el resultado de `npm test`.
5. Resumir en qué estado está KINEX.
6. Explicar qué trabajo propone y qué archivos tocaría.
7. Señalar cualquier discrepancia encontrada.

No debe responder únicamente “entendido”. Debe demostrar que inspeccionó realmente el paquete.

## Fuente de verdad y resolución de contradicciones

Si hay una contradicción:

1. El código ejecutable de A2.8 define lo que funciona actualmente.
2. Este archivo define cómo iniciar y qué preservar.
3. `INFORME_COMPLETO.md` define el contexto y roadmap.
4. `VERIFICACION.md` define qué fue comprobado.
5. `README.md` ofrece solo instrucciones breves.

No uses conversaciones externas como fuente de verdad si contradicen este paquete.

## Definición de terminado para cualquier cambio futuro

Un cambio solo está terminado cuando:

- el código está integrado;
- los datos anteriores siguen siendo compatibles;
- los tests existentes pasan;
- se añadieron tests para la nueva conducta;
- la app fue abierta y revisada en viewport móvil;
- no hay errores de consola ni texto `undefined`;
- se actualizó la documentación relevante;
- se entregó un nuevo ZIP completo y versionado;
- la versión estable anterior sigue disponible.

