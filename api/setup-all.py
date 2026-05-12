"""
Configura TODAS las colecciones de Directus directamente en SQLite:
  - faq_items          (preguntas frecuentes)
  - survey_opciones    (opciones del formulario multi-paso)
  - estadisticas       (stats de la página de contacto)

Uso: python3 setup-all.py
Requisito: Docker con Directus corriendo (docker compose up -d)
"""

import sqlite3
import subprocess
import sys
import time

CONTAINER  = "akumalweb-directus-1"
DB_REMOTE  = "/directus/database/data.db"
DB_LOCAL   = "/tmp/akumal_setup.db"

# ─── Datos iniciales ──────────────────────────────────────────────────────────

FAQ_ITEMS = [
    ("¿Cuánto tiempo tarda en fabricarse mi producto?",
     "Los plazos estándar van de 4 a 8 semanas desde la aprobación de la muestra, dependiendo de la complejidad del formato y el volumen de producción. Te informaremos del calendario exacto en tu presupuesto personalizado.", 1),
    ("¿Cuáles son los mínimos de producción?",
     "El mínimo de pedido (MOQ) varía según el formato y la fórmula. Contacta con nuestro equipo para recibir un presupuesto personalizado sin compromiso adaptado a tu volumen. Trabajamos con marcas que empiezan desde pequeñas tiradas para que puedas testear el mercado sin grandes inversiones.", 2),
    ("¿Puedo usar mi propia fórmula o necesito la vuestra?",
     "Puedes traer tu propia fórmula o dejar que nuestro equipo de nutricionistas la desarrolle desde cero según tus objetivos y público objetivo. En ambos casos, la fórmula es tuya.", 3),
    ("¿Qué certificaciones tenéis?",
     "Fabricamos bajo certificación GMP (Buenas Prácticas de Manufactura) y cumplimos los estándares ISO de gestión de calidad. Nuestros procesos garantizan la trazabilidad, seguridad alimentaria y control de calidad exigidos por la normativa europea. Solicita nuestros certificados por email.", 4),
    ("¿Os encargáis también del diseño del packaging?",
     "Sí. Ofrecemos servicio integral que incluye diseño gráfico de etiquetas conforme al Reglamento UE 1169/2011, selección de envases y personalización de packaging. Nos encargamos de todo para que solo tengas que preocuparte por vender.", 5),
    ("¿Fabricáis suplementos deportivos para el mercado internacional?",
     "Sí. Exportamos a varios países europeos y tenemos experiencia con las normativas de etiquetado y registro en mercados de la Unión Europea, Reino Unido y LATAM. Como laboratorio OEM en España, acompañamos a nuestros clientes en su expansión internacional.", 6),
    ("¿Qué tipos de suplementos deportivos podéis fabricar bajo marca blanca?",
     "Fabricamos una amplia gama: proteínas whey (concentrate, isolate, hidrolizado), creatina, aminoácidos (BCAA, EAA), pre-entrenos, colágeno, quemadores de grasa y vitaminas deportivas. Disponibles en polvo, cápsulas, comprimidos, sticks y barritas.", 7),
]

# (paso, campo, etiqueta, valor, descripcion, emoji, imagen_url, plantilla, orden)
SURVEY_OPCIONES = [
    # Paso 1 — Galénica (imagen_card, radio)
    (1,"galenica","Cápsula Dura",        "Cápsula Dura",                              "Alta precisión de dosis, fácil de tragar",    None, "https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=220&h=130&fit=crop&q=80",  "imagen_card", 1),
    (1,"galenica","Cápsula Blanda",      "Cápsula Blanda",                            "Ideal para aceites y activos lipofílicos",     None, "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=220&h=130&fit=crop&q=80",  "imagen_card", 2),
    (1,"galenica","Comprimido",          "Comprimido",                                "Larga vida útil, económico a gran escala",     None, "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=220&h=130&fit=crop&q=80", "imagen_card", 3),
    (1,"galenica","Polvo / Shake",       "Polvo / Shake",                             "Proteínas, gainers, pre-entrenos",             None, "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=220&h=130&fit=crop&q=80",  "imagen_card", 4),
    (1,"galenica","Stick / Monodosis",   "Stick / Monodosis",                         "Formato individual, ideal para retail",        None, "https://images.unsplash.com/photo-1622480916113-9000ac49b79d?w=220&h=130&fit=crop&q=80", "imagen_card", 5),
    (1,"galenica","Líquido / Shot",      "Líquido / Shot",                            "Absorción rápida, formato premium",            None, "https://images.unsplash.com/photo-1596451190630-186aff535bf2?w=220&h=130&fit=crop&q=80", "imagen_card", 6),
    (1,"galenica","Aún no lo sé",        "Aún no lo sé",                              "Te asesoramos sin compromiso",                 None, "https://images.unsplash.com/photo-1573495612070-b7c9b5e34b80?w=220&h=130&fit=crop&q=80", "imagen_card", 7),

    # Paso 2 — Aplicación (checkbox_row, checkbox)
    (2,"aplicacion","Deportivo",         "Deportivo",         None, "🏋️", None, "checkbox_row", 1),
    (2,"aplicacion","Salud femenina",    "Salud femenina",    None, "🌸", None, "checkbox_row", 2),
    (2,"aplicacion","Inmunitario",       "Inmunitario",       None, "🛡️", None, "checkbox_row", 3),
    (2,"aplicacion","Sueño",             "Sueño",             None, "🌙", None, "checkbox_row", 4),
    (2,"aplicacion","Antioxidante",      "Antioxidante",      None, "✨", None, "checkbox_row", 5),
    (2,"aplicacion","Detox",             "Detox",             None, "🌿", None, "checkbox_row", 6),
    (2,"aplicacion","Articular",         "Articular",         None, "🦴", None, "checkbox_row", 7),
    (2,"aplicacion","Cognitivo",         "Cognitivo",         None, "🧠", None, "checkbox_row", 8),
    (2,"aplicacion","Hormonal",          "Hormonal",          None, "⚗️", None, "checkbox_row", 9),
    (2,"aplicacion","Otro",              "Otro",              None, "🔬", None, "checkbox_row", 10),

    # Paso 3 — Volumen (imagen_card, radio)
    (3,"volumen","Menos de 500 unidades",    "Menos de 500 uds.",    "Test de mercado / MVP",         None, "https://images.unsplash.com/photo-1495592822108-db7e8e2c7f5f?w=220&h=130&fit=crop&q=80",  "imagen_card", 1),
    (3,"volumen","500 – 2.000 unidades",     "500 – 2.000 uds.",     "Lanzamiento inicial",           None, "https://images.unsplash.com/photo-1516192518150-0d8fee5425e3?w=220&h=130&fit=crop&q=80",  "imagen_card", 2),
    (3,"volumen","2.000 – 10.000 unidades",  "2.000 – 10.000 uds.",  "Escala de crecimiento",         None, "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=220&h=130&fit=crop&q=80",  "imagen_card", 3),
    (3,"volumen","Más de 10.000 unidades",   "Más de 10.000 uds.",   "Producción a gran escala",      None, "https://images.unsplash.com/photo-1565793979507-1fece1fae5a6?w=220&h=130&fit=crop&q=80",  "imagen_card", 4),

    # Paso 4 — Fórmula (imagen_card, radio)
    (4,"formula_estado","Sí, tengo fórmula definida",              "Sí, la tengo",     "Tengo ingredientes y dosis",          None, "https://images.unsplash.com/photo-1532094349884-32b43cc2c2e3?w=220&h=130&fit=crop&q=80", "imagen_card", 1),
    (4,"formula_estado","Tengo idea general, necesito ayuda técnica", "Idea general",  "Necesito asesoramiento técnico",      None, "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=220&h=130&fit=crop&q=80", "imagen_card", 2),
    (4,"formula_estado","Quiero fórmula estándar de catálogo",     "Catálogo estándar","Uso una de vuestras fórmulas",        None, "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=220&h=130&fit=crop&q=80", "imagen_card", 3),
    (4,"formula_estado","No lo sé, necesito asesoramiento",        "Me asesoran",      "Decidiré con vuestro equipo",         None, "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=220&h=130&fit=crop&q=80", "imagen_card", 4),

    # Paso 5 — Servicios adicionales (checkbox_row, checkbox)
    (5,"servicios","Asesoramiento Legal y/o Técnico",          "Asesoramiento Legal y/o Técnico",                      None, None, None, "checkbox_row", 1),
    (5,"servicios","Logística del producto",                   "Logística del producto",                               None, None, None, "checkbox_row", 2),
    (5,"servicios","Gestión de Registro Sanitario",            "Gestión de Registro Sanitario y tramitación de documentación", None, None, None, "checkbox_row", 3),
    (5,"servicios","Diseño y/o marketing",                     "Diseño y/o marketing del producto",                    None, None, None, "checkbox_row", 4),
]

# (valor, etiqueta, orden)
ESTADISTICAS = [
    ("+200", "Marcas creadas",         1),
    ("<24h", "Tiempo de respuesta",    2),
    ("GMP",  "Certificación activa",   3),
    ("100%", "Laboratorio propio",     4),
]

# ─── Helpers ──────────────────────────────────────────────────────────────────

def run(cmd):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return r.returncode, r.stdout.strip(), r.stderr.strip()

def ok(label):
    print(f"  ✓ {label}")

def skip(label):
    print(f"  · {label} (ya existe)")

def err(label, msg):
    print(f"  ✗ {label} — {msg}")

def ensure_collection(c, name, icon, note, singleton=0):
    c.execute("SELECT collection FROM directus_collections WHERE collection=?", (name,))
    if c.fetchone():
        skip(f"Colección {name}")
        return
    c.execute("""
        INSERT INTO directus_collections
            (collection, icon, note, hidden, singleton, accountability, collapse, archive_app_filter)
        VALUES (?,?,?,0,?,?,?,1)
    """, (name, icon, note, singleton, "all", "open"))
    ok(f"Colección {name}")

def ensure_field(c, collection, field, interface, note="", sort=1, required=0):
    c.execute("SELECT id FROM directus_fields WHERE collection=? AND field=?", (collection, field))
    if c.fetchone():
        return
    c.execute("""
        INSERT INTO directus_fields
            (collection, field, interface, note, sort, required, hidden, readonly, width, searchable)
        VALUES (?,?,?,?,?,?,0,0,'full',0)
    """, (collection, field, interface, note, sort, required))

def ensure_permission(c, policy_id, collection, action):
    c.execute(
        "SELECT id FROM directus_permissions WHERE policy=? AND collection=? AND action=?",
        (policy_id, collection, action)
    )
    if c.fetchone():
        return
    c.execute(
        "INSERT INTO directus_permissions (policy, collection, action, fields) VALUES (?,?,?,'*')",
        (policy_id, collection, action)
    )

def get_public_policy(c):
    c.execute("SELECT id FROM directus_policies WHERE admin_access=0 LIMIT 1")
    row = c.fetchone()
    return row[0] if row else None

# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("\n=== Setup Directus — Akumal Sport Nutrition ===\n")

    # 1. Copiar DB desde Docker
    print("Copiando base de datos desde Docker...")
    code, _, err_msg = run(f"docker cp {CONTAINER}:{DB_REMOTE} {DB_LOCAL}")
    if code != 0:
        print(f"Error: {err_msg}\n¿Está Docker corriendo? Ejecuta: docker compose up -d")
        sys.exit(1)
    ok("Base de datos copiada")

    db = sqlite3.connect(DB_LOCAL)
    c  = db.cursor()

    # 2. Política pública
    policy_id = get_public_policy(c)
    if policy_id:
        ok(f"Política pública encontrada ({policy_id[:8]}...)")
    else:
        err("Política pública", "no encontrada — los permisos públicos no se configurarán")

    # ── faq_items ─────────────────────────────────────────────────────────────
    print("\n[faq_items]")
    ensure_collection(c, "faq_items", "help", "Preguntas frecuentes del sitio web")
    c.execute("""
        CREATE TABLE IF NOT EXISTS faq_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pregunta  TEXT NOT NULL,
            respuesta TEXT NOT NULL,
            orden     INTEGER DEFAULT 1,
            activo    INTEGER DEFAULT 1
        )
    """)
    for i, (field, interface, note, sort) in enumerate([
        ("pregunta",  "input",          "Texto de la pregunta",           1),
        ("respuesta", "input-multiline","Texto de la respuesta",          2),
        ("orden",     "input",          "Orden de aparición (1=primero)", 3),
        ("activo",    "boolean",        "Desactivar para ocultar",        4),
    ]):
        ensure_field(c, "faq_items", field, interface, note, sort, 1 if field in ("pregunta","respuesta") else 0)
    c.execute("SELECT COUNT(*) FROM faq_items")
    if c.fetchone()[0] == 0:
        c.executemany("INSERT INTO faq_items (pregunta,respuesta,orden) VALUES (?,?,?)", FAQ_ITEMS)
        ok(f"{len(FAQ_ITEMS)} preguntas del FAQ insertadas")
    else:
        skip("Preguntas FAQ ya existen")
    if policy_id:
        ensure_permission(c, policy_id, "faq_items", "read")
        ok("Permiso público lectura")

    # ── survey_opciones ───────────────────────────────────────────────────────
    print("\n[survey_opciones]")
    ensure_collection(c, "survey_opciones", "list", "Opciones del formulario de cotización multi-paso")
    c.execute("""
        CREATE TABLE IF NOT EXISTS survey_opciones (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            paso       INTEGER NOT NULL,
            campo      TEXT    NOT NULL,
            etiqueta   TEXT    NOT NULL,
            valor      TEXT    NOT NULL,
            descripcion TEXT,
            emoji      TEXT,
            imagen_url TEXT,
            plantilla  TEXT    DEFAULT 'imagen_card',
            orden      INTEGER DEFAULT 1,
            activo     INTEGER DEFAULT 1
        )
    """)
    for fld, iface, note, sort in [
        ("paso",       "input",          "Número de paso (1-5)",           1),
        ("campo",      "input",          "Nombre del campo HTML (name=…)", 2),
        ("etiqueta",   "input",          "Texto que ve el usuario",        3),
        ("valor",      "input",          "Valor que se envía a Odoo",      4),
        ("descripcion","input",          "Subtítulo opcional",             5),
        ("emoji",      "input",          "Emoji para listas (paso 2, 5)",  6),
        ("imagen_url", "input",          "URL de imagen (pasos 1, 3, 4)",  7),
        ("plantilla",  "select-dropdown","imagen_card o checkbox_row",     8),
        ("orden",      "input",          "Orden de aparición",             9),
        ("activo",     "boolean",        "Desactivar para ocultar",        10),
    ]:
        ensure_field(c, "survey_opciones", fld, iface, note, sort)
    c.execute("SELECT COUNT(*) FROM survey_opciones")
    if c.fetchone()[0] == 0:
        c.executemany(
            "INSERT INTO survey_opciones (paso,campo,etiqueta,valor,descripcion,emoji,imagen_url,plantilla,orden) VALUES (?,?,?,?,?,?,?,?,?)",
            SURVEY_OPCIONES
        )
        ok(f"{len(SURVEY_OPCIONES)} opciones del survey insertadas")
    else:
        skip("Opciones ya existen")
    if policy_id:
        ensure_permission(c, policy_id, "survey_opciones", "read")
        ok("Permiso público lectura")

    # ── estadisticas ──────────────────────────────────────────────────────────
    print("\n[estadisticas]")
    ensure_collection(c, "estadisticas", "bar_chart", "Estadísticas que aparecen en las páginas")
    c.execute("""
        CREATE TABLE IF NOT EXISTS estadisticas (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            valor   TEXT    NOT NULL,
            etiqueta TEXT   NOT NULL,
            orden   INTEGER DEFAULT 1,
            activo  INTEGER DEFAULT 1
        )
    """)
    for fld, iface, note, sort in [
        ("valor",    "input",  "El número o texto grande (+200, <24h…)", 1),
        ("etiqueta", "input",  "La etiqueta debajo del número",          2),
        ("orden",    "input",  "Orden de aparición",                     3),
        ("activo",   "boolean","Desactivar para ocultar",                4),
    ]:
        ensure_field(c, "estadisticas", fld, iface, note, sort)
    c.execute("SELECT COUNT(*) FROM estadisticas")
    if c.fetchone()[0] == 0:
        c.executemany("INSERT INTO estadisticas (valor,etiqueta,orden) VALUES (?,?,?)", ESTADISTICAS)
        ok(f"{len(ESTADISTICAS)} estadísticas insertadas")
    else:
        skip("Estadísticas ya existen")
    if policy_id:
        ensure_permission(c, policy_id, "estadisticas", "read")
        ok("Permiso público lectura")

    db.commit()
    db.close()

    # 3. Copiar DB de vuelta al contenedor
    print("\nAplicando cambios al contenedor Docker...")
    run(f"docker cp {DB_LOCAL} {CONTAINER}:{DB_REMOTE}")
    ok("Base de datos actualizada")

    # 4. Reiniciar Directus
    print("Reiniciando Directus...")
    run("docker compose restart")
    time.sleep(12)

    # 5. Verificar
    code, out, _ = run("curl -s http://localhost:8055/server/health")
    if '"status":"ok"' in out:
        ok("Directus respondiendo correctamente")
    else:
        print("  ! Directus puede estar arrancando aún — espera unos segundos y prueba http://localhost:8055")

    print("\n¡Listo! Paneles disponibles en:")
    print("  http://localhost:8055/admin/content/faq_items")
    print("  http://localhost:8055/admin/content/survey_opciones")
    print("  http://localhost:8055/admin/content/estadisticas\n")

if __name__ == "__main__":
    main()
