// Vista Plan — port de renderPlan/copyWeeklySummary de A2.8.
import { FORMATS, GROUPS } from '../data/exercises';
import type { Plan } from '../db/schema';
import { nextSessionSuggestion } from '../logic/session';
import type { Ctx } from './types';

export default function PlanView({ ctx }: { ctx: Ctx }) {
  const { data } = ctx;
  const plan = data.plan;
  const sessions = Object.values(data.sessions).filter((s) => s.saved);
  const suggestion = nextSessionSuggestion(ctx.curDate, data.sessions, plan);

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

  const prepareFestivalWeek = () => {
    const festivalPlan: Plan = {
      ...plan,
      week: 'Semana festival',
      focus: 'Resistencia de pie',
      secondary: 'Piernas + aeróbico',
      objective: 'Llegar al festival con piernas frescas y tolerar dos días de muchas horas de pie.',
      rule: 'Intensidad moderada; no buscar agujetas ni cargas máximas esta semana.',
      notes: 'Alternar caminata, bicicleta o elíptico con fuerza controlada de piernas y core.',
    };
    const festivalSuggestion = nextSessionSuggestion(ctx.curDate, data.sessions, festivalPlan);
    ctx.putPlan(festivalPlan);
    ctx.patchSession({ groups: festivalSuggestion.groups, saved: false });
    ctx.setView('today');
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
            <button className="btn btn-soft" onClick={prepareFestivalWeek}>Preparar semana festival</button>
          </div>
        </div>
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
