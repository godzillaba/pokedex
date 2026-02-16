import { useState, useRef, useEffect } from "preact/hooks";
import { PokedexShell } from "./components/pokedex-shell.jsx";
import { SpeciesList } from "./components/species-list.jsx";
import { SpeciesCard } from "./components/species-card.jsx";
import { useSpecies } from "./hooks/use-species.js";
import { useLog } from "./hooks/use-log.js";

export function App() {
  const { log, toggleSeen, setNote } = useLog();
  const { filtered, types, search, setSearch, typeFilter, setTypeFilter, seenFilter, setSeenFilter } =
    useSpecies(log);
  const [selected, setSelected] = useState(null);
  const scrollY = useRef(0);

  const handleSelect = (s) => {
    scrollY.current = window.scrollY;
    history.pushState({ speciesId: s.id }, "");
    setSelected(s);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    history.back();
  };

  useEffect(() => {
    const onPopState = () => {
      setSelected(null);
      requestAnimationFrame(() => window.scrollTo(0, scrollY.current));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return (
    <PokedexShell>
      <div style={{ display: selected ? 'none' : undefined }}>
        <SpeciesList
          species={filtered}
          types={types}
          search={search}
          onSearch={setSearch}
          typeFilter={typeFilter}
          onTypeFilter={setTypeFilter}
          seenFilter={seenFilter}
          onSeenFilter={setSeenFilter}
          onSelect={handleSelect}
          log={log}
        />
      </div>
      {selected && (
        <SpeciesCard
          species={selected}
          entry={log[selected.id] || { seen: false, note: "" }}
          onToggleSeen={() => toggleSeen(selected.id)}
          onSetNote={(note) => setNote(selected.id, note)}
          onBack={handleBack}
        />
      )}
    </PokedexShell>
  );
}
