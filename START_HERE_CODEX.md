# START HERE — KINEX para Codex

## Instrucción principal

Estás trabajando en la carpeta raíz de **KINEX A3 v3.5.0 — app completa, en producción**.

Esta carpeta es el paquete canónico y autosuficiente. Todo el software está terminado
y verificado. **Tu única tarea es agregar las imágenes de los ejercicios** siguiendo el
pipeline y las reglas de este documento. No reescribas, no refactorices y no "mejores"
nada que no se te pida: la app funciona, tiene 46 tests unitarios y 21 E2E en verde, y
está desplegada en producción.

- **Producción:** https://janoalimentibel-design.github.io/kinex/
- **Repositorio:** https://github.com/janoalimentibel-design/kinex (push a `main` = deploy automático)
- **Referencia estable congelada:** `../KINEX_A2.8_Batch2_finalizado/` (nunca modificar)

Antes de tocar nada, leé completos: este archivo, `README.md`, `docs/DATA_MODEL.md`
y `docs/IMAGENES_ROADMAP.md`. Después ejecutá `npm install && npm test` y confirmá
46/46 antes de empezar.

## Qué es KINEX

App personal mobile-first de entrenamiento (fuerza, control, movimiento) para un
usuario con espondilólisis bilateral L5, rodilla derecha inestable y regreso progresivo
a escalada y pádel. Estética oscura/neón. **No es una app médica: sugiere y explica,
nunca diagnostica ni bloquea.** PWA instalable, 100% offline, datos solo en el
dispositivo (IndexedDB), backups JSON portables.

## Estado: TODO terminado excepto imágenes

| Fase | Contenido | Estado |
|---|---|---|
| 0 | A2.8 congelada como referencia + repo git | ✔ |
| 1 | Migración a Vite + TypeScript + React + Dexie + Zod; esquema v1 con migración v0→v1; las 4 vistas idénticas a A2.8 | ✔ |
| 2 | Imágenes WebP (23 MB→840 KB), PWA offline instalable, Playwright E2E, deploy GitHub Pages | ✔ |
| 3 | Esquema v2: check-in diario, registro por serie (reps/kg/RPE), temporizador de descanso | ✔ |
| 4 | Gráficos lumbar/rodilla, sesiones por semana, calendario mensual, racha semanal | ✔ |
| Contenido | Las 81 fichas con técnica específica (4 cues + 3 errores cada una) | ✔ |
| 5 | Progresiones/regresiones enlazadas + motor de sugerencias (check-in, dolor previo, RPE) | ✔ |
| **Imágenes** | **6 de 81 ejercicios con fotos. FALTAN 75 (225 imágenes)** | **← TU TAREA** |

## Comandos

```bash
npm install
npm run dev           # http://localhost:5173/
npm test              # Vitest — deben pasar 46/46
npm run build         # tsc estricto + vite build + service worker
npm run test:e2e      # Playwright 390×844 contra el build (requiere build previo)
npm run images        # regenera WebP desde assets-src/ ← usarás esto
npm run check:assets  # duplicados por hash y fases faltantes ← y esto
```

Cada push a `main` corre tests + check de assets y despliega. Si `deploy-pages` falla
con "Deployment failed, try again later" es transitorio: `gh run rerun <id> --failed`.

## Arquitectura (no tocar salvo lo indicado)

```
src/
├── main.tsx               entrada React
├── styles.css             estética oscura/neón (clases legacy; los SVG usan prefijo ch-)
├── data/
│   ├── exercises.ts       catálogo de 81 ejercicios + GROUPS/FORMATS/COMBOS + PROGRESSIONS
│   └── images.ts          mapa ejercicio → thumb + 3 fases  ← EDITARÁS ESTO
├── db/                    schema Zod (v1/v2), Dexie, migraciones v0→v1→v2, backups, bootstrap
├── logic/
│   ├── session.ts         armado de sesión (puro)
│   ├── stats.ts           racha, series de métricas, calendario (puro)
│   └── engine.ts          motor de sugerencias (puro)
└── components/            App, Today, Library, History, PlanView, sheets, SetLogger, RestTimer, Calendar, charts
public/assets/exercises/   WebP servidos por la app (GENERADOS, no editar a mano)
assets-src/exercises/      originales PNG/JPG archivados  ← PONDRÁS LOS ORIGINALES ACÁ
scripts/                   optimize-images.mjs · check-assets.mjs · gen-icons.mjs
tests/                     46 tests Vitest
e2e/                       21 tests Playwright  ← AGREGARÁS ejercicios a galerias.spec.ts
verification/              capturas móviles de evidencia por batch
docs/                      DATA_MODEL.md · IMAGENES_ROADMAP.md
```

## Datos y compatibilidad (crítico — no romper)

- IndexedDB `kinex` con `schemaVersion: 2`. La clave localStorage legacy
  `kinex_A2_6_pullups_corregidas` es **solo-lectura** (migración única).
- Los backups importan en cadena v0→v1→v2 para siempre. Cualquier cambio de estructura
  exige: nueva versión de esquema + migración pura + tests + `db.version(n).upgrade()`.
  **Para agregar imágenes NO se toca nada de esto.**
- Los datos del usuario valen más que cualquier refactor.

## Restricciones de producto (sin aprobación explícita del usuario, NO cambiar)

Nombre KINEX y subtítulo; estética oscura/neón; navegación Hoy/Biblioteca/Historial/Plan;
los 7 grupos; formatos Base/Extendido/Largo; modos Con peso/Sin peso/Mixto; regla de 2
grupos por sesión; compatibilidad de backups; ejercicios avanzados disponibles solo
manualmente; el motor sugiere y explica, jamás bloquea.

---

# TU TAREA: las imágenes (Batches 3 en adelante)

## Estado y contexto histórico

6 ejercicios tienen fotos (Batch 1: Flexiones `pushup`, Dominadas estrictas `pullup`,
Step-Up bajo `step-up-bajo` · Batch 2: Dead Bug `dead-bug`, Bird Dog `bird-dog`,
Wall Sit `wall-sit`). **El fallo histórico del proyecto (A2.6) fue generar imágenes en
masa sin revisión: fases repetidas o casi idénticas.** Desde entonces ningún batch se
declara terminado sin verificación visual en móvil. Además, un piloto con un generador
económico falló porque forzaba encuadre frontal: **de frente, las fases de un ejercicio
no se distinguen**. Las fotos deben ser de perfil o ¾, como las existentes.

## Reglas de cada imagen (obligatorias, sin excepción)

1. **Misma persona, ropa, gimnasio, iluminación y encuadre** que las fotos existentes.
   Usá como referencia visual los originales en `assets-src/exercises/` (hombre de pelo
   oscuro corto y barba recortada, remera negra lisa SIN logos, short gris oscuro,
   zapatillas negras de suela blanca; gimnasio oscuro con piso de goma negro,
   kettlebells y rack de mancuernas de fondo).
2. Exactamente **tres fases por ejercicio: Inicio, Medio y Final, claramente distintas**
   y técnicamente correctas. Si dos fases se leen parecidas en una tarjeta de celular,
   regenerá sin discutir.
3. **Vista de perfil o ¾** (nunca frontal), cámara a la altura del gesto.
4. Foto limpia: **sin texto, flechas, logos, marcas de agua, collages ni errores
   anatómicos** (contar dedos, articulaciones, dirección de rodillas).
5. Formato vertical ≈ 3:4 o 4:5 (las existentes son 640×799 y 1536×2048).
6. **Nunca base64. Nunca el mismo archivo para dos fases.** El chequeo de hashes
   (`npm run check:assets`) lo detecta, pero hashes distintos no garantizan fases
   visualmente distintas: la revisión con ojos es tuya.

## Pipeline de integración por ejercicio (paso a paso exacto)

Ejemplo con Flexiones con rodillas (`knee_pushup`, slug `flexiones-rodillas`):

1. Colocá los originales:
   `assets-src/exercises/flexiones-rodillas/inicio.png` (o .jpg), `medio.png`, `final.png`
2. `npm run images` → genera `public/assets/exercises/flexiones-rodillas/{inicio,medio,final,thumb}.webp`
3. Agregá la entrada en `src/data/images.ts` (rutas LITERALES, el checker las parsea):
   ```ts
   knee_pushup: {
     thumb: './assets/exercises/flexiones-rodillas/thumb.webp',
     phases: {
       Inicio: './assets/exercises/flexiones-rodillas/inicio.webp',
       Medio: './assets/exercises/flexiones-rodillas/medio.webp',
       Final: './assets/exercises/flexiones-rodillas/final.webp',
     },
   },
   ```
   La clave es el **id del catálogo** (`src/data/exercises.ts`), el slug es la carpeta.
4. `npm run check:assets` → debe decir OK sin duplicados.
5. Agregá el ejercicio a la lista `GALLERIES` de `e2e/galerias.spec.ts`:
   `['Flexiones con rodillas', 'flexiones-rodillas'],`
6. `npm test && npm run build && npm run test:e2e` → todo verde. El test de galería
   guarda automáticamente la captura de evidencia en `verification/a3-fase2/`.
7. **Revisión visual**: `npm run dev`, viewport 390×844, abrí la galería del ejercicio
   en Biblioteca y confirmá que Inicio/Medio/Final se distinguen de un vistazo.
8. Commit descriptivo + push (el deploy es automático). Un batch se declara terminado
   solo cuando TODOS sus ejercicios pasaron los pasos 4–7.

## Batch 3 — los 18 prioritarios (aparecen en las sesiones automáticas)

Formato: **id del catálogo** · slug de carpeta sugerido · descripción de las 3 fases.

1. **`balance_1`** · `balance-una-pierna` — I: de pie, ambos pies apoyados, brazos a los costados. M: una rodilla elevándose, peso pasando al pie de apoyo. F: equilibrio estable sobre una pierna, rodilla libre flexionada al frente.
2. **`leg_ext`** · `extension-cuadriceps` — I: sentado en la máquina, rodillas flexionadas 90°, tobillos tras el rodillo. M: piernas extendiéndose a mitad de recorrido. F: rodillas extendidas casi por completo, cuádriceps contraído.
3. **`calf_machine`** · `gemelos-maquina` — I: de pie en la máquina, talones abajo del escalón (estiramiento). M: talones a media elevación. F: en puntas de pie, elevación máxima.
4. **`active_hang`** · `active-hang` — I: colgado pasivo de la barra, hombros junto a las orejas. M: escápulas comenzando a deprimirse, cuello alargándose. F: hang activo, hombros abajo y pecho apenas afuera, codos siempre estirados.
5. **`band_pulldown`** · `band-lat-pulldown` — I: de rodillas o de pie, brazos arriba agarrando la banda anclada en alto. M: codos bajando hacia el torso a mitad de recorrido. F: codos junto al cuerpo, banda a la altura del pecho, omóplatos abajo.
6. **`pull_apart_back`** · `band-pull-apart-espalda` — I: brazos extendidos al frente a la altura de hombros, banda tensa entre las manos. M: banda abriéndose a medio recorrido. F: brazos en cruz, banda tocando el pecho, omóplatos juntos.
7. **`pull_apart_h`** · `band-pull-apart-hombro` — mismas tres fases que el anterior pero con encuadre levemente distinto (más cerrado sobre los hombros) para que los archivos NO sean casi iguales entre sí; el checker de hashes compara todo el set global.
8. **`knee_pushup`** · `flexiones-rodillas` — I: plancha con rodillas apoyadas y tobillos cruzados en alto, brazos extendidos. M: codos a 90°, pecho a media bajada. F: pecho cerca del piso, codos muy flexionados.
9. **`incline_pushup`** · `flexiones-inclinadas` — I: manos sobre un cajón/banco firme, cuerpo en línea inclinada, brazos extendidos. M: pecho bajando hacia el borde. F: pecho casi tocando el apoyo.
10. **`face_pull_h`** · `face-pull` — I: brazos extendidos al frente sujetando la banda anclada a la altura de la cara. M: codos abriéndose altos, manos acercándose. F: manos a los lados de la cara, codos altos, omóplatos juntos.
11. **`band_sh_press`** · `press-hombro-banda` — I: banda pisada, manos a la altura de los hombros. M: brazos a media extensión vertical. F: brazos extendidos arriba, costillas abajo sin arquear.
12. **`curl_band`** · `curl-banda` — I: de pie sobre la banda, brazos extendidos abajo. M: codos flexionados a 90°. F: manos arriba cerca de los hombros, bíceps contraído.
13. **`alt_curl_band`** · `curl-alterno-banda` — I: ambos brazos abajo con banda tensa. M: UN brazo a 90° y el otro abajo (la asimetría es la clave visual). F: ese brazo arriba completo, el otro sigue abajo.
14. **`short_curl`** · `curl-corto` — I: brazos abajo con banda liviana. M: codos a 90° con ambas manos subiendo. F: contracción arriba; diferénciese de `curl_band` por ángulo de cámara o posición en el gimnasio.
15. **`tri_ext_band`** · `extension-triceps-banda` — I: banda anclada arriba, codos pegados al cuerpo flexionados. M: antebrazos a media extensión hacia abajo. F: brazos extendidos abajo del todo, tríceps contraído.
16. **`tri_uni`** · `extension-triceps-unilateral` — I: un solo brazo flexionado contra la banda, el otro al costado. M: media extensión. F: brazo extendido completo (unilateral bien visible).
17. **`tri_iso`** · `isometrico-triceps` — isométrico: las fases se diferencian por encuadre y tensión — I: posición armada a 90° sin tensión visible. M: empujando contra la resistencia (banda deformada, antebrazo marcado). F: mismo ángulo con máxima tensión visible y expresión de esfuerzo contenido. Si no se logran 3 lecturas claras, consultar al usuario antes de integrar.
18. **`farmer`** · `farmer-carry` — I: de pie con mochila cargada a un costado, tomándola del piso ya erguido. M: caminando, un pie adelante en pleno paso. F: paso siguiente con la otra pierna, torso perfectamente vertical (la progresión del paso es la clave visual).

## Después del Batch 3

- **Batch 4 (~18):** el resto de los ejercicios que aparecen en selección automática.
- **Batches 5–7 (~13 c/u):** los de biblioteca, agrupados por grupo muscular.
- La lista completa de los 75 sin foto se obtiene con: los ids de `CATALOG` que no
  están en `REAL_IMAGES` (`src/data/images.ts`). Ver `docs/IMAGENES_ROADMAP.md`.
- Ojo con los pares duplicados de nombre (`pull_apart_back`/`pull_apart_h`,
  `close_band`/`band_close_press`, `diamond_reg`/`diamond_tri`, `face_pull`/`face_pull_h`):
  son ejercicios distintos en grupos distintos; cada uno necesita su set de archivos
  propio y visualmente diferenciado (el checker de hashes falla si reusás archivos).

## Definición de terminado (para cualquier batch)

- Originales en `assets-src/` y WebP generados con `npm run images`.
- Entradas en `images.ts` + ejercicios sumados a `e2e/galerias.spec.ts`.
- `npm test` + `npm run check:assets` + `npm run test:e2e` todo verde.
- Revisión visual en 390×844: tres fases distinguibles de un vistazo, cero errores de consola.
- Capturas de evidencia en `verification/`.
- Commit + push con deploy verde y comprobación de que producción sirve el bundle nuevo
  (`curl -s https://janoalimentibel-design.github.io/kinex/ | grep index-`).
- La app instalada como PWA puede requerir una segunda apertura para actualizarse: es normal.

## Qué NO hacer nunca

- No tocar `src/db/` ni el esquema de datos (las imágenes no lo necesitan).
- No usar base64 ni URLs externas para imágenes.
- No editar `public/assets/` a mano (se regenera desde `assets-src/`).
- No declarar un batch terminado "porque los archivos existen".
- No cambiar estética, navegación, grupos, formatos ni modos.
- No buscar versiones viejas (A1/A2.x) fuera de `../KINEX_A2.8_Batch2_finalizado/`.
