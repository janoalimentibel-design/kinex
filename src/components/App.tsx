import { useEffect, useState } from 'react';
import { CATALOG } from '../data/exercises';
import { bootstrap, replaceAll, toAppData, type AppData } from '../db/bootstrap';
import { db } from '../db/instance';
import type { CustomExercise, Plan, Session, V2Data } from '../db/schema';
import { createSession, isoDate } from '../logic/session';
import { hasActivity } from '../logic/activity';
import { applyPublishedRoutine } from '../logic/publishedRoutine';
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
      const updated = applyPublishedRoutine(result.data, isoDate(new Date()));
      if (updated !== result.data) {
        await db.transaction('rw', db.sessions, db.kv, async () => {
          await db.sessions.bulkPut(Object.values(updated.sessions).filter((s) => s !== result.data.sessions[s.date]));
          await db.kv.put({ key: 'plan', value: updated.plan });
        });
      }
      return { ...result, data: updated };
    });
    void bootPromise.then((result) => {
      setData(result.data);
      setNotice(result.migrationNotice);
      setWarnings(result.warnings);
    });
  }, []);

  if (!data) return <div className="boot">Cargando KINEX…</div>;

  const allEx = { ...CATALOG, ...data.custom };
  // Las sesiones aún no tocadas se generan considerando los grupos que ya
  // elegiste en los días anteriores de la semana.
  const session = data.sessions[curDate] ?? createSession(curDate, data.sessions, data.plan);

  const putSession = (s: Session) => {
    // A visible check confirms a completed disk write, not only React state.
    void db.sessions.put(s).then(() => {
      setData((d) => (d ? { ...d, sessions: { ...d.sessions, [s.date]: s } } : d));
      setStorageError(null);
    }).catch(() => setStorageError('No se pudo guardar el cambio en este dispositivo. No cierres la app; liberá espacio y volvé a intentarlo.'));
  };

  const ctx: Ctx = {
    data,
    allEx,
    curDate,
    session,
    setCurDate: (date) => setCurDate(date),
    setView,
    setModal,
    patchSession: (patch) => putSession({ ...session, ...patch }),
    putSessions: (sessions: Session[]) => {
      setData((d) => (d ? { ...d, sessions: { ...d.sessions, ...Object.fromEntries(sessions.map((s) => [s.date, s])) } } : d));
      void db.sessions.bulkPut(sessions);
    },
    putPlan: (plan: Plan) => {
      setData((d) => (d ? { ...d, plan } : d));
      void db.kv.put({ key: 'plan', value: plan });
    },
    putCustom: (exercise: CustomExercise) => {
      setData((d) => (d ? { ...d, custom: { ...d.custom, [exercise.id]: exercise } } : d));
      void db.customExercises.put(exercise);
    },
    importAll: async (v2: V2Data, source) => {
      const hydrated = await replaceAll(db, v2, source === 'v0' ? 'backup-v0' : source === 'v1' ? 'backup-v1' : 'backup-v2');
      const imported = toAppData(hydrated);
      const updated = applyPublishedRoutine(imported, isoDate(new Date()));
      if (updated !== imported) {
        await db.transaction('rw', db.sessions, db.kv, async () => {
          await db.sessions.bulkPut(Object.values(updated.sessions).filter((s) => s !== imported.sessions[s.date]));
          await db.kv.put({ key: 'plan', value: updated.plan });
        });
      }
      setData(updated);
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
            <div className="version">v3.35</div>
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
        <div className="sheet">{modal && <Sheet modal={modal} ctx={ctx} />}</div>
      </div>
    </>
  );
}
