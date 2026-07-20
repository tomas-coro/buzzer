import { ROLES } from "../../../game/roster.js";

// ctx: { state, draftView, dispatch }
export function render(ctx) {
  const { state, draftView } = ctx;
  const el = document.createElement("section");
  el.className = "screen draft";

  // Barra dei 5 slot (stato del quintetto)
  const slots = ROLES.map((r) => {
    const c = state.quintetto[r];
    return `<div class="slot ${c ? "full" : ""} ${r === draftView.role ? "active" : ""}">
      <span class="role">${r}</span>
      <span class="who">${c ? c.name : "—"}</span>
    </div>`;
  }).join("");

  // Aiuti rimasti
  const a = state.aids;
  const aidBtn = (tipo, label) =>
    `<button class="aid" data-aid="${tipo}" ${a[tipo] <= 0 ? "disabled" : ""}>${label} (${a[tipo]})</button>`;

  // I 5 candidati (top-5 della team-stagione pescata)
  const cand = draftView.cards.map((c, i) => {
    const ok = draftView.assignable[i];
    const badge = c.estimated ? `<span class="estimated-badge">provv.</span>` : "";
    return `<button class="cand ${ok ? "" : "off"}" data-i="${i}" ${ok ? "" : "disabled"}>
      <span class="cand-ovr">${c.ovr}</span>
      <span class="cand-name">${c.name} ${badge}</span>
      <span class="cand-pos">${c.pos.primary}</span>
    </button>`;
  }).join("");

  el.innerHTML = `
    <div class="slots">${slots}</div>
    <h2 class="display">Turno: ${draftView.role} — ${draftView.key.replace("|", " ")}</h2>
    <div class="cands">${cand}</div>
    <div class="aids">
      ${aidBtn("respin", "Re-spin")}
      ${aidBtn("squadra", "Cambia squadra")}
      ${aidBtn("stagione", "Cambia stagione")}
    </div>
  `;

  el.querySelectorAll(".cand:not([disabled])").forEach((b) => {
    b.onclick = () => ctx.dispatch({ type: "assign", card: draftView.cards[Number(b.dataset.i)] });
  });
  el.querySelectorAll(".aid:not([disabled])").forEach((b) => {
    const aid = b.dataset.aid;
    // "Cambia squadra"/"Cambia stagione" nel prototipo = ripescano un nuovo turno (nuova team-stagione)
    b.onclick = () => {
      ctx.dispatch({ type: "aid", aid });
      if (aid !== "respin") ctx.dispatch({ type: "spin" });
    };
  });
  return el;
}
