import { useCallback, useEffect, useRef, useState } from 'react';
import { db } from '../db/instance';
import type { AppData } from '../db/bootstrap';
import { parsePairing, upload, type SyncConnection } from './protocol';
import { changedRecordedDates, daySyncState, reviewBaseline, sessionBaselines } from './sessionReview';
import type { Session } from '../db/schema';

export function usePrivateSync(data: AppData | null) {
  const [status, setStatus] = useState('Sin conectar');
  const [connection, setConnection] = useState<SyncConnection | null>(null);
  const currentData = useRef(data);
  currentData.current = data;
  const [busy, setBusy] = useState(false);
  const [pendingOverwrite, setPendingOverwrite] = useState(false);
  const [pendingDates, setPendingDates] = useState<string[]>([]);
  const baselineReady = useRef<Promise<void> | null>(null);
  const running = useRef<Promise<void> | null>(null);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const send = useCallback((manual = true, date?: string) => {
    if (running.current) return running.current;
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true);
    const work = async () => {
      try {
        const transfer = async () => {
          if (baselineReady.current) await baselineReady.current;
          const current = await db.kv.get('syncConnection');
          if (current?.key !== 'syncConnection') { setConnection(null); setStatus('Sin conectar: abrí Plan → Perfil y seguimiento privado.'); return; }
          setConnection(current.value);
          let sessionSignatures: Record<string, string> = {};
          let sessions: Session[] = [];
          const payload = await db.transaction('r', db.sessions, db.customExercises, db.kv, async () => {
            const plan = await db.kv.get('plan');
            const profile = await db.kv.get('profile');
            if (plan?.key !== 'plan') throw new Error('Missing plan');
            sessions = await db.sessions.toArray();
            sessionSignatures = Object.fromEntries(sessions.map(session => [session.date, JSON.stringify(session)]));
            return JSON.stringify({ schemaVersion: 2, data: {
              sessions, customExercises: await db.customExercises.toArray(),
              plan: plan.value, ...(profile?.key === 'profile' ? { profile: profile.value } : {}),
            } });
          });
          const review = reviewBaseline(current.value, sessions);
          const changedDates = changedRecordedDates(review.baseline, sessions);
          setPendingOverwrite(changedDates.length > 0);
          setPendingDates(changedDates);
          const requiresFirstReview = review.origin === 'observed';
          if (!manual && (requiresFirstReview || changedDates.length)) {
            setStatus(changedDates.length ? 'Cambios guardados en este dispositivo. Podés enviarlos cuando quieras.' : 'Conectado a Drive.');
            return;
          }
          if (manual && (requiresFirstReview || changedDates.length)) {
            const selected = date && changedDates.includes(date) ? date : changedDates[0];
            const label = selected ? new Date(`${selected}T12:00:00`).toLocaleDateString('es', { day: 'numeric', month: 'long' }) : '';
            const question = requiresFirstReview
              ? 'Ya existe una copia anterior en Drive. ¿Querés actualizarla con los datos guardados en este dispositivo?'
              : `Cambiaste el registro del ${label}, que ya habías enviado.${changedDates.length > 1 ? ` También hay cambios en otros ${changedDates.length - 1} días.` : ''} ¿Querés volver a enviar los datos y actualizar la copia de Drive?`;
            if (!window.confirm(question)) {
              setStatus('Cambios guardados en este dispositivo. La copia de Drive se conserva.');
              return;
            }
          }
          setStatus('Enviando datos a Drive…');
          const next = { ...await upload(current.value, payload, abort.signal), syncedSessions: sessionSignatures,
            sessionReview: sessionBaselines(sessions), sessionReviewOrigin: 'confirmed' as const };
          const saved = await db.transaction('rw', db.kv, async () => {
            const active = await db.kv.get('syncConnection');
            if (active?.key !== 'syncConnection' || active.value.device !== next.device || active.value.token !== next.token) return false;
            await db.kv.put({ key: 'syncConnection', value: next });
            return true;
          });
          if (saved && mounted.current && !abort.signal.aborted) {
            setConnection(next);
            const remaining = changedRecordedDates(next.sessionReview, Object.values(currentData.current?.sessions ?? {}));
            setPendingOverwrite(remaining.length > 0);
            setPendingDates(remaining);
            setStatus(remaining.length ? 'Hay cambios nuevos guardados en este dispositivo, pendientes de enviar.' : `Enviado a Drive: ${new Date(next.lastSync).toLocaleString()}`);
          }
        };
        if (navigator.locks?.request) await navigator.locks.request('kinex-private-upload', { signal: abort.signal }, transfer);
        else await transfer(); // Server revisions still reject conflicting writes.
      } catch (error) {
        if (mounted.current && !abort.signal.aborted) setStatus(error instanceof Error && (error.message.startsWith('Conflicto') || error.message.startsWith('Google no respondió') || error.message.startsWith('Drive rechazó'))
          ? error.message : 'Pendiente: no se confirmó el envío. Tus datos siguen guardados en este dispositivo. Podés reintentar.');
      } finally {
        running.current = null;
        if (mounted.current) setBusy(false);
      }
    };
    running.current = work();
    return running.current;
  }, []);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; controller.current?.abort(); };
  }, []);
  useEffect(() => {
    if (!data) return;
    if (!baselineReady.current) {
      const observed = Object.values(data.sessions);
      baselineReady.current = db.transaction('rw', db.kv, async () => {
        const active = await db.kv.get('syncConnection');
        if (active?.key !== 'syncConnection') { if (mounted.current) setConnection(null); return; }
        if (active.value.sessionReview && active.value.sessionReviewOrigin) { if (mounted.current) setConnection(active.value); return; }
        const review = reviewBaseline(active.value, observed);
        const initialized = { ...active.value, sessionReview: review.baseline, sessionReviewOrigin: review.origin };
        await db.kv.put({ key: 'syncConnection', value: initialized });
        if (mounted.current) setConnection(initialized);
      });
      // Failure remains retryable; never invent a successful upload.
      void baselineReady.current.catch(() => { baselineReady.current = null; });
    }
    // Do not abort an upload when a new local change arrives: retain its server revision.
    let stopped = false;
    const timer = setTimeout(async () => {
      if (running.current) await running.current;
      if (stopped) return;
      const connection = await db.kv.get('syncConnection');
      if (!stopped && connection) void send(false);
    }, 1500);
    return () => { stopped = true; clearTimeout(timer); };
  }, [data, send]);
  useEffect(() => {
    const retry = async () => { if (await db.kv.get('syncConnection')) void send(false); };
    const timer = setInterval(retry, 60000);
    window.addEventListener('online', retry);
    return () => { clearInterval(timer); window.removeEventListener('online', retry); };
  }, [send]);
  const connect = async (text: string) => {
    const connection = parsePairing(text);
    controller.current?.abort();
    if (running.current) await running.current;
    await db.kv.put({ key: 'syncConnection', value: connection });
    setConnection(connection);
    await send();
  };
  const disconnect = async () => {
    controller.current?.abort();
    if (running.current) await running.current;
    await db.kv.delete('syncConnection');
    setConnection(null);
    setPendingOverwrite(false);
    setPendingDates([]);
    setStatus('Desconectado. La copia ya enviada permanece en tu Drive.');
  };
  const localPending = connection && data ? changedRecordedDates(reviewBaseline(connection, Object.values(data.sessions)).baseline, Object.values(data.sessions)) : pendingDates;
  const getDaySyncState = (date: string) => daySyncState(connection, data?.sessions[date], date);
  const currentStatus = localPending.length && status.startsWith('Enviado a Drive:') ? 'Cambios guardados en este dispositivo, pendientes de enviar.' : status;
  return { status: currentStatus, busy, connected: Boolean(connection), pendingOverwrite: connection && data ? localPending.length > 0 : pendingOverwrite, pendingDates: localPending, getDaySyncState, send, connect, disconnect };
}
