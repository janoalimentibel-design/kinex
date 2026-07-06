// Gráficos SVG livianos (sin dependencias) con la estética oscura/neón.
// Clases con prefijo ch- para no colisionar con las clases legacy (.bar, .dot, .line).
import type { MetricPoint, WeekCount } from '../logic/stats';

const W = 340;
const H = 140;
const PAD = { top: 10, right: 8, bottom: 18, left: 22 };

function xAt(i: number, n: number): number {
  if (n <= 1) return PAD.left + (W - PAD.left - PAD.right) / 2;
  return PAD.left + (i * (W - PAD.left - PAD.right)) / (n - 1);
}

function yAt(v: number): number {
  return PAD.top + ((10 - v) * (H - PAD.top - PAD.bottom)) / 10;
}

function path(points: MetricPoint[], pick: (p: MetricPoint) => number): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xAt(i, points.length).toFixed(1)},${yAt(pick(p)).toFixed(1)}`).join(' ');
}

// Evolución de lumbar (después) y rodilla por sesión guardada.
export function MetricLines({ points }: { points: MetricPoint[] }) {
  if (points.length < 2) {
    return <div className="empty">Guardá al menos dos sesiones con métricas para ver tu evolución.</div>;
  }
  const last = points[points.length - 1];
  return (
    <div className="chartwrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Evolución de lumbar y rodilla">
        {[0, 5, 10].map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={yAt(v)} y2={yAt(v)} className="ch-grid" />
            <text x={PAD.left - 6} y={yAt(v) + 3} className="ch-axis" textAnchor="end">{v}</text>
          </g>
        ))}
        <path d={path(points, (p) => p.lumbarAfter)} className="ch-line lumbar" />
        <path d={path(points, (p) => p.knee)} className="ch-line knee" />
        {points.map((p, i) => (
          <g key={p.date}>
            <circle cx={xAt(i, points.length)} cy={yAt(p.lumbarAfter)} r={2.5} className="ch-dot lumbar" />
            <circle cx={xAt(i, points.length)} cy={yAt(p.knee)} r={2.5} className="ch-dot knee" />
          </g>
        ))}
        <text x={xAt(0, points.length)} y={H - 4} className="ch-axis" textAnchor="start">{points[0].date.slice(5)}</text>
        <text x={xAt(points.length - 1, points.length)} y={H - 4} className="ch-axis" textAnchor="end">{last.date.slice(5)}</text>
      </svg>
      <div className="ch-legend">
        <span><i className="sw lumbar"></i>Lumbar después</span>
        <span><i className="sw knee"></i>Rodilla</span>
      </div>
    </div>
  );
}

// Sesiones por semana (últimas N semanas).
export function WeekBars({ weeks }: { weeks: WeekCount[] }) {
  const max = Math.max(1, ...weeks.map((w) => w.count));
  const bw = (W - PAD.left - PAD.right) / weeks.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Sesiones por semana">
      {weeks.map((w, i) => {
        const h = (w.count / max) * (H - PAD.top - PAD.bottom);
        const x = PAD.left + i * bw + bw * 0.18;
        return (
          <g key={w.monday}>
            {w.count > 0 && (
              <>
                <rect x={x} y={H - PAD.bottom - h} width={bw * 0.64} height={h} rx={3} className="ch-bar" />
                <text x={x + bw * 0.32} y={H - PAD.bottom - h - 4} className="ch-axis" textAnchor="middle">{w.count}</text>
              </>
            )}
            <text x={x + bw * 0.32} y={H - 4} className="ch-axis" textAnchor="middle">{w.monday.slice(8)}/{w.monday.slice(5, 7)}</text>
          </g>
        );
      })}
    </svg>
  );
}
