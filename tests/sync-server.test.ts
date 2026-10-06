import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { createHash } from 'node:crypto';
import { expect, test } from 'vitest';

test('server rejects unauthenticated and stale writes, and retries are idempotent', () => {
  const props = new Map<string, string>([['KINEX_TOKEN', 'a'.repeat(64)]]);
  let uploads = 0;
  const context = createContext({
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (text: string) => ({ setMimeType: () => JSON.parse(text) }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, hasLock: () => true, releaseLock: () => {} }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (key: string) => props.get(key), setProperty: (key: string, value: string) => props.set(key, value) }) },
    Utilities: { DigestAlgorithm: { SHA_256: '' }, computeDigest: (_: unknown, text: string) => createHash('sha256').update(text).digest(), base64Encode: (bytes: Buffer) => bytes.toString('base64') },
    ScriptApp: { getOAuthToken: () => 'test' },
    UrlFetchApp: { fetch: (url: string) => { if (url.includes('/upload/')) uploads++; return { getResponseCode: () => 200, getContentText: () => '{"id":"file"}' }; } },
  });
  runInContext(readFileSync(new URL('../integrations/google-drive/Code.gs', import.meta.url), 'utf8'), context);
  const send = (request: object) => { context.event = { postData: { contents: JSON.stringify(request) } }; return runInContext('doPost(event)', context); };
  const base = { token: 'a'.repeat(64), device: '01234567-0123-4123-8123-012345678901', version: 0, payload: JSON.stringify({ schemaVersion: 2, data: { sessions: [], customExercises: [], plan: {} } }) };
  expect(send({ ...base, token: 'wrong' }).ok).toBe(false); expect(uploads).toBe(0);
  expect(send(base)).toEqual({ ok: true, version: 1 });
  expect(send(base)).toEqual({ ok: true, version: 1 }); expect(uploads).toBe(1);
  expect(send({ ...base, payload: base.payload + ' ' })).toEqual({ ok: false, error: 'conflict' }); expect(uploads).toBe(1);
});
