import { useEffect, useState } from 'react';
import { emptyTrainingProfile, zTrainingProfile, type TrainingProfile } from '../db/schema';
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
  const { status } = ctx.sync;
  useEffect(() => { if (!dirty) setDraft(ctx.data.profile ?? emptyTrainingProfile()); }, [ctx.data.profile, dirty]);
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
    <div className="field"><label htmlFor="connection-file">Cargar código desde archivo</label><input id="connection-file" type="file" accept=".json,.txt,application/json,text/plain" onChange={async e => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 10000) { setNotice('El archivo de conexión es demasiado grande.'); return; }
      try { setPairing(await file.text()); setNotice('Código cargado. Tocá Conectar y enviar mis datos.'); }
      catch { setNotice('No se pudo leer el archivo de conexión.'); }
    }} /></div>
    <button className="btn btn-primary" disabled={!pairing} onClick={async () => {
      try { await ctx.sync.connect(pairing); setPairing(''); }
      catch { setNotice('Código inválido o no se pudo guardar la conexión.'); }
    }}>Conectar y enviar mis datos</button>
    <button className="btn btn-soft" onClick={async () => { try { await ctx.sync.disconnect(); } catch { setNotice('No se pudo desconectar. Reintentá.'); } }}>Desconectar</button>
    <p>La clave queda en este navegador y no se incluye en los respaldos. La copia en Drive puede ser leída desde tu conexión de Drive cuando pidas revisar tu entrenamiento.</p>
  </details>;
}
