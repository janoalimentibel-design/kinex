import { useEffect, useRef, useState } from 'react';
import { APPEARANCE_KEY, applyAppearance, readAppearance, type Appearance } from '../appearance/theme';

export default function AppearanceToggle() {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [appearance, setAppearance] = useState<Appearance>(readAppearance);
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystem = () => applyAppearance(appearance, media.matches);
    const updateStorage = (event: StorageEvent) => {
      if (event.key === APPEARANCE_KEY || event.key === null) setAppearance(readAppearance());
    };
    updateSystem();
    media.addEventListener('change', updateSystem);
    window.addEventListener('storage', updateStorage);
    return () => {
      media.removeEventListener('change', updateSystem);
      window.removeEventListener('storage', updateStorage);
    };
  }, [appearance]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!container.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  return <div className="appearance-toggle" ref={container}>
    <button ref={trigger} type="button" className="appearance-trigger" aria-label="Cambiar apariencia" aria-expanded={open} aria-controls="appearance-panel" onClick={() => setOpen(value => !value)}>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></svg>
    </button>
    {open && <div className="appearance-panel" id="appearance-panel">
    <label htmlFor="appearance-mode">Apariencia</label>
    <select id="appearance-mode" aria-label="Apariencia" value={appearance} onChange={event => {
      const value = event.target.value as Appearance;
      try { localStorage.setItem(APPEARANCE_KEY, value); } catch { /* Keep the choice for this visit. */ }
      applyAppearance(value);
      setAppearance(value);
    }}>
      <option value="light">Claro</option>
      <option value="dark">Oscuro</option>
      <option value="auto">Automático</option>
    </select>
    <p>Automático sigue el modo del dispositivo.</p>
    </div>}
  </div>;
}
