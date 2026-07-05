# KINEX — informe completo del proyecto

**Corte:** KINEX A2.8 — Batch 2 finalizado  
**Fecha del corte:** 2026-07-05  
**Propósito:** dejar un estado completo, ejecutable y comprensible antes de comenzar Batch 3.

## 1. Resumen ejecutivo

KINEX nació como una app personal mobile-first para entrenamiento, fuerza, control y movilidad. No busca ser una rutina genérica de gimnasio: debe ayudar a entrenar con criterio alrededor de una zona lumbar sensible, una rodilla derecha inestable y un regreso progresivo a escalada y pádel.

El proyecto comenzó como un único HTML grande con CSS, datos, lógica e imágenes base64 embebidas. Ese prototipo ya incluía la experiencia principal, pero era difícil de mantener y las imágenes de los movimientos se repetían o mostraban fases ambiguas.

El estado A2.8 conserva la experiencia visual oscura/neón y la funcionalidad existente, pero separa:

- HTML;
- estilos;
- catálogo de ejercicios;
- rutas de imágenes;
- lógica básica de sesiones;
- almacenamiento;
- componentes visuales de las galerías;
- tests;
- assets físicos por ejercicio y fase.

Hoy la app es un prototipo funcional local y usable. Todavía no es una aplicación de producción: necesita una capa más sólida de datos, seguridad, accesibilidad, progresión de entrenamiento, PWA, tests de interacción y despliegue.

## 2. Contexto de origen

### Objetivo del usuario

- Recuperar y mantener fuerza sin convertir la app en una interfaz médica.
- Proteger la zona lumbar y mejorar la estabilidad de la rodilla.
- Volver gradualmente a escalada y pádel.
- Priorizar dominadas, flexiones, bandas, calistenia, poleas y máquinas sencillas.
- Tener sesiones cortas o largas según el tiempo disponible.
- Registrar molestias y evolución sin depender de una cuenta o servicio externo.

### Condicionantes considerados

- Espondilólisis bilateral L5 y cambios discales leves descritos en el handoff.
- Ausencia reportada de síntomas radiculares actuales.
- Rodilla derecha inestable, sin identificación precisa del ligamento afectado.
- Evitar que saltos, impacto, cambios bruscos o variantes avanzadas aparezcan automáticamente al inicio.

KINEX no diagnostica ni sustituye una indicación médica o fisioterapéutica. La lógica de seguridad actual es todavía orientativa; una versión profesional debe hacer configurables las reglas acordadas con profesionales.

## 3. De dónde partimos

El paquete original contenía:

- `kinex_fase_A1_prototipo.html`: base funcional sin imágenes.
- `kinex_A2_4_verificada_imagenes.html`: primera integración estable de fotografías.
- `kinex_A2_5_imagenes_mejoradas.html`: intento con mejores secuencias.
- `kinex_A2_6_pullups_corregidas.html`: base elegida para continuar; dominadas aceptadas.
- handoff detallado y prompt de continuidad.

Problemas principales de A2.6:

- Flexiones: Inicio y Final eran el mismo archivo; Medio casi no mostraba recorrido.
- Step-Up: Medio y Final eran exactamente el mismo archivo.
- El HTML contenía imágenes base64 y superaba ampliamente el tamaño razonable para mantenimiento.
- Toda la aplicación estaba concentrada en un único documento.
- Las entregas anteriores no siempre habían sido abiertas y comprobadas visualmente.

## 4. Evolución realizada

### A2.7 — Batch 1

Ejercicios:

- Flexiones.
- Dominadas estrictas.
- Step-Up bajo.

Trabajo realizado:

- Se extrajeron los assets base64 existentes.
- Se conservaron las dominadas aceptadas.
- Se regeneraron las fases defectuosas de flexiones y Step-Up.
- Se separaron todos los assets del código.
- Se modularizó la aplicación.
- Se añadieron tests básicos y capturas de verificación.

### A2.8 — Batch 2

Ejercicios elegidos por utilidad para los objetivos del proyecto:

- Dead Bug: control lumbar y anti-extensión.
- Bird Dog: control lumbopélvico y coordinación contralateral.
- Wall Sit: tolerancia de cuádriceps y rodilla sin impacto.

Se generaron tres fases por ejercicio:

- Inicio.
- Medio o transición.
- Final.

Durante la revisión se detectó que Dead Bug Medio y Final se leían demasiado parecidos en la tarjeta móvil. La fase Media se volvió a generar con brazo a mitad del arco y rodilla todavía flexionada. Wall Sit Medio también se rehízo como descenso superficial para evitar que se confundiera con el final profundo.

## 5. Estado funcional actual

### Navegación

- Hoy.
- Biblioteca.
- Historial.
- Plan.

### Biblioteca

- 81 ejercicios totales.
- Piernas: 15.
- Espalda: 12.
- Pecho: 10.
- Hombro: 10.
- Bíceps: 10.
- Tríceps: 10.
- Core: 14.
- Buscador por nombre, grupo, tags y nivel.
- Filtros por grupo y avanzados.
- Alta local de ejercicios personalizados.
- Detalle con series, repeticiones, descanso, objetivo y claves técnicas.
- Regla que impide agregar al día un ejercicio de un grupo no activo.

### Sesión del día

- Dos grupos activos.
- Cambio manual de grupos.
- Combinaciones rápidas.
- Cambio y agregado de ejercicios.
- Checks de ejercicios completados.
- Barra de progreso.

Formatos:

- Base: 4 ejercicios, 20–25 minutos.
- Extendido: 5 ejercicios, 30–35 minutos; el extra pertenece a uno de los dos grupos activos.
- Largo: 6 ejercicios automáticos más opcionales, 40–50 minutos.

Modos:

- Con peso.
- Sin peso.
- Mixto.

### Historial

Al guardar una sesión registra:

- dolor lumbar antes y después;
- molestia de rodilla;
- energía;
- notas;
- formato, modo, grupos y ejercicios;
- volumen semanal aproximado por grupo.

### Plan

- Semana.
- Foco principal y secundario.
- Objetivo.
- Regla personal.
- Notas.
- Resumen semanal copiable.

### Datos

- Persistencia local mediante `localStorage`.
- Exportación a JSON.
- Importación de backups.
- Se mantiene la clave de almacenamiento de A2.6 para preservar compatibilidad con los datos existentes del navegador.

## 6. Fotografías integradas

Batch 1:

- Flexiones: 3 assets.
- Dominadas estrictas: 3 assets.
- Step-Up bajo: 3 assets.

Batch 2:

- Dead Bug: 3 assets.
- Bird Dog: 3 assets.
- Wall Sit: 3 assets.

Total: 18 fotografías externas organizadas por ejercicio.

La generación se realizó con la herramienta integrada de imágenes, usando prompts separados por fase y referencias visuales para mantener persona, ropa, gimnasio, iluminación y encuadre. No se usó texto, flyer, flechas ni marcas de agua dentro de las imágenes.

## 7. Código completo y estructura

```text
KINEX_A2.8_Batch2_finalizado/
├── index.html
├── package.json
├── README.md
├── INFORME_COMPLETO.md
├── VERIFICACION.md
├── src/
│   ├── app.js
│   ├── session.js
│   ├── storage.js
│   ├── styles.css
│   ├── data/
│   │   ├── exercises.js
│   │   └── images.js
│   └── ui/
│       └── media.js
├── tests/
│   └── kinex.test.js
├── assets/
│   └── exercises/
│       ├── pushup/
│       ├── pullup/
│       ├── step-up-bajo/
│       ├── dead-bug/
│       ├── bird-dog/
│       └── wall-sit/
└── verification/
```

### Responsabilidad de cada archivo

- `index.html`: estructura de las cuatro vistas, navegación y modal.
- `src/styles.css`: diseño mobile-first oscuro/neón y componentes visuales.
- `src/data/exercises.js`: grupos, 81 ejercicios, formatos, iconos y combinaciones.
- `src/data/images.js`: mapa ejercicio → thumbnail → Inicio/Medio/Final.
- `src/session.js`: utilidades puras para fechas, compatibilidad de modo y sesión inicial.
- `src/storage.js`: lectura y escritura local.
- `src/ui/media.js`: thumbnail, fase y galería de imágenes.
- `src/app.js`: estado de interfaz y comportamiento funcional heredado del prototipo.
- `tests/kinex.test.js`: contratos básicos de estructura, formatos, modos y assets.

No hay código oculto ni dependencia de un backend. El ZIP incluye el código completo y todos los assets.

## 8. Cómo ejecutar

La app usa módulos ES; debe servirse por HTTP local y no abrirse directamente como `file://`.

Desde la carpeta que contiene el proyecto:

```bash
python3 -m http.server 4173
```

Abrir:

```text
http://127.0.0.1:4173/outputs/KINEX_A2.8_Batch2_finalizado/
```

Tests:

```bash
cd outputs/KINEX_A2.8_Batch2_finalizado
npm test
```

Estado del corte: 6/6 tests correctos y sintaxis de `app.js` válida.

## 9. Qué está bien resuelto

- Identidad visual coherente y mobile-first.
- Flujo diario comprensible.
- Biblioteca amplia con categorías fitness visibles y tags internos.
- Tres formatos y tres modos.
- Selección manual sin eliminar ejercicios avanzados de la biblioteca.
- Registro simple de molestias y energía.
- Backup portable en JSON.
- Separación de assets y código.
- Primer pipeline repetible de imágenes por fase.
- Conservación de datos locales de versiones anteriores.

## 10. Qué sigue siendo prototipo

### Arquitectura

`app.js` todavía concentra demasiadas responsabilidades y conserva HTML generado como strings e handlers inline. Para mantener compatibilidad rápida se exponen funciones en `window`. Esto funciona, pero no es una arquitectura ideal para crecer.

### Datos

`localStorage` tiene capacidad limitada, no maneja migraciones estructuradas y no ofrece transacciones. No existe `schemaVersion` real en los backups.

### Seguridad

Algunos valores escritos por el usuario se interpolan en HTML. Antes de publicar la app debe eliminarse ese patrón o sanearse estrictamente para evitar inyección de HTML.

### Entrenamiento

La selección automática actual se basa principalmente en grupo, modo, nivel y frecuencia reciente. Todavía no aplica de forma completa:

- dolor actual;
- tolerancia de rodilla;
- dolor posterior de sesiones previas;
- fatiga;
- RPE/RIR;
- progresión semanal;
- equipo disponible;
- contraindicaciones personalizadas.

### Técnica y contenido

La mayoría de los ejercicios conserva claves técnicas genéricas del prototipo. Deben revisarse uno a uno. Tener 81 nombres no equivale a tener 81 fichas profesionales.

### Imágenes

Los PNG generados son pesados. La carpeta ocupa aproximadamente 24 MB y los assets 23 MB. Para producción deben convertirse a WebP/AVIF, generar thumbnails y usar carga diferida.

### Calidad

Los tests actuales son de contrato y existencia. Faltan tests reales de navegador para:

- completar una sesión;
- guardar y recargar historial;
- exportar e importar;
- cambiar grupos y ejercicios;
- ejercicios personalizados;
- migraciones de datos;
- accesibilidad por teclado y lector de pantalla.

### Producto

No hay autenticación, sincronización, instalación PWA, notificaciones, temporizador, seguimiento de series/repeticiones reales ni gráficos de progreso.

## 11. Arquitectura recomendada para profesionalizar

Para una app personal local-first con posibilidad de crecer:

### Frontend

- Vite.
- TypeScript estricto.
- React para componentes y estado de interfaz.
- React Router para vistas.
- Zustand o Context reducido para estado temporal.
- CSS Modules o una capa de tokens CSS conservando la estética actual.

No es obligatorio usar React, pero en este proyecto ayuda a eliminar handlers globales, strings HTML y actualizaciones manuales del DOM.

### Datos locales

- IndexedDB mediante Dexie.
- Zod para validar sesiones, ejercicios y backups.
- Campo `schemaVersion`.
- Migraciones explícitas de versión.
- Exportación JSON legible y restauración con vista previa.

### PWA

- Manifest.
- Service worker con Workbox.
- Funcionamiento offline completo.
- Instalación en pantalla de inicio.
- Estrategia de actualización que no borre datos.

### Calidad

- Vitest para lógica.
- Testing Library para componentes.
- Playwright para flujos completos.
- ESLint y Prettier.
- CI en GitHub Actions.
- Lighthouse para rendimiento, accesibilidad y PWA.

### Assets

- Originales archivados fuera del bundle público.
- WebP/AVIF responsive.
- Thumbnail pequeño para Biblioteca.
- Imagen mediana para galería.
- `loading="lazy"` y dimensiones explícitas para evitar saltos de layout.
- Script que detecte hashes duplicados y fases faltantes.

## 12. Funciones que harían KINEX mucho más útil

### Prioridad alta

1. Onboarding con equipo disponible, experiencia, restricciones y reglas personales.
2. Check-in antes de entrenar: lumbar, rodilla, energía, sueño y tiempo disponible.
3. Motor de sugerencias que use el check-in y el historial.
4. Registro por serie: repeticiones, tiempo, carga, RPE/RIR y dolor durante el ejercicio.
5. Temporizador de descanso integrado.
6. Progresiones y regresiones enlazadas por ejercicio.
7. PWA offline instalable.
8. Backup versionado y restauración segura.

### Prioridad media

1. Calendario mensual y rachas sin gamificación agresiva.
2. Gráficos de volumen, dolor y tolerancia.
3. Favoritos y ejercicios bloqueados.
4. Inventario de material disponible por ubicación.
5. Sesiones predefinidas: recuperación, fuerza, escalada, pádel y poco tiempo.
6. Recordatorios locales configurables.
7. Notas por ejercicio y vídeo propio opcional.

### Prioridad posterior

1. Sincronización cifrada entre dispositivos.
2. Cuenta opcional, no obligatoria.
3. Compartir resumen con fisioterapeuta o entrenador.
4. Integración con HealthKit/Google Health Connect si aporta valor real.

## 13. Reglas de seguridad recomendadas

Las reglas deben ser configurables y explicar por qué modifican una sesión. Ejemplos iniciales, pendientes de validación profesional:

- Si dolor lumbar o rodilla supera el umbral personal, reducir dificultad y evitar impacto.
- Si aparece dolor irradiado, bloqueo, inestabilidad marcada o empeoramiento inusual, detener la sesión y mostrar una recomendación prudente de consulta.
- No sugerir automáticamente ejercicios avanzados hasta cumplir criterios de tolerancia definidos.
- No aumentar simultáneamente carga, volumen y dificultad.
- Registrar síntomas después de la sesión y usar esa respuesta en la próxima sugerencia.

La app debe evitar lenguaje diagnóstico y presentar estas reglas como apoyo a decisiones personales/profesionales.

## 14. Roadmap concreto

### Etapa 0 — congelar A2.8

- Guardar este ZIP como referencia estable.
- No modificarlo directamente.
- Crear un repositorio Git para la siguiente etapa.

### Etapa 1 — base profesional

- Migrar a Vite + TypeScript + React.
- Reproducir exactamente las cuatro vistas.
- Añadir IndexedDB, Zod y migraciones.
- Importar backups actuales.
- Añadir PWA y tests de flujos críticos.

### Etapa 2 — contenido fiable

- Revisar las 81 fichas.
- Definir progresiones/regresiones.
- Completar batches de imágenes con aprobación visual.
- Comprimir assets y automatizar validaciones.

### Etapa 3 — inteligencia de sesión

- Check-in diario.
- Reglas de dolor/tolerancia.
- Progresión de carga y volumen.
- RPE/RIR y recuperación.

### Etapa 4 — uso diario pulido

- Temporizadores.
- Instalación PWA.
- Notificaciones locales.
- Gráficos y resúmenes.
- Pruebas en iPhone y Android reales.

### Etapa 5 — sincronización opcional

- Backend solo si la necesidad aparece.
- Datos cifrados y exportables.
- La app debe seguir funcionando offline.

## 15. Próximo paso recomendado

No seguiría agregando fotografías indefinidamente sobre la arquitectura actual. El corte más eficiente es:

1. conservar A2.8 como prototipo estable;
2. crear la base profesional con TypeScript, componentes, IndexedDB y PWA;
3. continuar Batch 3 sobre esa base;
4. migrar progresivamente el resto del contenido.

Así el trabajo visual nuevo entra directamente en la aplicación que se utilizará a diario y no vuelve a quedar atrapado en una estructura transitoria.

## 16. Criterio de “usable al máximo”

KINEX estará realmente lista para uso diario cuando:

- abra instantáneamente y funcione offline;
- no pierda datos al actualizar;
- adapte la sesión al estado del día;
- registre lo realizado, no solo lo sugerido;
- explique los cambios de dificultad;
- tenga fichas técnicas revisadas;
- sea accesible y cómoda con una mano;
- tenga tests de los flujos críticos;
- permita exportar todos los datos en cualquier momento;
- no dependa de una conexión ni de una suscripción para lo esencial.

Este A2.8 es una base visual y funcional valiosa. El siguiente salto importante no es “más pantallas”, sino convertir sus buenas decisiones de producto en una arquitectura robusta, local-first y verificable.
