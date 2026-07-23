// Vista Plan — port de renderPlan/copyWeeklySummary de A2.8.
import { useState } from 'react';
import { FORMATS, GROUPS } from '../data/exercises';
import type { Plan } from '../db/schema';
import type { Ctx } from './types';

export default function PlanView({ ctx }: { ctx: Ctx }) {
  const { data } = ctx;
  const plan = data.plan;
  const sessions = Object.values(data.sessions).filter((s) => s.saved);
  const [request, setRequest] = useState(() => localStorage.getItem('kinex-codex-draft') ?? '');

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

  const updateRequest = (value: string) => {
    setRequest(value);
    localStorage.setItem('kinex-codex-draft', value);
  };

  const requestBody = () => [
    '# Pedido desde KINEX',
    '',
    request.trim(),
    '',
    '---',
    '## Contexto automático',
    `- Semana: ${plan.week || '-'}`,
    `- Foco: ${plan.focus || '-'}${plan.secondary ? ` · ${plan.secondary}` : ''}`,
    `- Sesiones guardadas: ${sessions.length}`,
    `- Enviado: ${new Date().toLocaleString('es-ES')}`,
    '',
    '_Este Issue fue creado desde el Buzón de KINEX. Codex: leer el pedido y aplicar los cambios en la app._',
  ].join('\n');

  const sendRequest = () => {
    if (!request.trim()) { alert('Escribí primero qué querés cambiar o probar.'); return; }
    const title = `KINEX · ${request.trim().slice(0, 72)}`;
    const url = `https://github.com/janoalimentibel-design/kinex/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(requestBody())}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const copyRequest = () => {
    const text = requestBody();
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => alert('Pedido copiado.'));
    else ctx.setModal({ type: 'summary', text });
  };

  return (
    <div className="plan">
      <div className="sectionhead">
        <div>
          <h2>Plan</h2>
          <p>Foco semanal editable y resumen para ajustar la próxima semana.</p>
        </div>
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
      <div className="codexbox">
        <div className="t">Buzón para Codex</div>
        <h3>Pedime cambios desde la app</h3>
        <p>Escribí lo que detectaste. “Enviar a GitHub” abre un Issue ya redactado: confirmalo con tu cuenta de GitHub y después decime <b>“leé los pedidos de Git”</b>.</p>
        <textarea
          value={request}
          onChange={(e) => updateRequest(e.target.value)}
          placeholder="Ej: El jueves quiero más espalda y menos ejercicios con banda. Cambiá…"
        />
        <div className="codex-actions">
          <button className="btn btn-primary" onClick={sendRequest}>Enviar a GitHub ↗</button>
          <button className="btn btn-ghost" onClick={copyRequest}>Copiar pedido</button>
        </div>
        <div className="codex-note">El borrador queda guardado en este dispositivo. GitHub te pedirá la confirmación final: la app no guarda ninguna contraseña ni token.</div>
      </div>
    </div>
  );
}
