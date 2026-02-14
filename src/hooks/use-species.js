import { useState, useMemo } from "preact/hooks";
import data from "../data/species.json";

export function useSpecies() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const types = useMemo(
    () => [...new Set(data.map((s) => s.type))].sort(),
    [],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((s) => {
      if (typeFilter && s.type !== typeFilter) return false;
      if (q && !s.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, typeFilter]);

  return { filtered, types, search, setSearch, typeFilter, setTypeFilter };
}
