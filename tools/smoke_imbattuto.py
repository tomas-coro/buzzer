#!/usr/bin/env python3
"""Smoke test browser del percorso completo de L'Imbattuto."""

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def assert_no_overflow(page, fase):
    width = page.evaluate("[document.documentElement.scrollWidth, innerWidth]")
    assert width[0] <= width[1], f"overflow orizzontale in {fase}: {width}"


def play(browser, viewport):
    page = browser.new_page(viewport=viewport, reduced_motion="reduce")
    # Corsa riproducibile: questo seme completa davvero il 16-0 con l'auto-draft.
    page.add_init_script("""
      let s = 7;
      Math.random = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    """)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("response", lambda response: errors.append(f"HTTP {response.status} {response.url}")
            if response.status >= 400 and "/assets/volti/" not in response.url else None)

    page.goto(URL)
    assert page.title() == "L'IMBATTUTO — Buzzer"
    assert page.locator('link[rel="manifest"]').count() == 1
    assert page.locator('link[rel="icon"]').count() == 1
    page.locator("label.splash").click()
    page.locator("#gioca").click()
    page.locator('[data-diff="facile"]').click()
    page.locator("#autod-go").click()
    page.locator(".ct-row").first.wait_for()
    assert_no_overflow(page, "coach")
    page.locator(".ct-row").first.click()
    page.locator("#vai").click()

    rounds = 0
    while page.locator("#via").count():
        assert_no_overflow(page, f"partita {rounds + 1}")
        page.locator("#via").click()
        page.locator("#avanti").wait_for()
        page.locator("#avanti").click()
        rounds += 1

    assert rounds == 16, f"corsa terminata dopo {rounds} partite"
    assert "IMBATTUTO" in page.locator("body").inner_text()
    page.locator("#profilo").click()
    assert page.locator(".profilo").count() == 1
    assert_no_overflow(page, "profilo")
    assert not errors, "\n".join(errors)
    page.close()


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=ROOT))
    Thread(target=server.serve_forever, daemon=True).start()
    URL = f"http://127.0.0.1:{server.server_port}/prototype/imbattuto/"
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            for viewport in ({"width": 1280, "height": 900}, {"width": 375, "height": 812}):
                play(browser, viewport)
                print(f"ok {viewport['width']}x{viewport['height']}")
            browser.close()
    finally:
        server.shutdown()
