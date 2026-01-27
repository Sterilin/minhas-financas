from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("file:///app/index.html")

    # Check for duplicate button
    # The duplicate button had the same ID, so this count check verifies it's unique now
    expect(page.locator("#btn-data")).to_have_count(1)
    print("Button count verification passed.")

    # Click "Dados"
    page.click("#btn-data")

    # Check if view-data is visible
    expect(page.locator("#view-data")).to_be_visible()
    print("View-data visibility verification passed.")

    # Check if view-history is hidden (it should be, as we switched tabs)
    # And specifically, it should not be a parent of view-data (which we can't easily check with is_hidden,
    # but visibility of view-data implies it's not inside a hidden container)
    expect(page.locator("#view-history")).to_be_hidden()
    print("View-history hidden verification passed.")

    # Take screenshot
    page.screenshot(path="verification/verification.png")

    browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
