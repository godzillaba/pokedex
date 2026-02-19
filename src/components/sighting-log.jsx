import species from "../data/species.json";
import "./sighting-log.css";

const byId = Object.fromEntries(species.map((s, i) => [s.id, { ...s, number: i + 1 }]));

export function SightingLog({ log, onSelect, onBack }) {
  const entries = Object.entries(log)
    .filter(([, e]) => e.seen)
    .map(([id, e]) => ({ id, date: e.date || "", species: byId[id] }))
    .filter((e) => e.species)
    .sort((a, b) => {
      if (a.date && b.date) return b.date.localeCompare(a.date);
      if (a.date) return -1;
      if (b.date) return 1;
      return 0;
    });

  return (
    <div class="slog">
      <div class="slog__nav">
        <button class="slog__back" onClick={onBack}>BACK</button>
        <span class="slog__title">SIGHTING LOG</span>
        <span class="slog__count">{entries.length}</span>
      </div>
      {entries.length === 0 ? (
        <p class="slog__empty">NO SIGHTINGS YET</p>
      ) : (
        <ul class="slog__list">
          {entries.map((e) => (
            <li key={e.id} class="slog__entry" onClick={() => onSelect(e.species)}>
              <span class="slog__date">{e.date || "---"}</span>
              <span class="slog__num">#{String(e.species.number).padStart(4, "0")}</span>
              <span class="slog__name">{e.species.name}</span>
              <span class={`slog__type slog__type--${e.species.type.toLowerCase()}`}>
                {e.species.type}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
