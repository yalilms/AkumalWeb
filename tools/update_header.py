import re

html_files = ["index.html", "pages/nosotros.html", "pages/contacto.html"]

logo_new = """<a href="index.html" class="logo-site">
                                <img src="assets/images/akumal/logoAkumalBlanco.png" alt="Akumal" style="max-height: 40px; object-fit: contain;">
                            </a>"""

header_contact_new = """<div class="header-contact d-flex flex-column gap-2">
                                <a href="mailto:info@akumalnutrition.com" class="link text-caption d-flex align-items-center gap-2">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg> INFO@AKUMALNUTRITION.COM
                                </a>
                                <p class="text-caption d-flex align-items-center gap-2">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> +34 633 82 51 32
                                </p>
                            </div>"""

for f in html_files:
    with open(f, "r", encoding="utf-8") as file:
        content = file.read()

    # Replace Davies logo in header
    content = re.sub(r'<a href="index\.html" class="logo-site">\s*<i class="icon icon-davies-logo">\s*</i>\s*</a>', logo_new, content, flags=re.DOTALL)
    
    # Replace header contact block
    content = re.sub(r'<div class="header-contact">.*?</div>', header_contact_new, content, flags=re.DOTALL)
    
    # Ensure MENU is MENÚ
    content = content.replace("MENU\n                            </button>", "MENÚ\n                            </button>")

    with open(f, "w", encoding="utf-8") as file:
        file.write(content)
