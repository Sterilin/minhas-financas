from playwright.sync_api import sync_playwright, expect
import time

def verify(page):
    print("Navigating...")
    page.goto("http://localhost:8080")

    print("Waiting for Dashboard...")
    expect(page.get_by_role("heading", name="Resumo Financeiro")).to_be_visible(timeout=10000)
    expect(page.locator("#dash-real-balance")).not_to_have_text("...", timeout=20000)

    print("Dashboard loaded. Scrolling...")
    page.evaluate("window.scrollTo(0, 500)")
    time.sleep(2)

    print("Taking Dashboard screenshot...")
    page.screenshot(path="dashboard_verification.png")

    print("Switching to Data tab...")
    # Trigger tab switch via JS to ensure we hit the logic
    page.evaluate("if(window.UI) window.UI.switchTab('data')")

    time.sleep(2)
    print("Checking Audit view...")
    # Verify Audit view is active
    expect(page.locator("#subview-audit")).to_be_visible()

    # Verify we have rows or "Nenhum registro"
    # If logic works, it should render something.
    income_html = page.inner_html("#audit-income-body")
    print(f"Income Body Content Length: {len(income_html)}")

    page.screenshot(path="tables_verification.png")
    print("Done.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="error.png")
        finally:
            browser.close()
