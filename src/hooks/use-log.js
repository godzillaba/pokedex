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
      const entry = prev[id] || { seen: false, note: "", date: "" };
      const seen = !entry.seen;
      const date = seen && !entry.date ? new Date().toISOString().slice(0, 10) : entry.date || "";
      const next = { ...prev, [id]: { ...entry, seen, date } };
      save(next);
      return next;
    });
  }, []);

  const setNote = useCallback((id, note) => {
    setLog((prev) => {
      const entry = prev[id] || { seen: false, note: "", date: "" };
      const next = { ...prev, [id]: { ...entry, note } };
      save(next);
      return next;
    });
  }, []);

  const setDate = useCallback((id, date) => {
    setLog((prev) => {
      const entry = prev[id] || { seen: false, note: "", date: "" };
      const next = { ...prev, [id]: { ...entry, date } };
      save(next);
      return next;
    });
  }, []);

  const clearLog = useCallback(() => {
    localStorage.removeItem(KEY);
    setLog({});
  }, []);

  return { log, toggleSeen, setNote, setDate, clearLog };
}
