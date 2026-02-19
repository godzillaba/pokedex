import { useState, useMemo } from "preact/hooks";
import raw from "../data/species.json";
const data = raw.map((s, i) => ({ ...s, number: i + 1 }));

const STATUS_CODES = {
  "Least Concern": "LC",
  "Near Threatened": "NT",
  "Vulnerable": "VU",
  "Endangered": "EN",
  "Critically Endangered": "CR",
  "Extinct": "EX",
  "Data Deficient": "DD",
  "Secure": "DD",
};

export function useSpecies(log) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [seenFilter, setSeenFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const types = useMemo(
    () => [...new Set(data.map((s) => s.type))].sort(),
    [],
  );

  const statuses = useMemo(() => {
    const codes = new Set();
    for (const s of data) {
      const code = STATUS_CODES[s.conservation_status];
      if (code) codes.add(code);
    }
    return ["LC", "NT", "VU", "EN", "CR", "EX", "DD"].filter((c) => codes.has(c));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((s) => {
      if (typeFilter && s.type !== typeFilter) return false;
      if (statusFilter && STATUS_CODES[s.conservation_status] !== statusFilter) return false;
      if (q && !s.name.toLowerCase().includes(q)) return false;
      if (seenFilter === "seen" && !log[s.id]?.seen) return false;
      if (seenFilter === "unseen" && log[s.id]?.seen) return false;
      return true;
    });
  }, [search, typeFilter, statusFilter, seenFilter, log]);

  return {
    filtered, types, statuses,
    search, setSearch,
    typeFilter, setTypeFilter,
    statusFilter, setStatusFilter,
    seenFilter, setSeenFilter,
    STATUS_CODES,
  };
}
