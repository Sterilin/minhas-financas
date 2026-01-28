from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))
    page.on("pageerror", lambda err: print(f"Browser Error: {err}"))

    # Use localhost
    page.goto("http://localhost:8080/index.html")

    # Wait for modules
    page.wait_for_timeout(1000)

    # Check if Handlers is attached to window
    handlers_check = page.evaluate("typeof window.Handlers !== 'undefined'")
    if not handlers_check:
        print("Error: window.Handlers is undefined.")
        exit(1)
    print("window.Handlers is defined.")

    expect(page.locator("#view-dashboard")).to_be_visible()
    print("Dashboard visible.")

    page.click("#btn-data")
    expect(page.locator("#view-data")).to_be_visible()
    print("Switched to Data tab successfully.")

    browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
