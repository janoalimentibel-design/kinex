# KINEX A3 — base profesional (Fase 1)

App personal mobile-first de entrenamiento: fuerza, control y movimiento. Migración de KINEX A2.8 a Vite + TypeScript + React + IndexedDB, conservando exactamente la UX, la estética oscura/neón y la compatibilidad de datos.

**Referencia estable congelada:** `../KINEX_A2.8_Batch2_finalizado/` (no modificar).
**Modelo de datos y migraciones:** `docs/DATA_MODEL.md`.

## Ejecutar

```bash
npm install
npm run dev        # http://localhost:5173/
```

## Tests y build

```bash
npm test           # Vitest: migración v0→v1, bootstrap, contratos de A2.6/A2.8
npm run build      # tsc --noEmit + vite build → dist/
```

## Datos

- IndexedDB (Dexie) con `schemaVersion: 1`; validación Zod estricta.
- Al primer arranque migra automáticamente los datos de A2.x desde la clave
  `localStorage` heredada (`kinex_A2_6_pullups_corregidas`), en **solo-lectura**:
  los datos originales de A2.8 nunca se tocan.
- Backups: exporta JSON v1 con sobre versionado; importa backups v1 **y** v0
  (A2.6/A2.7/A2.8) con vista previa antes de reemplazar.

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
