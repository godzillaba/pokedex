import { useEffect, useState } from "preact/hooks";
import "./species-card.css";

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

export function SpeciesCard({ species, entry, onToggleSeen, onSetNote, onBack }) {
  const [imgErr, setImgErr] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    if (species.original_image) new Image().src = species.original_image;
  }, [species.original_image]);

  return (
    <div class="scard">
      <div class="scard__nav">
        <button class="scard__back" onClick={onBack}>
          ◄ BACK
        </button>
        <a class="scard__wiki" href={species.wiki_url} target="_blank" rel="noopener noreferrer">
          WIKI ►
        </a>
      </div>

      <div class="scard__header">
        <span class="scard__id">#{String(species.id).padStart(3, "0")}</span>
        <h2 class="scard__name">{species.name}</h2>
        <span
          class={`scard__type scard__type--${species.type.toLowerCase()}`}
        >
          {species.type}
        </span>
      </div>

      <div
        class={`scard__image-frame${!imgErr && species.original_image ? " scard__image-frame--clickable" : ""}`}
        onClick={() => !imgErr && species.original_image && setShowOriginal((v) => !v)}
      >
        {imgErr ? (
          <div class="scard__placeholder">?</div>
        ) : (
          <img
            src={showOriginal ? species.original_image : `/${species.image}`}
            alt={species.name}
            onError={() => showOriginal ? setShowOriginal(false) : setImgErr(true)}
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
