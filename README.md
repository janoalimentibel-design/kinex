# KINEX A3 — app completa (v3.5.0)

App personal mobile-first de entrenamiento: fuerza, control y movimiento. PWA instalable y 100% offline, con la UX y estética oscura/neón heredadas de A2.8 y compatibilidad total de datos.

**Codex u otra IA: comenzar obligatoriamente por `START_HERE_CODEX.md`** (la única tarea pendiente son las imágenes de ejercicios; todo lo demás está terminado).

**App en producción:** https://janoalimentibel-design.github.io/kinex/
(en el teléfono: abrir la URL → "Añadir a pantalla de inicio" → funciona sin conexión)

Funcionalidades: sesiones por grupos/formato/modo, biblioteca de 132 ejercicios con fichas técnicas específicas, marcar cada ejercicio como hecho con un toque, temporizador de descanso, progresiones/regresiones manuales, historial con gráficos de lumbar/rodilla, calendario mensual y racha, plan semanal y export/import de backups (v0/v1/v2).

**Referencia estable congelada:** `../KINEX_A2.8_Batch2_finalizado/` (no modificar).
**Modelo de datos y migraciones:** `docs/DATA_MODEL.md`.

## Ejecutar

```bash
npm install
npm run dev        # http://localhost:5173/
```

## Tests y build

```bash
npm test              # Vitest: migración v0→v1, bootstrap, contratos de A2.6/A2.8
npm run test:e2e      # Playwright: flujos completos en 390×844 (requiere build previo)
npm run check:assets  # duplicados por hash y fases faltantes
npm run build         # tsc --noEmit + vite build + service worker → dist/
npm run images        # regenera WebP desde assets-src/ (originales archivados)
```

Cada push a `main` corre tests + chequeo de assets y despliega a GitHub Pages.

## Datos

- IndexedDB (Dexie) con `schemaVersion: 2`; validación Zod estricta; las bases v1
  del dispositivo se elevan solas con `db.version(2).upgrade()`.
- Al primer arranque migra automáticamente los datos de A2.x desde la clave
  `localStorage` heredada (`kinex_A2_6_pullups_corregidas`), en **solo-lectura**:
  los datos originales de A2.8 nunca se tocan.
- Backups: exporta JSON v2 con sobre versionado; importa v2, v1 **y** v0
  (A2.6/A2.7/A2.8) en cadena, con vista previa antes de reemplazar.

## Estructura

```
src/
├── main.tsx            entrada
├── styles.css          estética oscura/neón heredada de A2.8
├── data/               catálogo de 81 ejercicios + mapa de imágenes (código, no DB)
├── db/                 schema Zod, Dexie, migración v0→v1, backups, bootstrap
├── logic/              lógica pura de sesiones (portada 1:1 de A2.8)
└── components/         las cuatro vistas + sheets
public/assets/          fotografías por ejercicio y fase
tests/                  Vitest (migración, bootstrap, contratos)
```
