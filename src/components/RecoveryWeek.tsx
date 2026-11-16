import { NOV16_DAYS, NOV16_END, NOV16_ID, NOV16_START } from '../logic/routineNov16';
import { isoDate } from '../logic/session';

export default function RecoveryWeek({ revision, loading, error, onLoad }: {
  revision?: string; loading: boolean; error: string | null; onLoad(): void;
}) {
  const today = isoDate(new Date());
  if (today < NOV16_START || today > NOV16_END) return null;
  return <section className="suggestion-card" data-testid="reviewed-routine-nov16">
    <div className="t">Semana del 16–22 de noviembre</div>
    <h3>Mix suave: fuerza con apoyo y actividad cómoda</h3>
    <p>Lunes: pecho y bíceps. Jueves: piernas y tríceps. Sábado: espalda con apoyo y gemelos, solo si seguís mejorando. Carga muy ligera, una serie de prueba y como máximo dos de 10–12, con 60–90 segundos de descanso. Omití cualquier ejercicio que reproduzca el pinchazo, aumente la molestia o te deje peor después.</p>
    <p>Cuello cómodo, respiración normal y nada de balanceos. No busques fatiga ni fallo. La polea alta de espalda y los abdominales avanzados quedan fuera de esta propuesta temporal. Si no seguís mejorando, pedí valoración antes de aumentar cargas.</p>
    <ol>{NOV16_DAYS.map(day => <li key={day.date}><b>{day.label} {Number(day.date.slice(-2))}:</b> {day.walkingText}</li>)}</ol>
    <details>
      <summary>Qué exige más a la espalda en esta propuesta</summary>
      <p>El curl sentado con respaldo y la extensión de rodilla con espalda apoyada permiten trabajar sin sostener una inclinación del tronco. El press con cabeza y espalda apoyadas también evita sostener el tronco en el aire, pero sigue transmitiendo fuerza: no hagas puente ni fuerces el arco.</p>
      <p>El remo con pecho apoyado reduce la necesidad de sostener el tronco inclinado, pero trabaja directamente la espalda media; por eso queda para una prueba posterior y opcional. Esta comparación se basa en postura y apoyos, no confirma qué ejercicio tolerás ni identifica la causa del dolor.</p>
      <p>Se posponen peso muerto, remo inclinado sin apoyo, cargas intensas, carries, dominadas y core avanzado. No se busca mantener el volumen de una semana normal.</p>
    </details>
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
