require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3001;

// Acepta peticiones desde cualquier origen en desarrollo
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const ODOO = {
    url:      process.env.ODOO_URL      || '',
    db:       process.env.ODOO_DB       || '',
    username: process.env.ODOO_USERNAME || '',
    apiKey:   process.env.ODOO_API_KEY  || ''
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDescription(d) {
    return [
        'Galénica: '              + d.galenica,
        'Aplicación: '            + d.aplicacion,
        'Volumen: '               + d.volumen,
        'Volumen anual: '         + (d.volumen_anual      || '—'),
        'Fórmula: '               + d.formula_estado,
        'Ingredientes: '          + (d.formula            || '—'),
        'Empresa constituida: '   + d.empresa_constituida,
        'Fecha lanzamiento: '     + (d.fecha_lanzamiento  || '—'),
        'Servicios adicionales: ' + (d.servicios          || '—'),
        'Empresa / Marca: '       + (d.empresa            || '—'),
        'Teléfono: '              + (d.telefono           || '—'),
        'Notas: '                 + (d.notas              || '—')
    ].join('\n');
}

function saveLeadLocally(data) {
    const file = path.join(__dirname, 'leads.json');
    let leads  = [];
    if (fs.existsSync(file)) {
        try { leads = JSON.parse(fs.readFileSync(file, 'utf-8')); } catch {}
    }
    leads.push({ ...data, _timestamp: new Date().toISOString() });
    fs.writeFileSync(file, JSON.stringify(leads, null, 2));
}

// ─── Odoo JSON-RPC ────────────────────────────────────────────────────────────

async function createOdooLead(data) {
    // 1. Autenticación
    const authRes = await fetch(ODOO.url + '/web/session/authenticate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
            jsonrpc: '2.0', method: 'call', id: 1,
            params:  { db: ODOO.db, login: ODOO.username, password: ODOO.apiKey }
        })
    });
    const auth = await authRes.json();
    if (auth.error) throw new Error('Odoo auth: ' + JSON.stringify(auth.error));

    const cookie = authRes.headers.get('set-cookie') || '';

    // 2. Crear lead en CRM
    const leadRes = await fetch(ODOO.url + '/web/dataset/call_kw', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body:    JSON.stringify({
            jsonrpc: '2.0', method: 'call', id: 2,
            params:  {
                model:  'crm.lead',
                method: 'create',
                args: [{
                    name:         'Cotización Web — ' + data.nombre,
                    contact_name: data.nombre,
                    email_from:   data.email,
                    phone:        data.telefono   || '',
                    partner_name: data.empresa    || '',
                    description:  buildDescription(data),
                    type:         'lead'
                }],
                kwargs: {}
            }
        })
    });
    const lead = await leadRes.json();
    if (lead.error) throw new Error('Odoo lead: ' + JSON.stringify(lead.error));
    return lead.result;
}

// ─── Rutas ────────────────────────────────────────────────────────────────────

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', odoo: !!ODOO.url });
});

// Recibir lead del formulario web
app.post('/api/lead', async (req, res) => {
    const data = req.body;

    if (!data.nombre || !data.email) {
        return res.status(400).json({ ok: false, error: 'nombre y email son requeridos' });
    }

    // Siempre guardamos en local como respaldo
    try { saveLeadLocally(data); } catch {}
    console.log('\n[Lead] ' + data.nombre + ' <' + data.email + '>');

    // Si Odoo está configurado, enviamos allí
    if (ODOO.url && ODOO.apiKey) {
        try {
            const leadId = await createOdooLead(data);
            console.log('[Odoo] Lead creado, ID:', leadId);
            return res.json({ ok: true, leadId });
        } catch (err) {
            console.error('[Odoo] Error:', err.message);
            // No fallamos — el lead ya está guardado en leads.json
            return res.json({ ok: true, local: true, odooError: err.message });
        }
    }

    console.log('[Dev] Odoo no configurado — guardado en api/leads.json');
    res.json({ ok: true, simulated: true });
});

// ─── Arranque ─────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
    console.log('\nAkumal API proxy → http://localhost:' + PORT);
    console.log('Odoo: ' + (ODOO.url || 'no configurado (modo local)'));
    console.log('Leads guardados en: api/leads.json\n');
});
