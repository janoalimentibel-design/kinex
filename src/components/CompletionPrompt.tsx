import { useEffect, useRef } from 'react';
import { reviewActivity } from './DaySyncStatus';
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
    <p>Los ejercicios marcados quedan guardados en este dispositivo. Si querés, completá tus minutos y calorías antes de enviar los datos. Completar los ejercicios no completa esos campos.</p>
    <button className="btn btn-primary" onClick={() => { close(); reviewActivity(); }}>Revisar actividad y calorías</button>
    <p>Si Drive está conectado, los datos ya guardados pueden enviarse automáticamente. Los minutos y calorías que todavía no guardaste no se incluyen.</p>
    <button className="btn btn-soft" onClick={close}>Volver a la sesión</button>
  </dialog>;
}
