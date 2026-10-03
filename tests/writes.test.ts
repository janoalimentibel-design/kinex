import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { expect, test } from 'vitest';
import { bootstrap, replaceAll } from '../src/db/bootstrap';
import { createDatabase } from '../src/db/database';
import { createDataWriter } from '../src/db/writes';
import { createSession } from '../src/logic/session';
import { editExercise } from '../src/logic/exerciseEdits';
import { CATALOG } from '../src/data/exercises';

let count = 0;
async function fixture() {
  const db = createDatabase(`writes-${++count}`);
  const { data } = await bootstrap(db, null);
  const session = { ...createSession('2026-10-01'), programmed: ['pec_deck', 'dumbbell_curl'] };
  await db.sessions.put(session);
  data.sessions[session.date] = session;
  return { db, data, session };
}

test('rapid taps and independent writers preserve both checks and their undo snapshots', async () => {
  const { db, data, session } = await fixture();
  const write = createDataWriter(db, data, () => {});
  const secondTab = createDataWriter(db, data, () => {});
  const toggle = (id: string) => (current: typeof data) => ({ ...current, sessions: { ...current.sessions, [session.date]: editExercise(current.sessions[session.date], { type: 'toggle', id }, CATALOG, current.sessions) } });
  await Promise.all([write(toggle('pec_deck')), secondTab(toggle('dumbbell_curl'))]);
  expect((await db.sessions.get(session.date))?.completed).toEqual({ pec_deck: true, dumbbell_curl: true });
  expect(await db.sessionRevisions.count()).toBe(2);
});

test('a failed edit rolls back both session and snapshot and the queue can continue', async () => {
  const { db, data, session } = await fixture();
  const write = createDataWriter(db, data, () => {});
  await expect(write(async (current) => {
    await db.sessions.put({ ...session, completed: { pec_deck: true } });
    throw new Error('simulated failure');
    return current;
  })).rejects.toThrow('simulated failure');
  expect(await db.sessions.get(session.date)).toEqual(session);
  expect(await db.sessionRevisions.count()).toBe(0);
  await write(current => ({ ...current, sessions: { ...current.sessions, [session.date]: { ...session, saved: true } } }));
  expect((await db.sessions.get(session.date))?.saved).toBe(true);
});

test('import keeps previous sessions as restorable snapshots and rolls back on failure', async () => {
  const { db, data, session } = await fixture();
  const write = createDataWriter(db, data, () => {});
  await expect(write(async () => {
    await replaceAll(db, { sessions: [], customExercises: [], plan: data.plan }, 'backup-v2');
    throw new Error('abort import');
  })).rejects.toThrow('abort import');
  expect(await db.sessions.get(session.date)).toEqual(session);
  await replaceAll(db, { sessions: [], customExercises: [], plan: data.plan }, 'backup-v2');
  expect(await db.sessions.count()).toBe(0);
  expect((await db.sessionRevisions.toArray())[0].session).toEqual(session);
});

test('database v2 upgrades without rewriting the existing Monday', async () => {
  const name = `upgrade-${++count}`;
  const old = new Dexie(name);
  old.version(2).stores({ sessions: 'date', customExercises: 'id', kv: 'key' });
  const monday = { ...createSession('2026-09-28'), groups: ['pecho', 'bicep'], completed: { pec_deck: true } };
  await old.table('sessions').put(monday);
  old.close();
  const db = createDatabase(name);
  expect(await db.sessions.get(monday.date)).toEqual(monday);
  expect(await db.sessionRevisions.count()).toBe(0);
});
