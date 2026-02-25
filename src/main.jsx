import { render } from "preact";
import { registerSW } from "virtual:pwa-register";
import { App } from "./app.jsx";
import "./app.css";

registerSW({ immediate: true });

render(<App />, document.getElementById("app"));
