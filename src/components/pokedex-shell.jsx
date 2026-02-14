import "./pokedex-shell.css";

export function PokedexShell({ children }) {
  return (
    <div class="pokedex">
      <div class="pokedex__top">
        <div class="pokedex__lens" />
        <div class="pokedex__lights">
          <span class="pokedex__light pokedex__light--red" />
          <span class="pokedex__light pokedex__light--yellow" />
          <span class="pokedex__light pokedex__light--green" />
        </div>
      </div>
      <div class="pokedex__screen">
        <div class="pokedex__scanlines" />
        <div class="pokedex__content">{children}</div>
      </div>
      <div class="pokedex__bottom">
        <div class="pokedex__dpad">
          <span />
          <span />
        </div>
        <div class="pokedex__buttons">
          <span class="pokedex__btn pokedex__btn--a" />
          <span class="pokedex__btn pokedex__btn--b" />
        </div>
      </div>
      <div class="pokedex__hinge" />
    </div>
  );
}
