// Todos los bottom-sheets de la app — ports de los open* de A2.8.
// Nuevo respecto de A2.8: ImportPreviewSheet (vista previa antes de reemplazar datos).
import { useState } from 'react';
import { COMBOS, FORMATS, GROUPS, PROGRESSIONS } from '../data/exercises';
import type { ParsedBackup } from '../db/backup';
import type { CustomExercise, Energy, GroupId, Level } from '../db/schema';
import { buildExerciseList, candidates } from '../logic/session';
import { GalleryBlock } from './media';
import type { Ctx, ModalState } from './types';

export function Sheet({ modal, ctx }: { modal: NonNullable<ModalState>; ctx: Ctx }) {
  switch (modal.type) {
    case 'combo': return <ComboSheet ctx={ctx} />;
    case 'addToGroup': return <AddToGroupSheet ctx={ctx} group={modal.group} />;
    case 'replace': return <ReplaceSheet ctx={ctx} origId={modal.origId} group={modal.group} />;
    case 'saveSession': return <SaveSessionSheet ctx={ctx} />;
    case 'libInfo': return <LibInfoSheet ctx={ctx} id={modal.id} />;
    case 'addCustom': return <AddCustomSheet ctx={ctx} />;
    case 'summary': return <SummarySheet text={modal.text} />;
    case 'importPreview': return <ImportPreviewSheet ctx={ctx} parsed={modal.parsed} />;
  }
}

function ComboSheet({ ctx }: { ctx: Ctx }) {
  const [picked, setPicked] = useState<GroupId[]>([...ctx.session.groups]);

  const toggle = (g: GroupId) =>
    setPicked((a) => {
      if (a.includes(g)) return a.filter((x) => x !== g);
      const next = a.length >= 2 ? a.slice(1) : a.slice();
      return [...next, g];
    });

  const apply = (groups: [GroupId, GroupId]) => {
    ctx.patchSession({ groups, completed: {}, replacements: {}, extras: [], saved: false });
    ctx.setModal(null);
  };

  const format = FORMATS[ctx.session.format];

  return (
    <>
      <div className="grip"></div>
      <h3>Cambiar grupos</h3>
      <div className="sh-sub">Elegí 2 grupos para esta sesión.</div>
      <div className="grpchips">
        {(Object.entries(GROUPS) as [GroupId, (typeof GROUPS)[GroupId]][]).map(([k, g]) => (
          <div key={k} className={`grpchip ${picked.includes(k) ? 'on' : ''}`} onClick={() => toggle(k)}>{g.label}</div>
        ))}
      </div>
      <button
        className="btn btn-primary"
        onClick={() => {
          if (picked.length !== 2) { alert('Elegí 2 grupos.'); return; }
          apply([picked[0], picked[1]]);
        }}
      >
        Aplicar
      </button>
      <div className="sh-sub" style={{ marginTop: 16 }}>Combinaciones rápidas</div>
      {COMBOS.map((c, i) => (
        <div className="swap-item" key={i} onClick={() => apply([c[0], c[1]])}>
          <div className="si-n">
            <div className="nm">{GROUPS[c[0]].label} + {GROUPS[c[1]].label}</div>
            <div className="mt">{format.duration} · {format.meta}</div>
          </div>
          <div className="si-add">usar →</div>
        </div>
      ))}
    </>
  );
}

function AddToGroupSheet({ ctx, group }: { ctx: Ctx; group: GroupId }) {
  const current = buildExerciseList(ctx.session, ctx.allEx, ctx.data.sessions).map((x) => x.id);
  const opts = candidates(ctx.allEx, group, ctx.session.mode, true).filter((e) => !current.includes(e.id));

  const add = (id: string) => {
    if (!ctx.session.extras.includes(id)) ctx.patchSession({ extras: [...ctx.session.extras, id], saved: false });
    ctx.setModal(null);
  };

  return (
    <>
      <div className="grip"></div>
      <h3>{GROUPS[group].label} · agregar</h3>
      <div className="sh-sub">Incluye ejercicios avanzados para elegir manualmente.</div>
      {opts.length ? opts.map((e) => (
        <div className="swap-item" key={e.id} onClick={() => add(e.id)}>
          <div className="si-n">
            <div className="nm">{e.name}</div>
            <div className="mt">{e.sets}×{e.reps} · {e.level}</div>
          </div>
          <div className="si-add">+ sumar</div>
        </div>
      )) : <div className="empty">No hay más opciones en este modo.</div>}
    </>
  );
}

function ReplaceSheet({ ctx, origId, group }: { ctx: Ctx; origId: string; group: GroupId }) {
  const opts = candidates(ctx.allEx, group, ctx.session.mode, true).filter((e) => e.id !== origId);

  const replace = (newId: string) => {
    ctx.patchSession({ replacements: { ...ctx.session.replacements, [origId]: newId }, saved: false });
    ctx.setModal(null);
  };

  return (
    <>
      <div className="grip"></div>
      <h3>Cambiar ejercicio</h3>
      <div className="sh-sub">Reemplaza por otro de {GROUPS[group].label}.</div>
      {opts.map((e) => (
        <div className="swap-item" key={e.id} onClick={() => replace(e.id)}>
          <div className="si-n">
            <div className="nm">{e.name}</div>
            <div className="mt">{e.sets}×{e.reps} · {e.level} · {e.tags.slice(0, 3).join(' · ')}</div>
          </div>
          <div className="si-add">cambiar →</div>
        </div>
      ))}
    </>
  );
}

function SaveSessionSheet({ ctx }: { ctx: Ctx }) {
  const m = ctx.session.metrics;
  const [lumbarBefore, setLumbarBefore] = useState(String(m?.lumbarBefore ?? 0));
  const [lumbarAfter, setLumbarAfter] = useState(String(m?.lumbarAfter ?? 0));
  const [knee, setKnee] = useState(String(m?.knee ?? 0));
  const [energy, setEnergy] = useState<Energy>(m?.energy ?? 'media');
  const [notes, setNotes] = useState(m?.notes ?? '');

  const score = (v: string) => Math.min(10, Math.max(0, Math.round(Number(v) || 0)));

  const save = () => {
    const exerciseLog = buildExerciseList(ctx.session, ctx.allEx, ctx.data.sessions).map((entry) => ({
      id: entry.id,
      name: ctx.allEx[entry.id]?.name ?? entry.id,
      group: entry.group,
      completed: Boolean(ctx.session.completed[entry.id]),
    }));
    ctx.patchSession({
      metrics: { lumbarBefore: score(lumbarBefore), lumbarAfter: score(lumbarAfter), knee: score(knee), energy, notes: notes.trim() },
      saved: true,
      exerciseLog,
    });
    ctx.setModal(null);
  };

  return (
    <>
      <div className="grip"></div>
      <h3>Guardar sesión</h3>
      <div className="sh-sub">Esto queda en el historial del celular.</div>
      <div className="field-row">
        <div className="field"><label>Lumbar antes</label><input type="number" min={0} max={10} value={lumbarBefore} onChange={(e) => setLumbarBefore(e.target.value)} /></div>
        <div className="field"><label>Lumbar después</label><input type="number" min={0} max={10} value={lumbarAfter} onChange={(e) => setLumbarAfter(e.target.value)} /></div>
      </div>
      <div className="field-row">
        <div className="field"><label>Rodilla</label><input type="number" min={0} max={10} value={knee} onChange={(e) => setKnee(e.target.value)} /></div>
        <div className="field">
          <label>Energía</label>
          <select value={energy} onChange={(e) => setEnergy(e.target.value as Energy)}>
            <option value="baja">baja</option>
            <option value="media">media</option>
            <option value="alta">alta</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label>Notas</label>
        <textarea placeholder="Ej: rodilla bien, dominadas fáciles..." value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <button className="btn btn-primary" onClick={save}>Guardar sesión</button>
    </>
  );
}

function LibInfoSheet({ ctx, id }: { ctx: Ctx; id: string }) {
  const e = ctx.allEx[id];
  if (!e) return null;
  const canAdd = ctx.session.groups.includes(e.group);
  const isCustom = Boolean(ctx.data.custom[id]);
  const noteTitle = isCustom ? 'Notas personales' : 'Objetivo';

  const addToDay = () => {
    if (!ctx.session.extras.includes(id)) ctx.patchSession({ extras: [...ctx.session.extras, id], saved: false });
    ctx.setModal(null);
    ctx.setView('today');
  };

  return (
    <>
      <div className="grip"></div>
      <h3>{e.name}</h3>
      <div className="sh-sub">{GROUPS[e.group].label} · {e.level} · {e.tags.join(' · ')}</div>
      <div className="stats">
        <div className="stat"><div className="v">{e.sets}</div><div className="k">Series</div></div>
        <div className="stat"><div className="v">{e.reps}</div><div className="k">Reps</div></div>
        <div className="stat"><div className="v">{e.rest}</div><div className="k">Descanso</div></div>
      </div>
      <GalleryBlock id={id} exercise={e} />
      {(PROGRESSIONS[id]?.easier || PROGRESSIONS[id]?.harder) && (
        <div className="block">
          <div className="bt"><span className="bd"></span>Progresión</div>
          <div className="proglinks">
            {PROGRESSIONS[id]?.easier && ctx.allEx[PROGRESSIONS[id].easier!] && (
              <button className="btn btn-soft prog-btn" onClick={() => ctx.setModal({ type: 'libInfo', id: PROGRESSIONS[id].easier! })}>
                ↓ Más fácil: {ctx.allEx[PROGRESSIONS[id].easier!].name}
              </button>
            )}
            {PROGRESSIONS[id]?.harder && ctx.allEx[PROGRESSIONS[id].harder!] && (
              <button className="btn btn-soft prog-btn" onClick={() => ctx.setModal({ type: 'libInfo', id: PROGRESSIONS[id].harder! })}>
                ↑ Más difícil: {ctx.allEx[PROGRESSIONS[id].harder!].name}
              </button>
            )}
          </div>
        </div>
      )}
      {e.notes && (
        <div className="block">
          <div className="bt"><span className="bd"></span>{noteTitle}</div>
          <div className="why">{e.notes}</div>
        </div>
      )}
      <div className="block">
        <div className="bt"><span className="bd"></span>Puntos técnicos</div>
        {e.cues.length
          ? e.cues.map((c, i) => <div className="cue" key={i}><span className="n">{i + 1}</span><span>{c}</span></div>)
          : <div className="why">Todavía no hay claves técnicas cargadas para este ejercicio personalizado.</div>}
      </div>
      {canAdd ? (
        <button className="btn btn-primary" onClick={addToDay}>Agregar al día actual</button>
      ) : (
        <button className="btn btn-soft" onClick={() => alert(`Este ejercicio pertenece a ${GROUPS[e.group].label}. Para usarlo hoy, primero cambiá uno de los grupos de la sesión.`)}>
          No pertenece a los grupos de hoy
        </button>
      )}
    </>
  );
}

function AddCustomSheet({ ctx }: { ctx: Ctx }) {
  const [name, setName] = useState('');
  const [group, setGroup] = useState<GroupId>('pierna');
  const [level, setLevel] = useState<Level>('Inicial');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10–12');
  const [rest, setRest] = useState('60s');
  const [mode, setMode] = useState('sinpeso');
  const [notes, setNotes] = useState('');

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) { alert('Poné un nombre.'); return; }
    const id = 'u_' + Date.now().toString(36); // un solo id: clave e id siempre coinciden
    const exercise: CustomExercise = {
      id,
      name: trimmed,
      group,
      modes: mode === 'mix' ? ['peso', 'sinpeso'] : [mode as 'peso' | 'sinpeso'],
      level,
      sets, reps, rest,
      tags: ['personal'],
      cues: [],
      errors: [],
      notes,
    };
    ctx.putCustom(exercise);
    ctx.setModal(null);
  };

  return (
    <>
      <div className="grip"></div>
      <h3>Nuevo ejercicio</h3>
      <div className="sh-sub">Se guarda en tu biblioteca local.</div>
      <div className="field"><label>Nombre</label><input placeholder="Ej: Remo en polea baja" value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="field-row">
        <div className="field">
          <label>Grupo</label>
          <select value={group} onChange={(e) => setGroup(e.target.value as GroupId)}>
            {(Object.entries(GROUPS) as [GroupId, (typeof GROUPS)[GroupId]][]).map(([k, g]) => <option key={k} value={k}>{g.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Nivel</label>
          <select value={level} onChange={(e) => setLevel(e.target.value as Level)}>
            <option>Inicial</option><option>Progresivo</option><option>Avanzado</option>
          </select>
        </div>
      </div>
      <div className="field-row">
        <div className="field"><label>Series</label><input value={sets} onChange={(e) => setSets(e.target.value)} /></div>
        <div className="field"><label>Reps</label><input value={reps} onChange={(e) => setReps(e.target.value)} /></div>
        <div className="field"><label>Descanso</label><input value={rest} onChange={(e) => setRest(e.target.value)} /></div>
      </div>
      <div className="field">
        <label>Modo</label>
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="sinpeso">Sin peso</option>
          <option value="peso">Con peso</option>
          <option value="mix">Mixto</option>
        </select>
      </div>
      <div className="field">
        <label>Notas personales</label>
        <textarea placeholder="Ej: agarre cerrado, espalda neutra, no tirar con lumbar..." value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <button className="btn btn-primary" onClick={save}>Guardar</button>
    </>
  );
}

function SummarySheet({ text }: { text: string }) {
  return (
    <>
      <div className="grip"></div>
      <h3>Resumen</h3>
      <textarea
        readOnly
        value={text}
        style={{ width: '100%', minHeight: 260, background: 'var(--card)', color: 'var(--txt)', border: '1px solid var(--line2)', borderRadius: 10, padding: 12 }}
      />
    </>
  );
}

function ImportPreviewSheet({ ctx, parsed }: { ctx: Ctx; parsed: ParsedBackup }) {
  const [busy, setBusy] = useState(false);
  const { data, warnings, source } = parsed;
  const dates = data.sessions.map((s) => s.date);
  const range = dates.length ? `${dates[0]} → ${dates[dates.length - 1]}` : 'sin sesiones';

  const confirm = async () => {
    setBusy(true);
    await ctx.importAll(data, source);
    ctx.setModal(null);
    alert('Backup importado.');
  };

  return (
    <>
      <div className="grip"></div>
      <h3>Importar backup</h3>
      <div className="sh-sub">
        {source === 'v0' ? 'Backup de una versión anterior (A2.x): se convierte automáticamente.' : 'Backup de esta versión.'}
      </div>
      <div className="wkvol">
        <div className="t">Contenido del archivo</div>
        <div className="hrow"><b>{data.sessions.length}</b> sesiones · {range}</div>
        <div className="hrow"><b>{data.customExercises.length}</b> ejercicios personalizados</div>
        <div className="hrow">Semana del plan: <b>{data.plan.week || '-'}</b></div>
      </div>
      {warnings.length > 0 && (
        <div className="notice">
          <b>Avisos de conversión:</b>
          <ul>{warnings.slice(0, 8).map((w, i) => <li key={i}>{w}</li>)}</ul>
          {warnings.length > 8 && <div>…y {warnings.length - 8} más.</div>}
        </div>
      )}
      <div className="sh-sub" style={{ marginTop: 12 }}>Esto reemplaza todos tus datos actuales. Si tenés dudas, exportá un backup primero.</div>
      <div className="actions">
        <button className="btn btn-ghost" onClick={() => ctx.setModal(null)}>Cancelar</button>
        <button className="btn btn-primary" disabled={busy} onClick={() => void confirm()}>
          {busy ? 'Importando…' : 'Reemplazar mis datos'}
        </button>
      </div>
    </>
  );
}
