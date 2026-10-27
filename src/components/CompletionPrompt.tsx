import { useEffect, useRef } from 'react';
import type { Ctx } from './types';

/** A modal keeps the finish action visible even at the bottom of a long workout. */
export default function CompletionPrompt({ ctx, complete, active, signature }: {
  ctx: Ctx; complete: boolean; active: boolean; signature: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const dismissed = useRef(new Set<string>());
  const key = `kinex-finish:${ctx.curDate}:${signature}`;
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (!complete) {
      dismissed.current.delete(key);
      try { sessionStorage.removeItem(key); } catch { /* In-memory dismissal remains available. */ }
    }
    let acknowledged = dismissed.current.has(key);
    try { acknowledged ||= sessionStorage.getItem(key) === 'dismissed'; } catch { /* Storage can be disabled. */ }
    if (active && complete && !acknowledged) {
      if (!element.open) element.showModal();
    } else if (element.open) element.close();
  }, [active, complete, key]);
  const close = () => {
    dismissed.current.add(key);
    try { sessionStorage.setItem(key, 'dismissed'); } catch { /* Keep the in-memory choice. */ }
    dialog.current?.close();
  };
  return <dialog ref={dialog} className="completion-dialog" aria-labelledby="completion-title" onCancel={e => { e.preventDefault(); close(); }}>
    <h3 id="completion-title">Entrenamiento completado</h3>
    <p>Terminaste todos los ejercicios de esta sesión. Enviá la última copia a tu Drive privado para la próxima revisión.</p>
    <button className="btn btn-primary" disabled={ctx.sync.busy} onClick={() => void ctx.sync.send(true, ctx.curDate)}>{ctx.sync.busy ? 'Enviando…' : 'Enviar datos'}</button>
    <p role="status">{ctx.sync.status}</p>
    <button className="btn btn-soft" onClick={close}>Volver a la sesión</button>
  </dialog>;
}
