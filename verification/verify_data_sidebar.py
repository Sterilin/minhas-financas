from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # intercept external requests that could block the test (tailwind CDN, etc, based on previous verify.py)
        page.route("**/*", lambda route: route.abort() if route.request.resource_type in ["image", "media", "font"] and "127.0.0.1" not in route.request.url and "localhost" not in route.request.url else route.continue_())

        # goto local server
        page.goto("http://127.0.0.1:8000")

        # wait for initial dashboard to load
        page.wait_for_selector("#view-dashboard")

        # Take a screenshot of the dashboard initially (sidebar should NOT be visible)
        page.screenshot(path="/home/jules/verification/dashboard_view.png")

        # click 'Dados' tab
        page.click("button#btn-data")

        # verify we are in data tab
        page.wait_for_selector("#view-data", state="visible")

        # Sidebar should now be visible on 'data' tab
        page.wait_for_selector("#context-sidebar", state="visible")

        # Check active button on sidebar (Audit)
        page.wait_for_selector("#tab-btn-audit.bg-indigo-50")

        page.screenshot(path="/home/jules/verification/data_sidebar_view.png", full_page=True)

        browser.close()

if __name__ == "__main__":
    run()
