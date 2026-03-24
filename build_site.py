#!/usr/bin/env python3
"""One-time transform: Webflow export paths → static site relative paths."""
import re
from pathlib import Path

ROOT = Path(__file__).parent

CSS_TAG = (
    '<link href="https://cdn.prod.website-files.com/606d5cd3048a86b7a82fed1e/'
    'css/kevinlyan.webflow.shared.b0cde5cb6.css" rel="stylesheet" type="text/css" '
    'integrity="sha384-sM3ly2fLO3UayVaH+1HmSw14unSmhJbTe+R3CoLDRM5Nx20wMSlFMShrD7/4zSaN" '
    'crossorigin="anonymous"/>'
)


def fix_protocol(html: str) -> str:
    html = re.sub(r'src="//', 'src="https://', html)
    html = re.sub(r'href="//', 'href="https://', html)
    return html


NAV_INJECT = (
    "</nav>"
    '<div class="w-nav-button" aria-label="menu" role="button" tabindex="0">'
    '<div class="w-icon-nav-menu"></div></div>'
    '<div class="w-nav-overlay" data-wf-ignore=""></div>'
    "</div></div></div>"
)


def inject_nav(html: str) -> str:
    old = "</nav></div></div></div>"
    if old not in html:
        raise SystemExit("inject_nav: expected navbar closing pattern not found")
    return html.replace(old, NAV_INJECT, 1)


def inject_overrides(html: str, css_href: str) -> str:
    needle = '<link href="' + css_href + '" rel="stylesheet" type="text/css"/>'
    add = needle + '<link href="' + css_href.replace(
        "kevinlyan.webflow.shared.css", "overrides.css"
    ) + '" rel="stylesheet" type="text/css"/>'
    if needle not in html:
        raise SystemExit("inject_overrides: main css link not found")
    return html.replace(needle, add, 1)


def transform_root(html: str) -> str:
    html = html.replace(CSS_TAG, '<link href="css/kevinlyan.webflow.shared.css" rel="stylesheet" type="text/css"/>')
    reps = [
        ('href="/"', 'href="index.html"'),
        ('href="/about"', 'href="about.html"'),
        ('href="/disruptions-center"', 'href="disruptions-center/index.html"'),
        ('href="/responsive-cancels"', 'href="responsive-cancels/index.html"'),
        ('href="/checkout-redesign"', 'href="checkout-redesign/index.html"'),
    ]
    for a, b in reps:
        html = html.replace(a, b)
    # Keep the homepage headline custom color class on rebuilds.
    html = html.replace(
        '<h1 class="heading">Welcome in.<br/>',
        '<h1 class="heading moon-gold-heading">Welcome in.<br/>',
    )
    html = inject_nav(html)
    html = inject_overrides(html, "css/kevinlyan.webflow.shared.css")
    return fix_protocol(html)


def transform_nested(html: str) -> str:
    html = html.replace(
        CSS_TAG,
        '<link href="../css/kevinlyan.webflow.shared.css" rel="stylesheet" type="text/css"/>',
    )
    reps = [
        ('href="/"', 'href="../index.html"'),
        ('href="/about"', 'href="../about.html"'),
        ('href="/disruptions-center"', 'href="../disruptions-center/index.html"'),
        ('href="/responsive-cancels"', 'href="../responsive-cancels/index.html"'),
        ('href="/checkout-redesign"', 'href="../checkout-redesign/index.html"'),
    ]
    for a, b in reps:
        html = html.replace(a, b)
    html = inject_nav(html)
    html = inject_overrides(html, "../css/kevinlyan.webflow.shared.css")
    return fix_protocol(html)


def main():
    (ROOT / "disruptions-center").mkdir(parents=True, exist_ok=True)
    (ROOT / "responsive-cancels").mkdir(parents=True, exist_ok=True)
    (ROOT / "checkout-redesign").mkdir(parents=True, exist_ok=True)

    mapping = [
        ("_index.html", "index.html", transform_root),
        ("_about.html", "about.html", transform_root),
        ("_dc.html", "disruptions-center/index.html", transform_nested),
        ("_rc.html", "responsive-cancels/index.html", transform_nested),
        ("_ccr.html", "checkout-redesign/index.html", transform_nested),
    ]
    for src_name, dest_name, fn in mapping:
        src = ROOT / src_name
        text = src.read_text(encoding="utf-8")
        out = fn(text)
        (ROOT / dest_name).write_text(out, encoding="utf-8")
        print(f"Wrote {dest_name}")


if __name__ == "__main__":
    main()
