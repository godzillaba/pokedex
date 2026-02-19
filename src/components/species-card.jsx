import { useEffect, useState } from "preact/hooks";
import "./species-card.css";

const BASE = import.meta.env.BASE_URL;
const STAT_LABELS = { size: "SIZE", speed: "SPD", rarity: "RAR", danger: "DNG" };

const STATUS_CLASS = {
  "Least Concern": "lc",
  "Near Threatened": "nt",
  "Vulnerable": "vu",
  "Endangered": "en",
  "Critically Endangered": "cr",
  "Extinct": "ex",
  "Data Deficient": "dd",
  "Secure": "dd",
};

function StatBar({ label, value }) {
  return (
    <div class="scard__stat">
      <span class="scard__stat-label">{label}</span>
      <div class="scard__stat-track">
        <div class="scard__stat-fill" style={{ width: `${value}%` }} />
      </div>
      <span class="scard__stat-val">{value}</span>
    </div>
  );
}

export function SpeciesCard({ species, entry, onToggleSeen, onSetNote, onSetDate, onBack, preferOriginal, onToggleImageMode }) {
  const [imgErr, setImgErr] = useState(false);
  // "sprite" | "original" | "fallback"
  const [imgMode, setImgMode] = useState("sprite");

  const hasAnyOriginal = species.original_image || species.fallback_image;

  useEffect(() => {
    setImgErr(false);
    if (preferOriginal && hasAnyOriginal) {
      setImgMode(species.original_image ? "original" : "fallback");
    } else {
      setImgMode("sprite");
    }
  }, [species.id, preferOriginal]);

  useEffect(() => {
    if (species.original_image) new Image().src = species.original_image;
    if (species.fallback_image) new Image().src = `${BASE}${species.fallback_image}`;
  }, [species.original_image, species.fallback_image]);

  const imgSrc =
    imgMode === "original" ? species.original_image :
    imgMode === "fallback" ? `${BASE}${species.fallback_image}` :
    `${BASE}${species.image}`;

  const onImgError = () => {
    if (imgMode === "original" && species.fallback_image) setImgMode("fallback");
    else if (imgMode === "original" || imgMode === "fallback") setImgMode("sprite");
    else setImgErr(true);
  };

  const toggleImage = () => {
    if (!hasAnyOriginal) return;
    onToggleImageMode();
  };

  return (
    <div class="scard">
      <div class="scard__nav">
        <button class="scard__back" onClick={onBack}>
          BACK
        </button>
        <a class="scard__wiki" href={species.wiki_url} target="_blank" rel="noopener noreferrer">
          WIKI
        </a>
      </div>

      <div class="scard__header">
        <span class="scard__id">#{String(species.number).padStart(4, "0")}</span>
        <h2 class="scard__name">{species.name}</h2>
        <span
          class={`scard__type scard__type--${species.type.toLowerCase()}`}
        >
          {species.type}
        </span>
      </div>

      <div
        class={`scard__image-frame${!imgErr && hasAnyOriginal ? " scard__image-frame--clickable" : ""}`}
        onClick={() => !imgErr && toggleImage()}
      >
        {imgErr ? (
          <div class="scard__placeholder">?</div>
        ) : (
          <img
            src={imgSrc}
            alt={species.name}
            onError={onImgError}
            loading="lazy"
          />
        )}
      </div>

      <div class="scard__log">
        <button
          class={`scard__seen-btn ${entry.seen ? "scard__seen-btn--active" : ""}`}
          onClick={onToggleSeen}
        >
          {entry.seen ? "* SEEN" : "MARK SEEN"}
        </button>
        {entry.seen && (
          <input
            class="scard__date"
            type="date"
            value={entry.date || ""}
            onInput={(e) => onSetDate(e.target.value)}
          />
        )}
        <textarea
          class="scard__note"
          placeholder="Add a note..."
          value={entry.note}
          onInput={(e) => onSetNote(e.target.value)}
          rows={3}
        />
      </div>

      <p class="scard__species">{species.species}</p>
      <p class="scard__desc">{species.description}</p>

      <div class="scard__info">
        <div class="scard__info-row">
          <span class="scard__info-label">REGION</span>
          <span>{species.region}</span>
        </div>
        <div class="scard__info-row">
          <span class="scard__info-label">HABITAT</span>
          <span>{species.habitat}</span>
        </div>
        {species.conservation_status && (
          <div class="scard__info-row">
            <span class="scard__info-label">STATUS</span>
            <span class={`scard__status scard__status--${STATUS_CLASS[species.conservation_status] || "dd"}`}>
              {species.conservation_status}
            </span>
          </div>
        )}
      </div>

      <div class="scard__stats">
        {Object.entries(species.stats).map(([key, val]) => (
          <StatBar key={key} label={STAT_LABELS[key]} value={val} />
        ))}
      </div>
    </div>
  );
}
