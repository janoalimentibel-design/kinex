import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { EX, FORMATS, GROUPS } from '../src/data/exercises.js';
import { REAL_IMAGES } from '../src/data/images.js';
import { createSession, isModeCompatible } from '../src/session.js';

test('las cuatro vistas y controles principales siguen presentes', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const app = fs.readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  for (const id of ['view-today', 'view-lib', 'view-hist', 'view-plan']) assert.match(html, new RegExp(id));
  for (const label of ['Marcar hecha', 'Exportar backup', 'Importar', 'Copiar resumen']) assert.match(html + app, new RegExp(label));
});

test('formatos y grupos mantienen el contrato de A2.6', () => {
  assert.deepEqual(Object.keys(FORMATS), ['base', 'ext', 'long']);
  assert.equal(FORMATS.base.perGroup, 2);
  assert.equal(FORMATS.ext.extraOne, true);
  assert.equal(FORMATS.long.perGroup, 3);
  assert.equal(Object.keys(GROUPS).length, 7);
});

test('la sesión inicial conserva modo mixto y dos grupos', () => {
  const session = createSession('2026-06-27', [['pierna', 'hombro']]);
  assert.equal(session.mode, 'mix');
  assert.equal(session.format, 'base');
  assert.equal(session.groups.length, 2);
});

test('compatibilidad de modo respeta peso, sinpeso y mixto', () => {
  assert.equal(isModeCompatible(EX.pushup, 'sinpeso'), true);
  assert.equal(isModeCompatible(EX.pushup, 'peso'), false);
  assert.equal(isModeCompatible(EX.pushup, 'mix'), true);
});

test('Batch 1 tiene tres assets externos distintos por ejercicio', () => {
  for (const id of ['pushup', 'pullup', 'step_bajo']) {
    const phases = Object.values(REAL_IMAGES[id].phases);
    assert.equal(phases.length, 3);
    assert.equal(new Set(phases).size, 3);
    for (const asset of phases) {
      assert.equal(asset.startsWith('data:'), false);
      assert.equal(fs.existsSync(new URL('../' + asset.slice(2), import.meta.url)), true, id + ': falta ' + asset);
    }
  }
});

test('Batch 2 tiene tres assets externos distintos por ejercicio', () => {
  for (const id of ['dead_bug', 'bird_dog', 'wall_sit']) {
    const phases = Object.values(REAL_IMAGES[id].phases);
    assert.equal(phases.length, 3);
    assert.equal(new Set(phases).size, 3);
    for (const asset of phases) {
      assert.equal(asset.startsWith('data:'), false);
      assert.equal(fs.existsSync(new URL('../' + asset.slice(2), import.meta.url)), true, id + ': falta ' + asset);
    }
  }
});
