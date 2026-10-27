import 'fake-indexeddb/auto';
import { expect, test } from 'vitest';
import { bootstrap, replaceAll, toExportData } from '../src/db/bootstrap';
import { parseBackup, serializeBackup } from '../src/db/backup';
import { createDatabase } from '../src/db/database';
import { createDataWriter } from '../src/db/writes';
import { createSession } from '../src/logic/session';
import { createDefaultPlan, type Session } from '../src/db/schema';

const gymDay = (): Session => ({ ...createSession('2026-10-27'), gymMinutes: 80, trainingCalories: 400, trainingCaloriesIncludeAerobic: true, aerobicActivities: [{ id: 'bike', type: 'Bici', minutes: 20, calories: 125, distanceKm: 6 }] });

test('backup e importación conservan estancia gym, cardio y diferencia entre vacío y cero', async () => {
  const sessions = [gymDay(), { ...createSession('2026-10-26'), gymMinutes: 0, trainingCalories: 0 }, createSession('2026-10-25')];
  const backup = parseBackup(serializeBackup({ sessions, customExercises: [], plan: createDefaultPlan() }));
  expect(backup.data.sessions).toEqual(sessions);
  const db = createDatabase('gym-backup-roundtrip');
  try {
    await replaceAll(db, backup.data, 'backup-v2');
    const restored = toExportData((await bootstrap(db, null)).data);
    expect(restored.sessions.find(session => session.date === '2026-10-27')).toMatchObject(gymDay());
    expect(restored.sessions.find(session => session.date === '2026-10-26')?.gymMinutes).toBe(0);
    expect(restored.sessions.find(session => session.date === '2026-10-25')?.gymMinutes).toBeUndefined();
  } finally { db.close(); await db.delete(); }
});

test('ediciones persistidas reemplazan tiempo y calorías sin sumar duplicados y conservan revisión previa', async () => {
  const db = createDatabase('gym-repeated-save');
  try {
    const { data } = await bootstrap(db, null);
    const initial = gymDay();
    await db.sessions.put(initial);
    data.sessions[initial.date] = initial;
    const write = createDataWriter(db, data, () => {});
    const patch = { gymMinutes: 90, trainingCalories: 450 };
    const edit = (current: typeof data) => ({ ...current, sessions: { ...current.sessions, [initial.date]: { ...current.sessions[initial.date], ...patch } } });
    await write(edit);
    await write(edit);
    const restored = (await bootstrap(db, null)).data.sessions[initial.date];
    expect(restored.gymMinutes).toBe(90);
    expect(restored.trainingCalories).toBe(450);
    expect(restored.aerobicActivities).toEqual(initial.aerobicActivities);
    expect((await db.sessionRevisions.toArray()).some(item => item.session.gymMinutes === 80)).toBe(true);
    expect(await db.sessions.count()).toBe(1);
  } finally { db.close(); await db.delete(); }
});

test('backup anterior sigue sin inventar duración gym al importar', async () => {
  const old = createSession('2026-07-03');
  const parsed = parseBackup(serializeBackup({ sessions: [old], customExercises: [], plan: createDefaultPlan() }));
  expect(parsed.data.sessions[0]).not.toHaveProperty('gymMinutes');
  const db = createDatabase('gym-old-backup');
  try {
    await replaceAll(db, parsed.data, 'backup-v2');
    expect((await bootstrap(db, null)).data.sessions[old.date]).not.toHaveProperty('gymMinutes');
  } finally { db.close(); await db.delete(); }
});
