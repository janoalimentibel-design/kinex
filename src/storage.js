export function createDefaultDB() {
  return { sessions: {}, custom: {}, plan: { week: 'Semana 1', focus: 'Fuerza', secondary: '', objective: '', rule: '', notes: '' } };
}

export function loadDatabase(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? Object.assign(fallback, JSON.parse(saved)) : fallback;
  } catch (error) {
    console.warn('KINEX: no se pudo leer localStorage', error);
    return fallback;
  }
}

export function saveDatabase(key, db) {
  localStorage.setItem(key, JSON.stringify(db));
}
