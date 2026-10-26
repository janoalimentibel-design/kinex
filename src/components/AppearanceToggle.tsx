import { useEffect, useState } from 'react';
import { APPEARANCE_KEY, applyAppearance, readAppearance, type Appearance } from '../appearance/theme';

export default function AppearanceToggle() {
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
  return <label className="appearance-toggle">
    <span className="appearance-symbol" aria-hidden="true">☀ / ☾</span>
    <span className="visually-hidden">Apariencia</span>
    <select aria-label="Apariencia" value={appearance} onChange={event => {
      const value = event.target.value as Appearance;
      try { localStorage.setItem(APPEARANCE_KEY, value); } catch { /* Keep the choice for this visit. */ }
      applyAppearance(value);
      setAppearance(value);
    }}>
      <option value="light">Claro</option>
      <option value="dark">Oscuro</option>
      <option value="auto">Automático</option>
    </select>
  </label>;
}
