import { useState, useRef } from "preact/hooks";
import "./settings.css";

export function Settings({ onBack, onClearData, log, onRestore }) {
  const [confirming, setConfirming] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState("");
  const fileRef = useRef(null);

  const handleClear = () => {
    onClearData();
    setConfirming(false);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(log, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wilddex-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        onRestore(data);
        setRestoreMsg("Data restored!");
      } catch {
        setRestoreMsg("Invalid file.");
      }
      setTimeout(() => setRestoreMsg(""), 3000);
    };
    reader.readAsText(file);
    fileRef.current.value = "";
  };

  return (
    <div class="settings">
      <button class="settings__back" onClick={onBack}>&lt; BACK</button>
      <h2 class="settings__title">SETTINGS</h2>
      <div class="settings__section">
        <h3 class="settings__label">DATA</h3>
        <div class="settings__actions">
          <button class="settings__btn" onClick={handleExport}>
            EXPORT DATA
          </button>
          <button class="settings__btn" onClick={() => fileRef.current.click()}>
            RESTORE FROM FILE
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            class="settings__file-input"
            onChange={handleRestore}
          />
          {restoreMsg && <p class="settings__msg">{restoreMsg}</p>}
        </div>
        <hr class="settings__divider" />
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
