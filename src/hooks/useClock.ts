import { useMemo, useSyncExternalStore } from 'react';

type ClockListener = () => void;

type ClockStore = {
  subscribe: (listener: ClockListener) => () => void;
  getSnapshot: () => number;
};

const noopSubscribe = () => () => {};

function createClock(intervalMs: number, enabled: boolean): ClockStore {
  let value = Date.now();
  if (!enabled) return { subscribe: noopSubscribe, getSnapshot: () => value };
  let timer: ReturnType<typeof setInterval> | null = null;
  const listeners = new Set<ClockListener>();

  return {
    subscribe(listener) {
      value = Date.now();
      listeners.add(listener);
      if (!timer) {
        timer = setInterval(() => {
          value = Date.now();
          listeners.forEach((notify) => notify());
        }, intervalMs);
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && timer) {
          clearInterval(timer);
          timer = null;
        }
      };
    },
    getSnapshot() {
      return value;
    },
  };
}

export function useClock(intervalMs: number, enabled = true): number {
  const store = useMemo(() => createClock(intervalMs, enabled), [enabled, intervalMs]);

  return useSyncExternalStore(
    enabled ? store.subscribe : noopSubscribe,
    store.getSnapshot
  );
}
