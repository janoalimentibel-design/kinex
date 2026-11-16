import { NOV16_DAYS, NOV16_END, NOV16_ID, NOV16_START } from '../logic/routineNov16';
import { isoDate } from '../logic/session';

export default function RecoveryWeek({ revision, loading, error, onLoad }: {
  revision?: string; loading: boolean; error: string | null; onLoad(): void;
}) {
  const today = isoDate(new Date());
  if (today < NOV16_START || today > NOV16_END) return null;
  return <section className="suggestion-card" data-testid="reviewed-routine-nov16">
    <div className="t">Semana del 16–22 de noviembre</div>
    <h3>Descarga activa</h3>
    <p>El objetivo es mantener movimiento cómodo y reevaluar antes de retomar cargas. Esta semana no programa fuerza ni abdominales avanzados.</p>
    <ol>{NOV16_DAYS.map(day => <li key={day.date}><b>{day.label} {Number(day.date.slice(-2))}:</b> {day.walkingText}</li>)}</ol>
    <details>
      <summary>Activación suave opcional · solo si es indolora</summary>
      <p>Elegí una postura cómoda, de pie con apoyo si te resulta mejor. Mantené el cuello y el tronco quietos, sin buscar el movimiento que pinza.</p>
      <p>Al exhalar, activá suavemente el abdomen durante 5 segundos, sin apretar fuerte ni contener la respiración. Relajá y descansá 10–15 segundos. Probá 4 repeticiones; omitilas si aparece o aumenta la molestia.</p>
      <p>Es una opción de activación, no un tratamiento de la causa del dolor. Si no seguís mejorando, pedí valoración antes de retomar fuerza.</p>
    </details>
    <p>Los tiempos son un punto de partida, no una cuota. Acortá o detené la actividad si aumenta la molestia. No fuerces estiramientos ni repitas el gesto que dispara el dolor.</p>
    <p>Se conservan tus días ya empezados y tus elecciones personales. Podés registrar una caminata en Actividad únicamente cuando la hayas hecho.</p>
    <button className="btn btn-primary" disabled={loading} onClick={onLoad}>{loading ? 'Guardando rutina…' : revision === NOV16_ID ? 'Abrir semana suave' : 'Cargar semana suave'}</button>
    {error && <p role="alert">{error}</p>}
  </section>;
}
