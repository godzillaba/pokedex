import "./pokedex-shell.css";

export function PokedexShell({ children }) {
  return (
    <div class="pokedex">
      <div class="pokedex__scanlines" />
      <div class="pokedex__content">{children}</div>
    </div>
  );
}
