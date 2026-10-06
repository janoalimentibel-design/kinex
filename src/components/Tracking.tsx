import { useEffect, useState } from 'react';
import { db } from '../db/instance';
import { toExportData } from '../db/bootstrap';
import { emptyTrainingProfile, zTrainingProfile, type TrainingProfile } from '../db/schema';
import { parsePairing, upload } from '../sync/protocol';
import type { Ctx } from './types';

const fields: [keyof TrainingProfile, string][] = [
  ['goals', 'Objetivos y deportes'], ['availability', 'Días y minutos disponibles'],
  ['equipment', 'Equipamiento'], ['reportedHistory', 'Antecedentes que vos reportás'],
  ['reportReference', 'Informe médico: fecha y referencia'], ['clinicianInstructions', 'Indicaciones del médico o fisioterapeuta'],
  ['currentSymptoms', 'Síntomas actuales y cuándo aparecen'], ['toleratedMovements', 'Movimientos tolerados y los que molestan'],
  ['preferences', 'Preferencias de entrenamiento'],
];
export default function Tracking({ ctx }: { ctx: Ctx }) {
  const [draft, setDraft] = useState(ctx.data.profile ?? emptyTrainingProfile());
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState('');
  const [pairing, setPairing] = useState('');
  const [epoch, setEpoch] = useState(0);
  const [status, setStatus] = useState('Sin conectar');
  const payload = JSON.stringify({ schemaVersion: 2, data: toExportData(ctx.data) });
  useEffect(() => { if (!dirty) setDraft(ctx.data.profile ?? emptyTrainingProfile()); }, [ctx.data.profile, dirty]);
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;
    const sync = async () => {
      try {
        const entry = await db.kv.get('syncConnection');
        if (stopped) return;
        if (!entry || entry.key !== 'syncConnection') { setStatus('Sin conectar'); return; }
        setStatus('Sincronización pendiente…');
        // A browser-wide lock prevents two tabs from racing the same device revision.
        await navigator.locks.request('kinex-private-upload', { signal: controller.signal }, async () => {
          const current = await db.kv.get('syncConnection');
          if (stopped || current?.key !== 'syncConnection') return;
          const freshPayload = await db.transaction('r', db.sessions, db.customExercises, db.kv, async () => {
            const plan = await db.kv.get('plan');
            const profile = await db.kv.get('profile');
            if (plan?.key !== 'plan') throw new Error('Missing plan');
            return JSON.stringify({ schemaVersion: 2, data: {
              sessions: await db.sessions.toArray(), customExercises: await db.customExercises.toArray(),
              plan: plan.value, ...(profile?.key === 'profile' ? { profile: profile.value } : {}),
            } });
          });
          const next = await upload(current.value, freshPayload, controller.signal);
          if (stopped) return;
          await db.transaction('rw', db.kv, async () => {
            const active = await db.kv.get('syncConnection');
            if (active?.key === 'syncConnection' && active.value.device === next.device && active.value.token === next.token) {
              await db.kv.put({ key: 'syncConnection', value: next });
            }
          });
          setStatus(`Sincronizado: ${new Date(next.lastSync).toLocaleString()}`);
        });
      } catch {
        if (!stopped) setStatus('Pendiente: no se confirmó el envío. Tu registro sigue guardado en este dispositivo. Se reintentará con la app abierta.');
      }
      if (!stopped) timer = setTimeout(sync, 60000);
    };
    timer = setTimeout(sync, 1500);
    return () => { stopped = true; clearTimeout(timer); controller.abort(); };
  }, [payload, epoch]);
  return <details className="wkcard">
    <summary>Perfil y seguimiento privado</summary>
    <h3>Tu perfil de entrenamiento</h3>
    <p>Información aportada por vos. Completarlo no modifica automáticamente los ejercicios ni verifica un diagnóstico.</p>
    {fields.map(([key, label]) => <div className="field" key={key}><label htmlFor={`profile-${key}`}>{label}</label><textarea id={`profile-${key}`} value={draft[key]} maxLength={key === 'reportedHistory' || key === 'clinicianInstructions' ? 8000 : 2000} onChange={e => { setDirty(true); setDraft({ ...draft, [key]: e.target.value }); }} /></div>)}
    <button className="btn btn-primary" onClick={async () => {
      try { await ctx.putProfile(zTrainingProfile.parse({ ...draft, updatedAt: new Date().toISOString() })); setDirty(false); setNotice('Perfil guardado en este dispositivo.'); }
      catch { setNotice('No se pudo guardar el perfil. Conservamos el texto para que reintentes.'); }
    }}>Guardar perfil</button>
    <p role="status">{notice}</p>
    <h3>Seguimiento privado en Drive</h3>
    <p>Al conectar, se enviarán tu historial, plan y perfil a tu Drive privado mientras la app esté abierta. Cada dispositivo mantiene su propia copia. No combina datos entre teléfonos.</p>
    <p role="status">{status}</p>
    <div className="field"><label htmlFor="pairing">Código de conexión personal</label><input id="pairing" type="password" autoComplete="off" value={pairing} onChange={e => setPairing(e.target.value)} /></div>
    <button className="btn btn-primary" disabled={!pairing} onClick={async () => {
      try { const value = parsePairing(pairing); await db.kv.put({ key: 'syncConnection', value }); setPairing(''); setEpoch(n => n + 1); }
      catch { setStatus('Código inválido o no se pudo guardar la conexión.'); }
    }}>Conectar y enviar mis datos</button>
    <button className="btn btn-soft" onClick={async () => { await db.kv.delete('syncConnection'); setEpoch(n => n + 1); setStatus('Desconectado. La copia ya enviada permanece en tu Drive.'); }}>Desconectar</button>
    <p>La clave queda en este navegador y no se incluye en los respaldos. La copia en Drive puede ser leída desde tu conexión de Drive cuando pidas revisar tu entrenamiento.</p>
  </details>;
}
