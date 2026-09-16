// HOME - port fedele del mockup 19-sirena-clutch (splash BUZZER + tiro all'ultimo
// secondo + home Cabina 90s). Tolta la cornice-telefono del mockup: qui lo schermo
// E' l'app. Animazioni splash->home e sirena sono CSS puro (checkbox #opn + :has).
// L'unico aggancio JS: "Gioca" / modalita "Corsa" -> passo alla scelta difficolta.


const HOME_COPY = {
  it: {
    settings: "Impostazioni",
    close: "Chiudi",
    tagline: "fino all\'ultimo possesso",
    unbeaten: "L'Imbattuto",
    season: "Stagione",
    challenge: "Sfida",
    soon: "presto",
    player: "Giocatore",
    playerInfo: "Identità locale della cabina. Non cambia il nome della squadra.",
    profileIcon: "Icona giocatore",
    language: "Lingua",
    languageInfo: "Italiano attivo.",
    updates: "Aggiornamenti",
    updateInfo: "Controlla se è disponibile una nuova versione.",
    check: "Verifica",
    save: "Salva",
    playerName: "Nome giocatore",
    stats: "Statistiche",
    leaderboard: "Leaderboard"
  },
  en: {
    settings: "Settings",
    close: "Close",
    tagline: "until the final possession",
    unbeaten: "The Unbeaten",
    season: "Season",
    challenge: "Challenge",
    soon: "soon",
    player: "Player",
    playerInfo: "Local arcade identity. This does not change your team name.",
    profileIcon: "Player icon",
    language: "Language",
    languageInfo: "English active.",
    updates: "Updates",
    updateInfo: "Check whether a new version is available.",
    check: "Check",
    save: "Save",
    playerName: "Player name",
    stats: "Stats",
    leaderboard: "Leaderboard"
  }
};

const PLAYER_ICONS = {
  ball: `<svg class="arc-icon arc-orange" viewBox="0 0 40 40" aria-hidden="true"><circle class="arc-main" cx="20" cy="20" r="15"/><path class="arc-line" d="M5 20h30M20 5c5 6 5 24 0 30M9 9c8 4 14 10 22 22M31 9c-8 4-14 10-22 22"/><path class="arc-accent" d="M9 8a15 15 0 0 1 8-3l-2 5a11 11 0 0 0-4 2z"/></svg>`,
  trophy: `<svg class="arc-icon arc-blue" viewBox="0 0 40 40" aria-hidden="true"><path class="arc-main" d="M11 6h18v10c0 7-4 12-9 13-5-1-9-6-9-13z"/><path class="arc-accent" d="M8 10H4v4c0 6 3 9 8 9v-5c-2-1-3-2-3-4h2m18-4h4v4c0 6-3 9-8 9v-5c2-1 3-2 3-4h-2"/><path class="arc-main" d="M17 28h6v5h7v4H10v-4h7z"/><path class="arc-light" d="M15 10h10"/></svg>`,
  bolt: `<svg class="arc-icon arc-yellow" viewBox="0 0 40 40" aria-hidden="true"><path class="arc-main" d="M24 3 7 23h11l-3 14 18-23H23z"/><path class="arc-accent" d="m21 11-7 9h8l-2 8 8-11h-7z"/></svg>`,
  star: `<svg class="arc-icon arc-orange" viewBox="0 0 40 40" aria-hidden="true"><path class="arc-main" d="m20 3 5 11 12 2-9 8 2 12-10-6-10 6 2-12-9-8 12-2z"/><path class="arc-cut" d="m20 12 2.5 5 5.5 1-4 4 1 5-5-2.7-5 2.7 1-5-4-4 5.5-1z"/><path class="arc-accent" d="m20 5 2 5-7 1z"/></svg>`,
  hoop: `<svg class="arc-icon arc-blue" viewBox="0 0 40 40" aria-hidden="true"><path class="arc-main" d="M9 3h22v14H9z"/><path class="arc-cut" d="M14 7h12v7H14z"/><path class="arc-accent" d="M4 16h32v6H4z"/><path class="arc-light" d="m9 22 4 15m18-15-4 15m-12-15 2 15m8-15-2 15m-10-9c5 2 9 2 14 0m-12 6c3 1 7 1 10 0"/></svg>`,
  buzzer: `<svg class="arc-icon arc-yellow" viewBox="0 0 40 40" aria-hidden="true"><path class="arc-main" d="M11 27V17c0-6 4-10 9-10s9 4 9 10v10z"/><path class="arc-accent" d="M7 27h26v8H7z"/><path class="arc-light" d="M15 17c0-4 2-6 5-6"/><path class="arc-line" d="M11 24h18M11 31h18"/><path class="arc-accent" d="M18 2h4v4h-4zM4 8l3-3 3 3-3 3zm26 0 3-3 3 3-3 3z"/></svg>`,
  crown: `<svg class="arc-icon arc-orange" viewBox="0 0 40 40" aria-hidden="true"><path class="arc-main" d="M4 10l9 7 7-14 7 14 9-7-4 22H8z"/><path class="arc-accent" d="M8 27h24v7H8z"/><path class="arc-cut" d="M12 23h16l-1 4H13z"/><circle class="arc-accent" cx="4" cy="9" r="2"/><circle class="arc-accent" cx="20" cy="3" r="2"/><circle class="arc-accent" cx="36" cy="9" r="2"/></svg>`,
  shoe: `<svg class="arc-icon arc-blue" viewBox="0 0 40 40" aria-hidden="true"><path class="arc-main" d="M10 3h10c0 7 3 12 10 15l5 2c2 1 3 4 3 8v5H6c-3 0-5-2-5-5 0-5 3-9 9-13z"/><path class="arc-accent" d="M10 3h10v5h-6v7h-4z"/><path class="arc-light" d="m14 11 6 2m-7 2 9 2M5 27h31m-16-9 10 4"/><path class="arc-line" d="M7 33h30"/></svg>`,
  shield: `<svg class="arc-icon arc-yellow" viewBox="0 0 40 40" aria-hidden="true"><path class="arc-main" d="m20 3 16 6v10c0 10-6 15-16 19C10 34 4 29 4 19V9z"/><path class="arc-accent" d="m11 20 6 6 13-14-4-4-9 10-3-3z"/><path class="arc-light" d="m20 7 11 4"/></svg>`,
  arcade: `<svg class="arc-icon arc-orange" viewBox="0 0 40 40" aria-hidden="true"><path class="arc-main" d="M9 11h22c5 0 8 5 8 12 0 8-4 14-9 14-4 0-6-5-10-5s-6 5-10 5c-5 0-9-6-9-14 0-7 3-12 8-12z"/><path class="arc-cut" d="M10 16h5v5h5v5h-5v5h-5v-5H5v-5h5z"/><circle class="arc-accent" cx="29" cy="19" r="3"/><circle class="arc-accent" cx="34" cy="25" r="3"/><path class="arc-light" d="M11 13h18"/></svg>`
};

function playerIconSvg(id) {
  if (id === "p1") return "P1";
  return PLAYER_ICONS[id] || "P1";
}


export function render(ctx) {
  const root = document.createElement("div");
  root.className = "cabhome ph--cab a-buzz";

  let playerName = "PLAYER1";
  let language = "it";
  let playerIcon = "p1";

  try {
    playerName = (localStorage.getItem("buzzer-player-name") || "PLAYER1")
      .toUpperCase()
      .replace(/[^A-Z0-9À-ÖØ-Ý ]/g, "")
      .trim()
      .slice(0, 8) || "PLAYER1";

    language = localStorage.getItem("buzzer-language") === "en" ? "en" : "it";
    const savedIcon = localStorage.getItem("buzzer-player-icon");
    playerIcon = savedIcon === "p1" || PLAYER_ICONS[savedIcon] ? savedIcon : "p1";
  } catch {}
  const copy = HOME_COPY[language];
  root.innerHTML = `
    <div class="scr">
      <div class="home">
        <div class="bz-top bz-top-upgraded">
          <div class="bz-player rise" aria-label="Giocatore 1">
            <button
              class="bz-player-trigger"
              id="player-icon-toggle"
              type="button"
              aria-expanded="false"
              aria-controls="player-icon-picker"
              aria-label="${copy.profileIcon}"
              title="${copy.profileIcon}"
            >
              <span class="bz-player-slot bz-player-profile" id="home-player-icon" aria-hidden="true">${playerIconSvg(playerIcon)}</span>
            </button>

            <button class="bz-player-name-btn" id="home-player-name" type="button">${playerName}</button>

            <dialog class="bz-player-picker" id="player-icon-picker" aria-label="${copy.profileIcon}">
              <button class="bz-player-picker-close" id="close-player-picker" type="button" aria-label="${copy.close}">
                <span aria-hidden="true">×</span>
              </button>

              <div class="bz-player-picker-label">
                <b>${copy.profileIcon}</b>
                <span>CABINA P1</span>
              </div>

              <div class="bz-player-picker-grid" role="group" aria-label="${copy.profileIcon}">
                <button
                  class="player-pick player-pick--p1${playerIcon === "p1" ? " active" : ""}"
                  type="button"
                  data-player-icon="p1"
                  aria-pressed="${playerIcon === "p1"}"
                  aria-label="P1"
                >P1</button>

                ${Object.keys(PLAYER_ICONS).map((id) => `
                  <button
                    class="player-pick player-pick--${id}${playerIcon === id ? " active" : ""}"
                    type="button"
                    data-player-icon="${id}"
                    aria-pressed="${playerIcon === id}"
                    aria-label="${{ ball: "Pallone", trophy: "Trofeo", bolt: "Fulmine", star: "Stella", hoop: "Canestro", buzzer: "Sirena", crown: "Corona", shoe: "Scarpa", shield: "Scudo", arcade: "Gamepad" }[id]}"
                  >
                    ${playerIconSvg(id)}
                  </button>
                `).join("")}
              </div>
            </dialog>
          </div>

          <span class="bz-top-actions rise" style="--d:.04s">
            <span class="bz-best">best <b>9-0</b></span>

            <button class="bz-settings-btn bz-stats-btn" id="open-stats" type="button" aria-label="Statistiche Cabina" title="Statistiche Cabina">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 20V10h4v10M10 20V4h4v16M16 20v-7h4v7"/>
              </svg>
            </button>

            <button class="bz-settings-btn" id="open-settings" type="button" aria-label="${copy.settings}" title="${copy.settings}">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="3.2"/>
                <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1a1.7 1.7 0 0 0-.4-1.1 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1a1.7 1.7 0 0 0 1.1-.4 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1a1.7 1.7 0 0 0 .4 1.1 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.15.37.36.7.6 1 .29.29.67.43 1.1.43h.1v4h-.1c-.43 0-.81.14-1.1.43-.24.3-.45.63-.6 1.14Z"/>
              </svg>
            </button>
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
          <div class="bz-sub rise" style="--d:.66s">${copy.tagline}</div>
        </div>
        <div class="bz-foot">
          <div class="bz-modes-main rise" style="--d:.74s">
            <button class="bz-mode bz-mode--primary bz-mode--on bz-mode--corsa" id="mode-corsa" type="button">
              <span class="mode-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M7 4h10v4c0 3.7-2 6.2-5 7-3-.8-5-3.3-5-7V4Z"/>
                  <path d="M7 6H4v2c0 2.4 1.4 4 3.6 4.4M17 6h3v2c0 2.4-1.4 4-3.6 4.4"/>
                  <path d="M12 15v3M8 20h8"/>
                </svg>
              </span>
              <span class="n">16-0</span>
              <b>${copy.unbeaten}</b>
              <span class="desc">Costruisci la squadra. Una sconfitta e finisce.</span>
              <span class="mode-action" id="gioca"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></span>
            </button>

            <button class="bz-mode bz-mode--primary bz-mode--on bz-mode--playoff" id="mode-playoff" type="button">
              <span class="mode-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9"/>
                  <path d="M3 12h18"/>
                  <path d="M12 3c3 3 3 15 0 18"/>
                  <path d="M12 3c-3 3-3 15 0 18"/>
                  <path d="M5.5 6.2c3.5 1.8 9.5 1.8 13 0"/>
                  <path d="M5.5 17.8c3.5-1.8 9.5-1.8 13 0"/>
                </svg>
              </span>
              <span class="n">4 serie</span>
              <b>Playoff</b>
              <span class="desc">Best of 7. Puoi perdere una gara, non la serie.</span>
              <span class="mode-action"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></span>
            </button>
          </div>

          <div class="bz-modes-sub rise" style="--d:.8s">
            <div class="bz-mode bz-mode--secondary">
              <span class="mode-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <rect x="4" y="5" width="16" height="15" rx="2"/>
                  <path d="M8 3v4M16 3v4M4 9h16"/>
                  <path d="M8 13h2M12 13h2M16 13h1M8 16h2M12 16h2"/>
                </svg>
              </span>
              <div class="mode-copy">
                <span class="n">82-0</span>
                <b>${copy.season}</b>
              </div>
              <span class="soon">${copy.soon}</span>
            </div>

            <div class="bz-mode bz-mode--secondary">
              <span class="mode-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <circle cx="8" cy="8" r="3"/>
                  <circle cx="16" cy="8" r="3"/>
                  <path d="M3.5 19c.3-3.2 2-5 4.5-5s4.2 1.8 4.5 5"/>
                  <path d="M11.5 19c.3-3.2 2-5 4.5-5s4.2 1.8 4.5 5"/>
                </svg>
              </span>
              <div class="mode-copy">
                <span class="n">★</span>
                <b>${copy.challenge}</b>
              </div>
              <span class="soon">${copy.soon}</span>
            </div>
          </div>
</div>
      </div>
      <dialog class="bz-settings-dialog" id="settings-dialog">
        <div class="bz-settings-panel">

          <div class="settings-header">
            <div>
              <span class="settings-kicker">CABINA P1</span>
              <h2>${copy.settings}</h2>
            </div>
            <button id="close-settings" class="settings-close" type="button" aria-label="${copy.close}">×</button>
          </div>

          <section class="settings-block">
            <span class="settings-title">${copy.player}</span>

            <div class="settings-player-row">
              <span class="settings-p1">P1</span>

              <input
                id="player-name-input"
                type="text"
                maxlength="8"
                value="${playerName}"
                autocomplete="off"
                spellcheck="false"
                aria-label="${copy.playerName}"
              >

              <span class="settings-counter"><b id="player-name-count">${playerName.length}</b>/8</span>
            </div>

            <p>${copy.playerInfo}</p>
          </section>

          <section class="settings-block">
            <span class="settings-title">${copy.language}</span>

            <div class="language-choice">
              <button type="button" data-lang="it" class="${language === "it" ? "active" : ""}">
                Italiano
              </button>
              <button type="button" data-lang="en" class="${language === "en" ? "active" : ""}">
                English
              </button>
            </div>

            <p id="language-info">
              ${language === "en"
                ? "Preferenza English salvata. La traduzione completa verrà collegata successivamente."
                : "Italiano attivo."}
            </p>
          </section>

          <section class="settings-block settings-update-block">
            <div>
              <span class="settings-title">${copy.updates}</span>
              <p id="update-status-copy">${copy.updateInfo}</p>
            </div>

            <button class="settings-update-btn" id="check-update" type="button">
              Verifica
            </button>
          </section>

          <button class="settings-save" id="save-settings" type="button">
            Salva
          </button>

        </div>
      </dialog>

      ${ctx.showHomeIntro ? `
      <input class="opn" type="checkbox" id="opn-rewind">
      <label class="splash" for="opn-rewind">
        <svg class="sp-ball" viewBox="0 0 64 64" aria-hidden="true">
          <circle class="ball-fill" cx="32" cy="32" r="30"/><path class="ball-sd" d="M32 62a30 30 0 0 0 27-16 30 30 0 0 1-54 0A30 30 0 0 0 32 62z"/><ellipse class="ball-hi" cx="24" cy="22" rx="13" ry="9"/>
          <g class="seam"><path d="M3 32H61"/><path d="M32 3V61"/><path d="M13 7C25 22 25 42 13 57"/><path d="M51 7C39 22 39 42 51 57"/></g>
        </svg>
        <div class="bz-wm sp-wm">BU<b>ZZ</b>ER</div>
        <div class="sp-tag">il gioco da ultimo secondo</div>
        <span class="bz-open"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5l12 7-12 7z"/></svg> Tira al buzzer</span>
      </label>
      ` : ""}
    </div>
  `;

  // Corsa = L'IMBATTUTO: "Gioca" o la modalita Corsa portano alla scelta difficolta.
  const vai = () => ctx.go("difficolta");
  root.querySelector("#gioca")?.addEventListener("click", vai);
  root.querySelector("#mode-corsa").onclick = vai;
  root.querySelector("#mode-playoff").onclick = () => ctx.go("difficolta-playoff");
  root.querySelector("#home-player-name")?.addEventListener("click", () => ctx.go("profilo"));
  root.querySelector("#open-stats")?.addEventListener("click", () => ctx.go("profilo"));


  const settingsDialog = root.querySelector("#settings-dialog");
  const nameInput = root.querySelector("#player-name-input");
  const homePlayerName = root.querySelector("#home-player-name");
  const playerCount = root.querySelector("#player-name-count");

  const openSettings = () => {
    nameInput.value = playerName;
    playerCount.textContent = String(playerName.length);
    closePlayerPicker();
    settingsDialog.showModal();
  };

  root.querySelector("#open-settings").onclick = openSettings;

  root.querySelector("#close-settings").onclick = () => settingsDialog.close();

  settingsDialog.addEventListener("click", (event) => {
    if (event.target === settingsDialog) settingsDialog.close();
  });

  nameInput.addEventListener("input", () => {
    nameInput.value = nameInput.value
      .toUpperCase()
      .replace(/[^A-Z0-9À-ÖØ-Ý ]/g, "")
      .slice(0, 8);

    playerCount.textContent = String(nameInput.value.length);
  });
  const iconToggle = root.querySelector("#player-icon-toggle");
  const iconPicker = root.querySelector("#player-icon-picker");
  const homePlayerIcon = root.querySelector("#home-player-icon");

  const closePlayerPicker = () => {
    if (!iconPicker?.open) return;
    iconPicker.close();
    iconToggle?.setAttribute("aria-expanded", "false");
  };

  iconToggle?.addEventListener("click", () => {
    if (!iconPicker || iconPicker.open) return;

    /* Il picker deve essere un vero modal viewport-level,
       non dipendere dal layout della topbar/Home. */
    if (iconPicker.parentElement !== document.body) {
      document.body.appendChild(iconPicker);
    }

    iconPicker.showModal();
    iconToggle.setAttribute("aria-expanded", "true");
  });

  iconPicker?.addEventListener("click", (event) => {
    if (event.target === iconPicker) closePlayerPicker();
  });

  iconPicker?.addEventListener("cancel", (event) => {
    event.preventDefault();
    closePlayerPicker();
  });

  root.querySelector("#close-player-picker")?.addEventListener("click", () => {
    closePlayerPicker();
  });

  root.querySelectorAll("[data-player-icon]").forEach((button) => {
    button.onclick = () => {
      const value = button.dataset.playerIcon;
      playerIcon = value === "p1" || PLAYER_ICONS[value] ? value : "p1";

      root.querySelectorAll("[data-player-icon]").forEach((b) => {
        const active = b.dataset.playerIcon === playerIcon;
        b.classList.toggle("active", active);
        b.setAttribute("aria-pressed", active ? "true" : "false");
      });

      homePlayerIcon.innerHTML = playerIconSvg(playerIcon);

      try {
        localStorage.setItem("buzzer-player-icon", playerIcon);
      } catch {}

      closePlayerPicker();
    };
  });

  root.querySelectorAll("[data-lang]").forEach((button) => {
    button.onclick = () => {
      language = button.dataset.lang === "en" ? "en" : "it";

      root.querySelectorAll("[data-lang]").forEach((b) => {
        b.classList.toggle("active", b === button);
      });

      try {
        localStorage.setItem("buzzer-language", language);
      } catch {}

      root.querySelector("#language-info").textContent =
        language === "en"
          ? "Preferenza English salvata. La traduzione completa verrà collegata successivamente."
          : "Italiano attivo.";
    };
  });

  root.querySelector("#save-settings").onclick = () => {
    playerName = nameInput.value.trim() || "PLAYER1";

    try {
      localStorage.setItem("buzzer-player-name", playerName);
    } catch {}

    homePlayerName.textContent = playerName;
    settingsDialog.close();
  };

  const updateButton = root.querySelector("#check-update");
  const status = ctx.updateState?.() ?? {};
  updateButton.classList.toggle("has-update", Boolean(status.available));
  updateButton.classList.toggle("checking", Boolean(status.checking));
  updateButton.setAttribute("aria-label", status.available ? "Aggiornamento disponibile" : "Controlla aggiornamenti");
  updateButton.textContent = status.available
    ? "Aggiorna"
    : (status.checking ? "Controllo…" : "Verifica");

  const updateCopy = root.querySelector("#update-status-copy");
  if (updateCopy) {
    updateCopy.textContent = status.available
      ? "Una nuova versione di Buzzer è disponibile."
      : (status.checking ? "Controllo aggiornamenti…" : "Buzzer è pronto per il controllo aggiornamenti.");
  }
  updateButton.onclick = () => ctx.checkForUpdates?.();

  return root;
}
