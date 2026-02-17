import "./species-list.css";

export function SpeciesList({
  species,
  types,
  search,
  onSearch,
  typeFilter,
  onTypeFilter,
  seenFilter,
  onSeenFilter,
  onSelect,
  log,
}) {
  return (
    <div class="slist">
      <div class="slist__controls">
        <div class="slist__search-row">
          <input
            class="slist__search"
            type="text"
            placeholder="SEARCH..."
            value={search}
            onInput={(e) => onSearch(e.target.value)}
          />
          <button
            class="slist__shuffle"
            onClick={() => species.length && onSelect(species[Math.floor(Math.random() * species.length)])}
            title="Random species"
          >
            ?
          </button>
        </div>
        <div class="slist__filters">
          <button
            class={`slist__filter ${!typeFilter ? "slist__filter--active" : ""}`}
            onClick={() => onTypeFilter("")}
          >
            ALL
          </button>
          {types.map((t) => (
            <button
              key={t}
              class={`slist__filter ${typeFilter === t ? "slist__filter--active" : ""}`}
              onClick={() => onTypeFilter(typeFilter === t ? "" : t)}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
        <div class="slist__filters">
          <button
            class={`slist__filter ${!seenFilter ? "slist__filter--active" : ""}`}
            onClick={() => onSeenFilter("")}
          >
            ALL
          </button>
          <button
            class={`slist__filter ${seenFilter === "seen" ? "slist__filter--active" : ""}`}
            onClick={() => onSeenFilter(seenFilter === "seen" ? "" : "seen")}
          >
            SEEN
          </button>
          <button
            class={`slist__filter ${seenFilter === "unseen" ? "slist__filter--active" : ""}`}
            onClick={() => onSeenFilter(seenFilter === "unseen" ? "" : "unseen")}
          >
            UNSEEN
          </button>
        </div>
      </div>
      <ul class="slist__entries">
        {species.map((s) => (
          <li key={s.id} class="slist__entry" onClick={() => onSelect(s)}>
            {log[s.id]?.seen && <span class="slist__seen" title="Seen!">*</span>}
            <span class="slist__num">
              {String(s.id).padStart(3, "0")}
            </span>
            <span class="slist__name">{s.name}</span>
            {log[s.id]?.note && <span class="slist__has-note" title="Has note">+</span>}
            <span class={`slist__type slist__type--${s.type.toLowerCase()}`}>
              {s.type}
            </span>
          </li>
        ))}
        {species.length === 0 && (
          <li class="slist__empty">NO SPECIES FOUND</li>
        )}
      </ul>
    </div>
  );
}
