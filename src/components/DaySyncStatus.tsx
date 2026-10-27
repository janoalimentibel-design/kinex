import { useEffect, useState } from 'react';
import { hasActivity } from '../logic/activity';
import type { Ctx } from './types';

/** Describe only the selected day's saved data, never an unsaved form draft. */
export default function DaySyncStatus({ ctx, dirty = false }: { ctx: Ctx; dirty?: boolean }) {
  const state = ctx.sync.getDaySyncState(ctx.curDate);
  const [attempted, setAttempted] = useState(false);
  useEffect(() => { setAttempted(false); }, [ctx.curDate]);
  const stored = ctx.data.sessions[ctx.curDate];
  const recorded = Boolean(stored && hasActivity(stored));
  const deliveryError = attempted && /^(Pendiente:|Google no respondió|Drive rechazó|Conflicto)/.test(ctx.sync.status);
  return <div className="day-sync-status">
    <p role="status">{dirty ? 'Borrador sin guardar: estos cambios todavía no se guardaron ni se enviaron.'
      : !recorded ? `Todavía no guardaste actividad para este día.${state === 'disconnected' ? ' Drive no está conectado.' : ''}`
      : state === 'disconnected' ? 'Guardado en este dispositivo. Drive no está conectado.'
      : state === 'sent' ? 'Datos guardados de este día enviados a Drive.'
      : state === 'pending' ? 'Cambios guardados en este dispositivo. Pendientes de enviar a Drive.'
      : state === 'unverified' ? 'Guardado en este dispositivo. No se confirmó qué versión de este día está en Drive.'
      : 'Guardado en este dispositivo. Todavía no se confirmó el envío de este día.'}</p>
    {dirty && <p>Guardá el borrador para incluir los nuevos minutos y calorías en el envío.</p>}
    {ctx.sync.connected && <>
      <p className="sync-explanation">Con Drive conectado, los datos guardados pueden enviarse automáticamente. Lo que todavía no guardaste en este formulario no se envía.</p>
      {recorded && (state !== 'sent' || dirty) && <button type="button" className="btn btn-soft" disabled={dirty || ctx.sync.busy} onClick={() => { setAttempted(true); void ctx.sync.send(true, ctx.curDate); }}>{ctx.sync.busy ? 'Enviando…' : 'Enviar cambios'}</button>}
    </>}
    {attempted && state !== 'sent' && <p role={deliveryError ? 'alert' : 'status'} className={deliveryError ? 'sync-error' : undefined}>{ctx.sync.status}</p>}
  </div>;
}

export function reviewActivity() {
  requestAnimationFrame(() => {
    const section = document.getElementById('activity-log');
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    section?.focus({ preventScroll: true });
  });
}
