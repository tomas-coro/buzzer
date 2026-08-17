// Chrome condiviso delle schermate "dentro l'app" (coach/run/esito).
// Header-cabina identico al draft: marchio BUZZER + pill della difficoltà. Serve a
// far portare a queste schermate la stessa identità Cabina 90s, invece di partire
// spoglie e stonare con home/difficoltà/draft. La stessa fiamma e lo stesso markup
// del draft, tenuti in un unico posto per non duplicarli su ogni schermata.

const FLAME = `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="f1" d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z"/><path class="f2" d="M11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>`;

// Header-cabina: marchio a sinistra, pill difficoltà a destra. state.difficolta è
// una chiave minuscola ("facile"...); qui la mostro con l'iniziale maiuscola.
export function appHeader(state) {
  const diffName = state.difficolta.charAt(0).toUpperCase() + state.difficolta.slice(1);
  return `
    <div class="apphd">
      <div class="wm">BU<b>ZZ</b>ER</div>
      <div class="mode-pill"><span class="mp-ico">${FLAME}</span><span class="mp-txt">${diffName}</span></div>
    </div>`;
}

// Escape per i testi che finiscono dentro i template HTML (nomi giocatore e
// allenatore arrivano da dati, non da costanti scritte a mano).
export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Etichetta di sezione: titolo piccolo a sinistra, riga di aiuto a destra.
// Stessa forma su coach e run, così le due schermate si leggono allo stesso modo.
export function seclab(titolo, aiuto = "") {
  return `<div class="seclab">
    <span class="sl-t">${esc(titolo)}</span>
    ${aiuto ? `<span class="sl-h">${aiuto}</span>` : ""}
  </div>`;
}
