import "./species-list.css";

export function SpeciesList({
  species,
  types,
  statuses,
  statusCodes,
  search,
  onSearch,
  typeFilter,
  onTypeFilter,
  statusFilter,
  onStatusFilter,
  seenFilter,
  onSeenFilter,
  onSelect,
  onSettings,
  onLog,
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
          <button
            class="slist__shuffle"
            onClick={onLog}
            title="Sighting log"
          >
            #
          </button>
          <button
            class="slist__shuffle"
            onClick={onSettings}
            title="Settings"
          >
            *
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
        <div class="slist__filters">
          <button
            class={`slist__filter ${!statusFilter ? "slist__filter--active" : ""}`}
            onClick={() => onStatusFilter("")}
          >
            ALL
          </button>
          {statuses.map((code) => (
            <button
              key={code}
              class={`slist__filter slist__filter--status slist__filter--${code.toLowerCase()} ${statusFilter === code ? "slist__filter--active" : ""}`}
              onClick={() => onStatusFilter(statusFilter === code ? "" : code)}
            >
              {code}
            </button>
          ))}
        </div>
      </div>
      <ul class="slist__entries">
        {species.map((s) => (
          <li key={s.id} class="slist__entry" onClick={() => onSelect(s)}>
            {log[s.id]?.seen && <span class="slist__seen" title="Seen!">*</span>}
            <span class="slist__num">
              {String(s.number).padStart(4, "0")}
            </span>
            <span class="slist__name">{s.name}</span>
            {log[s.id]?.note && <span class="slist__has-note" title="Has note">+</span>}
            {statusCodes[s.conservation_status] && (
              <span class={`slist__status slist__status--${statusCodes[s.conservation_status].toLowerCase()}`}>
                {statusCodes[s.conservation_status]}
              </span>
            )}
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
