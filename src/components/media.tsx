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

export function PhaseBlock({ id, exercise, label }: { id: string; exercise: CatalogExercise; label: 'Inicio' | 'Medio' | 'Final' }) {
  const src = REAL_IMAGES[id]?.phases[label];
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
  return (
    <div className="block">
      <div className="bt"><span className="bd"></span>Fotos del movimiento</div>
      <div className="lib-gallery">
        {(['Inicio', 'Medio', 'Final'] as const).map((label) => (
          <div className="shot" key={label}>
            <img src={batch.phases[label]} alt={`${exercise.name} ${label}`} loading="lazy" />
            <span className="phase-lab-inline">{label}</span>
          </div>
        ))}
      </div>
      <div className="batch-note">Fotos limpias integradas.</div>
    </div>
  );
}
