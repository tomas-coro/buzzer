import { mountAccountPanel } from "../account-panel.js";
import { allRuns } from "../meta.js";
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

export function render(ctx) {
  const root = document.createElement("div");
  root.className = "cabhome ph--cab a-buzz";

  let playerName = "PLAYER1";
  let language = "it";

  try {
    playerName = (localStorage.getItem("buzzer-player-name") || "PLAYER1")
      .toUpperCase()
      .replace(/[^A-Z0-9À-ÖØ-Ý ]/g, "")
      .trim()
      .slice(0, 12) || "PLAYER1";

    language = localStorage.getItem("buzzer-language") === "en" ? "en" : "it";
  } catch {}
  const copy = HOME_COPY[language];

  const runs = allRuns(window.localStorage);

  const runsImbattuto = runs.filter((run) => run?.formato === "imbattuto");
  const runsPlayoff = runs.filter((run) => run?.formato === "playoff");

  const bestImbattuto = runsImbattuto.length
    ? runsImbattuto.reduce(
        (best, run) => Math.max(best, Number(run?.vittorie) || 0),
        0
      )
    : null;

  const bestPlayoffSeries = runsPlayoff.length
    ? runsPlayoff.reduce((best, run) => {
        const serieVinte =
          run?.esito === "campione"
            ? 4
            : Math.max(0, Math.min(3, (Number(run?.round) || 1) - 1));

        return Math.max(best, serieVinte);
      }, 0)
    : null;

  root.innerHTML = `
    <div class="scr">
      <div class="home" id="home-main-panel">
        <div class="bz-top bz-top-upgraded">
          <div class="bz-player rise" aria-label="${copy.player}">
            <span class="bz-player-slot bz-player-id" id="home-player-id">${playerName}</span>
          </div>

          <span class="bz-top-actions rise" style="--d:.04s">

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
      <section class="home-settings-panel" id="settings-dialog" hidden>
        <div class="bz-settings-panel">

          <div class="settings-header">
            <div>
              <span class="settings-kicker">CABINA P1</span>
              <h2>${copy.settings}</h2>
            </div>
            <button id="close-settings" class="settings-close" type="button" aria-label="${copy.close}">×</button>
          </div>

          <section class="settings-block settings-player-block">
            <span class="settings-title">${copy.player}</span>

            <div class="settings-player-row">
              <span class="settings-p1">P1</span>

              <input
                id="player-name-input"
                type="text"
                maxlength="12"
                value="${playerName}"
                autocomplete="off"
                spellcheck="false"
                aria-label="${copy.playerName}"
              >

              <span class="settings-counter"><b id="player-name-count">${playerName.length}</b>/12</span>
            </div>

            <p>${copy.playerInfo}</p>
          </section>

          <section class="settings-block settings-language-block">
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

          <section class="settings-block settings-account-block">
            <div id="settings-account"></div>
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
      </section>

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
  root.querySelector("#open-stats")?.addEventListener("click", () => ctx.go("profilo"));


  const settingsDialog = root.querySelector("#settings-dialog");
  const homeMainPanel = root.querySelector("#home-main-panel");
  const nameInput = root.querySelector("#player-name-input");
  const homePlayerId = root.querySelector("#home-player-id");
  const playerCount = root.querySelector("#player-name-count");

  const openSettings = () => {
    nameInput.value = playerName;
    playerCount.textContent = String(playerName.length);

    homeMainPanel.hidden = true;
    settingsDialog.hidden = false;
    root.classList.add("settings-open");
  };

  const closeSettings = () => {
    settingsDialog.hidden = true;
    homeMainPanel.hidden = false;
    root.classList.remove("settings-open");
  };

  root.querySelector("#open-settings").onclick = openSettings;
  root.querySelector("#close-settings").onclick = closeSettings;

  nameInput.addEventListener("input", () => {
    nameInput.value = nameInput.value
      .toUpperCase()
      .replace(/[^A-Z0-9À-ÖØ-Ý ]/g, "")
      .slice(0, 12);

    playerCount.textContent = String(nameInput.value.length);
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

    homePlayerId.textContent = playerName;
    closeSettings();
  };

  const settingsAccount = root.querySelector("#settings-account");
  if (settingsAccount) {
    mountAccountPanel(settingsAccount, window.localStorage);
  }

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
