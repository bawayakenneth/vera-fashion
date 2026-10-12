"""Browser end-to-end test (optional; needs Python Playwright). Run: python3 tests/e2e.py"""
import subprocess, time, sys, os, tempfile
from playwright.sync_api import sync_playwright, expect

PORT = 4173
BASE = f"http://localhost:{PORT}"
OUT = os.environ.get("SHOTS", os.path.join(tempfile.gettempdir(), "verra-shots"))
os.makedirs(OUT, exist_ok=True)
server = subprocess.Popen(["node", "server.js"], env={**os.environ, "PORT": str(PORT)}, stdout=subprocess.DEVNULL)
time.sleep(1)
fails, errors = [], []

def check(name, cond):
    print(("PASS " if cond else "FAIL ") + name)
    if not cond: fails.append(name)

try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={"width": 1366, "height": 900})
        page = ctx.new_page()
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
        # external Google Fonts may be unreachable in sandboxes: ignore those only
        page.on("console", lambda m: m.type == "error" and "fonts.g" not in m.text and "ERR_" not in m.text and errors.append("console: " + m.text))
        page.on("requestfailed", lambda r: "fonts.g" not in r.url and errors.append("requestfailed: " + r.url))
        page.on("response", lambda r: r.status >= 400 and errors.append(f"http {r.status}: {r.url}"))

        page.goto(BASE); page.wait_for_load_state("networkidle")
        check("title set from config", "Verra" in page.title())
        check("8 product cards render", page.locator(".card").count() == 8)
        check("hero image loaded", page.evaluate("document.getElementById('hero-img').naturalWidth") > 0)
        check("all product images loaded", page.evaluate("[...document.querySelectorAll('.card img')].every(i => i.complete && i.naturalWidth>0)"))
        check("theme variable applied", page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()") == "#7a1f34")
        check("announce bar text", "Free shipping over $150" in page.inner_text("#announce"))
        page.wait_for_timeout(1300); page.screenshot(path=f"{OUT}/desktop-top.png")

        # filters + sort
        page.click("[data-category='Knitwear']")
        check("filter Knitwear -> 2 cards", page.locator(".card").count() == 2)
        check("result count text", page.inner_text("#result-count") == "2 pieces")
        check("pressed state", page.get_attribute("[data-category='Knitwear']", "aria-pressed") == "true")
        page.select_option("#sort", "price-desc")
        check("sort desc puts Lumen first", "Lumen" in page.locator(".card h3").first.inner_text())
        page.click("[data-category='All']"); page.select_option("#sort", "price-asc")
        check("sort asc cheapest first", "$120" in page.locator(".card .price").first.inner_text())
        page.select_option("#sort", "featured")

        # quick view: validation then add
        page.click("[data-open='meridian-coat']")
        check("dialog opens", page.evaluate("document.getElementById('quickview').open"))
        page.screenshot(path=f"{OUT}/desktop-quickview.png")
        page.click("[data-qv-add]")
        check("size required error", "Choose a size" in page.inner_text("#qv-error"))
        page.locator(".swatch").nth(1).click()
        check("color label updates", page.inner_text("#qv-color-name") == "Oxblood")
        page.locator(".size", has_text="M").click()
        page.click("[data-qv-step='1']")
        check("qty shows 2", page.inner_text("#qv-qty") == "2")
        page.click("[data-thumb]:nth-of-type(2)")
        check("thumb switches image", "-b.svg" in page.get_attribute("#qv-main", "src"))
        page.click("[data-qv-add]")
        check("dialog closed after add", not page.evaluate("document.getElementById('quickview').open"))
        check("drawer open", "open" in page.get_attribute("#cart-drawer", "class"))
        check("badge = 2", page.inner_text("#cart-count") == "2")
        check("subtotal $570", page.inner_text("#cart-subtotal") == "$570")
        check("shipping free", page.inner_text("#cart-shipping") == "Free")
        check("focus moved into drawer", page.evaluate("document.getElementById('cart-drawer').contains(document.activeElement)"))
        page.screenshot(path=f"{OUT}/desktop-cart.png")

        # cart controls
        page.click("[data-act='dec']")
        check("dec -> $285", page.inner_text("#cart-subtotal") == "$285")
        page.click("[data-act='dec']")
        check("dec to 0 empties bag", page.is_visible("#cart-empty") and page.inner_text("#cart-count") == "0")
        page.keyboard.press("Escape")
        check("Escape closes drawer", "open" not in page.get_attribute("#cart-drawer", "class"))
        check("drawer inert when closed", page.get_attribute("#cart-drawer", "inert") is not None)

        # small order: shipping charge + progress, one-size product skips size error
        page.click("[data-open='drift-tote']"); page.click("[data-qv-add]")
        check("one-size product adds without choosing", page.inner_text("#cart-count") == "1")
        check("tote ($195) is over threshold -> free shipping", page.inner_text("#cart-shipping") == "Free" and page.inner_text("#cart-total") == "$195")
        page.click("[data-act='remove']"); page.click("#cart-close")
        page.click("[data-open='sable-slip']"); page.locator(".size", has_text="S").first.click(); page.click("[data-qv-add]")
        check("under threshold shows $12 shipping", page.inner_text("#cart-shipping") == "$12")
        check("total $147 and nudge to free shipping", page.inner_text("#cart-total") == "$147" and "$15" in page.inner_text("#ship-msg"))
        page.screenshot(path=f"{OUT}/desktop-cart-small.png")
        page.click("#checkout-btn")
        check("checkout toast shown", "prototype" in page.inner_text("#toast"))
        # persistence
        page.reload(); page.wait_for_load_state("networkidle")
        check("cart persists after reload", page.inner_text("#cart-count") == "1")
        page.click("#cart-open"); page.click("[data-act='remove']")
        check("remove works", page.inner_text("#cart-count") == "0")
        page.click("#cart-close")

        # contact form
        page.click("#contact-form button[type=submit]")
        check("name error", "Enter your name" in page.inner_text("#c-name-err"))
        check("focus first invalid", page.evaluate("document.activeElement.id") == "c-name")
        page.fill("#c-name", "Ada"); page.fill("#c-email", "bad"); page.fill("#c-message", "short")
        page.click("#contact-form button[type=submit]")
        check("email error", "valid email" in page.inner_text("#c-email-err"))
        check("message error", "10 characters" in page.inner_text("#c-message-err"))
        page.fill("#c-email", "ada@example.com"); page.fill("#c-message", "Do you do made-to-measure?")
        page.click("#contact-form button[type=submit]")
        check("contact success + reset", "Thanks, Ada" in page.inner_text("#form-status") and page.input_value("#c-name") == "")
        page.fill("#n-email", "nope"); page.click("#newsletter-form button")
        check("newsletter invalid", "valid email" in page.inner_text("#newsletter-status"))
        page.fill("#n-email", "a@b.co"); page.click("#newsletter-form button")
        check("newsletter ok", "on the list" in page.inner_text("#newsletter-status"))
        page.screenshot(path=f"{OUT}/desktop-full.png", full_page=True)

        # mobile
        m = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        mp = m.new_page()
        mp.on("pageerror", lambda e: errors.append(f"mobile pageerror: {e}"))
        mp.goto(BASE); mp.wait_for_load_state("networkidle"); mp.wait_for_timeout(1300)
        check("mobile: no horizontal overflow", mp.evaluate("document.documentElement.scrollWidth <= window.innerWidth"))
        check("mobile: nav hidden until toggled", not mp.is_visible("#site-nav"))
        mp.click("#nav-toggle")
        check("mobile: nav opens", mp.is_visible("#site-nav") and mp.get_attribute("#nav-toggle", "aria-expanded") == "true")
        mp.screenshot(path=f"{OUT}/mobile-top.png")
        mp.click("#site-nav a[href='#shop']")
        check("mobile: nav closes on link", not mp.is_visible("#site-nav"))
        mp.click("[data-open='cairn-sweater']"); mp.wait_for_timeout(200)
        mp.screenshot(path=f"{OUT}/mobile-quickview.png")
        check("mobile: dialog no overflow", mp.evaluate("document.getElementById('quickview').scrollWidth <= document.getElementById('quickview').clientWidth + 1"))
        b.close()
finally:
    server.terminate()

for e in errors: print("ERROR", e)
print(f"\n{len(fails)} failed, {len(errors)} runtime errors")
sys.exit(1 if fails or errors else 0)
