import { useState, useCallback } from "preact/hooks";

const KEY = "wilddex-log";

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

function save(log) {
  localStorage.setItem(KEY, JSON.stringify(log));
}

export function useLog() {
  const [log, setLog] = useState(load);

  const toggleSeen = useCallback((id) => {
    setLog((prev) => {
      const entry = prev[id] || { seen: false, note: "" };
      const next = { ...prev, [id]: { ...entry, seen: !entry.seen } };
      save(next);
      return next;
    });
  }, []);

  const setNote = useCallback((id, note) => {
    setLog((prev) => {
      const entry = prev[id] || { seen: false, note: "" };
      const next = { ...prev, [id]: { ...entry, note } };
      save(next);
      return next;
    });
  }, []);

  const clearLog = useCallback(() => {
    localStorage.removeItem(KEY);
    setLog({});
  }, []);

  return { log, toggleSeen, setNote, clearLog };
}
