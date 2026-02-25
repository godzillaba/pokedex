import { render } from "preact";
import { registerSW } from "virtual:pwa-register";
import { App } from "./app.jsx";
import "./app.css";

registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, r) {
    if (!r) return;
    setInterval(() => r.update(), 60 * 60 * 1000);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") r.update();
    });
  },
});

render(<App />, document.getElementById("app"));
