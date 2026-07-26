// Thumbnails, fases y galerías — port de src/ui/media.js de A2.8 a React.
import { GROUPS } from '../data/exercises';
import { REAL_IMAGES } from '../data/images';
import type { CatalogExercise, GroupId } from '../db/schema';

export function colorOf(group: GroupId): string {
  return `var(${GROUPS[group].cssVar})`;
}

export function hasImage(id: string): boolean {
  return Boolean(REAL_IMAGES[id]);
}

export function isHoldImage(id: string): boolean {
  return REAL_IMAGES[id]?.display === 'hold';
}

type ImageLabel = 'Inicio' | 'Medio' | 'Final' | 'Posición';

export function PhaseBlock({ id, exercise, label }: { id: string; exercise: CatalogExercise; label: ImageLabel }) {
  const src = REAL_IMAGES[id]?.phases[label === 'Posición' ? 'Inicio' : label];
  if (src) {
    return (
      <div className="phase">
        <div className="ph-img has-real"><img src={src} alt={`${exercise.name} ${label}`} loading="lazy" /></div>
        <div className="ph-lab">{label}</div>
      </div>
    );
  }
  return (
    <div className="phase">
      <div className="ph-img"><div className="ph-ph">Foto limpia<br />{exercise.name}<br />{label}</div></div>
      <div className="ph-lab">{label}</div>
    </div>
  );
}

export function LibThumb({ id, exercise }: { id: string; exercise: CatalogExercise }) {
  const src = REAL_IMAGES[id]?.thumb;
  const tag = <span className="lc-tag" style={{ background: colorOf(exercise.group) }}>{GROUPS[exercise.group].label}</span>;
  if (src) {
    return (
      <div className="lc-img has-real">
        {tag}
        <img src={src} alt={exercise.name} loading="lazy" />
        <span className="real-badge">foto</span>
      </div>
    );
  }
  return (
    <div className="lc-img">
      {tag}
      <div className="ph-ph">Foto limpia<br />{exercise.name}</div>
    </div>
  );
}

export function GalleryBlock({ id, exercise }: { id: string; exercise: CatalogExercise }) {
  const batch = REAL_IMAGES[id];
  if (!batch) return null;
  const labels: ImageLabel[] = batch.display === 'hold' ? ['Posición'] : ['Inicio', 'Medio', 'Final'];
  return (
    <div className="block">
      <div className="bt"><span className="bd"></span>{batch.display === 'hold' ? 'Postura del ejercicio' : 'Fotos del movimiento'}</div>
      <div className={`lib-gallery ${batch.display === 'hold' ? 'hold-gallery' : ''}`}>
        {labels.map((label) => (
          <div className="shot" key={label}>
            <img src={batch.phases[label === 'Posición' ? 'Inicio' : label]} alt={`${exercise.name} ${label}`} loading="lazy" />
            <span className="phase-lab-inline">{label}</span>
          </div>
        ))}
      </div>
      <div className="batch-note">{batch.display === 'hold' ? 'Ejercicio isométrico: mantené esta posición con técnica.' : 'Secuencia del movimiento integrada.'}</div>
    </div>
  );
}
