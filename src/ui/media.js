export function createMediaComponents({ images, groups, colorOf }) {
  const hasImage = (id) => Boolean(images[id]);
  const phaseBlock = (id, exercise, label) => {
    const src = images[id]?.phases?.[label];
    if (src) return `<div class="phase"><div class="ph-img has-real"><img src="${src}" alt="${exercise.nm} ${label}"></div><div class="ph-lab">${label}</div></div>`;
    return `<div class="phase"><div class="ph-img"><div class="ph-ph">Foto limpia<br>${exercise.nm}<br>${label}</div></div><div class="ph-lab">${label}</div></div>`;
  };
  const libThumb = (id, exercise) => {
    const src = images[id]?.thumb;
    if (src) return `<div class="lc-img has-real"><span class="lc-tag" style="background:${colorOf(exercise.g)}">${groups[exercise.g][0]}</span><img src="${src}" alt="${exercise.nm}"><span class="real-badge">foto</span></div>`;
    return `<div class="lc-img"><span class="lc-tag" style="background:${colorOf(exercise.g)}">${groups[exercise.g][0]}</span><div class="ph-ph">Foto limpia<br>${exercise.nm}</div></div>`;
  };
  const galleryBlock = (id, exercise) => {
    const batch = images[id];
    if (!batch) return '';
    return `<div class="block"><div class="bt"><span class="bd"></span>Fotos del movimiento</div><div class="lib-gallery">${['Inicio', 'Medio', 'Final'].map((label) => `<div class="shot"><img src="${batch.phases[label]}" alt="${exercise.nm} ${label}"><span class="phase-lab-inline">${label}</span></div>`).join('')}</div><div class="batch-note">Fotos limpias integradas.</div></div>`;
  };
  return { hasImage, phaseBlock, libThumb, galleryBlock };
}
