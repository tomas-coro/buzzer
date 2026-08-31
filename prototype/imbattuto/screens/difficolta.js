import { DIFFICULTIES, TETTI } from "../../../game/difficulty.js";
import { formattaSalario } from "../../../game/salary.js";

// Scelta difficolta di L'IMBATTUTO. Passo-ponte (non tra i mockup finiti):
// tenuto minimale nel linguaggio della home Cabina 90s, chip verticali.
// "vedi" = quanto scopri della carta a quel livello (il vero differenziatore, ora che
// le vittorie sono sempre 16). Coerente col reveal del draft: facile tutto, normale
// overall+stat firma, difficile solo le stats, incubo al buio.
const META = {
  facile:    { nome: "Facile",    tag: "Riscaldamento", vedi: "Tutto" },
  normale:   { nome: "Normale",   tag: "La corsa",      vedi: "OVR + stats" },
  difficile: { nome: "Difficile", tag: "Ferro",         vedi: "Solo stats" },
  incubo:    { nome: "Incubo",    tag: "Nessuna rete",  vedi: "Al buio" },
};

// Il nome della squadra entra nella CRONACA della partita ("Dinamo Sofà avanti
// dopo il primo quarto"), quindi non è un'etichetta: senza, il motore ripiega
// sul suo default "La tua squadra" e le frasi suonano male in mezzo ai nomi
// veri delle squadre NBA. Si sceglie qui perché è l'ultima schermata prima del
// draft, e il default è già scritto: chi non vuole pensarci tira dritto.
const NOME_DEFAULT = "Dinamo Sofà";

// ctx: { dispatch, go }
export function render(ctx) {
  const root = document.createElement("div");
  root.className = "cabhome ph--cab diffscreen";

  const chips = Object.entries(DIFFICULTIES).map(([key, d]) => {
    const m = META[key];
    const aiuti = `${d.aids.respin} re-spin · ${d.aids.squadra} squadra · ${d.aids.stagione} stagione`;
    return `
      <button class="diff-chip" data-diff="${key}" type="button">
        <span class="dc-l">
          <span class="dc-name">${m.nome}</span>
          <span class="dc-tag">${m.tag}</span>
          <span class="dc-aid">${aiuti}</span>
        </span>
        <span class="dc-r">
          <span class="dc-see-lab">Vedi</span>
          <span class="dc-see">${m.vedi}</span>
          <span class="dc-cap-lab">Tetto</span>
          <span class="dc-cap">${formattaSalario(TETTI[key])}</span>
        </span>
      </button>`;
  }).join("");

  root.innerHTML = `
    <div class="scr diff-scr">
      <button class="diff-back" id="back" type="button">‹ Home</button>
      <div class="diff-head">
        <div class="bz-wm diff-wm">L'IM<b>BATT</b>UTO</div>
        <p class="diff-sub"><b>16 vittorie di fila</b> in ogni livello. Nessuna sconfitta ammessa.</p>
      </div>
      <label class="diff-nome" for="nomesq">
        <span class="dn-lab">Come si chiama la tua squadra</span>
        <input id="nomesq" class="dn-in" type="text" maxlength="24" autocomplete="off"
               value="${NOME_DEFAULT}" aria-describedby="dn-help">
        <span class="dn-help" id="dn-help">Finisce nella cronaca delle partite</span>
      </label>
      <div class="diff-list">${chips}</div>
      <p class="diff-foot">Il livello resta lo stesso per tutta la corsa: si sceglie
        adesso, non si cambia in mezzo. <b>Sedici vittorie</b> in tutti e quattro.</p>
    </div>
  `;

  root.querySelector("#back").onclick = () => ctx.go("home");
  // Nome vuoto = default, non un errore: il motore rifiuta la stringa vuota, e
  // qui non c'è niente da correggere all'utente, c'è solo un nome da mettere.
  const nome = () => (root.querySelector("#nomesq").value.trim() || NOME_DEFAULT);
  root.querySelector("#nomesq").onkeydown = (e) => { if (e.key === "Enter") e.preventDefault(); };
  root.querySelectorAll(".diff-chip").forEach((b) => {
    b.onclick = () => ctx.dispatch({
      type: "newRun", formato: "imbattuto", difficolta: b.dataset.diff, squadra: nome(),
    });
  });

  return root;
}
