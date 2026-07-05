# KINEX — Diseño de datos y migraciones (Fase 1)

Estado: **aprobado e implementado** (`src/db/`; tests en `tests/`)
Fecha: 2026-07-05
Base analizada: código real de A2.8 (`src/storage.js`, `src/app.js`, `src/data/exercises.js`)

## 1. Principios de diseño

1. **Los datos del usuario valen más que la arquitectura.** Ninguna migración destruye la fuente original.
2. **Los valores de los enums no cambian jamás** (`pierna`, `espalda`, `peso`, `sinpeso`, `mix`, `base`, `ext`, `long`, `Inicial`, `Progresivo`, `Avanzado`). Solo se renombran *campos*. Así la migración es un mapeo puro de nombres, sin reinterpretación semántica.
3. **`localStorage` legacy es solo-lectura.** La app nueva lo lee una vez para migrar y nunca lo escribe ni lo borra. A2.8 congelada sigue funcionando intacta.
4. **Todo backup viejo importa para siempre.** Un JSON exportado por A2.6/A2.7/A2.8 (sin `schemaVersion`) se detecta como v0 y pasa por la misma función de migración que el `localStorage`.
5. **El catálogo de 81 ejercicios vive en código, no en la base.** Solo lo que crea el usuario (sesiones, ejercicios personalizados, plan) se persiste.

## 2. Formato actual (v0) — tal como existe hoy

Clave `localStorage`: `kinex_A2_6_pullups_corregidas`. Backup = volcado directo de esta estructura, sin sobre ni versión.

```js
{
  sessions: {
    "2026-07-05": {                    // clave = fecha ISO
      groups: ["pierna", "hombro"],    // siempre 2 grupos
      mode: "mix",                     // "peso" | "sinpeso" | "mix"
      format: "base",                  // "base" | "ext" | "long"
      extraTarget: "auto",             // "auto" | "g1" | "g2" — puede faltar
      done: { "wall_sit": true },      // checks por ejercicio
      repl: { "step_bajo": "leg_ext" },// reemplazos origen→nuevo — puede faltar
      extra: ["dead_bug"],             // agregados manuales — puede faltar
      saved: false,
      metrics: null | {
        lba: 2, lbd: 1,                // lumbar antes/después, 0–10
        knee: 0,                       // rodilla, 0–10
        energy: "media",               // "baja" | "media" | "alta"
        notes: "texto libre"
      }
    }
  },
  custom: {
    "u_abc123": {                      // clave = id generado
      id: "u_abc123",                  // ⚠ puede divergir de la clave (bug de doble Date.now())
      nm: "Remo en polea baja", g: "espalda",
      m: ["peso"],                     // ["peso"] | ["sinpeso"] | ["peso","sinpeso"]
      lvl: "Inicial", sets: "3", reps: "10–12", rest: "60s",
      tags: ["personal"], cues: [], errs: [], why: "notas personales"
    }
  },
  plan: { week: "Semana 1", focus: "Fuerza", secondary: "", objective: "", rule: "", notes: "" }
}
```

Debilidades conocidas de v0: sin versión, sin validación al importar, campos crípticos, campos opcionales implícitos, `sets/reps/rest` como strings libres, id de custom que puede divergir de su clave.

## 3. Esquema v1 (TypeScript + Zod)

Mismos datos, nombres claros, validación estricta. Los strings libres (`sets`, `reps`, `rest`) **se conservan como strings** en v1 — convertirlos a números estructurados es un cambio semántico que se reserva para v2 (registro por serie).

```ts
type GroupId  = 'pierna'|'espalda'|'pecho'|'hombro'|'bicep'|'tricep'|'core';
type Mode     = 'peso'|'sinpeso'|'mix';
type Format   = 'base'|'ext'|'long';
type Level    = 'Inicial'|'Progresivo'|'Avanzado';
type Energy   = 'baja'|'media'|'alta';

interface Session {
  date: string;                        // 'YYYY-MM-DD', clave primaria
  groups: [GroupId, GroupId];
  mode: Mode;
  format: Format;
  extraTarget: 'auto'|'g1'|'g2';       // default 'auto'
  completed: Record<string, boolean>;  // antes: done
  replacements: Record<string, string>;// antes: repl
  extras: string[];                    // antes: extra
  saved: boolean;
  metrics: SessionMetrics | null;
}

interface SessionMetrics {
  lumbarBefore: number;                // antes: lba — entero 0–10
  lumbarAfter: number;                 // antes: lbd — entero 0–10
  knee: number;                        // entero 0–10
  energy: Energy;
  notes: string;
}

interface CustomExercise {
  id: string;                          // clave primaria; se fuerza id === clave al migrar
  name: string;                        // antes: nm
  group: GroupId;                      // antes: g
  modes: Mode[];                       // antes: m — solo 'peso'/'sinpeso'
  level: Level;                        // antes: lvl
  sets: string; reps: string; rest: string;
  tags: string[]; cues: string[];
  errors: string[];                    // antes: errs
  notes: string;                       // antes: why
}

interface Plan {
  week: string; focus: string; secondary: string;
  objective: string; rule: string; notes: string;
}

interface Meta {
  schemaVersion: 1;
  migratedFrom: 'localStorage-v0' | 'backup-v0' | 'fresh' | 'backup-v1';
  migratedAt: string;                  // ISO datetime
}
```

Cada tipo tiene su esquema Zod equivalente. El parser v1 es **estricto** (rechaza lo inválido); el parser v0 es **tolerante** (aplica defaults documentados en §5).

## 4. Almacenamiento: Dexie (IndexedDB)

```ts
const db = new Dexie('kinex');
db.version(1).stores({
  sessions: 'date',          // Session, clave = fecha
  customExercises: 'id',     // CustomExercise
  kv: 'key',                 // { key: 'plan', value: Plan } y { key: 'meta', value: Meta }
});
```

- `plan` y `meta` van en una tabla clave-valor: son singletons, no merecen tabla propia.
- Los índices adicionales (p. ej. `saved` para historial) se agregan solo si el rendimiento lo pide; con datos de una persona, no hace falta de entrada.
- Futuras versiones de esquema usan `db.version(2).stores(...).upgrade(...)` de Dexie — encadenadas, nunca reemplazadas.

## 5. Migración v0 → v1

Una única función pura `migrateV0toV1(raw: unknown): { data: V1Data, warnings: string[] }`, usada por los **dos** caminos de entrada (localStorage e importación de backup). Puro = testeable sin navegador.

Mapeo de campos:

| v0 | v1 | Normalización defensiva |
|---|---|---|
| `sessions[fecha].done` | `completed` | default `{}` |
| `sessions[fecha].repl` | `replacements` | default `{}` |
| `sessions[fecha].extra` | `extras` | default `[]` |
| `sessions[fecha].extraTarget` | `extraTarget` | default `'auto'` |
| `metrics.lba` / `lbd` / `knee` | `lumbarBefore` / `lumbarAfter` / `knee` | coerción a número, redondeo, clamp 0–10; si no es coercible → 0 + warning |
| `metrics.energy` | `energy` | si no es `baja/media/alta` → `'media'` + warning |
| `metrics.notes` | `notes` | coerción a string, default `''` |
| `custom[clave].nm/g/m/lvl` | `name/group/modes/level` | — |
| `custom[clave].id` | `id` | **se impone `id = clave`** (corrige el bug de doble `Date.now()`); las referencias en sesiones usan la clave, así que nada se rompe |
| `custom[clave].errs/why` | `errors/notes` | defaults `[]` / `''` |
| `plan.*` | `plan.*` | defaults del objeto actual de `createDefaultDB()` |

Reglas ante datos anómalos:

- Clave de sesión que no es fecha `YYYY-MM-DD` válida → se descarta **con warning visible**, nunca en silencio.
- Sesión con menos/más de 2 grupos o grupo desconocido → se conserva lo salvable (fecha, metrics, saved) y se rellenan grupos con la combinación por defecto + warning. No se tira una sesión con métricas de dolor por un enum roto.
- Ejercicio custom con grupo/nivel inválido → se conserva con `level: 'Inicial'` y warning; solo se descarta si no tiene ni nombre.
- Referencias en `completed`/`replacements`/`extras` a ejercicios inexistentes → **se conservan tal cual** (v0 ya las tolera; limpiar es decisión del usuario, no de la migración).

La migración **nunca lanza excepción por datos sucios**: devuelve datos + warnings. Solo falla si el JSON no es parseable o no tiene `sessions` (mismo criterio mínimo que A2.8 actual).

## 6. Flujo de arranque de la app nueva

```
arranque
 ├─ ¿existe kv.meta en IndexedDB?
 │   ├─ sí → app normal (datos ya en v1)
 │   └─ no → ¿existe localStorage['kinex_A2_6_pullups_corregidas']?
 │        ├─ sí → migrateV0toV1 → escribir en Dexie
 │        │       → meta = { schemaVersion:1, migratedFrom:'localStorage-v0' }
 │        │       → mostrar aviso: "Datos migrados de la versión anterior (N sesiones)"
 │        │       → localStorage QUEDA INTACTO
 │        └─ no → base vacía, meta.migratedFrom = 'fresh'
```

**Advertencia asumida y visible para el usuario:** desde el momento de la migración, A2.8 (localStorage) y la app nueva (IndexedDB) divergen — lo que registres en una no aparece en la otra. La app nueva lo indica una sola vez tras migrar. El camino de vuelta siempre existe: exportar backup v1 no se pierde nunca, y A2.8 congelada conserva sus datos originales.

## 7. Formato de backup v1

```json
{
  "app": "KINEX",
  "schemaVersion": 1,
  "exportedAt": "2026-07-05T18:30:00.000Z",
  "data": {
    "sessions":  [ /* Session[] */ ],
    "customExercises": [ /* CustomExercise[] */ ],
    "plan": { /* Plan */ }
  }
}
```

Detección al importar:

| El JSON tiene… | Se interpreta como | Pipeline |
|---|---|---|
| `schemaVersion: 1` y `app: "KINEX"` | backup v1 | validación Zod estricta |
| sin `schemaVersion`, con `sessions` objeto | backup v0 (A2.6/A2.7/A2.8) | `migrateV0toV1` (misma función) |
| otra cosa | inválido | rechazo con mensaje claro, sin tocar datos |

La importación muestra **vista previa antes de reemplazar**: cuántas sesiones, rango de fechas, ejercicios personalizados, warnings de migración si los hay — y recién entonces pide confirmación. Igual que hoy, importar reemplaza (no fusiona); la fusión es una mejora futura explícita, no un cambio silencioso.

Los `schemaVersion` futuros migran en cadena (v0→v1→v2…), cada salto con su función pura y sus tests. Un backup v1 seguirá importando en la app v5.

## 8. Tests de migración (criterio de cierre de esta pieza)

1. **Fixture real v0**: backup generado con la estructura exacta de A2.8 (sesiones con y sin metrics, con repl/extra y sin ellos, custom con id divergente) → migra → pasa validación Zod v1 estricta.
2. **Campos faltantes**: sesión v0 mínima `{groups, mode, format, done:{}, saved:false, metrics:null}` → todos los defaults correctos.
3. **Valores sucios**: metrics con strings numéricos, energy inválida, clave de fecha corrupta → clamps, defaults y warnings esperados; nada explota.
4. **Bug de id custom**: clave ≠ id interno → id resultante = clave, referencias intactas.
5. **Roundtrip v1**: export → import → datos idénticos (deep equal).
6. **Idempotencia**: migrar un v0 dos veces produce exactamente lo mismo.
7. **Equivalencia de caminos**: migrar desde localStorage y desde backup v0 con el mismo contenido produce el mismo resultado.
8. **Rechazos**: JSON corrupto, vacío, o de otra app → error claro, base intacta.
9. **DB por defecto**: `createDefaultDB()` de A2.8 migrado = base v1 vacía con plan por defecto.

## 9. Reservado para v2+ (documentado, NO se implementa ahora)

- Registro por serie (reps reales, carga, RPE/RIR, dolor durante el ejercicio) — aquí es donde `sets/reps/rest` se estructuran.
- Check-in pre-sesión (lumbar, rodilla, energía, sueño, tiempo).
- Inventario de material y favoritos/bloqueados.

Se listan solo para garantizar que ninguna decisión de v1 los bloquee: ninguno exige cambiar claves primarias ni enums, solo agregar tablas o campos opcionales → migraciones aditivas simples.
