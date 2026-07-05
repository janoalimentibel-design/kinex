// Vista Biblioteca — port de renderFilters/renderLib de A2.8.
import { useState } from 'react';
import { GROUPS } from '../data/exercises';
import { LibThumb } from './media';
import type { Ctx } from './types';

export default function Library({ ctx }: { ctx: Ctx }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const filters: [string, string][] = [
    ['all', 'Todos'],
    ...Object.entries(GROUPS).map(([k, g]) => [k, g.label] as [string, string]),
    ['advanced', 'Avanzados'],
  ];

  const q = query.toLowerCase();
  const rows = Object.entries(ctx.allEx).filter(([, e]) => {
    const hay = `${e.name} ${e.group} ${e.tags.join(' ')} ${e.level}`.toLowerCase();
    const inFilter = filter === 'all' || e.group === filter || (filter === 'advanced' && e.level === 'Avanzado');
    return inFilter && hay.includes(q);
  });

  return (
    <div className="lib">
      <div className="sectionhead">
        <div>
          <h2>Biblioteca</h2>
          <p>Ejercicios por músculo, con intención interna de recuperación y rendimiento. Las fotos limpias se integran como assets individuales, no como flyers.</p>
        </div>
        <button className="addbtn" onClick={() => ctx.setModal({ type: 'addCustom' })}>+ Nuevo</button>
      </div>
      <input className="search" placeholder="Buscar ejercicio o tag..." value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="filters">
        {filters.map(([k, label]) => (
          <button key={k} className={`filt ${filter === k ? 'on' : ''}`} onClick={() => setFilter(k)}>{label}</button>
        ))}
      </div>
      <div className="libgrid">
        {rows.length ? rows.map(([id, e]) => {
          const load = e.modes.includes('peso') && e.modes.includes('sinpeso') ? 'mixto' : e.modes.includes('peso') ? 'con peso' : 'sin peso';
          return (
            <div className="libcard" key={id} onClick={() => ctx.setModal({ type: 'libInfo', id })}>
              <LibThumb id={id} exercise={e} />
              <div className="lc-b">
                <div className="nm">{e.name}</div>
                <div className="mt">{load} · {e.level}</div>
              </div>
            </div>
          );
        }) : <div className="empty">Sin resultados.</div>}
      </div>
    </div>
  );
}
