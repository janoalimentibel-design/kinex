// Barra de temporizador de descanso, fija sobre la navegación.
// Vibra al terminar (si el dispositivo lo permite) y se cierra sola.
export interface RestState {
  label: string;
  left: number;
  total: number;
  kind: 'rest' | 'work';
}

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function RestTimer({ rest, onExtend, onClose }: {
  rest: RestState;
  onExtend: () => void;
  onClose: () => void;
}) {
  const finished = rest.left <= 0;
  const pct = rest.total ? Math.max(0, Math.min(100, (rest.left / rest.total) * 100)) : 0;
  return (
    <div className={`resttimer ${finished ? 'fin' : ''}`}>
      <div className="rt-bar" style={{ width: `${pct}%` }}></div>
      <div className="rt-row">
        <div className="rt-info">
          <span className="rt-time">{finished ? (rest.kind === 'work' ? '¡Tiempo!' : '¡Listo!') : fmt(rest.left)}</span>
          <span className="rt-label">{finished ? (rest.kind === 'work' ? 'podés cambiar de lado o descansar' : 'siguiente serie') : `${rest.kind === 'work' ? 'trabajo' : 'descanso'} · ${rest.label}`}</span>
        </div>
        {!finished && <button className="rt-btn" onClick={onExtend}>+15s</button>}
        <button className="rt-btn" onClick={onClose}>✕</button>
      </div>
    </div>
  );
}
