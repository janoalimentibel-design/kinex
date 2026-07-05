// Vista Historial — port de renderHist + export/import de A2.8.
// La importación ahora pasa por parseBackup (v0 y v1) con vista previa antes de reemplazar.
import { useRef } from 'react';
import { DIAS, FORMATS, GROUPS, MES } from '../data/exercises';
import { parseBackup, serializeBackup, BackupError } from '../db/backup';
import { toV1Data } from '../db/bootstrap';
import { buildExerciseList, isoDate } from '../logic/session';
import { colorOf } from './media';
import type { Ctx } from './types';

export default function History({ ctx }: { ctx: Ctx }) {
  const { data, allEx } = ctx;
  const fileRef = useRef<HTMLInputElement>(null);

  const saved = Object.values(data.sessions)
    .filter((s) => s.saved)
    .sort((a, b) => b.date.localeCompare(a.date));

  const vol: Record<string, number> = {};
  for (const g of Object.keys(GROUPS)) vol[g] = 0;
  const now = new Date();
  for (const s of saved) {
    const diff = (now.getTime() - new Date(s.date).getTime()) / 864e5;
    if (diff <= 7 && diff >= -1) for (const g of s.groups) vol[g]++;
  }
  const max = Math.max(1, ...Object.values(vol));

  const exportData = () => {
    const blob = new Blob([serializeBackup(toV1Data(data))], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kinex-backup-${isoDate(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = parseBackup(await file.text());
      ctx.setModal({ type: 'importPreview', parsed });
    } catch (error) {
      alert(error instanceof BackupError ? error.message : 'Archivo no válido.');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="hist">
      <div className="sectionhead">
        <div>
          <h2>Historial</h2>
          <p>Sesiones, cambios, molestias y volumen semanal.</p>
        </div>
      </div>
      <div className="iobar">
        <button className="iobtn" onClick={exportData}>Exportar backup</button>
        <button className="iobtn" onClick={() => fileRef.current?.click()}>Importar</button>
        <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={(e) => void importData(e.target.files?.[0])} />
      </div>
      <div className="wkvol">
        <div className="t">Volumen últimos 7 días</div>
        <div>
          {Object.entries(GROUPS).map(([g, gg]) => (
            <div className="volrow" key={g}>
              <span className="gl" style={{ color: colorOf(g as keyof typeof GROUPS) }}>{gg.label}</span>
              <div className="vb"><div className="vf" style={{ background: colorOf(g as keyof typeof GROUPS), width: `${(vol[g] / max) * 100}%` }}></div></div>
              <span className="vc">{vol[g]}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        {saved.length ? saved.map((s) => {
          const date = new Date(s.date);
          const exs = buildExerciseList(s, allEx, data.sessions);
          return (
            <div className="hcard" key={s.date}>
              <div className="hd">{date.getDate()} {MES[date.getMonth()]}<small>{DIAS[date.getDay()]}</small></div>
              <div className="hg">
                <div>
                  {s.groups.map((g, i) => (
                    <span key={i} className="gtag" style={{ background: colorOf(g), fontSize: 10 }}>{GROUPS[g].label}</span>
                  ))}
                </div>
                <div className="hrow"><b>{FORMATS[s.format].name}</b> · {s.mode} · {exs.length} ejercicios</div>
                <div className="hrow">
                  Lumbar {s.metrics?.lumbarBefore ?? '-'}→{s.metrics?.lumbarAfter ?? '-'} · Rodilla {s.metrics?.knee ?? '-'} · Energía {s.metrics?.energy ?? '-'}
                </div>
                {s.metrics?.notes && <div className="hrow">“{s.metrics.notes}”</div>}
              </div>
            </div>
          );
        }) : <div className="empty">Todavía no guardaste sesiones.</div>}
      </div>
    </div>
  );
}
