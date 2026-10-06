import { z } from 'zod';

export const zConnection = z.object({
  endpoint: z.string().regex(/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/),
  token: z.string().regex(/^[a-f0-9]{64}$/),
  device: z.string().uuid(),
  version: z.number().int().nonnegative(),
  lastSync: z.string(),
});
export type SyncConnection = z.infer<typeof zConnection>;
export function parsePairing(text: string): SyncConnection {
  return zConnection.parse({ ...JSON.parse(text), device: crypto.randomUUID(), version: 0, lastSync: '' });
}
export async function upload(connection: SyncConnection, payload: string, signal: AbortSignal) {
  zConnection.parse(connection);
  const response = await fetch(connection.endpoint, {
    method: 'POST', credentials: 'omit', redirect: 'follow', signal,
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ token: connection.token, device: connection.device, version: connection.version, payload }),
  });
  if (!response.ok) throw new Error('No se pudo contactar con Drive.');
  const result = z.object({ ok: z.boolean(), version: z.number().int().nonnegative().optional(), error: z.string().optional() }).parse(await response.json());
  if (!result.ok || result.version === undefined) throw new Error(result.error === 'conflict' ? 'Conflicto de versiones. Reconectá para crear otra copia sin sobrescribir la anterior.' : 'Drive rechazó la sincronización. Revisá la conexión.');
  return { ...connection, version: result.version, lastSync: new Date().toISOString() };
}
