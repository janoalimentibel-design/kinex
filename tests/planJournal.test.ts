import 'fake-indexeddb/auto';
import { expect, test } from 'vitest';
import { bootstrap } from '../src/db/bootstrap';
import { createDatabase } from '../src/db/database';
import { createDataWriter } from '../src/db/writes';
import { acknowledgePlanPatch, PLAN_JOURNAL_KEY, readPendingPlan, stagePlanPatch } from '../src/db/planJournal';

function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

test('a reload before the queued write starts recovers only the pending plan fields', async () => {
  const journal = storage();
  const db = createDatabase('plan-journal-reload');
  const { data } = await bootstrap(db, null);
  const pending = stagePlanPatch(journal, { focus: 'Mi plan personal' });
  // The old page disappeared before its IndexedDB callback ran. Another writer
  // committed an unrelated field; recovery must merge with that current value.
  await db.kv.put({ key: 'plan', value: { ...data.plan, secondary: 'Otra pestaña' } });
  const reloaded = (await bootstrap(db, null)).data;
  const write = createDataWriter(db, reloaded, () => {});
  await write(current => ({ ...current, plan: { ...current.plan, ...readPendingPlan(journal)!.patch } }));
  acknowledgePlanPatch(journal, pending.id);
  const saved = await db.kv.get('plan');
  expect(saved?.key === 'plan' && saved.value).toMatchObject({ focus: 'Mi plan personal', secondary: 'Otra pestaña' });
  expect(journal.getItem(PLAN_JOURNAL_KEY)).toBeNull();
  await db.delete();
});

test('confirming an earlier save never clears the newer edit, including empty fields', () => {
  const journal = storage();
  const first = stagePlanPatch(journal, { focus: 'Primero' });
  const next = stagePlanPatch(journal, { focus: '', notes: 'Nuevo' });
  acknowledgePlanPatch(journal, first.id);
  expect(readPendingPlan(journal)).toEqual(next);
  expect(next.patch).toEqual({ focus: '', notes: 'Nuevo' });
  acknowledgePlanPatch(journal, next.id);
  expect(readPendingPlan(journal)).toBeNull();
});

test('a failed IndexedDB transaction keeps the recovery record for retry', async () => {
  const journal = storage();
  const db = createDatabase('plan-journal-failure');
  const { data } = await bootstrap(db, null);
  const pending = stagePlanPatch(journal, { focus: 'Recuperable' });
  const write = createDataWriter(db, data, () => {});
  await expect(write(async current => {
    await db.kv.put({ key: 'plan', value: { ...current.plan, ...pending.patch } });
    throw new Error('simulated transaction failure');
  })).rejects.toThrow('simulated transaction failure');
  expect(readPendingPlan(journal)).toEqual(pending);
  const unchanged = await db.kv.get('plan');
  expect(unchanged?.key === 'plan' && unchanged.value).toEqual(data.plan);
  await db.delete();
});

test('quota errors are propagated and cannot produce a successful recovery record', () => {
  const journal = storage();
  journal.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); };
  expect(() => stagePlanPatch(journal, { focus: 'No protegido' })).toThrow('Full');
  expect(readPendingPlan(journal)).toBeNull();
});

test('recovery never rolls back routine metadata transported by a full plan patch', () => {
  const journal = storage();
  stagePlanPatch(journal, { focus: 'Manual', routineRevision: 'old-revision', reviewedWeek: 'old-week', autoWeekly: false });
  expect(readPendingPlan(journal)?.patch).toEqual({ focus: 'Manual' });
});

test('a successful plan replacement supersedes its captured draft, not a newer edit', () => {
  const journal = storage();
  const superseded = stagePlanPatch(journal, { focus: 'Before import' });
  // This acknowledgment runs only after import/reviewed routine commits.
  acknowledgePlanPatch(journal, superseded.id);
  expect(readPendingPlan(journal)).toBeNull();
  const beforeReview = stagePlanPatch(journal, { focus: 'Before review' });
  const newer = stagePlanPatch(journal, { focus: 'After review clicked' });
  acknowledgePlanPatch(journal, beforeReview.id);
  expect(readPendingPlan(journal)).toEqual(newer);
});
