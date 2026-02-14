import { useState } from "preact/hooks";
import "./species-card.css";

const STAT_LABELS = { size: "SIZE", speed: "SPD", rarity: "RAR", danger: "DNG" };

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

export function SpeciesCard({ species, onBack }) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <div class="scard">
      <button class="scard__back" onClick={onBack}>
        ◄ BACK
      </button>

      <div class="scard__header">
        <span class="scard__id">#{String(species.id).padStart(3, "0")}</span>
        <h2 class="scard__name">{species.name}</h2>
        <span
          class={`scard__type scard__type--${species.type.toLowerCase()}`}
        >
          {species.type}
        </span>
      </div>

      <div class="scard__image-frame">
        {imgErr ? (
          <div class="scard__placeholder">?</div>
        ) : (
          <img
            src={`/${species.image}`}
            alt={species.name}
            onError={() => setImgErr(true)}
            loading="lazy"
          />
        )}
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
      </div>

      <div class="scard__stats">
        {Object.entries(species.stats).map(([key, val]) => (
          <StatBar key={key} label={STAT_LABELS[key]} value={val} />
        ))}
      </div>
    </div>
  );
}
