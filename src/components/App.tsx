import { usePrivateSync } from '../sync/usePrivateSync';
import { useEffect, useRef, useState } from 'react';
import { CATALOG } from '../data/exercises';
import { bootstrap, replaceAll, toAppData, type AppData } from '../db/bootstrap';
import { db } from '../db/instance';
import { createDataWriter } from '../db/writes';
import { acknowledgePlanPatch, readPendingPlan, stagePlanPatch, type PendingPlan } from '../db/planJournal';
import { editExercise } from '../logic/exerciseEdits';
import type { CustomExercise, Plan, Session, V2Data } from '../db/schema';
import { buildExerciseList, createSession, isoDate } from '../logic/session';
import { hasActivity } from '../logic/activity';
import { activitySignature } from '../logic/aerobic';
import { zSession } from '../db/schema';
import { applyPublishedRoutine } from '../logic/publishedRoutine';
import { OCT26_DAYS, OCT26_ID } from '../logic/routineOct26';
import { rebalancePending } from '../logic/rebalance';
import { editSession } from '../logic/editSession';
import History from './History';
import Library from './Library';
import PlanView from './PlanView';
import Requests from './Requests';
import RestTimer, { type RestState } from './RestTimer';
import { Sheet } from './sheets';
import Today from './Today';
import AppearanceToggle from './AppearanceToggle';
import type { Ctx, ModalState, View } from './types';

// Cache del arranque: StrictMode monta dos veces en dev y la migración debe correr una sola vez.
let bootPromise: ReturnType<typeof bootstrap> | null = null;

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const sync = usePrivateSync(data);
  const writer = useRef<ReturnType<typeof createDataWriter> | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [planDraftWarning, setPlanDraftWarning] = useState<{ id: string; message: string } | null>(null);
  const [view, setView] = useState<View>('today');
  const [curDate, setCurDate] = useState(() => isoDate(new Date()));
  const [modal, setModal] = useState<ModalState>(null);
  const [rest, setRest] = useState<RestState | null>(null);

  // Cuenta regresiva del descanso; al llegar a 0 vibra y se cierra sola.
  useEffect(() => {
    if (!rest) return;
    if (rest.left <= 0) {
      navigator.vibrate?.([200, 100, 200]);
      const timeout = setTimeout(() => setRest(null), 4000);
      return () => clearTimeout(timeout);
    }
    const interval = setInterval(() => {
      setRest((r) => (r ? { ...r, left: r.left - 1 } : r));
    }, 1000);
    return () => clearInterval(interval);
  }, [rest]);

  useEffect(() => {
    bootPromise ??= bootstrap(db).then(async (result) => {
      let updated = result.data;
      let pending: PendingPlan | null = null;
      try { pending = readPendingPlan(sessionStorage); } catch { /* IndexedDB remains available if tab storage is blocked. */ }
      const initialize = createDataWriter(db, result.data, (next) => { updated = next; });
      await initialize(current => {
        const reviewed = rebalancePending(applyPublishedRoutine(current, isoDate(new Date())), isoDate(new Date()));
        return pending ? { ...reviewed, plan: { ...reviewed.plan, ...pending.patch } } : reviewed;
      });
      if (pending) try { acknowledgePlanPatch(sessionStorage, pending.id); } catch { /* Keep the recovery record if cleanup fails. */ }
      return { ...result, data: updated };
    });
    void bootPromise.then((result) => {
      writer.current ??= createDataWriter(db, result.data, setData);
      setData(result.data);
      setNotice(result.migrationNotice);
      setWarnings(result.warnings);
    }).catch(() => setStorageError('No se pudieron leer tus datos. No borres el almacenamiento; volvé a abrir la app.'));
  }, []);

  if (!data) return <div className="boot">{storageError ?? 'Cargando KINEX…'}</div>;

  const allEx = { ...CATALOG, ...data.custom };
  // Las sesiones aún no tocadas se generan considerando los grupos que ya
  // elegiste en los días anteriores de la semana.
  const session = data.sessions[curDate] ?? createSession(curDate, data.sessions, data.plan);

  const commit = (transform: (current: AppData) => AppData | Promise<AppData>) => {
    return writer.current!(transform).then(() => setStorageError(null)).catch((error) => {
      setStorageError('No se pudo guardar el cambio. Tus datos anteriores se conservan; volvé a intentarlo.');
      throw error;
    });
  };
  const updateDay = (transform: (s: Session, current: AppData) => Session) => {
    void commit((current) => {
      const previous = current.sessions[curDate] ?? createSession(curDate, current.sessions, current.plan);
      const next = transform(previous, current);
      return rebalancePending({ ...current, sessions: { ...current.sessions, [curDate]: next } }, isoDate(new Date()), curDate);
    }).catch(() => {});
  };

  const ctx: Ctx = {
    sync,
    data,
    allEx,
    curDate,
    session,
    setCurDate: (date) => setCurDate(date),
    setView,
    setModal,
    patchSession: (patch) => updateDay((previous) => editSession(previous, typeof patch === 'function' ? patch(previous) : patch)),
    editExercise: (edit) => updateDay((previous, current) => editExercise(previous, edit, { ...CATALOG, ...current.custom }, current.sessions)),
    saveActivityData: (date, patch, expectedSignature) => {
      const captured = structuredClone(patch);
      return commit(current => {
        const previous = current.sessions[date] ?? createSession(date, current.sessions, current.plan);
        if (activitySignature(previous) !== expectedSignature) throw new Error('La actividad de este día cambió. Conservamos tu borrador; revisá los datos guardados antes de reemplazarlos.');
        const next = zSession.parse({ ...previous, ...captured, manuallyEdited: true });
        return rebalancePending({ ...current, sessions: { ...current.sessions, [date]: next } }, isoDate(new Date()), date);
      });
    },
    restoreSession: (restored, custom = []) => commit((current) => ({ ...current, custom: { ...Object.fromEntries(custom.map(e => [e.id, e])), ...current.custom }, sessions: { ...current.sessions, [restored.date]: { ...restored, manuallyEdited: true } } })),
    putSessions: (sessions: Session[]) => {
      void commit((current) => {
        // Never overwrite activity written while this plan was being prepared.
        const writable = sessions.filter((s) => !current.sessions[s.date] || (!hasActivity(current.sessions[s.date]) && !current.sessions[s.date].manuallyEdited && current.sessions[s.date].selectedExercises === undefined));
        return rebalancePending({ ...current, sessions: { ...current.sessions, ...Object.fromEntries(writable.map((s) => [s.date, s])) } }, isoDate(new Date()));
      }).catch(() => {});
    },
    loadReviewedRoutine: async () => {
      let openDate: string | undefined;
      let replacedPlan = false;
      let superseded: PendingPlan | null = null;
      try { superseded = readPendingPlan(sessionStorage); } catch { /* Tab storage may be unavailable. */ }
      await commit(current => {
        const today = isoDate(new Date());
        const updated = rebalancePending(applyPublishedRoutine(current, today, true), today);
        replacedPlan = updated.plan !== current.plan;
        const dates = updated.plan.routineRevision === OCT26_ID ? OCT26_DAYS.map(day => day.date) : Object.keys(updated.sessions).sort();
        openDate = dates.find(date => date >= today && updated.sessions[date] && !hasActivity(updated.sessions[date]) &&
          buildExerciseList(updated.sessions[date], { ...CATALOG, ...updated.custom }, updated.sessions).length > 0)
          ?? dates.find(date => date >= today && updated.sessions[date]) ?? dates.filter(date => updated.sessions[date]).at(-1);
        return updated;
      });
      if (superseded && replacedPlan) try { acknowledgePlanPatch(sessionStorage, superseded.id); } catch { /* Keep recovery data if cleanup fails. */ }
      if (openDate) { setCurDate(openDate); setView('today'); }
    },
    putProfile: (profile) => commit(current => ({ ...current, profile })),
    putPlan: (plan: Partial<Plan>) => {
      let pending: PendingPlan | null = null;
      let warningId: string | null = null;
      try { pending = stagePlanPatch(sessionStorage, plan); }
      catch {
        warningId = crypto.randomUUID();
        setPlanDraftWarning({ id: warningId, message: 'El borrador no pudo protegerse antes de guardar. No recargues hasta que termine el guardado.' });
      }
      const patch = { ...pending?.patch, ...plan };
      void commit(current => ({ ...current, plan: { ...current.plan, ...patch } })).then(() => {
        if (pending) try { acknowledgePlanPatch(sessionStorage, pending.id); } catch { /* A later reload can replay this committed patch. */ }
        if (warningId) setPlanDraftWarning(current => current?.id === warningId ? null : current);
      }).catch(() => {});
    },
    putCustom: (exercise: CustomExercise) => {
      void commit((current) => ({ ...current, custom: { ...current.custom, [exercise.id]: exercise } })).catch(() => {});
    },
    importAll: async (v2: V2Data, source) => {
      let superseded: PendingPlan | null = null;
      try { superseded = readPendingPlan(sessionStorage); } catch { /* Tab storage may be unavailable. */ }
      await commit(async () => {
        const hydrated = await replaceAll(db, v2, source === 'v0' ? 'backup-v0' : source === 'v1' ? 'backup-v1' : 'backup-v2');
        const imported = toAppData(hydrated);
        return rebalancePending(applyPublishedRoutine(imported, isoDate(new Date())), isoDate(new Date()));
      });
      if (superseded) try { acknowledgePlanPatch(sessionStorage, superseded.id); } catch { /* Keep recovery data if cleanup fails. */ }
    },
    startRest: (label, seconds) => setRest({ label, left: seconds, total: seconds, kind: 'rest' }),
    startTimer: (label, seconds) => setRest({ label, left: seconds, total: seconds, kind: 'work' }),
  };

  const savedCount = Object.values(data.sessions).filter(hasActivity).length;
  const tabs: [View, string, string][] = [
    ['today', '⌂', 'Hoy'],
    ['lib', '▥', 'Biblioteca'],
    ['hist', '↗', 'Historial'],
    ['plan', '☰', 'Plan'],
    ['requests', '✎', 'Pedidos'],
  ];

  return (
    <>
      <div className="topbar">
        <div className="brand">
          <div>
            <div className="logo">KI<span>NEX</span></div>
            <div className="tag">Fuerza · control · movimiento</div>
          </div>
          <AppearanceToggle />
          <div className="streak">
            <div className="n">{savedCount}</div>
            <div className="l">sesiones</div>
            <div className="version">v3.46</div>
          </div>
        </div>
      </div>

      {(storageError || planDraftWarning) && <div className="notice" role="alert">{storageError ?? planDraftWarning?.message}</div>}
      <div className={`view ${view === 'today' ? 'show' : ''}`} id="view-today">
        <Today ctx={ctx} active={view === 'today'} notice={notice} warnings={warnings} dismissNotice={() => setNotice(null)} />
      </div>
      <div className={`view ${view === 'lib' ? 'show' : ''}`} id="view-lib">
        <Library ctx={ctx} />
      </div>
      <div className={`view ${view === 'hist' ? 'show' : ''}`} id="view-hist">
        <History ctx={ctx} />
      </div>
      <div className={`view ${view === 'plan' ? 'show' : ''}`} id="view-plan">
        <PlanView ctx={ctx} />
      </div>
      <div className={`view ${view === 'requests' ? 'show' : ''}`} id="view-requests">
        <Requests ctx={ctx} />
      </div>

      {rest && (
        <RestTimer
          rest={rest}
          onExtend={() => setRest((r) => (r ? { ...r, left: r.left + 15, total: r.total + 15 } : r))}
          onClose={() => setRest(null)}
        />
      )}

      <div className="nav">
        {tabs.map(([v, icon, label]) => (
          <button key={v} className={view === v ? 'on' : ''} onClick={() => { setView(v); scrollTo(0, 0); }}>
            {icon}<span>{label}</span>
          </button>
        ))}
      </div>

      <div className={`modal ${modal ? 'show' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
        <div className="sheet">{modal && <Sheet key={`${curDate}:${JSON.stringify(modal)}`} modal={modal} ctx={ctx} />}</div>
      </div>
    </>
  );
}
