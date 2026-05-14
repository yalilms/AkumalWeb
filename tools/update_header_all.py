#!/usr/bin/env python3
"""
Aplica el header actualizado (logo -10, col-md-3, hamburger) a todas las páginas.
Excluye archivos de login.
"""
import re
import os
import glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

HAMBURGER = (
    '<button type="button"\n'
    '                                class="btn-mobile-menu btn-menu-styled open-mb-menu hamburger-btn" aria-label="Menú">\n'
    '                                <span class="ham-line"></span>\n'
    '                                <span class="ham-line"></span>\n'
    '                                <span class="ham-line"></span>\n'
    '                            </button>'
)

# Regex para el botón MENU/MENÚ (cualquier variante)
MENU_BTN_RE = re.compile(
    r'<button[^>]+class="[^"]*btn-mobile-menu[^"]*btn-menu-styled[^"]*open-mb-menu[^"]*"[^>]*>.*?</button>',
    re.DOTALL
)

def depth_prefix(filepath):
    """Devuelve el prefijo ../  según la profundidad relativa al root."""
    rel = os.path.relpath(filepath, ROOT)
    depth = len(rel.split(os.sep)) - 1
    return '../' * depth

def logo_src(prefix):
    return f'{prefix}assets/images/akumal/logos/LOGO AKUMAL NUTRITION-10.png'

def process(filepath):
    with open(filepath, encoding='utf-8') as f:
        html = f.read()

    original = html
    prefix = depth_prefix(filepath)

    # 1. Actualizar versión akumal.css
    html = re.sub(r'akumal\.css\?v=\d+', 'akumal.css?v=63', html)

    # 2. Columna del logo: col-md-1 → col-md-3
    html = html.replace('col-6 col-md-1', 'col-6 col-md-3')

    # 3. Logo image: actualizar src y style
    html = re.sub(
        r'(<a[^>]+class="logo-site"[^>]*>\s*<img\s)[^>]+(>)',
        lambda m: (
            m.group(1)
            + f'src="{logo_src(prefix)}" alt="Akumal"\n'
            + '                                    style="height: 35px; width: auto;"'
            + m.group(2)
        ),
        html
    )

    # 4. Columna del nav: col-md-8 → col-md-6 con header-nav-col
    html = html.replace(
        'col-md-8 d-none d-md-block ps-4',
        'col-md-6 d-none d-md-block ps-4 header-nav-col'
    )

    # 5. Reemplazar botón MENU/MENÚ con hamburguesa
    html = MENU_BTN_RE.sub(HAMBURGER, html)

    if html != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f'  ✓ {os.path.relpath(filepath, ROOT)}')
    else:
        print(f'  – {os.path.relpath(filepath, ROOT)} (sin cambios)')

# Recoger todos los HTML excepto login
patterns = [
    os.path.join(ROOT, '*.html'),
    os.path.join(ROOT, 'pages', '*.html'),
    os.path.join(ROOT, 'es', '*.html'),
    os.path.join(ROOT, 'blog', '*.html'),
    os.path.join(ROOT, 'es', 'blog', '*.html'),
]

files = []
for pattern in patterns:
    files.extend(glob.glob(pattern))

# Excluir login
files = [f for f in files if 'login' not in os.path.basename(f)]
files.sort()

print(f'Procesando {len(files)} archivos...\n')
for f in files:
    process(f)
print('\nHecho.')
