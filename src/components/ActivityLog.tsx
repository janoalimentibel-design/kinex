import { useEffect, useRef, useState, type FormEvent } from 'react';
import { z } from 'zod';
import { zAerobicActivity, type Session } from '../db/schema';
import { activitySignature, activityTotals } from '../logic/aerobic';
import type { Ctx } from './types';

const zRow = z.object({ id: z.string(), type: z.string(), minutes: z.string(), calories: z.string(), distanceKm: z.string() });
const zDraft = z.object({ rows: z.array(zRow), training: z.string(), includes: z.boolean(), baseline: z.string() });
type Draft = z.infer<typeof zDraft>;
const PREFIX = 'kinex:activity-draft:v1:';
const memoryDrafts = new Map<string, Draft>();
const value = (number: number | undefined) => number === undefined ? '' : String(number);
function fromSession(session: Session): Draft {
  return { rows: (session.aerobicActivities ?? []).map(item => ({ ...item, minutes: value(item.minutes), calories: value(item.calories), distanceKm: value(item.distanceKm) })), training: value(session.trainingCalories), includes: session.trainingCaloriesIncludeAerobic ?? false, baseline: activitySignature(session) };
}
function number(raw: string, label: string, required = false): number | undefined {
  const text = raw.trim().replace(',', '.');
  if (!text && !required) return undefined;
  if (!/^\d+(?:\.\d+)?$/.test(text) || !Number.isFinite(Number(text)) || Number(text) < 0 || (required && Number(text) === 0)) throw new Error(`${label}: escribí ${required ? 'un número mayor que cero' : 'un número igual o mayor que cero, o dejalo vacío'}.`);
  return Number(text);
}
export function listActivityDrafts(): string[] {
  try { return [...new Set([...memoryDrafts.keys(), ...Object.keys(sessionStorage).filter(key => key.startsWith(PREFIX) && zDraft.safeParse(JSON.parse(sessionStorage.getItem(key) ?? 'null')).success).map(key => key.slice(PREFIX.length))])]; }
  catch { return [...memoryDrafts.keys()]; }
}

export default function ActivityLog({ ctx }: { ctx: Ctx }) {
  const date = ctx.curDate;
  const key = `${PREFIX}${date}`;
  const signature = activitySignature(ctx.session);
  const [initial] = useState(() => {
    try {
      const persisted = sessionStorage.getItem(key);
      const stored = memoryDrafts.has(date) ? JSON.stringify(memoryDrafts.get(date)) : persisted;
      return { draft: stored ? zDraft.parse(JSON.parse(stored)) : fromSession(ctx.session), dirty: Boolean(stored), durable: !stored || stored === persisted };
    } catch { return { draft: memoryDrafts.get(date) ?? fromSession(ctx.session), dirty: memoryDrafts.has(date), durable: false }; }
  });
  const [draft, setDraft] = useState(initial.draft);
  const [dirty, setDirty] = useState(initial.dirty);
  const [durable, setDurable] = useState(initial.durable);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const saving = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!dirty && !busy) setDraft(fromSession(ctx.session));
  }, [signature, dirty, busy, ctx.session]);
  const change = (next: Draft) => {
    if (saving.current) return;
    memoryDrafts.set(date, next);
    setDraft(next); setDirty(true); setError(''); setMessage('');
    try { sessionStorage.setItem(key, JSON.stringify(next)); setDurable(true); }
    catch { setDurable(false); }
    window.dispatchEvent(new Event('kinex-activity-draft'));
  };
  const update = (id: string, field: keyof Draft['rows'][number], text: string) => change({ ...draft, rows: draft.rows.map(row => row.id === id ? { ...row, [field]: text } : row) });
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (saving.current) return;
    setError(''); setMessage('');
    try {
      const aerobicActivities = draft.rows.map((row, index) => zAerobicActivity.parse({ id: row.id, type: row.type, minutes: number(row.minutes, `Actividad ${index + 1}, minutos`, true), calories: number(row.calories, `Actividad ${index + 1}, calorías`), distanceKm: number(row.distanceKm, `Actividad ${index + 1}, kilómetros`) }));
      const trainingCalories = number(draft.training, 'Calorías del entrenamiento');
      saving.current = true; setBusy(true);
      await ctx.saveActivityData(date, { aerobicActivities, trainingCalories, trainingCaloriesIncludeAerobic: draft.includes }, draft.baseline);
      if (JSON.stringify(memoryDrafts.get(date)) === JSON.stringify(draft)) memoryDrafts.delete(date);
      try {
        if (sessionStorage.getItem(key) === JSON.stringify(draft)) sessionStorage.removeItem(key);
        window.dispatchEvent(new Event('kinex-activity-draft'));
      } catch { /* Data is committed even if draft cleanup is unavailable. */ }
      if (mounted.current) { setDirty(false); setMessage('Actividad y calorías guardadas en este dispositivo.'); }
    } catch (reason) {
      if (mounted.current) setError(reason instanceof z.ZodError ? 'Completá el tipo y los minutos de cada actividad con valores válidos.' : reason instanceof Error ? reason.message : 'No se pudo guardar. Tu borrador se conserva.');
    } finally {
      saving.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const totals = activityTotals(ctx.session);
  return <section className="activity-log suggestion-card" aria-labelledby="activity-title">
    <h3 id="activity-title">Actividad y calorías</h3>
    <p>Registrá lo que mida tu reloj, incluso en días sin fuerza. Calorías y kilómetros son opcionales.</p>
    <form className="activity-form" onSubmit={event => void save(event)}>
      <fieldset disabled={busy}>
        {draft.rows.map((row, index) => <article className="activity-entry" key={row.id}>
          <h4>Actividad aeróbica {index + 1}</h4>
          <div className="activity-fields">
            <label>Tipo de actividad <input aria-label={`Tipo de actividad ${index + 1}`} list="aerobic-types" value={row.type} maxLength={100} required onChange={event => update(row.id, 'type', event.target.value)} /></label>
            <label>Minutos <input aria-label={`Minutos ${index + 1}`} inputMode="decimal" value={row.minutes} required onChange={event => update(row.id, 'minutes', event.target.value)} /></label>
            <label>Calorías (kcal) <input aria-label={`Calorías ${index + 1}`} inputMode="decimal" value={row.calories} onChange={event => update(row.id, 'calories', event.target.value)} /></label>
            <label>Kilómetros <input aria-label={`Kilómetros ${index + 1}`} inputMode="decimal" value={row.distanceKm} onChange={event => update(row.id, 'distanceKm', event.target.value)} /></label>
          </div>
          <button className="btn btn-soft" type="button" aria-label={`Eliminar actividad ${index + 1}`} onClick={() => change({ ...draft, rows: draft.rows.filter(item => item.id !== row.id) })}>Eliminar actividad</button>
        </article>)}
        <datalist id="aerobic-types"><option value="Bici" /><option value="Caminar" /><option value="Correr" /><option value="Elíptica" /><option value="Natación" /></datalist>
        <button className="btn btn-soft" type="button" onClick={() => change({ ...draft, rows: [...draft.rows, { id: crypto.randomUUID(), type: 'Bici', minutes: '', calories: '', distanceKm: '' }] })}>Añadir actividad aeróbica</button>
        <label>Calorías del entrenamiento (kcal)<input aria-label="Calorías del entrenamiento" inputMode="decimal" value={draft.training} onChange={event => change({ ...draft, training: event.target.value })} /></label>
        <label className="activity-checkbox"><input type="checkbox" checked={draft.includes} onChange={event => change({ ...draft, includes: event.target.checked })} />Incluyen la actividad aeróbica</label>
        <p>Si el reloj ya incluye el cardio en las calorías del entrenamiento, marcá esta opción para contarlo una sola vez.</p>
        <div className="activity-actions"><button className="btn btn-primary" type="submit" disabled={!dirty}>{busy ? 'Guardando…' : 'Guardar actividad y calorías'}</button>
          {dirty && <button type="button" className="btn btn-soft" onClick={() => {
            if (!window.confirm('¿Descartar el borrador de actividad y recuperar los datos guardados de este día?')) return;
            memoryDrafts.delete(date);
            try { sessionStorage.removeItem(key); window.dispatchEvent(new Event('kinex-activity-draft')); } catch { /* Continue with the committed values. */ }
            setDraft(fromSession(ctx.session)); setDirty(false); setError(''); setMessage('');
          }}>Descartar borrador de actividad</button>}
        </div>
      </fieldset>
    </form>
    {dirty && <p role="status">Borrador sin guardar{!durable ? ': no se pudo proteger; guardalo antes de recargar.' : '. Se conserva al cambiar de día.'}</p>}
    {dirty && draft.baseline !== signature && <p role="alert">Los datos guardados cambiaron. Tu borrador está protegido; revisá el día antes de descartarlo y volver a editar.</p>}
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    <div className="activity-summary"><p>Guardado: {totals.minutes} min de aeróbico · {totals.distanceKm === null ? 'km sin registrar' : `${totals.distanceKm} km`} · {totals.aerobicCalories === null ? 'kcal aeróbicas sin registrar' : `${totals.aerobicCalories} kcal aeróbicas`}</p><p>Total guardado del día: {totals.totalCalories === null ? 'sin calorías registradas' : `${totals.totalCalories} kcal`}. Los valores opcionales vacíos no se estiman.</p></div>
  </section>;
}
