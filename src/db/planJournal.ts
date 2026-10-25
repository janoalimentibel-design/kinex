import { z } from 'zod';
import { zPlan, type Plan } from './schema';

export const PLAN_JOURNAL_KEY = 'kinex:pending-plan';
type JournalStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const zEditablePlan = zPlan.pick({ week: true, focus: true, secondary: true, objective: true, rule: true, notes: true }).partial();
const zPendingPlan = z.object({ id: z.string(), patch: zEditablePlan });
export type PendingPlan = z.infer<typeof zPendingPlan>;

/** A tab-local write-ahead record survives reload before IndexedDB commits. */
export function readPendingPlan(storage: JournalStorage): PendingPlan | null {
  const raw = storage.getItem(PLAN_JOURNAL_KEY);
  if (!raw) return null;
  try {
    const result = zPendingPlan.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch { return null; }
}

export function stagePlanPatch(storage: JournalStorage, patch: Partial<Plan>): PendingPlan {
  const pending: PendingPlan = {
    id: crypto.randomUUID(),
    patch: { ...readPendingPlan(storage)?.patch, ...zEditablePlan.parse(patch) },
  };
  storage.setItem(PLAN_JOURNAL_KEY, JSON.stringify(pending));
  return pending;
}

/** An earlier commit must not discard edits queued while it was being saved. */
export function acknowledgePlanPatch(storage: JournalStorage, id: string): void {
  if (readPendingPlan(storage)?.id === id) storage.removeItem(PLAN_JOURNAL_KEY);
}
