import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import { watchAppUpdates } from './pwaUpdates';
import './styles.css';

function AppUpdateNotice() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    return watchAppUpdates({ serviceWorker: navigator.serviceWorker, window, document, isOnline: () => navigator.onLine }, () => setReady(true));
  }, []);
  if (!ready) return null;
  return <div className="notice" role="status">
    <b>Actualización lista.</b> Recargá cuando termines de guardar tus cambios.
    <div><button className="btn btn-primary" onClick={() => window.location.reload()}>Recargar KINEX</button></div>
  </div>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppUpdateNotice />
    <App />
  </StrictMode>,
);
