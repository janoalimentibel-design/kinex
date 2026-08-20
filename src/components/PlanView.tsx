// Vista Plan — port de renderPlan/copyWeeklySummary de A2.8.
import { FORMATS, GROUPS } from '../data/exercises';
import type { Plan, Session } from '../db/schema';
import { buildExerciseList, createSession, nextSessionSuggestion } from '../logic/session';
import type { Ctx } from './types';

export default function PlanView({ ctx }: { ctx: Ctx }) {
  const { data } = ctx;
  const plan = data.plan;
  const sessions = Object.values(data.sessions).filter((s) => s.saved);
  const suggestion = nextSessionSuggestion(ctx.curDate, data.sessions, plan);
  const scheduledSessions = Object.values(data.sessions)
    .filter((session) => session.programTitle?.startsWith('Próxima semana'))
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
            `- ${s.date}: ${s.groups.map((g) => GROUPS[g].label).join(' + ')} · ${FORMATS[s.format].name} · ${s.mode} · lumbar ${s.metrics?.lumbarBefore ?? '-'}→${s.metrics?.lumbarAfter ?? '-'} · rodilla ${s.metrics?.knee ?? '-'} · notas: ${s.metrics?.notes || ''}`,
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
    ctx.patchSession({ groups: suggestion.groups, saved: false });
    ctx.setView('today');
  };

  const loadNextWeek = () => {
    const nextPlan: Plan = {
      ...plan,
      week: 'Próxima semana',
      focus: plan.focus || 'Fuerza base',
      secondary: plan.secondary || 'Técnica + movilidad',
      objective: plan.objective || 'Tres sesiones de fuerza distribuidas según el historial reciente.',
      notes: `${plan.notes ? `${plan.notes.trim()} ` : ''}La selección evita grupos y ejercicios recientes. El aeróbico cotidiano va por separado.`,
    };

    // Carga tres días alternados de la semana siguiente. Cada día se calcula
    // con las sesiones guardadas y las programadas antes, para rotar focos.
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
    const scheduled = [0, 2, 4].map((offset) => {
      const date = dateAt(offset);
      const existing = data.sessions[date];
      // No toca una sesión hecha ni una rutina futura que ya dejaste armada.
      if (existing?.saved || existing?.programmed?.length) {
        drafts[date] = existing;
        return existing;
      }
      const visibleHistory = { ...data.sessions, ...drafts };
      const session = createSession(date, visibleHistory, nextPlan);
      // Para esta selección, las sesiones ya programadas cuentan como uso: así
      // la semana no repite el mismo ejercicio en sus tres días aunque todavía
      // no se hayan marcado como realizadas.
      const historyForExercises = Object.fromEntries(
        Object.entries(visibleHistory).map(([key, value]) => [key, { ...value, saved: true }]),
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
            <button className="btn btn-soft" onClick={loadNextWeek}>Crear próxima semana</button>
          </div>
        </div>
        {scheduledSessions.length > 0 && (
          <div className="festival-routine">
            <div className="t">Próxima semana cargada</div>
            <p>Tres sesiones alternadas armadas desde tu historial. No modifica sesiones ya realizadas.</p>
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
          <div className="hrow"><b>{sessions.length}</b> sesiones guardadas</div>
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
