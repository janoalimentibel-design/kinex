# KINEX v3.44 · Banco abdominal y alcance del historial

## Problema

Las fotos v3.43 del crunch inclinado apenas cambiaban la posición del tronco. El inicio ya parecía una contracción y el ángulo oblicuo ocultaba la separación entre hombros y colchoneta. La variante con brazos al frente tenía el mismo problema; el sostén reutilizaba el final del crunch. Que dos archivos tengan hashes distintos no demuestra que expliquen un movimiento.

## Criterio visual

Dos fotogramas útiles en cada crunch: perfil lateral, espalda alta apoyada al empezar y hombros separados al contraer, conservando pelvis apoyada y sin convertirlo en una incorporación completa. El sostén tiene una foto propia y una instrucción de mantener, sin inventar fases dinámicas. Los nuevos assets declaran sus fotogramas en frames.json para no generar fases intermedias redundantes.

Originales y prompts exactos generados con la herramienta imagegen incorporada:

- assets-src/exercises/decline-bench-crunch-v344/generation.md
- assets-src/exercises/decline-bench-reach-v344/generation.md
- assets-src/exercises/decline-bench-hold-v344/generation.md

WebP de consumo: public/assets/exercises/ con los mismos tres directorios. Las fotos son representaciones del tipo de banco, no una certificación clínica ni una réplica dimensional.

## Qué significa semana revisada

La semana publicada en routineOct26.ts tiene una lista explícita de fechas, grupos y ejercicios. Se preparó como revisión puntual y respeta actividad y elecciones existentes. No es un algoritmo de progresión acumulada de cargas.

Las sugerencias generales de session.ts sí cuentan usos anteriores y última fecha de ejercicios para rotarlos; grupos y reequilibrio consideran distribución semanal y vecinos del calendario. Esa frecuencia no equivale a volumen de entrenamiento medido en series y kilos.

Las dosis visibles vienen de las fichas del catálogo. La interfaz actual no captura kilos, repeticiones efectivamente realizadas ni esfuerzo por serie. El esquema admite conservar esos datos importados por compatibilidad, pero el selector no utiliza esos números para ajustar cargas. Por eso no corresponde atribuir su ausencia a que el usuario no los haya anotado.

La pantalla Plan aclara este alcance. Esta publicación conserva rutina, historial, preferencias y formato de backups; no cambia las cargas ni añade automáticamente variantes al entrenamiento.

## Validación

Cinco originales y versiones a tamaño de teléfono revisados por el principal, interfaz y pruebas. 108 pruebas unitarias, build y check:assets aprobados. Doce escenarios relevantes en Chromium y doce en WebKit aprobados (galerías, zoom y carga de rutina). El control del sostén muestra Tiempo para su dosis en segundos. La publicación vuelve a ejecutar la suite completa en CI.
