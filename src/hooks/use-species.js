import { useState, useMemo } from "preact/hooks";
import data from "../data/species.json";

export function useSpecies(log) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [seenFilter, setSeenFilter] = useState("");

  const types = useMemo(
    () => [...new Set(data.map((s) => s.type))].sort(),
    [],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((s) => {
      if (typeFilter && s.type !== typeFilter) return false;
      if (q && !s.name.toLowerCase().includes(q)) return false;
      if (seenFilter === "seen" && !log[s.id]?.seen) return false;
      if (seenFilter === "unseen" && log[s.id]?.seen) return false;
      return true;
    });
  }, [search, typeFilter, seenFilter, log]);

  return { filtered, types, search, setSearch, typeFilter, setTypeFilter, seenFilter, setSeenFilter };
}
