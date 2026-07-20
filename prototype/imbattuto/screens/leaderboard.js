import { leaderboard, lifetimeStats } from "../meta.js";

// ctx: { state, dispatch, go }  — usa window.localStorage nel browser
export function render(ctx) {
  const store = window.localStorage;
  const st = lifetimeStats(store);
  // Se veniamo da un run finito, mostriamo il suo bucket; altrimenti un default.
  const formato = ctx.state?.formato ?? "playoff";
  const difficolta = ctx.state?.difficolta ?? "normale";
  const lb = leaderboard(store, formato, difficolta);

  const el = document.createElement("section");
  el.className = "screen leaderboard";
  const righe = lb.length
    ? lb.map((r, i) => `<li><span class="pos">${i + 1}</span> ${r.vittorie} vittorie · ${r.esito}</li>`).join("")
    : `<li class="vuoto">Ancora nessun run in questo bucket.</li>`;
  el.innerHTML = `
    <h1 class="display">Leaderboard</h1>
    <p class="bucket">${formato} · ${difficolta}</p>
    <ol class="classifica">${righe}</ol>
    <div class="lifetime">
      <span>Run: ${st.runs}</span><span>Imbattuti: ${st.imbattuti}</span><span>Miglior streak: ${st.migliorStreak}</span>
    </div>
    <button class="chip" id="home">Home</button>
  `;
  el.querySelector("#home").onclick = () => ctx.dispatch({ type: "reset" });
  return el;
}
