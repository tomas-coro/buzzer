// Home: evoluzione fedele dell'identità attuale di Buzzer.
// Nessuna nuova logica di gioco: si lavora solo su gerarchia, spazio e qualità visiva.

export function render(ctx) {
  const root = document.createElement("div");
  root.className = "cabhome ph--cab a-buzz home-v3";
  root.innerHTML = `
    <div class="scr">
      <div class="home">
        <div class="bz-top bz-top-v3">
          <span class="bz-credit rise">★ 1 credito</span>
          <span class="bz-top-actions rise" style="--d:.04s">
            <button class="bz-update" id="check-update" type="button" aria-label="Controlla aggiornamenti" title="Controlla aggiornamenti">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.34 5.66L16.24 15.24A6 6 0 1 1 18 11h-3l4 4 4-4h-3z"/></svg>
              <span class="bz-update-dot" aria-hidden="true"></span>
            </button>
            <span class="bz-best">best <b>9-0</b></span>
          </span>
        </div>

        <section class="bz-stage bz-stage-v3" aria-label="Buzzer">
          <div class="bz-brand-v3">
            <div class="bz-wm">BU<b>ZZ</b>ER</div>
            <div class="bz-sub rise" style="--d:.18s">il gioco da ultimo secondo</div>
          </div>

          <div class="bz-arena" aria-hidden="true">
            <span class="arena-copy arena-copy--left">strategia<br>statistiche<br>scelte</span>
            <span class="arena-copy arena-copy--right">una sola<br>squadra<br>ultimo secondo</span>
            <span class="arena-light arena-light--l"></span>
            <span class="arena-light arena-light--r"></span>
            <span class="arena-floor"></span>
            <div class="emblem emblem-v3">
              <svg class="hoop hoop-back" viewBox="0 0 120 96" aria-hidden="true">
                <rect x="35" y="3" width="50" height="38" rx="4" fill="rgba(253,242,221,.045)" stroke="var(--netc)" stroke-width="1.5" opacity=".6"/>
                <rect x="50" y="13" width="20" height="15" rx="2" fill="none" stroke="var(--rim)" stroke-width="2"/>
                <path class="rim-back-case" d="M27 46 Q60 38.5 93 46" fill="none" stroke="var(--ink)" stroke-width="9" stroke-linecap="round"/>
                <path class="rim-back" d="M27 46 Q60 38.5 93 46" fill="none" stroke="var(--ball2)" stroke-width="4.5" stroke-linecap="round" opacity=".95"/>
                <g class="net net-back" stroke="var(--netc)" stroke-width="1.5" opacity=".58" fill="none">
                  <path d="M30 47 L40 86 M90 47 L80 86 M44 47 L48 87 M76 47 L72 87 M60 47 L60 88"/>
                  <path d="M34 60 Q60 67 86 60 M40 75 Q60 82 80 75"/>
                </g>
              </svg>
              <svg class="bz-ball" viewBox="0 0 64 64" aria-hidden="true">
                <circle class="ball-fill" cx="32" cy="32" r="30"/>
                <path class="ball-sd" d="M32 62a30 30 0 0 0 27-16 30 30 0 0 1-54 0A30 30 0 0 0 32 62z"/>
                <ellipse class="ball-hi" cx="24" cy="22" rx="13" ry="9"/>
                <g class="seam"><path d="M3 32H61"/><path d="M32 3V61"/><path d="M13 7C25 22 25 42 13 57"/><path d="M51 7C39 22 39 42 51 57"/></g>
              </svg>
              <svg class="hoop hoop-front" viewBox="0 0 120 96" aria-hidden="true">
                <g class="net net-front" stroke="var(--netc)" stroke-width="2" opacity="0" fill="none">
                  <path d="M30 47 L40 86 M90 47 L80 86 M44 47 L48 87 M76 47 L72 87 M60 47 L60 88"/>
                  <path d="M34 60 Q60 67 86 60 M40 75 Q60 82 80 75"/>
                </g>
                <path class="rim-front-case" d="M27 46 Q60 53.5 93 46" fill="none" stroke="var(--ink)" stroke-width="10" stroke-linecap="round"/>
                <path class="rim-front" d="M27 46 Q60 53.5 93 46" fill="none" stroke="var(--pop2)" stroke-width="5.5" stroke-linecap="round"/>
              </svg>
              <span class="flash" aria-hidden="true"></span>
            </div>
          </div>
        </section>

        <div class="bz-foot bz-foot-v3">
          <div class="bz-main-modes rise" style="--d:.68s">
            <button class="bz-mode-card bz-mode-card--imbattuto" id="mode-corsa" type="button">
              <span class="bmc-icon" aria-hidden="true">★</span>
              <span class="bmc-copy"><b>L'Imbattuto</b><small>Affronta la corsa e scrivi la tua storia.</small></span>
              <span class="bmc-go" aria-hidden="true">›</span>
            </button>
            <button class="bz-mode-card bz-mode-card--playoff" id="mode-playoff" type="button">
              <span class="bmc-icon bmc-icon--ball" aria-hidden="true">●</span>
              <span class="bmc-copy"><b>Playoff</b><small>Quattro serie. Una sola squadra.</small></span>
              <span class="bmc-go" aria-hidden="true">›</span>
            </button>
          </div>
          <div class="bz-secondary-modes rise" style="--d:.74s" aria-label="Modalità in arrivo">
            <div class="bz-secondary-card"><span>▦</span><b>Stagione</b><small>presto</small></div>
            <div class="bz-secondary-card"><span>◆</span><b>Sfida</b><small>presto</small></div>
          </div>
          <p class="bz-home-line rise" style="--d:.8s">Il basket è fatto di scelte.</p>
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

  root.querySelector("#mode-corsa").onclick = () => ctx.go("difficolta");
  root.querySelector("#mode-playoff").onclick = () => ctx.go("difficolta-playoff");

  const updateButton = root.querySelector("#check-update");
  const status = ctx.updateState?.() ?? {};
  updateButton.classList.toggle("has-update", Boolean(status.available));
  updateButton.classList.toggle("checking", Boolean(status.checking));
  updateButton.setAttribute("aria-label", status.available ? "Aggiornamento disponibile" : "Controlla aggiornamenti");
  updateButton.onclick = () => ctx.checkForUpdates?.();

  return root;
}
