import { z } from 'zod';

export const zConnection = z.object({
  endpoint: z.string().regex(/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/),
  token: z.string().regex(/^[a-f0-9]{64}$/),
  device: z.string().uuid(),
  version: z.number().int().nonnegative(),
  lastSync: z.string(),
  syncedSessions: z.record(z.string(), z.string()).optional(),
  sessionReview: z.record(z.string(), z.string()).optional(),
  sessionReviewOrigin: z.enum(['observed', 'confirmed']).optional(),
});
export type SyncConnection = z.infer<typeof zConnection>;
function deviceId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
export function parsePairing(text: string): SyncConnection {
  const cleaned = text.replace(/^\uFEFF/, '').trim();
  if (/^[a-f0-9]{64}$/i.test(cleaned)) throw new Error('Cargaste solo la clave. Elegí CONEXION-KINEX.txt, que contiene la dirección y la clave juntas.');
  let parsed: Record<string, unknown>;
  try { parsed = JSON.parse(cleaned); }
  catch { throw new Error('El código no es válido. Elegí el archivo CONEXION-KINEX.txt en Cargar código desde archivo.'); }
  if (!parsed || typeof parsed !== 'object') throw new Error('Elegí el archivo CONEXION-KINEX.txt.');
  const result = zConnection.safeParse({
    endpoint: typeof parsed.endpoint === 'string' ? parsed.endpoint.trim() : parsed.endpoint,
    token: typeof parsed.token === 'string' ? parsed.token.trim() : parsed.token,
    device: deviceId(), version: 0, lastSync: '',
  });
  if (!result.success) throw new Error('El archivo no contiene una conexión válida. Elegí CONEXION-KINEX.txt.');
  return result.data;
}
export async function upload(connection: SyncConnection, payload: string, signal: AbortSignal) {
  zConnection.parse(connection);
  const request = new AbortController();
  const cancel = () => request.abort();
  signal.addEventListener('abort', cancel, { once: true });
  if (signal.aborted) request.abort();
  const timeout = setTimeout(() => request.abort(), 20000);
  try {
  const response = await fetch(connection.endpoint, {
    method: 'POST', credentials: 'omit', redirect: 'follow', signal: request.signal,
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ token: connection.token, device: connection.device, version: connection.version, payload }),
  });
  if (!response.ok) throw new Error('No se pudo contactar con Drive.');
  const result = z.object({ ok: z.boolean(), version: z.number().int().nonnegative().optional(), error: z.string().optional() }).parse(await response.json());
  if (!result.ok || result.version === undefined) throw new Error(result.error === 'conflict' ? 'Conflicto de versiones. Reconectá para crear otra copia sin sobrescribir la anterior.' : 'Drive rechazó la sincronización. Revisá la conexión.');
  return { ...connection, version: result.version, lastSync: new Date().toISOString() };
  } catch (error) {
    if (request.signal.aborted && !signal.aborted) throw new Error('Google no respondió en 20 segundos. Tu conexión quedó guardada; tocá Reintentar envío.');
    throw error;
  } finally {
    clearTimeout(timeout); signal.removeEventListener('abort', cancel);
  }
}

