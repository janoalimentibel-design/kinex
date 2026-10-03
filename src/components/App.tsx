import { useEffect, useRef, useState } from 'react';
import { CATALOG } from '../data/exercises';
import { bootstrap, replaceAll, toAppData, type AppData } from '../db/bootstrap';
import { db } from '../db/instance';
import { createDataWriter, persistChanges } from '../db/writes';
import { editExercise } from '../logic/exerciseEdits';
import type { CustomExercise, Plan, Session, V2Data } from '../db/schema';
import { createSession, isoDate } from '../logic/session';
import { hasActivity } from '../logic/activity';
import { applyPublishedRoutine } from '../logic/publishedRoutine';
import { rebalancePending } from '../logic/rebalance';
import { editSession } from '../logic/editSession';
import History from './History';
import Library from './Library';
import PlanView from './PlanView';
import Requests from './Requests';
import RestTimer, { type RestState } from './RestTimer';
import { Sheet } from './sheets';
import Today from './Today';
import type { Ctx, ModalState, View } from './types';

// Cache del arranque: StrictMode monta dos veces en dev y la migración debe correr una sola vez.
let bootPromise: ReturnType<typeof bootstrap> | null = null;

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const writer = useRef<ReturnType<typeof createDataWriter> | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [storageError, setStorageError] = useState<string | null>(null);
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
      const updated = rebalancePending(applyPublishedRoutine(result.data, isoDate(new Date())), isoDate(new Date()));
      if (updated !== result.data) await persistChanges(db, result.data, updated);
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
    data,
    allEx,
    curDate,
    session,
    setCurDate: (date) => setCurDate(date),
    setView,
    setModal,
    patchSession: (patch) => updateDay((previous) => editSession(previous, typeof patch === 'function' ? patch(previous) : patch)),
    editExercise: (edit) => updateDay((previous, current) => editExercise(previous, edit, { ...CATALOG, ...current.custom }, current.sessions)),
    restoreSession: (restored, custom = []) => commit((current) => ({ ...current, custom: { ...Object.fromEntries(custom.map(e => [e.id, e])), ...current.custom }, sessions: { ...current.sessions, [restored.date]: { ...restored, manuallyEdited: true } } })),
    putSessions: (sessions: Session[]) => {
      void commit((current) => {
        // Never overwrite activity written while this plan was being prepared.
        const writable = sessions.filter((s) => !current.sessions[s.date] || (!hasActivity(current.sessions[s.date]) && !current.sessions[s.date].manuallyEdited && current.sessions[s.date].selectedExercises === undefined));
        return rebalancePending({ ...current, sessions: { ...current.sessions, ...Object.fromEntries(writable.map((s) => [s.date, s])) } }, isoDate(new Date()));
      }).catch(() => {});
    },
    putPlan: (plan: Partial<Plan>) => { void commit((current) => ({ ...current, plan: { ...current.plan, ...plan } })).catch(() => {}); },
    putCustom: (exercise: CustomExercise) => {
      void commit((current) => ({ ...current, custom: { ...current.custom, [exercise.id]: exercise } })).catch(() => {});
    },
    importAll: async (v2: V2Data, source) => {
      await commit(async () => {
        const hydrated = await replaceAll(db, v2, source === 'v0' ? 'backup-v0' : source === 'v1' ? 'backup-v1' : 'backup-v2');
        const imported = toAppData(hydrated);
        return rebalancePending(applyPublishedRoutine(imported, isoDate(new Date())), isoDate(new Date()));
      });
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
          <div className="streak">
            <div className="n">{savedCount}</div>
            <div className="l">sesiones</div>
            <div className="version">v3.38</div>
          </div>
        </div>
      </div>

      {storageError && <div className="notice" role="alert">{storageError}</div>}
      <div className={`view ${view === 'today' ? 'show' : ''}`} id="view-today">
        <Today ctx={ctx} notice={notice} warnings={warnings} dismissNotice={() => setNotice(null)} />
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
