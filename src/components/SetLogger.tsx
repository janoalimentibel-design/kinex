// Registro por serie: reps, carga (kg), RPE y check por serie.
// Cuando todas las series quedan hechas, el ejercicio se marca completado.
import { targetSets } from '../logic/session';
import type { CatalogExercise, SetEntry } from '../db/schema';
import type { Ctx } from './types';

const emptySet = (): SetEntry => ({ reps: null, load: null, rpe: null, done: false });

export function setLogFor(logs: Record<string, SetEntry[]>, id: string, exercise: CatalogExercise): SetEntry[] {
  const existing = logs[id] ?? [];
  const target = Math.max(targetSets(exercise.sets), existing.length);
  return [...existing, ...Array.from({ length: target - existing.length }, emptySet)];
}

export default function SetLogger({ ctx, id, exercise }: { ctx: Ctx; id: string; exercise: CatalogExercise }) {
  const { session } = ctx;
  const sets = setLogFor(session.setLogs, id, exercise);

  const update = (index: number, patch: Partial<SetEntry>) => {
    const next = sets.map((s, i) => (i === index ? { ...s, ...patch } : s));
    const allDone = next.every((s) => s.done);
    ctx.patchSession({
      setLogs: { ...session.setLogs, [id]: next },
      completed: allDone ? { ...session.completed, [id]: true } : session.completed,
    });
  };

  const num = (value: string, max: number): number | null => {
    if (value === '') return null;
    const n = Number(value);
    return Number.isNaN(n) ? null : Math.min(max, Math.max(0, n));
  };

  return (
    <div className="block setlog">
      <div className="bt"><span className="bd"></span>Registro por serie</div>
      <div className="setlog-head"><span>#</span><span>Reps</span><span>Kg</span><span>RPE</span><span></span></div>
      {sets.map((s, i) => (
        <div className={`setlog-row ${s.done ? 'done' : ''}`} key={i}>
          <span className="setlog-n">{i + 1}</span>
          <input
            type="number" inputMode="numeric" placeholder={exercise.reps}
            value={s.reps ?? ''}
            onChange={(e) => update(i, { reps: num(e.target.value, 999) === null ? null : Math.round(num(e.target.value, 999)!) })}
          />
          <input
            type="number" inputMode="decimal" placeholder="—"
            value={s.load ?? ''}
            onChange={(e) => update(i, { load: num(e.target.value, 999) })}
          />
          <select value={s.rpe ?? ''} onChange={(e) => update(i, { rpe: e.target.value === '' ? null : Number(e.target.value) })}>
            <option value="">—</option>
            {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button className={`setchk ${s.done ? 'on' : ''}`} onClick={() => update(i, { done: !s.done })}>✓</button>
        </div>
      ))}
    </div>
  );
}
