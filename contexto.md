# Contexto del proyecto — Akumal Sport Nutrition

## Qué es este proyecto

Sitio web estático B2B para **Akumal Sport Nutrition**, fabricante de suplementos deportivos en España.  
El objetivo es que los formularios lleguen a **Odoo CRM** y que el contenido (FAQ, preguntas del survey) sea editable desde un **panel CMS** sin tocar código.

---

## Arquitectura — Opción 2 implementada

```
Web HTML (sin framework)
    │
    ├── Formulario survey (contacto.html)
    │       └── POST → http://localhost:3001/api/lead → Odoo CRM (o leads.json en local)
    │
    ├── FAQ (index.html)
    │       └── GET → http://localhost:8055/items/faq_items → Directus CMS
    │               (si Directus no responde, muestra el HTML hardcodeado como fallback)
    │
    └── Botón "Iniciar sesión" → redirigir a URL de Odoo (pendiente configurar)
```

### Piezas

| Pieza | Tecnología | Puerto local | Para qué |
|---|---|---|---|
| Web | HTML/CSS/JS estático | (Live Server) | Frontend público |
| Proxy API | Node.js + Express | 3001 | Recibe leads y los manda a Odoo |
| CMS | Directus 11 (Docker) | 8055 | Panel para editar contenido |
| Backend | Odoo | externo | CRM — guarda los leads del formulario |

---

## Cómo arrancar en local

### 1. Proxy API (formulario → Odoo)

```bash
cd api
npm run dev        # arranca en http://localhost:3001
```

- Si `.env` no existe o `ODOO_URL` está vacío → los leads se guardan en `api/leads.json` (modo local)
- Si `.env` tiene credenciales de Odoo → los leads van a Odoo CRM **y** a `api/leads.json` como copia

### 2. Directus CMS (panel de contenido)

```bash
# desde la raíz del proyecto
docker compose up -d        # arranca en http://localhost:8055
docker compose down         # para
docker compose logs -f      # ver logs en tiempo real
```

- Panel: http://localhost:8055
- Email: `admin@akumal.com`
- Password: `akumal2025`
- Los datos se guardan en volúmenes Docker nombrados (`akumalweb_directus_db`, `akumalweb_directus_uploads`)

### 3. La web

Abre con VS Code Live Server o cualquier servidor estático. No necesita build.

---

## Archivos clave creados/modificados

| Archivo | Qué hace |
|---|---|
| `api/server.js` | Servidor Node.js proxy — recibe POST `/api/lead` y crea lead en Odoo |
| `api/package.json` | Dependencias del proxy (express, cors, dotenv) |
| `api/.env.example` | Plantilla de variables de entorno — copiar a `api/.env` |
| `api/leads.json` | Se crea automáticamente — guarda todos los leads recibidos |
| `docker-compose.yml` | Levanta Directus con SQLite y volúmenes Docker |
| `js/config.js` | URLs de la API y Directus — **cambiar para producción** |
| `contacto.html` | Carga `js/config.js`; `sendToOdoo()` ahora llama al proxy local |
| `index.html` | Carga `js/config.js`; FAQ se carga desde Directus si está activo |

---

## Conectar con Odoo (cuando esté disponible)

1. Copiar `.env.example` a `.env`:
   ```bash
   cp api/.env.example api/.env
   ```
2. Rellenar en `api/.env`:
   ```
   ODOO_URL=https://tuempresa.odoo.com
   ODOO_DB=nombre_base_de_datos
   ODOO_USERNAME=usuario@email.com
   ODOO_API_KEY=tu_api_key
   ```
3. Reiniciar el proxy: `npm run dev`

Los leads del formulario crearán registros en `crm.lead` de Odoo con todos los datos del survey (galénica, aplicación, volumen, fórmula, empresa, contacto).

---

## Configurar colección FAQ en Directus

La colección ya está configurada automáticamente. Si necesitas reinicializarla en un nuevo entorno:

```bash
cd api
node setup-directus.js
```

El script crea la colección, los campos, los permisos públicos y carga las 7 preguntas.

> **Nota técnica:** Directus 11 tiene un bug donde el API de `/fields/{collection}` devuelve 403
> incluso para admins en colecciones nuevas. El script lo resuelve modificando directamente
> la base de datos SQLite y reiniciando el contenedor.

La web cargará automáticamente las preguntas de Directus. Si Directus no está activo, muestra el FAQ hardcodeado del HTML como fallback.

---

## Pendiente / próximos pasos

- [ ] Configurar `api/.env` con credenciales de Odoo real
- [ ] Crear colección `faq_items` en Directus y migrar las 7 preguntas del FAQ
- [ ] Cambiar el botón "Iniciar sesión" (`login.html`) para redirigir a la URL de Odoo
- [ ] (Opcional) Crear colección `survey_questions` en Directus para editar los pasos del formulario
- [ ] (Producción) Actualizar `js/config.js` con las URLs del servidor definitivo

---

## Estructura de un lead que llega a Odoo

```
crm.lead {
  name:         "Cotización Web — Nombre del cliente"
  contact_name: "Nombre"
  email_from:   "email@ejemplo.com"
  phone:        "+34 600 000 000"
  partner_name: "Nombre empresa"
  description:  """
    Galénica: Polvo / Shake
    Aplicación: Deportivo, Inmunitario
    Volumen: 500 – 2.000 unidades
    Volumen anual: 10.000 – 100.000 uds/año
    Fórmula: Tengo idea general, necesito ayuda técnica
    Ingredientes: Creatina 3g, L-Glutamina 2g
    Empresa constituida: Sí
    Fecha lanzamiento: 2025-09-01
    Servicios adicionales: Diseño y/o marketing
    Empresa / Marca: Mi Marca SL
    Teléfono: +34 600 000 000
    Notas: Texto libre del cliente
  """
  type: "lead"
}
```
