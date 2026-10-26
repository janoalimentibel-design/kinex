import { useCallback, useEffect, useRef, useState } from 'react';
import { db } from '../db/instance';
import type { AppData } from '../db/bootstrap';
import { parsePairing, upload } from './protocol';

export function usePrivateSync(data: AppData | null) {
  const [status, setStatus] = useState('Sin conectar');
  const [busy, setBusy] = useState(false);
  const [pendingOverwrite, setPendingOverwrite] = useState(false);
  const running = useRef<Promise<void> | null>(null);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const send = useCallback((manual = true) => {
    if (running.current) return running.current;
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true);
    const work = async () => {
      try {
        const transfer = async () => {
          const current = await db.kv.get('syncConnection');
          if (current?.key !== 'syncConnection') { setStatus('Sin conectar: abrí Plan → Perfil y seguimiento privado.'); return; }
          setStatus('Enviando datos a Drive…');
          let sessionSignatures: Record<string, string> = {};
          const payload = await db.transaction('r', db.sessions, db.customExercises, db.kv, async () => {
            const plan = await db.kv.get('plan');
            const profile = await db.kv.get('profile');
            if (plan?.key !== 'plan') throw new Error('Missing plan');
            const sessions = await db.sessions.toArray();
            sessionSignatures = Object.fromEntries(sessions.map(session => [session.date, JSON.stringify(session)]));
            return JSON.stringify({ schemaVersion: 2, data: {
              sessions, customExercises: await db.customExercises.toArray(),
              plan: plan.value, ...(profile?.key === 'profile' ? { profile: profile.value } : {}),
            } });
          });
          const changedDates = current.value.syncedSessions
            ? Object.keys(current.value.syncedSessions).filter(date => current.value.syncedSessions?.[date] !== sessionSignatures[date])
            : current.value.lastSync ? Object.keys(sessionSignatures) : [];
          setPendingOverwrite(changedDates.length > 0);
          if (changedDates.length) {
            setStatus(`Cambios pendientes en un día ya enviado (${changedDates.join(', ')}). Tocá Enviar datos para confirmar el reemplazo en Drive.`);
            if (!manual || !window.confirm('Este día ya se envió y cambiaste sus datos. ¿Querés volver a enviar los datos y sobrescribir la copia de Drive con estos nuevos?')) return;
          }
          const next = { ...await upload(current.value, payload, abort.signal), syncedSessions: sessionSignatures };
          const saved = await db.transaction('rw', db.kv, async () => {
            const active = await db.kv.get('syncConnection');
            if (active?.key !== 'syncConnection' || active.value.device !== next.device || active.value.token !== next.token) return false;
            await db.kv.put({ key: 'syncConnection', value: next });
            return true;
          });
          if (saved && mounted.current && !abort.signal.aborted) {
            setPendingOverwrite(false);
            setStatus(`Enviado a Drive: ${new Date(next.lastSync).toLocaleString()}`);
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
    await send();
  };
  const disconnect = async () => {
    controller.current?.abort();
    if (running.current) await running.current;
    await db.kv.delete('syncConnection');
    setPendingOverwrite(false);
    setStatus('Desconectado. La copia ya enviada permanece en tu Drive.');
  };
  return { status, busy, pendingOverwrite, send, connect, disconnect };
}
