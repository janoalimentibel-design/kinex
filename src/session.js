export function isoDate(date) { return date.toISOString().slice(0, 10); }
export function isModeCompatible(exercise, mode) { return mode === 'mix' || exercise.m.includes(mode); }
export function levelScore(level) { return level === 'Inicial' ? 1 : level === 'Progresivo' ? 2 : 3; }
export function suggestedGroups(date, combinations) {
  return combinations[(new Date(date).getDay() + 1) % combinations.length].slice();
}
export function createSession(date, combinations) {
  return { groups: suggestedGroups(date, combinations), mode: 'mix', format: 'base', done: {}, saved: false, metrics: null, repl: {}, extra: [] };
}
