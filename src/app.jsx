import { useState, useRef, useEffect } from "preact/hooks";
import { PokedexShell } from "./components/pokedex-shell.jsx";
import { SpeciesList } from "./components/species-list.jsx";
import { SpeciesCard } from "./components/species-card.jsx";
import { Settings } from "./components/settings.jsx";
import { SightingLog } from "./components/sighting-log.jsx";
import { useSpecies } from "./hooks/use-species.js";
import { useLog } from "./hooks/use-log.js";

export function App() {
  const { log, toggleSeen, setNote, setDate, clearLog } = useLog();
  const {
    filtered, types, statuses, search, setSearch,
    typeFilter, setTypeFilter, statusFilter, setStatusFilter,
    seenFilter, setSeenFilter, STATUS_CODES,
  } = useSpecies(log);
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState("list");
  const scrollY = useRef(0);

  const handleSelect = (s) => {
    scrollY.current = window.scrollY;
    history.pushState({ speciesId: s.id }, "");
    setSelected(s);
    window.scrollTo(0, 0);
  };

  const handleSettings = () => {
    scrollY.current = window.scrollY;
    history.pushState({ page: "settings" }, "");
    setPage("settings");
    window.scrollTo(0, 0);
  };

  const handleLog = () => {
    scrollY.current = window.scrollY;
    history.pushState({ page: "log" }, "");
    setPage("log");
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    history.back();
  };

  useEffect(() => {
    const onPopState = () => {
      setSelected(null);
      setPage("list");
      requestAnimationFrame(() => window.scrollTo(0, scrollY.current));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return (
    <PokedexShell>
      <div style={{ display: selected || page !== "list" ? 'none' : undefined }}>
        <SpeciesList
          species={filtered}
          types={types}
          statuses={statuses}
          statusCodes={STATUS_CODES}
          search={search}
          onSearch={setSearch}
          typeFilter={typeFilter}
          onTypeFilter={setTypeFilter}
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
          seenFilter={seenFilter}
          onSeenFilter={setSeenFilter}
          onSelect={handleSelect}
          onSettings={handleSettings}
          onLog={handleLog}
          log={log}
        />
      </div>
      {selected && (
        <SpeciesCard
          species={selected}
          entry={log[selected.id] || { seen: false, note: "", date: "" }}
          onToggleSeen={() => toggleSeen(selected.id)}
          onSetNote={(note) => setNote(selected.id, note)}
          onSetDate={(date) => setDate(selected.id, date)}
          onBack={handleBack}
        />
      )}
      {page === "log" && (
        <SightingLog log={log} onSelect={handleSelect} onBack={handleBack} />
      )}
      {page === "settings" && (
        <Settings onBack={handleBack} onClearData={clearLog} />
      )}
    </PokedexShell>
  );
}
