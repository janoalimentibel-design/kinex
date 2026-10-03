// Vista Hoy — port de renderStrip/renderDay/renderGroups/renderExercise de A2.8.
import { useEffect, useState } from 'react';
import { DIAS, FORMATS, GROUPS, MES, PROGRESSIONS } from '../data/exercises';
import type { GroupId, Mode } from '../db/schema';
import { buildExerciseList, isoDate, restSeconds, type SessionEntry } from '../logic/session';
import { completedIds, hasActivity } from '../logic/activity';
import { colorOf, hasImage, isHoldImage, imageLabels, PhaseBlock } from './media';
import { IconCaret, IconCheck } from './icons';
import type { Ctx } from './types';

function weekDays(): Date[] {
  const t = new Date();
  const wd = (t.getDay() + 6) % 7;
  const mon = new Date(t);
  mon.setDate(t.getDate() - wd);
  return [...Array(7)].map((_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

const MODES: [Mode, string][] = [['peso', 'Con peso'], ['sinpeso', 'Sin peso'], ['mix', 'Mixto']];

function workTimes(reps: string): number[] {
  const range = reps.match(/(\d+)\s*[–-]\s*(\d+)\s*(min|s)/i);
  if (range) {
    const multiplier = range[3].toLowerCase() === 'min' ? 60 : 1;
    return [Number(range[1]) * multiplier, Number(range[2]) * multiplier];
  }
  const single = reps.match(/(\d+)\s*(min|s)/i);
  if (!single) return [];
  return [Number(single[1]) * (single[2].toLowerCase() === 'min' ? 60 : 1)];
}

function timeLabel(seconds: number): string {
  return seconds % 60 === 0 ? `${seconds / 60} min` : `${seconds}s`;
}

export default function Today({ ctx, notice, warnings, dismissNotice }: {
  ctx: Ctx;
  notice: string | null;
  warnings: string[];
  dismissNotice: () => void;
}) {
  const { data, allEx, session, curDate } = ctx;
  const [openEx, setOpenEx] = useState<Record<string, boolean>>({});
  useEffect(() => setOpenEx({}), [curDate]);

  const list = buildExerciseList(session, allEx, data.sessions);
  const checked = new Set(completedIds(session));
  const done = list.filter((x) => checked.has(x.id)).length;
  const pct = list.length ? Math.round((done / list.length) * 100) : 0;
  const d = new Date(`${curDate}T12:00:00`);
  const today = isoDate(new Date());
  const days = weekDays();
  const format = FORMATS[session.format];

  const toggleDone = (id: string) => ctx.editExercise({ type: 'toggle', id });
  const groupsInOrder = [...new Set([...session.groups, ...list.map((entry) => entry.group)])];
  const displayedGroups = curDate < today && list.length ? [...new Set(list.map((entry) => entry.group))] : groupsInOrder;

  return (
    <>
      <div className="weekwrap">
        <div className="weekhead">
          <h2>Tu semana</h2>
          <span className="wk">{`${days[0].getDate()} ${MES[days[0].getMonth()]} – ${days[6].getDate()} ${MES[days[6].getMonth()]}`}</span>
        </div>
        <div className="days">
          {days.map((day) => {
            const di = isoDate(day);
            const s = data.sessions[di];
            return (
              <div
                key={di}
                className={`day ${di === curDate ? 'active' : ''} ${s && hasActivity(s) ? 'trained' : ''} ${di === today ? 'today' : ''}`}
                onClick={() => ctx.setCurDate(di)}
              >
                <div className="dn">{DIAS[day.getDay()]}</div>
                <div className="dd">{day.getDate()}</div>
                <div className="mo">{MES[day.getMonth()]}</div>
                <div className="dot"></div>
              </div>
            );
          })}
        </div>
      </div>

      {notice && (
        <div className="notice">
          <b>Migración completada.</b> {notice}
          {warnings.length > 0 && (
            <ul>{warnings.slice(0, 8).map((w, i) => <li key={i}>{w}</li>)}</ul>
          )}
          <button className="btn btn-soft" onClick={dismissNotice}>Entendido</button>
        </div>
      )}

      {curDate < today && !data.sessions[curDate] && <div className="notice">No hay un registro guardado para este día en este dispositivo. Los ejercicios de abajo son una sugerencia, no un entrenamiento realizado.</div>}
      <div>
        <div className="dayhead">
          <div className="dlabel">{`${DIAS[d.getDay()]} ${d.getDate()} ${MES[d.getMonth()]} · ${data.plan.week || 'Semana 1'} · ${data.plan.focus || 'Fuerza'}`}</div>
          {session.programTitle && curDate >= today && <div className="program-title">{session.programTitle}</div>}
          <div className="focus">
            Sesión{' '}
            {displayedGroups.map((g, i) => (
              <span key={i} className="gtag" style={{ background: colorOf(g) }}>{GROUPS[g].label}</span>
            ))}
          </div>
          <div className="meta">
            <span>⏱ <b>{session.selectedExercises !== undefined || session.programmed?.length ? 'A tu ritmo' : format.duration}</b></span>
            <span>◎ <b>{list.length} ejercicios</b></span>
            <span><b>{displayedGroups.length}</b> grupos</span>
          </div>
        </div>

        <p className="sh-sub">Cambiar grupos, formato o modo genera otra lista. Lo ya realizado se conserva en Historial.</p>
        <div className="segwrap">
          <div className="seglabel">Formato</div>
          <div className="segment">
            {(Object.entries(FORMATS) as [typeof session.format, (typeof FORMATS)[keyof typeof FORMATS]][]).map(([k, f]) => (
              <button key={k} className={session.format === k ? 'on' : ''} onClick={() => ctx.patchSession({ format: k })}>
                {f.name}
              </button>
            ))}
          </div>
        </div>

        {session.format === 'ext' && session.groups.length === 2 && (
          <div className="segwrap">
            <div className="seglabel">Ejercicio extra</div>
            <div className="segment">
              <button className={session.extraTarget === 'auto' ? 'on' : ''} onClick={() => ctx.patchSession({ extraTarget: 'auto' })}>Auto</button>
              <button className={session.extraTarget === 'g1' ? 'on' : ''} onClick={() => ctx.patchSession({ extraTarget: 'g1' })}>{GROUPS[session.groups[0]].label}</button>
              <button className={session.extraTarget === 'g2' ? 'on' : ''} onClick={() => ctx.patchSession({ extraTarget: 'g2' })}>{GROUPS[session.groups[1]].label}</button>
            </div>
          </div>
        )}

        <div className="segwrap">
          <div className="seglabel">Modo</div>
          <div className="segment">
            {MODES.map(([k, label]) => (
              <button
                key={k}
                className={session.mode === k ? 'on' : ''}
                onClick={() => ctx.patchSession({ mode: k })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="actions">
          <button className="btn btn-ghost" onClick={() => ctx.setModal({ type: 'combo' })}>☰ Cambiar grupos</button>
          <button className="btn btn-primary" onClick={() => ctx.setModal({ type: 'saveSession' })}>✓ Marcar hecha</button>
          <button className="btn btn-ghost" onClick={() => ctx.setModal({ type: 'revisions' })}>Deshacer / versiones del día</button>
        </div>

        <div className="prog">
          <div className="bar"><div className="fill" style={{ width: `${pct}%` }}></div></div>
          <div className="proglab"><span>{done} de {list.length} ejercicios</span><span>{pct}%</span></div>
        </div>

        <div className="list">
          {displayedGroups.map((g) => {
            const exs = list.filter((x) => x.group === g);
            return (
              <div key={g}>
                <div className="grp-head">
                  <span className="gdot" style={{ background: colorOf(g) }}></span>
                  <span className="gn" style={{ color: colorOf(g) }}>{GROUPS[g].label}</span>
                  <div className="grp-actions">
                    <button className="mini" onClick={() => ctx.setModal({ type: 'addToGroup', group: g })}>+ ejercicio</button>
                  </div>
                </div>
                {exs.map((entry) => (
                  <ExerciseCard
                    key={entry.id}
                    ctx={ctx}
                    entry={entry}
                    open={Boolean(openEx[entry.id])}
                    toggleOpen={() => setOpenEx((o) => ({ ...o, [entry.id]: !o[entry.id] }))}
                    toggleDone={() => toggleDone(entry.id)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function ExerciseCard({ ctx, entry, open, toggleOpen, toggleDone }: {
  ctx: Ctx;
  entry: SessionEntry;
  open: boolean;
  toggleOpen: () => void;
  toggleDone: () => void;
}) {
  const { allEx, session } = ctx;
  const e = allEx[entry.id];
  if (!e) return <div className="ex"><div className="ex-head"><div className="nm">{session.exerciseLog?.find((item) => item.id === entry.id)?.name ?? entry.id}</div></div><button className="btn btn-danger" onClick={() => ctx.editExercise({ type: 'remove', id: entry.id })}>Quitar del día</button></div>;
  const done = completedIds(session).includes(entry.id);
  const load = e.modes.includes('peso') && e.modes.includes('sinpeso') ? 'mixto' : e.modes.includes('peso') ? 'con peso' : 'sin peso';
  const times = workTimes(e.reps);

  const remove = () => ctx.editExercise({ type: 'remove', id: entry.id });
  const origId = entry.id;
  const replaceWith = (targetId: string) => ctx.editExercise({ type: 'replace', id: entry.id, replacement: targetId });
  const links = PROGRESSIONS[entry.id];
  const visibleIds = new Set(buildExerciseList(session, allEx, ctx.data.sessions).map(e => e.id));

  return (
    <div className={`ex ${done ? 'done' : ''} ${open ? 'open' : ''}`}>
      <div className="ex-head" onClick={toggleOpen}>
        <div className="ex-ti">
          <div className="nm">{e.name}</div>
          <div className="sub">{e.sets}×{e.reps} · desc <b>{e.rest}</b></div>
          <div className="badges">
            <span className="badge">{load}</span>
            <span className={`badge ${e.level === 'Avanzado' ? 'adv' : 'auto'}`}>{e.level}</span>
            {hasImage(entry.id) && <span className="badge auto">foto</span>}
            {entry.src === 'extra-auto' && <span className="badge">extra</span>}
            {entry.src === 'reemplazo' && <span className="badge">cambio</span>}
          </div>
        </div>
        <button className="chk" aria-label={`Marcar ${e.name}`} aria-pressed={Boolean(done)} onClick={(ev) => { ev.stopPropagation(); toggleDone(); }}><IconCheck /></button>
        <IconCaret />
      </div>
      <div className="ex-body">
        <div className={`phases ${isHoldImage(entry.id) ? 'hold-phases' : imageLabels(entry.id).length === 2 ? 'two-phases' : ''}`}>
          {imageLabels(entry.id).map((p) => <PhaseBlock key={p} id={entry.id} exercise={e} label={p} />)}
        </div>
        <div className="ex-info">
          <div className="stats">
            <div className="stat"><div className="v">{e.sets}</div><div className="k">Series</div></div>
            <div className="stat"><div className="v">{e.reps}</div><div className="k">{times.length ? 'Tiempo' : 'Reps'}</div></div>
            <div className="stat"><div className="v">{e.rest}</div><div className="k">Descanso</div></div>
          </div>
          {times.length > 0 && (
            <div className="work-timers">
              <span>Tiempo de trabajo</span>
              {times.map((seconds) => (
                <button key={seconds} className="mini" onClick={() => ctx.startTimer(e.name, seconds)}>▶ {timeLabel(seconds)}</button>
              ))}
            </div>
          )}
          <button className="btn btn-soft rest-start" onClick={() => ctx.startRest(e.name, restSeconds(e.rest))}>
            ▶ Descanso {e.rest}
          </button>
          <div className="block">
            <div className="bt"><span className="bd"></span>Puntos técnicos</div>
            {e.cues.map((c, i) => <div className="cue" key={i}><span className="n">{i + 1}</span><span>{c}</span></div>)}
          </div>
          <div className="block">
            <div className="bt"><span className="bd" style={{ background: 'var(--warn)' }}></span>Errores comunes</div>
            {e.errors.map((c, i) => <div className="err" key={i}><span className="n">×</span><span>{c}</span></div>)}
          </div>
          <div className="why">
            {e.notes}
            <br /><br />
            <b>Tags:</b> {e.tags.join(' · ')}
          </div>
          <div className="card-actions">
            <button className="btn btn-soft" onClick={() => ctx.setModal({ type: 'replace', origId, group: e.group as GroupId })}>Cambiar</button>
            {links?.easier && allEx[links.easier] && !visibleIds.has(links.easier) && (
              <button className="btn btn-soft prog-btn" onClick={() => replaceWith(links.easier!)}>↓ {allEx[links.easier].name}</button>
            )}
            {links?.harder && allEx[links.harder] && !visibleIds.has(links.harder) && (
              <button className="btn btn-soft prog-btn" onClick={() => replaceWith(links.harder!)}>
                ↑ {allEx[links.harder].name}
              </button>
            )}
            <button className="btn btn-danger" onClick={remove}>Quitar del día</button>
          </div>
        </div>
      </div>
    </div>
  );
}
