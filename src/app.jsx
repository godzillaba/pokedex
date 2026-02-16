import { useState, useRef } from "preact/hooks";
import { PokedexShell } from "./components/pokedex-shell.jsx";
import { SpeciesList } from "./components/species-list.jsx";
import { SpeciesCard } from "./components/species-card.jsx";
import { useSpecies } from "./hooks/use-species.js";
import { useLog } from "./hooks/use-log.js";

export function App() {
  const { filtered, types, search, setSearch, typeFilter, setTypeFilter } =
    useSpecies();
  const { log, toggleSeen, setNote } = useLog();
  const [selected, setSelected] = useState(null);
  const scrollY = useRef(0);

  const handleSelect = (s) => {
    scrollY.current = window.scrollY;
    setSelected(s);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setSelected(null);
    requestAnimationFrame(() => window.scrollTo(0, scrollY.current));
  };

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
