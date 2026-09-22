import { getSession, signIn, signUp, signOut } from "./auth.js";
import { sync } from "./sync.js";

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function mountAccountPanel(host, store = window.localStorage) {
  if (!host) return;

  let formOpen = false;
  let mode = "login";
  let busy = false;
  let error = "";
  let syncState = "";

  async function render() {
    const session = await getSession(store);
    const email = session?.user?.email || "";

    if (session) {
      host.innerHTML = `
        <div class="settings-account-summary">
          <div class="settings-account-main">
            <div class="settings-account-status">
              <span class="acct-dot on" aria-hidden="true"></span>
              <div>
                <b>COLLEGATO</b>
                <small>${esc(email)}</small>
              </div>
            </div>

            ${syncState ? `
              <span class="settings-sync-state ${syncState}">
                ${syncState === "ok" ? "SYNC OK" : "SYNC KO"}
              </span>
            ` : ""}
          </div>

          <div class="settings-account-actions">
            <button
              type="button"
              class="settings-mini-btn"
              data-account="sync"
              ${busy ? "disabled" : ""}
            >
              ${busy ? "..." : "SINCRONIZZA"}
            </button>

            <button
              type="button"
              class="settings-mini-btn ghost"
              data-account="logout"
              ${busy ? "disabled" : ""}
            >
              ESCI
            </button>
          </div>
        </div>
      `;

      host.querySelector('[data-account="sync"]')?.addEventListener("click", async () => {
        busy = true;
        syncState = "";
        await render();

        const result = await sync(store);

        busy = false;
        syncState = result.ok ? "ok" : "err";
        await render();
      });

      host.querySelector('[data-account="logout"]')?.addEventListener("click", async () => {
        busy = true;
        await signOut(store);
        busy = false;
        syncState = "";
        formOpen = false;
        await render();
      });

      return;
    }

    host.innerHTML = `
      <div class="settings-account-summary">
        <div class="settings-account-main">
          <div class="settings-account-status">
            <span class="acct-dot" aria-hidden="true"></span>
            <div>
              <b>NON COLLEGATO</b>
              <small>Statistiche e progressi su tutti i dispositivi</small>
            </div>
          </div>
        </div>

        <button
          type="button"
          class="settings-account-open"
          data-account="open"
        >
          ACCEDI
        </button>
      </div>

      ${formOpen ? `
        <div class="settings-account-overlay">
          <div class="settings-account-login">
            <div class="settings-login-head">
              <div>
                <span class="settings-kicker">ACCOUNT CLOUD</span>
                <h3>${mode === "register" ? "REGISTRATI" : "ACCEDI"}</h3>
              </div>

              <button
                type="button"
                class="settings-login-close"
                data-account="close"
                aria-label="Chiudi"
              >×</button>
            </div>

            <form id="settings-account-form" class="settings-login-form">
              <label>
                <span>EMAIL</span>
                <input
                  id="settings-account-email"
                  type="email"
                  autocomplete="email"
                  required
                >
              </label>

              <label>
                <span>PASSWORD</span>
                <input
                  id="settings-account-password"
                  type="password"
                  autocomplete="${mode === "register" ? "new-password" : "current-password"}"
                  minlength="6"
                  required
                >
              </label>

              ${error ? `<p class="settings-login-error">${esc(error)}</p>` : ""}

              <button
                type="submit"
                class="settings-login-submit"
                ${busy ? "disabled" : ""}
              >
                ${busy ? "ATTENDI..." : mode === "register" ? "REGISTRATI" : "ACCEDI"}
              </button>
            </form>

            <button
              type="button"
              class="settings-login-switch"
              data-account="switch"
              ${busy ? "disabled" : ""}
            >
              ${mode === "register"
                ? "Hai già un account? Accedi"
                : "Non hai un account? Registrati"}
            </button>
          </div>
        </div>
      ` : ""}
    `;

    host.querySelector('[data-account="open"]')?.addEventListener("click", async () => {
      formOpen = true;
      error = "";
      await render();
      host.querySelector("#settings-account-email")?.focus();
    });

    host.querySelector('[data-account="close"]')?.addEventListener("click", async () => {
      formOpen = false;
      error = "";
      await render();
    });

    host.querySelector('[data-account="switch"]')?.addEventListener("click", async () => {
      mode = mode === "login" ? "register" : "login";
      error = "";
      await render();
    });

    host.querySelector("#settings-account-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();

      const emailValue =
        host.querySelector("#settings-account-email")?.value.trim() || "";

      const password =
        host.querySelector("#settings-account-password")?.value || "";

      busy = true;
      error = "";
      await render();

      const result = mode === "register"
        ? await signUp(store, emailValue, password)
        : await signIn(store, emailValue, password);

      if (!result.ok) {
        busy = false;
        error = result.error || "Accesso non riuscito.";
        await render();
        return;
      }

      const syncResult = await sync(store);

      busy = false;
      formOpen = false;
      syncState = syncResult.ok ? "ok" : "err";
      await render();
    });
  }

  await render();
}
