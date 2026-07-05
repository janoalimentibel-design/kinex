import { useEffect, useState } from 'react';
import { CATALOG } from '../data/exercises';
import { bootstrap, replaceAll, toAppData, type AppData } from '../db/bootstrap';
import { db } from '../db/instance';
import type { CustomExercise, Plan, Session, V1Data } from '../db/schema';
import { createSession, isoDate } from '../logic/session';
import History from './History';
import Library from './Library';
import PlanView from './PlanView';
import { Sheet } from './sheets';
import Today from './Today';
import type { Ctx, ModalState, View } from './types';

// Cache del arranque: StrictMode monta dos veces en dev y la migración debe correr una sola vez.
let bootPromise: ReturnType<typeof bootstrap> | null = null;

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [view, setView] = useState<View>('today');
  const [curDate, setCurDate] = useState(() => isoDate(new Date()));
  const [modal, setModal] = useState<ModalState>(null);

  useEffect(() => {
    bootPromise ??= bootstrap(db);
    void bootPromise.then((result) => {
      setData(result.data);
      setNotice(result.migrationNotice);
      setWarnings(result.warnings);
    });
  }, []);

  if (!data) return <div className="boot">Cargando KINEX…</div>;

  const allEx = { ...CATALOG, ...data.custom };
  const session = data.sessions[curDate] ?? createSession(curDate);

  const putSession = (s: Session) => {
    setData((d) => (d ? { ...d, sessions: { ...d.sessions, [s.date]: s } } : d));
    void db.sessions.put(s);
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
    putPlan: (plan: Plan) => {
      setData((d) => (d ? { ...d, plan } : d));
      void db.kv.put({ key: 'plan', value: plan });
    },
    putCustom: (exercise: CustomExercise) => {
      setData((d) => (d ? { ...d, custom: { ...d.custom, [exercise.id]: exercise } } : d));
      void db.customExercises.put(exercise);
    },
    importAll: async (v1: V1Data, source) => {
      await replaceAll(db, v1, source === 'v0' ? 'backup-v0' : 'backup-v1');
      setData(toAppData(v1));
    },
  };

  const savedCount = Object.values(data.sessions).filter((s) => s.saved).length;
  const tabs: [View, string, string][] = [
    ['today', '⌂', 'Hoy'],
    ['lib', '▥', 'Biblioteca'],
    ['hist', '↗', 'Historial'],
    ['plan', '☰', 'Plan'],
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
          </div>
        </div>
      </div>

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
