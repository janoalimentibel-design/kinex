interface Events {
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

interface UpdateEnvironment {
  serviceWorker: Events & {
    controller: object | null;
    ready: Promise<unknown>;
    getRegistration(): Promise<{ update(): Promise<unknown> } | undefined>;
  };
  window: Events;
  document: Events & { visibilityState: string };
  isOnline(): boolean;
}

/** Check again after an installed app returns from the background. Never reload it. */
export function watchAppUpdates(environment: UpdateEnvironment, onUpdateReady: () => void): () => void {
  const { serviceWorker, window, document, isOnline } = environment;
  let previousController = serviceWorker.controller;
  let disposed = false;
  let checking = false;

  const check = () => {
    if (disposed || checking || !isOnline() || document.visibilityState !== 'visible') return;
    checking = true;
    void serviceWorker.getRegistration().then(registration => {
      if (!disposed && registration) return registration.update();
    }).catch(() => {
      // Offline or an unavailable server is not evidence of an update.
    }).finally(() => { checking = false; });
  };
  const controllerChanged = () => {
    const next = serviceWorker.controller;
    if (previousController && next && previousController !== next) onUpdateReady();
    previousController = next;
  };

  serviceWorker.addEventListener('controllerchange', controllerChanged);
  document.addEventListener('visibilitychange', check);
  window.addEventListener('focus', check);
  window.addEventListener('online', check);
  check();
  // The generated registration script runs at window.load, possibly after us.
  void serviceWorker.ready.then(check).catch(() => {});

  return () => {
    disposed = true;
    serviceWorker.removeEventListener('controllerchange', controllerChanged);
    document.removeEventListener('visibilitychange', check);
    window.removeEventListener('focus', check);
    window.removeEventListener('online', check);
  };
}
