import { afterEach, expect, test, vi } from 'vitest';
import { parsePairing, upload } from '../src/sync/protocol';
import { toAppData, toExportData } from '../src/db/bootstrap';
import { createDefaultPlan, emptyTrainingProfile, zV2Data } from '../src/db/schema';
const pairing = { endpoint: 'https://script.google.com/macros/s/test/exec', token: 'a'.repeat(64) };
afterEach(() => vi.unstubAllGlobals());
test('rejects destinations outside personal Apps Script and invalid tokens', () => {
  expect(() => parsePairing(JSON.stringify({ ...pairing, endpoint: 'https://example.com/collect' }))).toThrow();
  expect(() => parsePairing(JSON.stringify({ ...pairing, token: 'short' }))).toThrow();
});
test('new pairings isolate devices and do not trust injected revisions', () => {
  const a = parsePairing(JSON.stringify({ ...pairing, version: 99 }));
  const b = parsePairing(JSON.stringify(pairing));
  expect(a.device).not.toBe(b.device); expect(a.version).toBe(0);
});
test('only acknowledges a successful server response', async () => {
  const connection = parsePairing(JSON.stringify(pairing));
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: false, error: 'conflict' }) }));
  await expect(upload(connection, '{}', new AbortController().signal)).rejects.toThrow('Conflicto');
  expect(connection.lastSync).toBe('');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, version: 1 }) }));
  expect((await upload(connection, '{}', new AbortController().signal)).version).toBe(1);
});
test('profile round trips and older backups remain valid; credentials never export', () => {
  const old = { sessions: [], customExercises: [], plan: createDefaultPlan() };
  expect(zV2Data.parse(old).profile).toBeUndefined();
  const profile = { ...emptyTrainingProfile(), goals: 'Volver al deporte' };
  const app = { ...toAppData({ ...old, profile }), syncConnection: pairing };
  const exported = toExportData(app);
  expect(zV2Data.parse(exported).profile).toEqual(profile);
  expect(JSON.stringify(exported)).not.toContain(pairing.token);
});
