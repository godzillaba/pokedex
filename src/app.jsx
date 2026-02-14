import { useState } from "preact/hooks";
import { PokedexShell } from "./components/pokedex-shell.jsx";
import { SpeciesList } from "./components/species-list.jsx";
import { SpeciesCard } from "./components/species-card.jsx";
import { useSpecies } from "./hooks/use-species.js";

export function App() {
  const { filtered, types, search, setSearch, typeFilter, setTypeFilter } =
    useSpecies();
  const [selected, setSelected] = useState(null);

  return (
    <PokedexShell>
      {selected ? (
        <SpeciesCard species={selected} onBack={() => setSelected(null)} />
      ) : (
        <SpeciesList
          species={filtered}
          types={types}
          search={search}
          onSearch={setSearch}
          typeFilter={typeFilter}
          onTypeFilter={setTypeFilter}
          onSelect={setSelected}
        />
      )}
    </PokedexShell>
  );
}
