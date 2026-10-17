import { useEffect, useRef, useState } from 'react';
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

export function imageLabels(id: string): ImageLabel[] {
  const batch = REAL_IMAGES[id];
  return batch?.display === 'hold' ? ['Posición'] : batch?.visiblePhases ?? ['Inicio', 'Medio', 'Final'];
}

function ExercisePhoto({ src, exercise, label, instruction }: { src: string; exercise: CatalogExercise; label: ImageLabel; instruction?: string }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (open && !dialog.current?.open) dialog.current?.showModal(); }, [open]);
  const close = () => { dialog.current?.close(); setOpen(false); };
  return <>
    <button className="photo-open" aria-label={`Ampliar ${exercise.name} · ${label}`} onClick={event => { event.stopPropagation(); setOpen(true); }}>
      <img src={src} alt={`${exercise.name} ${label}`} loading="lazy" />
    </button>
    <dialog ref={dialog} className="photo-dialog" aria-label={`${exercise.name} · ${label} ampliada`} onCancel={event => { event.preventDefault(); close(); }}>
      {open && <><h3>{exercise.name} · {label}</h3><img className="zoom-photo" src={src} alt={`${exercise.name} ${label} ampliada`} />{instruction && <p>{instruction}</p>}<button className="btn btn-soft" onClick={close}>Cerrar foto</button></>}
    </dialog>
  </>;
}

export function PhaseBlock({ id, exercise, label }: { id: string; exercise: CatalogExercise; label: ImageLabel }) {
  const src = REAL_IMAGES[id]?.phases[label === 'Posición' ? 'Inicio' : label];
  if (src) {
    return (
      <div className="phase">
        <div className="ph-img has-real"><ExercisePhoto src={src} exercise={exercise} label={label} instruction={REAL_IMAGES[id]?.instructions?.[label]} /></div>
        <div className="ph-lab">{label}</div>
        {REAL_IMAGES[id]?.instructions?.[label] && <p className="phase-instruction">{REAL_IMAGES[id].instructions![label]}</p>}
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
  const labels = imageLabels(id);
  return (
    <div className="block">
      <div className="bt"><span className="bd"></span>{batch.display === 'hold' ? 'Postura del ejercicio' : 'Fotos del movimiento'}</div>
      <div className={`lib-gallery ${batch.display === 'hold' ? 'hold-gallery' : labels.length === 2 ? 'two-phase-gallery' : ''}`}>
        {labels.map((label) => (
          <div className="shot" key={label}>
            <ExercisePhoto src={batch.phases[label === 'Posición' ? 'Inicio' : label]} exercise={exercise} label={label} instruction={batch.instructions?.[label]} />
            <span className="phase-lab-inline">{label}</span>
            {batch.instructions?.[label] && <p className="phase-instruction">{batch.instructions[label]}</p>}
          </div>
        ))}
      </div>
      <p className="photo-tip">Tocá una foto para ampliarla.</p>
      <div className="batch-note">{batch.note ?? (batch.display === 'hold' ? 'Ejercicio isométrico: mantené esta posición con técnica.' : 'Secuencia del movimiento integrada.')}</div>
    </div>
  );
}
