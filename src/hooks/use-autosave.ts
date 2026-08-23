'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveStatus = 'idle' | 'pending' | 'saved' | 'error';

export interface UseAutosaveOptions<T> {
  value: T;
  /** Persists the value. Rejections surface as an 'error' status. */
  save: (value: T) => Promise<void>;
  /** Quiet period before a save fires. */
  debounceMs?: number;
  enabled?: boolean;
}

export interface UseAutosaveResult {
  status: SaveStatus;
  /** When the last successful save landed, for "Saved just now". */
  lastSavedAt: Date | null;
  /** Forces an immediate save, e.g. just before submitting. */
  flush: () => Promise<void>;
}

/**
 * Debounced autosave for exam and editor state (§11, §14).
 *
 * Also flushes on tab hide, so closing a laptop lid does not cost the learner
 * their draft. The first render never saves — only real changes do.
 */
export function useAutosave<T>({
  value,
  save,
  debounceMs = 1200,
  enabled = true,
}: UseAutosaveOptions<T>): UseAutosaveResult {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const saveRef = useRef(save);
  const valueRef = useRef(value);

  /** The value as last persisted, so we never re-save an unchanged payload. */
  const savedSnapshot = useRef<string>(JSON.stringify(value));
  const timeout = useRef<number | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);

  // Mirrored through effects rather than assigned during render: React 19
  // forbids mutating a ref mid-render.
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const persist = useCallback(async () => {
    const snapshot = JSON.stringify(valueRef.current);
    if (snapshot === savedSnapshot.current) return;

    setStatus('pending');
    const run = (async () => {
      try {
        await saveRef.current(valueRef.current);
        savedSnapshot.current = snapshot;
        setStatus('saved');
        setLastSavedAt(new Date());
      } catch {
        setStatus('error');
      } finally {
        inFlight.current = null;
      }
    })();
    inFlight.current = run;
    await run;
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (JSON.stringify(value) === savedSnapshot.current) return;

    if (timeout.current !== null) window.clearTimeout(timeout.current);
    timeout.current = window.setTimeout(() => {
      void persist();
    }, debounceMs);

    return () => {
      if (timeout.current !== null) window.clearTimeout(timeout.current);
    };
  }, [value, enabled, debounceMs, persist]);

  useEffect(() => {
    if (!enabled) return;
    const onHide = () => {
      if (document.visibilityState === 'hidden') void persist();
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [enabled, persist]);

  const flush = useCallback(async () => {
    if (timeout.current !== null) window.clearTimeout(timeout.current);
    await (inFlight.current ?? persist());
  }, [persist]);

  return { status, lastSavedAt, flush };
}

export function saveStatusLabel(status: SaveStatus, lastSavedAt: Date | null): string {
  if (status === 'pending') return 'Saving…';
  if (status === 'error') return 'Not saved';
  if (status === 'saved' || lastSavedAt) {
    if (!lastSavedAt) return 'Saved';
    const seconds = Math.floor((Date.now() - lastSavedAt.getTime()) / 1000);
    if (seconds < 45) return 'Saved just now';
    const minutes = Math.round(seconds / 60);
    return 'Saved ' + minutes + (minutes === 1 ? ' minute ago' : ' minutes ago');
  }
  return 'Not saved yet';
}
