import { useState } from "preact/hooks";
import "./settings.css";

export function Settings({ onBack, onClearData }) {
  const [confirming, setConfirming] = useState(false);

  const handleClear = () => {
    onClearData();
    setConfirming(false);
  };

  return (
    <div class="settings">
      <button class="settings__back" onClick={onBack}>&lt; BACK</button>
      <h2 class="settings__title">SETTINGS</h2>
      <div class="settings__section">
        <h3 class="settings__label">DATA</h3>
        {!confirming ? (
          <button class="settings__btn settings__btn--danger" onClick={() => setConfirming(true)}>
            CLEAR ALL DATA
          </button>
        ) : (
          <div class="settings__confirm">
            <p class="settings__warn">Delete all seen/notes data?</p>
            <div class="settings__confirm-actions">
              <button class="settings__btn settings__btn--danger" onClick={handleClear}>
                YES, DELETE
              </button>
              <button class="settings__btn" onClick={() => setConfirming(false)}>
                CANCEL
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
