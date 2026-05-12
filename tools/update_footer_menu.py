import re
import os

# login.html excluded (per project convention)
html_files = [
    "index.html",
    "pages/nosotros.html",
    "pages/contacto.html",
    "pages/blog.html",
]

SVG_MAIL  = '<svg width="{s}" height="{s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>'
SVG_PHONE = '<svg width="{s}" height="{s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>'
SVG_CLOCK = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>'
SVG_LI    = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>'
SVG_FB    = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>'
SVG_IG    = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>'
SVG_UP    = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left:6px;"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>'


def build_footer(filepath):
    d = os.path.dirname(filepath)
    if d in ("pages", "blog"):
        idx   = "../index.html"
        logo  = "../assets/images/akumal/LOGO AKUMAL.png"
        nos   = "nosotros.html"
        con   = "contacto.html"
        blo   = "blog.html"
    else:
        idx   = "index.html"
        logo  = "assets/images/akumal/LOGO AKUMAL.png"
        nos   = "pages/nosotros.html"
        con   = "pages/contacto.html"
        blo   = "pages/blog.html"

    svg_mail20  = SVG_MAIL.format(s=20)
    svg_phone20 = SVG_PHONE.format(s=20)
    svg_li18    = SVG_LI.replace('width="16" height="16"', 'width="18" height="18"')

    return (
        '<footer class="tf-footer">\n'
        '            <div class="container">\n'
        '                <div class="br-line">\n'
        '                </div>\n'
        '            </div>\n'
        '            <div class="footer-inner">\n'
        '                <div class="container">\n'
        '                    <div class="row">\n'
        '                        <div class="col-md-3">\n'
        f'                            <a href="{idx}" class="footer-logo mb-4 d-inline-block">\n'
        f'                                <img src="{logo}" alt="Akumal Sport Nutrition" style="max-width: 200px; filter: brightness(0) invert(1);">\n'
        '                            </a>\n'
        '                            <p class="title text-has-dot text-caption fw-medium mt-4 mb-2">\n'
        '                                <span class="br-dot" style="background-color:#607561; width:8px; height:8px; border-radius:50%; display:inline-block; margin-right:8px;">\n'
        '                                </span>\n'
        '                                DONDE NACEN LAS MARCAS\n'
        '                            </p>\n'
        '                            <p class="text-body-2 mt-3" style="line-height:1.6; color: rgba(255,255,255,0.60);">\n'
        '                                Donde nacen las marcas que marcan la diferencia. Somos ese socio estratégico que toda marca necesita cuando decide tomarse en serio su producto, su posicionamiento y su crecimiento. Trabajamos para terceros, en un modelo B2B, acompañando a empresas que buscan lanzar o mejorar su propia línea de suplementación deportiva.\n'
        '                            </p>\n'
        '                        </div>\n'
        '                        <div class="col-6 col-sm-2 col-md-1">\n'
        '                            <p class="footer-heading text-caption fw-medium text-white-64">\n'
        '                                ENLACES\n'
        '                            </p>\n'
        '                        </div>\n'
        '                        <div class="col-6 col-sm-4 col-md-3">\n'
        '                            <ul class="footer-menu-list mb-sm-0">\n'
        f'                                <li><a href="{idx}" class="link letter-space--2 h5">Inicio</a></li>\n'
        f'                                <li><a href="{nos}" class="link letter-space--2 h5">Sobre Nosotros</a></li>\n'
        f'                                <li><a href="{con}" class="link letter-space--2 h5">Cotiza Online</a></li>\n'
        f'                                <li><a href="{blo}" class="link letter-space--2 h5">Noticias</a></li>\n'
        '                                <li><a href="#" class="link letter-space--2 h5">Únete al Equipo</a></li>\n'
        '                            </ul>\n'
        '                        </div>\n'
        '                        <div class="col-6 col-sm-2 col-md-1">\n'
        '                            <p class="footer-heading text-caption fw-medium text-white-64">\n'
        '                                CONTACTO\n'
        '                            </p>\n'
        '                        </div>\n'
        '                        <div class="col-6 col-sm-4 col-md-4">\n'
        '                            <ul class="footer-menu-list mb-0">\n'
        '                                <li>\n'
        '                                    <a href="mailto:info@akumalnutrition.com" class="link letter-space--2 h5 d-flex align-items-center gap-2">\n'
        f'                                        {svg_mail20} Correo\n'
        '                                    </a>\n'
        '                                </li>\n'
        '                                <li>\n'
        '                                    <a href="tel:+34633825132" class="link letter-space--2 h5 d-flex align-items-center gap-2">\n'
        f'                                        {svg_phone20} +34 633 82 51 32\n'
        '                                    </a>\n'
        '                                </li>\n'
        '                                <li class="mt-3">\n'
        '                                    <div class="d-flex gap-2">\n'
        '                                        <a href="https://www.linkedin.com/company/akumal-sport-nutrition/posts/?feedView=all" target="_blank" class="social-icon-circle">' + SVG_LI + '</a>\n'
        '                                        <a href="https://www.facebook.com/akumalsportnutrition" target="_blank" class="social-icon-circle">' + SVG_FB + '</a>\n'
        '                                        <a href="https://www.instagram.com/akumalsportnutrition" target="_blank" class="social-icon-circle">' + SVG_IG + '</a>\n'
        '                                    </div>\n'
        '                                </li>\n'
        '                            </ul>\n'
        '                        </div>\n'
        '                    </div>\n'
        '                </div>\n'
        '            </div>\n'
        '            <div class="footer-bottom">\n'
        '                <div class="container">\n'
        '<div class="bottom">\n'
        '                        <p class="text-nocopy text-caption fw-medium letter-space--1">\n'
        '                            © AKUMAL SPORT NUTRITION 2026\n'
        '                        </p>\n'
        '                        <div class="d-flex align-items-center gap-3 flex-wrap justify-content-end">\n'
        '                            <a href="#" class="link text-caption fw-medium letter-space--1" style="color:#fff">POLÍTICA DE PRIVACIDAD</a>\n'
        '                            <a href="#" class="link text-caption fw-medium letter-space--1" style="color:#fff">AVISO LEGAL</a>\n'
        '                            <a href="#" class="link text-caption fw-medium letter-space--1" style="color:#fff">POLÍTICA DE COOKIES</a>\n'
        '                            <a href="#" class="action-go-top tf-link-icon link text-caption fw-medium letter-space--1" onclick="window.scrollTo({top:0,behavior:\'smooth\'}); return false;">\n'
        '                                VOLVER ARRIBA\n'
        f'                                {SVG_UP}\n'
        '                            </a>\n'
        '                        </div>\n'
        '                    </div>\n'
        '                </div>\n'
        '            </div>\n'
        '        </footer>'
    )


def build_offcanvas(filepath):
    d = os.path.dirname(filepath)
    if d in ("pages", "blog"):
        idx  = "../index.html"
        logo = "../assets/images/akumal/logoAkumalBlanco.png"
        nos  = "nosotros.html"
        con  = "contacto.html"
        blo  = "blog.html"
    else:
        idx  = "index.html"
        logo = "assets/images/akumal/logoAkumalBlanco.png"
        nos  = "pages/nosotros.html"
        con  = "pages/contacto.html"
        blo  = "pages/blog.html"

    def item(href, label):
        return (
            '            <li>\n'
            '                <div class="item close-mb-menu">\n'
            f'                    <a href="{href}" class="mb-menu-link text-display-1">\n'
            f'                        <span class="text">{label}</span>\n'
            '                        <div class="infiniteSlide_text_main">\n'
            '                            <div class="infiniteSlide infiniteSlide_text" data-clone="5">\n'
            f'                                <p class="text-body-2 letter-space--1"><span class="text-primary">//</span> {label}</p>\n'
            f'                                <p class="text-body-2 letter-space--1"><span class="text-primary">//</span> {label}</p>\n'
            f'                                <p class="text-body-2 letter-space--1"><span class="text-primary">//</span> {label}</p>\n'
            '                            </div>\n'
            '                        </div>\n'
            '                    </a>\n'
            '                </div>\n'
            '            </li>\n'
        )

    svg_clock18 = SVG_CLOCK
    svg_phone18 = SVG_PHONE.format(s=18)
    svg_mail18  = SVG_MAIL.format(s=18)
    svg_li18    = SVG_LI.replace('width="16" height="16"', 'width="18" height="18"')

    return (
        '<div class="offcanvas-menu">\n'
        '        <div class="offcanvas-content">\n'
        '            <div class="container h-100">\n'
        '                <div class="offcanvas-content_wrapin">\n'
        '                    <div class="canvas_head">\n'
        f'                        <a href="{idx}" class="logo-site">\n'
        f'                            <img src="{logo}" alt="Akumal" style="max-width: 150px;">\n'
        '                        </a>\n'
        '                        <div class="btn-mobile-menu close-mb-menu text-caption link d-flex align-items-center gap-2">\n'
        '                            <i class="icon icon-close"></i>\n'
        '                            CERRAR\n'
        '                        </div>\n'
        '                    </div>\n'
        '                    <div class="canvas_center">\n'
        '                        <ul class="nav-ul-mb">\n'
        + item(idx, 'Inicio')
        + item(nos, 'Sobre Nosotros')
        + item(con, 'Cotiza Online')
        + item(blo, 'Noticias')
        + item('#', 'Únete al Equipo') +
        '                        </ul>\n'
        '                    </div>\n'
        '                    <div class="canvas_foot">\n'
        '                        <div class="left">\n'
        f'                            <a href="mailto:info@akumalnutrition.com" class="link text-caption d-flex align-items-center gap-2 mb-2">{svg_mail18} INFO@AKUMALNUTRITION.COM</a>\n'
        '                            <p class="text-caption d-flex align-items-center gap-2">\n'
        f'                                {svg_clock18}\n'
        '                                <span class="clock"></span>\n'
        '                                HORA LOCAL\n'
        '                            </p>\n'
        '                        </div>\n'
        '                        <div class="right" style="text-align: right;">\n'
        f'                            <a href="tel:+34633825132" class="tf-link-icon text-caption link d-flex align-items-center gap-2 mb-2 justify-content-end">{svg_phone18} +34 633 82 51 32</a>\n'
        f'                            <a href="#" class="tf-link-icon text-caption link d-flex align-items-center gap-2 justify-content-end">{svg_li18} LINKEDIN</a>\n'
        '                        </div>\n'
        '                    </div>\n'
        '                </div>\n'
        '            </div>\n'
        '        </div>\n'
        '    </div>'
    )


for f in html_files:
    with open(f, "r", encoding="utf-8") as fh:
        content = fh.read()

    footer_new   = build_footer(f)
    offcanvas_new = build_offcanvas(f)

    content = re.sub(r'<footer class="tf-footer">.*?</footer>', footer_new, content, flags=re.DOTALL)
    content = re.sub(r'<div class="offcanvas-menu">.*?<!-- /Mobile Menu -->', offcanvas_new + '\n    <!-- /Mobile Menu -->', content, flags=re.DOTALL)

    with open(f, "w", encoding="utf-8") as fh:
        fh.write(content)

    print(f"✓ {f}")
