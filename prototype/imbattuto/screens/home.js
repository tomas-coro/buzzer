// HOME - port fedele del mockup 19-sirena-clutch (splash BUZZER + tiro all'ultimo
// secondo + home Cabina 90s). Tolta la cornice-telefono del mockup: qui lo schermo
// E' l'app. Animazioni splash->home e sirena sono CSS puro (checkbox #opn + :has).
// L'unico aggancio JS: "Gioca" / modalita "Corsa" -> passo alla scelta difficolta.

export function render(ctx) {
  const root = document.createElement("div");
  root.className = "cabhome ph--cab a-buzz";
  root.innerHTML = `
    <div class="scr">
      <div class="home">
        <div class="bz-top">
          <span class="bz-credit rise">★ 1 credito</span>
          <span class="bz-top-actions rise" style="--d:.04s">
            <button class="bz-update" id="check-update" type="button" aria-label="Controlla aggiornamenti" title="Controlla aggiornamenti">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.34 5.66L16.24 15.24A6 6 0 1 1 18 11h-3l4 4 4-4h-3z"/></svg>
              <span class="bz-update-dot" aria-hidden="true"></span>
            </button>
            <span class="bz-best">best <b>9-0</b></span>
          </span>
        </div>
        <div class="bz-stage">
          <div class="emblem">
            <svg class="hoop hoop-back" viewBox="0 0 120 96" aria-hidden="true">
              <rect x="35" y="3" width="50" height="38" rx="4" fill="rgba(253,242,221,.06)" stroke="var(--netc)" stroke-width="1.6" opacity=".45"/>
              <rect x="50" y="13" width="20" height="15" rx="2" fill="none" stroke="var(--rim)" stroke-width="2"/>
              <path class="rim-back-case" d="M27 46 Q60 38.5 93 46" fill="none" stroke="var(--ink)" stroke-width="9" stroke-linecap="round"/>
              <path class="rim-back" d="M27 46 Q60 38.5 93 46" fill="none" stroke="var(--ball2)" stroke-width="4.5" stroke-linecap="round" opacity=".95"/>
              <g class="net net-back" stroke="var(--netc)" stroke-width="1.5" opacity=".5" fill="none">
                <path d="M30 47 L40 86 M90 47 L80 86 M44 47 L48 87 M76 47 L72 87 M60 47 L60 88"/>
                <path d="M34 60 Q60 67 86 60 M40 75 Q60 82 80 75"/>
              </g>
            </svg>
            <svg class="bz-ball" viewBox="0 0 64 64" aria-hidden="true">
              <circle class="ball-fill" cx="32" cy="32" r="30"/><path class="ball-sd" d="M32 62a30 30 0 0 0 27-16 30 30 0 0 1-54 0A30 30 0 0 0 32 62z"/><ellipse class="ball-hi" cx="24" cy="22" rx="13" ry="9"/>
              <g class="seam"><path d="M3 32H61"/><path d="M32 3V61"/><path d="M13 7C25 22 25 42 13 57"/><path d="M51 7C39 22 39 42 51 57"/></g>
            </svg>
            <svg class="hoop hoop-front" viewBox="0 0 120 96" aria-hidden="true">
              <g class="net net-front" stroke="var(--netc)" stroke-width="2.2" opacity="0" fill="none">
                <path d="M30 47 L40 86 M90 47 L80 86 M44 47 L48 87 M76 47 L72 87 M60 47 L60 88"/>
                <path d="M34 60 Q60 67 86 60 M40 75 Q60 82 80 75"/>
              </g>
              <path class="rim-front-case" d="M27 46 Q60 53.5 93 46" fill="none" stroke="var(--ink)" stroke-width="10" stroke-linecap="round"/>
              <path class="rim-front" d="M27 46 Q60 53.5 93 46" fill="none" stroke="var(--pop2)" stroke-width="5.5" stroke-linecap="round"/>
            </svg>
            <span class="flash" aria-hidden="true"></span>
          </div>
          <div class="bz-wm">BU<b>ZZ</b>ER</div>
          <div class="bz-sub rise" style="--d:.66s">l'ultimo tiro decide</div>
        </div>
        <div class="bz-foot">
          <button class="bz-cta rise" id="gioca" style="--d:.7s" type="button"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5l12 7-12 7z"/></svg> Gioca</button>
          <div class="bz-modes rise" style="--d:.76s">
            <button class="bz-mode bz-mode--on" id="mode-corsa" type="button"><span class="n">16-0</span><b>Corsa</b><span class="play">gioca</span></button>
            <button class="bz-mode bz-mode--on" id="mode-playoff" type="button"><span class="n">serie</span><b>Playoff</b><span class="play">gioca</span></button>
            <div class="bz-mode"><span class="n">82-0</span><b>Stagione</b><span class="soon">presto</span></div>
            <div class="bz-mode"><span class="n">★</span><b>Sfida</b><span class="soon">presto</span></div>
          </div>
        </div>
      </div>
      <input class="opn" type="checkbox" id="opn-rewind">
      <label class="splash" for="opn-rewind">
        <svg class="sp-ball" viewBox="0 0 64 64" aria-hidden="true">
          <circle class="ball-fill" cx="32" cy="32" r="30"/><path class="ball-sd" d="M32 62a30 30 0 0 0 27-16 30 30 0 0 1-54 0A30 30 0 0 0 32 62z"/><ellipse class="ball-hi" cx="24" cy="22" rx="13" ry="9"/>
          <g class="seam"><path d="M3 32H61"/><path d="M32 3V61"/><path d="M13 7C25 22 25 42 13 57"/><path d="M51 7C39 22 39 42 51 57"/></g>
        </svg>
        <div class="bz-wm sp-wm">BU<b>ZZ</b>ER</div>
        <div class="sp-tag">il gioco da ultimo secondo</div>
        <span class="bz-open"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5l12 7-12 7z"/></svg> Apri l'app</span>
      </label>
    </div>
  `;

  // Corsa = L'IMBATTUTO: "Gioca" o la modalita Corsa portano alla scelta difficolta.
  const vai = () => ctx.go("difficolta");
  root.querySelector("#gioca").onclick = vai;
  root.querySelector("#mode-corsa").onclick = vai;
  root.querySelector("#mode-playoff").onclick = () => ctx.go("difficolta-playoff");

  const updateButton = root.querySelector("#check-update");
  const status = ctx.updateState?.() ?? {};
  updateButton.classList.toggle("has-update", Boolean(status.available));
  updateButton.classList.toggle("checking", Boolean(status.checking));
  updateButton.setAttribute("aria-label", status.available ? "Aggiornamento disponibile" : "Controlla aggiornamenti");
  updateButton.onclick = () => ctx.checkForUpdates?.();

  return root;
}
