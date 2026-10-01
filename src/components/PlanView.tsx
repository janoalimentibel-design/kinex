// Vista Plan — port de renderPlan/copyWeeklySummary de A2.8.
import { FORMATS, GROUPS } from '../data/exercises';
import type { Plan, Session } from '../db/schema';
import { buildExerciseList, createSession, nextSessionSuggestion, weeklyCoveragePairs } from '../logic/session';
import { activityGroups, completedIds, hasActivity } from '../logic/activity';
import { applyPublishedRoutine, ROUTINE_END, ROUTINE_ID, ROUTINE_START } from '../logic/publishedRoutine';
import { isoDate } from '../logic/session';
import type { Ctx } from './types';

export default function PlanView({ ctx }: { ctx: Ctx }) {
  const { data } = ctx;
  const plan = data.plan;
  const sessions = Object.values(data.sessions).filter(hasActivity);
  const suggestion = nextSessionSuggestion(ctx.curDate, data.sessions, plan);
  const scheduledSessions = Object.values(data.sessions)
    .filter((session) => session.programTitle?.startsWith('Próxima semana') || session.programTitle?.startsWith('Semana revisada'))
    .sort((a, b) => a.date.localeCompare(b.date));

  const set = (patch: Partial<Plan>) => ctx.putPlan({ ...plan, ...patch });

  const avgMetric = (key: 'lumbarAfter' | 'knee') => {
    const vals = sessions.filter((s) => s.metrics).map((s) => s.metrics![key]);
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '-';
  };

  const mostUsed = (prop: 'format' | 'mode') => {
    const counts: Record<string, number> = {};
    for (const s of sessions) counts[s[prop]] = (counts[s[prop]] ?? 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-';
  };

  const copyWeeklySummary = () => {
    const ordered = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
    const txt =
      `KINEX — resumen semanal\nSemana: ${plan.week}\nFoco principal: ${plan.focus}\nFoco secundario: ${plan.secondary || '-'}\nObjetivo: ${plan.objective || '-'}\nRegla personal: ${plan.rule || '-'}\n\nSesiones guardadas: ${ordered.length}\n` +
      ordered
        .map(
          (s) =>
            `- ${s.date}: ${activityGroups(s, ctx.allEx).map((g) => GROUPS[g].label).join(' + ')} · Hechos: ${completedIds(s).map((id) => ctx.allEx[id]?.name ?? id).join(', ')} · ${FORMATS[s.format].name} · ${s.mode} · notas: ${s.metrics?.notes || ''}`,
        )
        .join('\n');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(txt).then(
        () => alert('Resumen copiado.'),
        () => ctx.setModal({ type: 'summary', text: txt }),
      );
    } else {
      ctx.setModal({ type: 'summary', text: txt });
    }
  };

  const applySuggestion = () => {
    ctx.patchSession({ groups: suggestion.groups });
    ctx.setView('today');
  };

  const loadNextWeek = () => {
    const nextPlan: Plan = {
      ...plan,
      week: 'Próxima semana',
      focus: plan.focus || 'Fuerza base',
      secondary: plan.secondary || 'Técnica + movilidad',
      objective: plan.objective || 'Cuatro sesiones de fuerza que cubren todos los grupos durante la semana.',
      notes: `${plan.notes ? `${plan.notes.trim()} ` : ''}La semana cubre todos los grupos de fuerza antes de repetir uno y rota ejercicios según el historial. El aeróbico cotidiano va por separado.`,
    };

    // Cuatro días repartidos (lun, mar, jue, sáb): cubren los siete grupos
    // antes de repetir uno. Los ejercicios siguen rotando según el historial.
    // Nunca pisa una sesión que el usuario ya guardó en su historial.
    const from = new Date(`${ctx.curDate}T12:00:00`);
    const daysToMonday = ((8 - from.getDay()) % 7) || 7;
    const monday = new Date(from);
    monday.setDate(from.getDate() + daysToMonday);
    const dateAt = (offset: number) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + offset);
      return date.toISOString().slice(0, 10);
    };
    const drafts: Record<string, Session> = {};
    const coverage = weeklyCoveragePairs(data.sessions, dateAt(0));
    const scheduled = [0, 1, 3, 5].map((offset, index) => {
      const date = dateAt(offset);
      const existing = data.sessions[date];
      // No toca una sesión hecha ni una rutina futura que ya dejaste armada.
      if ((existing && hasActivity(existing)) || existing?.programmed?.length) {
        drafts[date] = existing;
        return existing;
      }
      const visibleHistory = { ...data.sessions, ...drafts };
      const session = { ...createSession(date, visibleHistory, nextPlan), groups: coverage[index] };
      // Para esta selección, las sesiones ya programadas cuentan como uso: así
      // la semana no repite el mismo ejercicio en sus tres días aunque todavía
      // no se hayan marcado como realizadas.
      const historyForExercises = Object.fromEntries(
        Object.entries(visibleHistory).map(([key, value]) => [key, drafts[key] ? {
          ...value, completed: { ...value.completed, ...Object.fromEntries((value.programmed ?? []).map((id) => [id, true])) },
        } : value]),
      );
      const programmed = buildExerciseList(session, ctx.allEx, historyForExercises).map((entry) => entry.id);
      const planned: Session = {
        ...session,
        date,
        format: 'base' as const,
        programmed,
        programTitle: `Próxima semana · ${session.groups.map((group) => GROUPS[group].label).join(' + ')}`,
      };
      drafts[date] = planned;
      return planned;
    });
    ctx.putPlan(nextPlan);
    ctx.putSessions(scheduled);
  };

  return (
    <div className="plan">
      <div className="sectionhead">
        <div>
          <h2>Plan</h2>
          <p>Foco semanal editable y resumen para ajustar la próxima semana.</p>
        </div>
        <button className="mini" onClick={() => ctx.setView('requests')}>✎ Pedidos</button>
      </div>
      {isoDate(new Date()) >= ROUTINE_START && isoDate(new Date()) <= ROUTINE_END && (
        <div className="suggestion-card" data-testid="reviewed-routine">
          <div className="t">Rutina revisada · 28 sep – 4 oct</div>
          <h3>Rutina de la semana</h3>
          <p>Los días pendientes se ajustan si coinciden con los músculos de un día contiguo. Abajo podés ver los grupos y ejercicios vigentes.</p>
          <p>La rutina se carga sin reemplazar tu historial ni los días que ya empezaste. Cada tilde cuenta como actividad, sin guardar otro formulario.</p>
          {plan.routineRevision === ROUTINE_ID
            ? <b>Rutina cargada. Abrí los días de abajo o la pestaña Hoy.</b>
            : <button className="btn btn-primary" onClick={() => {
              const updated = applyPublishedRoutine(data, isoDate(new Date()), true);
              ctx.putSessions(Object.values(updated.sessions).filter((s) => s !== data.sessions[s.date]));
              ctx.putPlan(updated.plan);
              ctx.setCurDate(isoDate(new Date())); ctx.setView('today');
            }}>Cargar rutina revisada</button>}
          <p>Complemento opcional: bici o remo ergómetro. No reemplaza la sesión de fuerza ni cuenta como espalda realizada.</p>
          <button className="btn btn-soft" onClick={() => ctx.setModal({ type: 'libInfo', id: 'rowing_erg' })}>Ver remo ergómetro</button>
          <p>El ajuste automático semanal y la sincronización privada todavía están pendientes. Esta es la revisión concreta de esta semana.</p>
        </div>
      )}
      <div>
        <div className="wkcard">
          <div className="field">
            <label>Semana</label>
            <input value={plan.week} onChange={(e) => set({ week: e.target.value })} />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Foco principal</label>
              <input value={plan.focus} onChange={(e) => set({ focus: e.target.value })} placeholder="Fuerza, Rodilla, Core..." />
            </div>
            <div className="field">
              <label>Foco secundario</label>
              <input value={plan.secondary} onChange={(e) => set({ secondary: e.target.value })} placeholder="Espalda, movilidad..." />
            </div>
          </div>
          <div className="field">
            <label>Objetivo de la semana</label>
            <textarea value={plan.objective} onChange={(e) => set({ objective: e.target.value })} placeholder="Ej: priorizar tren superior y no irritar rodilla." />
          </div>
          <div className="field">
            <label>Regla personal</label>
            <textarea value={plan.rule} onChange={(e) => set({ rule: e.target.value })} placeholder="Ej: si rodilla >3/10, evitar estocadas." />
          </div>
          <div className="field">
            <label>Notas del plan</label>
            <textarea value={plan.notes} onChange={(e) => set({ notes: e.target.value })} />
          </div>
        </div>
        <div className="suggestion-card">
          <div className="t">Sugerencia para {ctx.curDate}</div>
          <h3>{suggestion.groups.map((group) => GROUPS[group].label).join(' + ')}</h3>
          <p>{suggestion.reason}</p>
          <div className="suggestion-actions">
            <button className="btn btn-primary" onClick={applySuggestion}>Aplicar a este día</button>
            <button className="btn btn-soft" onClick={loadNextWeek}>Organizar próxima semana</button>
          </div>
        </div>
        {scheduledSessions.length > 0 && (
          <div className="festival-routine">
            <div className="t">{plan.routineRevision === ROUTINE_ID ? 'Sesiones programadas' : 'Próxima semana cargada'}</div>
            <p>Abrí cada día para ver los ejercicios. Los días realizados se conservan, aunque difieran de la propuesta nueva.</p>
            {scheduledSessions.map((session) => (
              <button key={session.date} className="routine-session" onClick={() => { ctx.setCurDate(session.date); ctx.setView('today'); }}>
                <span><b>{session.date}</b><small>{session.programTitle}</small></span>
                <span>{session.programmed?.map((id) => ctx.allEx[id]?.name ?? id).join(' · ')}</span>
                <i>Abrir ›</i>
              </button>
            ))}
          </div>
        )}
        <div className="wkvol">
          <div className="t">Estado de esta versión</div>
          <div className="hrow"><b>{sessions.length}</b> sesiones con actividad registrada</div>
          <div className="hrow">Formato más usado: <b>{mostUsed('format')}</b> · Modo más usado: <b>{mostUsed('mode')}</b></div>
          <div className="hrow">Lumbar promedio post: <b>{avgMetric('lumbarAfter')}</b> · Rodilla promedio: <b>{avgMetric('knee')}</b></div>
        </div>
      </div>
      <div className="apibox">
        <h3>Resumen semanal</h3>
        <p>Copia un resumen con tu historial, molestias y ejercicios para ajustar la siguiente semana.</p>
        <button className="btn btn-primary" onClick={copyWeeklySummary}>Copiar resumen</button>
      </div>
    </div>
  );
}
