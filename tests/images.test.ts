import { expect, test } from 'vitest';
import { CATALOG } from '../src/data/exercises';
import { REAL_IMAGES } from '../src/data/images';
import { imageLabels } from '../src/components/media';

test('las 138 fichas del catálogo tienen imágenes asignadas', () => {
  expect(Object.keys(REAL_IMAGES).sort()).toEqual(Object.keys(CATALOG).sort());
});

test('serrato muestra inicio y final sin una fase intermedia redundante', () => {
  expect(imageLabels('serratus')).toEqual(['Inicio', 'Final']);
  expect(REAL_IMAGES.serratus.note).toContain('escápulas');
});

test('las posturas y secuencias conservan sus etiquetas apropiadas', () => {
  expect(imageLabels('chin_iso')).toEqual(['Posición']);
  expect(imageLabels('tri_iso')).toEqual(['Posición']);
  expect(imageLabels('tibialis')).toEqual(['Inicio', 'Medio', 'Final']);
  expect(imageLabels('sin-imagen')).toEqual(['Inicio', 'Medio', 'Final']);
  for (const id of Object.keys(REAL_IMAGES)) {
    const labels = imageLabels(id);
    expect(labels.length).toBeGreaterThan(0);
    expect(new Set(labels).size).toBe(labels.length);
  }
});
