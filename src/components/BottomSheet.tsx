import { useEffect, useRef, type ReactNode } from 'react';

/** Native dialog supplies modal focus containment, inert background and Escape. */
export default function BottomSheet({ open, label, onClose, children }: {
  open: boolean; label: string; onClose(): void; children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const pointerOpener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    // Safari does not focus a button on a pointer click. Record the actual
    // control before React opens the dialog, while keyboard focus stays native.
    const rememberPointer = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || dialog.current?.contains(event.target)) return;
      pointerOpener.current = event.target.closest<HTMLElement>('button, a[href], input, select, textarea, [role="button"], [tabindex]');
    };
    const preferKeyboard = () => { pointerOpener.current = null; };
    document.addEventListener('pointerdown', rememberPointer, true);
    document.addEventListener('keydown', preferKeyboard, true);
    return () => {
      document.removeEventListener('pointerdown', rememberPointer, true);
      document.removeEventListener('keydown', preferKeyboard, true);
    };
  }, []);
  useEffect(() => {
    const element = dialog.current;
    if (!element || !open) return;
    const active = document.activeElement;
    const opener = pointerOpener.current ?? (active instanceof HTMLElement && active !== document.body && active !== document.documentElement
      ? active : null);
    pointerOpener.current = null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (!element.open) element.showModal();
    return () => {
      if (element.open) element.close();
      document.body.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [open]);
  return <dialog ref={dialog} className={`modal bottom-sheet-modal ${open ? 'show' : ''}`} aria-label={label}
    onCancel={event => { if (event.target === event.currentTarget) { event.preventDefault(); onClose(); } }}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="sheet">
      <div className="sheet-toolbar"><button type="button" className="sheet-close" aria-label="Cerrar ventana" onClick={onClose}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg><span>Cerrar</span>
      </button></div>
      {children}
    </div>
  </dialog>;
}
