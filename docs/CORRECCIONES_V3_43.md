# KINEX v3.43

## Correcciones

- #16: una sola extensión de cuádriceps elegible (accesorio de banco). El identificador anterior sigue disponible para interpretar el historial.
- #17: se retira la ficha de banco horizontal de las selecciones nuevas. Se incorporan crunch corto en banco inclinado, variante con brazos al frente y sostén isométrico. Las imágenes representan el tipo de banco observado; no certifican su ángulo, dimensiones o ajuste exactos.
- Gemelos de pie con apoyo, sin requerir máquina de gemelos.
- Catálogo: 150 fichas, con 596 archivos de imagen referenciados y 149 carpetas físicas de fases. El sostén isométrico muestra una sola posición compartida.

## Semana 26 de octubre–1 de noviembre de 2026

| Día | Grupos | Ejercicios |
|---|---|---|
| Lunes 26 | Pecho y tríceps | Press inclinado, pec deck, flexiones, polea con cuerda, patada con apoyo |
| Martes 27 | Espalda y bíceps | Dominadas, remo con pecho apoyado, pull-apart, curl inclinado, martillo |
| Jueves 29 | Pierna y hombro | Extensión en banco, puente de glúteos, gemelos con apoyo, press y elevaciones laterales |
| Sábado 31 | Pierna y core | Rumano, tibialis, Bird Dog, plancha lateral, Pallof, crunch inclinado condicional |

Miércoles, viernes y domingo: recuperación. No se fijan kilos ni se aumentan automáticamente las cargas. La flexión en banco depende de tolerancia e indicaciones individuales; sin carga externa, recorrido corto, omitir si molesta o no está indicada.

La carga de la semana es atómica, idempotente y conserva historial, sesiones empezadas, selecciones manuales (incluso vacías), programas previos y perfil. Abrir el próximo día salta sesiones explícitamente vacías. El calendario muestra la semana de la fecha abierta y el Plan refleja las selecciones actuales.

## Imágenes

Generación mediante imagegen; originales en assets-src y WebP en public/assets. Prompts completos y decisiones de revisión:

- assets-src/exercises/decline-bench-crunch-v343/generation.md
- assets-src/exercises/decline-bench-reach-v343/generation.md
- assets-src/exercises/standing-calf-raise-v343/generation.md

## Validación

98 pruebas unitarias aprobadas; build y check:assets aprobados. Suite Chromium: 120 aprobadas, una omitida de backup privado y una expectativa de catálogo corregida y comprobada en una repetición de las dos pruebas de zoom. 16 pruebas WebKit aprobadas (rutina, edición, catálogo, seguimiento y zoom). Revisión visual del calendario, carga de rutina y cuatro sesiones programadas. La publicación ejecuta nuevamente la suite completa en CI.

Los datos personales, diagnóstico, historial y archivos de conexión permanecen fuera del repositorio público.
