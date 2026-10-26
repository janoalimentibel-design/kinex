import { expect, test, vi } from 'vitest';
import { watchAppUpdates } from '../src/pwaUpdates';

function fixture(controller: object | null = {}) {
  const serviceEvents = new EventTarget();
  const documentEvents = new EventTarget();
  const windowEvents = new EventTarget();
  const update = vi.fn().mockResolvedValue(undefined);
  const registration = { update };
  const serviceWorker = Object.assign(serviceEvents, {
    controller, ready: new Promise<unknown>(() => {}), getRegistration: vi.fn().mockResolvedValue(registration),
  });
  const document = Object.assign(documentEvents, { visibilityState: 'visible' });
  let online = true;
  const onReady = vi.fn();
  const stop = watchAppUpdates({ serviceWorker, window: windowEvents, document, isOnline: () => online }, onReady);
  const settle = async () => { await new Promise(resolve => setTimeout(resolve, 0)); };
  return { serviceWorker, document, window: windowEvents, update, onReady, stop, settle, setOnline(value: boolean) { online = value; } };
}

test('checks on startup, foreground, focus and restored connectivity without announcing an update', async () => {
  const state = fixture();
  await state.settle();
  expect(state.update).toHaveBeenCalledTimes(1);
  state.document.visibilityState = 'hidden';
  state.document.dispatchEvent(new Event('visibilitychange'));
  await state.settle();
  expect(state.update).toHaveBeenCalledTimes(1);
  state.document.visibilityState = 'visible';
  state.document.dispatchEvent(new Event('visibilitychange'));
  await state.settle();
  state.window.dispatchEvent(new Event('focus'));
  await state.settle();
  state.setOnline(false);
  state.window.dispatchEvent(new Event('focus'));
  await state.settle();
  expect(state.update).toHaveBeenCalledTimes(3);
  state.setOnline(true);
  state.window.dispatchEvent(new Event('online'));
  await state.settle();
  expect(state.update).toHaveBeenCalledTimes(4);
  expect(state.onReady).not.toHaveBeenCalled();
  state.stop();
});

test('first installation is quiet, a subsequent replacement announces readiness exactly once', async () => {
  const state = fixture(null);
  state.serviceWorker.controller = {};
  state.serviceWorker.dispatchEvent(new Event('controllerchange'));
  expect(state.onReady).not.toHaveBeenCalled();
  state.serviceWorker.controller = {};
  state.serviceWorker.dispatchEvent(new Event('controllerchange'));
  state.serviceWorker.dispatchEvent(new Event('controllerchange'));
  expect(state.onReady).toHaveBeenCalledTimes(1);
  state.stop();
  await state.settle();
});

test('network failure stays quiet and disposed listeners cannot announce or check again', async () => {
  const state = fixture();
  await state.settle();
  state.update.mockRejectedValueOnce(new Error('offline'));
  state.window.dispatchEvent(new Event('online'));
  await state.settle();
  expect(state.onReady).not.toHaveBeenCalled();
  const checks = state.update.mock.calls.length;
  state.stop();
  state.window.dispatchEvent(new Event('focus'));
  state.serviceWorker.controller = {};
  state.serviceWorker.dispatchEvent(new Event('controllerchange'));
  await state.settle();
  expect(state.update).toHaveBeenCalledTimes(checks);
  expect(state.onReady).not.toHaveBeenCalled();
});
