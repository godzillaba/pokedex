import { useState, useCallback } from "preact/hooks";
import data from "../data/species.json";

const KEY = "wilddex-log";
const MIGRATED_KEY = "wilddex-log-v2";

function migrate(log) {
  if (localStorage.getItem(MIGRATED_KEY)) return log;
  const numToSlug = {};
  for (let i = 0; i < data.length; i++) numToSlug[String(i + 1)] = data[i].id;
  const migrated = {};
  for (const [k, v] of Object.entries(log)) {
    migrated[numToSlug[k] || k] = v;
  }
  localStorage.setItem(MIGRATED_KEY, "1");
  localStorage.setItem(KEY, JSON.stringify(migrated));
  return migrated;
}

function load() {
  try {
    const log = JSON.parse(localStorage.getItem(KEY)) || {};
    return migrate(log);
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
    localStorage.removeItem(MIGRATED_KEY);
    setLog({});
  }, []);

  const restoreLog = useCallback((imported) => {
    localStorage.setItem(KEY, JSON.stringify(imported));
    localStorage.setItem(MIGRATED_KEY, "1");
    setLog(imported);
  }, []);

  return { log, toggleSeen, setNote, setDate, clearLog, restoreLog };
}
