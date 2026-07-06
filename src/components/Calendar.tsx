// Calendario mensual: días entrenados marcados; tocar un día lo abre en Hoy.
import { useState } from 'react';
import { MES } from '../data/exercises';
import { trainedDaysOfMonth } from '../logic/stats';
import { isoDate } from '../logic/session';
import type { Ctx } from './types';

const DOW = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export default function Calendar({ ctx }: { ctx: Ctx }) {
  const today = new Date();
  const [year, setYear] = useState(today.getUTCFullYear());
  const [month, setMonth] = useState(today.getUTCMonth()); // 0-11

  const trained = trainedDaysOfMonth(ctx.data.sessions, year, month);
  const todayIso = isoDate(new Date());

  const first = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const leadingBlanks = (first.getUTCDay() + 6) % 7; // semana empieza lunes

  const move = (delta: number) => {
    const d = new Date(Date.UTC(year, month + delta, 1));
    setYear(d.getUTCFullYear());
    setMonth(d.getUTCMonth());
  };

  const openDay = (day: number) => {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    ctx.setCurDate(date);
    ctx.setView('today');
    scrollTo(0, 0);
  };

  return (
    <div className="cal">
      <div className="cal-head">
        <button className="cal-nav" onClick={() => move(-1)}>‹</button>
        <span className="cal-title">{MES[month]} {year}</span>
        <button className="cal-nav" onClick={() => move(1)}>›</button>
      </div>
      <div className="cal-grid">
        {DOW.map((d) => <span key={d} className="cal-dow">{d}</span>)}
        {Array.from({ length: leadingBlanks }, (_, i) => <span key={`b${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          return (
            <button
              key={day}
              className={`cal-day ${trained.has(day) ? 'trained' : ''} ${iso === todayIso ? 'today' : ''}`}
              onClick={() => openDay(day)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
