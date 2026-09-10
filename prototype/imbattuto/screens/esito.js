import { appHeader, esc } from "./_chrome.js";
import { teamName } from "../../../game/team-names.js";
import { listaRosa } from "../../../game/rosa.js";

export function testoCondivisione(state) {
  const record = `${state.vittorie}-${state.esito === "imbattuto" ? 0 : 1}`;
  const difficolta = state.difficolta[0].toUpperCase() + state.difficolta.slice(1);
  return `L'IMBATTUTO — ${record} · ${difficolta}\nRosa: ${listaRosa(state.rosa).map((c) => c.name).join(", ")}`;
}

// Fascia colore del round, stesso linguaggio visivo del draft: oro/argento/
// bronzo per un margine largo/medio/stretto, rosso per l'unico round che può
// essere una sconfitta (solo l'ultimo di un run, per regola del motore).
function fasciaOf(margine, persa) {
  if (persa) return { cls: "rosso", label: "KO" };
  if (margine >= 15) return { cls: "oro", label: "★" };
  if (margine >= 8) return { cls: "argento", label: "●" };
  return { cls: "bronzo", label: "▲" };
}

// Riga di un round: il testo clou è l'ultima frase di `h.cronaca`, già
// scritta dal motore per l'ultimo quarto - zero lavoro nuovo di narrazione.
function rigaRound(h, i) {
  const persa = !h.vinto;
  const margine = Math.abs(h.punti.casa - h.punti.ospite);
  const f = fasciaOf(margine, persa);
  const clou = h.cronaca.at(-1).testo;
  const quarti = h.quarti.map((q, qi) =>
    `<span>${q.overtime ? "OT" : `${qi + 1}°`} ${q.cumCasa}-${q.cumOspite}</span>`).join("");
  return `<li style="--i:${i}">
    <button class="r-row" data-idx="${i}" type="button" aria-expanded="false">
      <span class="r-round">R${h.round}</span>
      <span class="r-fascia ${f.cls}">${f.label}</span>
      <span class="r-mid">
        <span class="r-avv">${esc(teamName(h.avversario))} · ${esc(h.stagione)}</span>
        <span class="r-clou">${esc(clou)}</span>
      </span>
      <span class="r-pt">${h.punti.casa}-${h.punti.ospite}</span>
    </button>
    <div class="r-detail"><div class="r-detail-in">
      <div class="r-quarti">${quarti}</div>
      <p class="r-clou-full"><b>${persa ? "Ultimo quarto" : "Quarto decisivo"}:</b> ${esc(clou)}</p>
    </div></div>
  </li>`;
}

// ctx: { state, dispatch, go }
export function render(ctx) {
  const { state } = ctx;
  const vinto = state.esito === "imbattuto";
  const tacche = state.storia.length;
  // Il tabellone si accende una tacca alla volta, poi il resto della
  // sequenza (bagliore, titolo, riepilogo, cronaca, azioni) parte a ruota.
  const afterLadder = tacche * 45 + 250;

  const el = document.createElement("section");
  el.className = `screen esito ${vinto ? "win" : "lose"}`;
  el.innerHTML = `
    ${appHeader(state)}
    <div class="e-flash" style="animation: flashBurst ${vinto ? .7 : .4}s ease-out ${afterLadder}ms both"></div>
    <div class="e-ladder">${Array.from({ length: tacche }, (_, i) =>
      `<div class="e-tacca lit" style="animation: tPop .18s ease-out ${i * 45}ms both"></div>`).join("")}</div>
    <p class="e-score"><b>0</b>-0</p>
    <h1 style="animation: stampIn .5s cubic-bezier(.2,1.6,.4,1) ${afterLadder + 150}ms both">${vinto ? "IMBATTUTO" : "SCONFITTA"}</h1>
    <p class="riepilogo" style="animation: simpleIn .4s var(--ease) ${afterLadder + 500}ms both">${vinto ? `${state.vittorie} vittorie di fila` : `${state.vittorie} vittorie prima dello stop`}</p>
    <ul class="storia" style="animation: simpleIn .3s var(--ease) ${afterLadder + 650}ms both">${state.storia.map(rigaRound).join("")}</ul>
    <div class="azioni" style="animation: simpleIn .3s var(--ease) ${afterLadder + 800}ms both">
      <button class="cta" id="leaderboard">Leaderboard</button>
      <button class="chip" id="share">${navigator.share ? "Condividi" : "Copia risultato"}</button>
      <button class="chip" id="profilo">Profilo</button>
      <button class="chip" id="ancora">Nuovo run</button>
    </div>
  `;

  // Conteggio delle vittorie sul tabellone LED, in parallelo all'accensione
  // delle tacche: non è il punteggio della singola partita, è il computo dei
  // round vinti in questa run.
  const score = el.querySelector(".e-score");
  const target = state.vittorie;
  let n = 0;
  const timer = setInterval(() => {
    n++;
    score.innerHTML = `<b>${n}</b>-${vinto ? 0 : 1}`;
    if (n >= target) clearInterval(timer);
  }, (vinto ? 700 : 900) / Math.max(target, 1));
  if (target === 0) { clearInterval(timer); score.innerHTML = `<b>0</b>-${vinto ? 0 : 1}`; }

  el.querySelectorAll(".r-row").forEach((row) => {
    row.addEventListener("click", () => {
      const open = row.closest("li").classList.toggle("open");
      row.setAttribute("aria-expanded", String(open));
    });
  });
  el.querySelector("#ancora").onclick = () => ctx.dispatch({ type: "reset" });
  el.querySelector("#share").onclick = async (e) => {
    const text = testoCondivisione(state);
    try {
      if (navigator.share) await navigator.share({ title: "L'IMBATTUTO — Buzzer", text, url: location.href });
      else await navigator.clipboard.writeText(`${text}\n${location.href}`);
      e.currentTarget.textContent = navigator.share ? "Condiviso" : "Copiato";
    } catch (error) {
      if (error.name !== "AbortError") e.currentTarget.textContent = "Riprova";
    }
  };
  el.querySelector("#leaderboard").onclick = () => ctx.go("leaderboard");
  el.querySelector("#profilo").onclick = () => ctx.go("profilo");
  return el;
}
