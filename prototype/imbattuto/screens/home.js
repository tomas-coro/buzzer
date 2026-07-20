import { DIFFICULTIES } from "../../../game/difficulty.js";

const FORMATI = ["playoff", "stagione", "sfida"];

// ctx: { state, dispatch, go }
export function render(ctx) {
  const el = document.createElement("section");
  el.className = "screen home";
  el.innerHTML = `
    <h1 class="display">L'IMBATTUTO</h1>
    <p class="tagline">Un quintetto. Nessuna sconfitta.</p>
    <fieldset class="pick" id="formato"><legend class="display">Formato</legend></fieldset>
    <fieldset class="pick" id="difficolta"><legend class="display">Difficoltà</legend></fieldset>
    <button class="cta" id="via" disabled>Inizia il draft</button>
  `;
  const scelte = { formato: null, difficolta: null };
  const via = el.querySelector("#via");
  const sync = () => { via.disabled = !(scelte.formato && scelte.difficolta); };

  function group(name, valori, into) {
    for (const v of valori) {
      const b = document.createElement("button");
      b.className = "chip"; b.textContent = v; b.dataset.v = v;
      b.onclick = () => {
        scelte[name] = v;
        into.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", c === b));
        sync();
      };
      into.appendChild(b);
    }
  }
  group("formato", FORMATI, el.querySelector("#formato"));
  group("difficolta", Object.keys(DIFFICULTIES), el.querySelector("#difficolta"));

  via.onclick = () => ctx.dispatch({ type: "newRun", ...scelte });
  return el;
}
