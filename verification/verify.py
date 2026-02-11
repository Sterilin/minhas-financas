import os
import sys
import time
import subprocess
from playwright.sync_api import sync_playwright

def verify():
    # Start server
    server = subprocess.Popen([sys.executable, "-m", "http.server", "8000"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(2) # Wait for server

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()

            # Capture console logs
            page.on("console", lambda msg: print(f"Console: {msg.text}"))
            page.on("pageerror", lambda exc: print(f"Page Error: {exc}"))

            page.goto("http://localhost:8000/index.html")

            # Wait for some initialization
            page.wait_for_timeout(3000)

            # Check if DataService is defined
            ds_exists = page.evaluate("typeof window.DataService !== 'undefined'")
            print(f"DataService exists: {ds_exists}")

            if not ds_exists:
                print("FAILED: DataService not found")
                sys.exit(1)

            # Screenshot
            os.makedirs("verification", exist_ok=True)
            page.screenshot(path="verification/screenshot.png")
            print("Screenshot saved to verification/screenshot.png")

    finally:
        server.terminate()

if __name__ == "__main__":
    verify()
