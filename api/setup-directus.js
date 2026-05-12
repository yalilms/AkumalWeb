/**
 * Configura Directus automáticamente:
 *   1. Crea los campos de faq_items via schema (snapshot → diff → apply)
 *   2. Activa lectura pública
 *   3. Carga las 7 preguntas del FAQ
 *
 * Uso: node setup-directus.js
 */

const DIRECTUS = 'http://localhost:8055';
const EMAIL    = 'admin@akumal.com';
const PASSWORD = 'akumal2025';

const FAQ_ITEMS = [
    { pregunta: '¿Cuánto tiempo tarda en fabricarse mi producto?',                         respuesta: 'Los plazos estándar van de 4 a 8 semanas desde la aprobación de la muestra, dependiendo de la complejidad del formato y el volumen de producción. Te informaremos del calendario exacto en tu presupuesto personalizado.',                                                                                                                                                     orden: 1, activo: true },
    { pregunta: '¿Cuáles son los mínimos de producción?',                                  respuesta: 'El mínimo de pedido (MOQ) varía según el formato y la fórmula. Contacta con nuestro equipo para recibir un presupuesto personalizado sin compromiso adaptado a tu volumen. Trabajamos con marcas que empiezan desde pequeñas tiradas para que puedas testear el mercado sin grandes inversiones.',                                                                             orden: 2, activo: true },
    { pregunta: '¿Puedo usar mi propia fórmula o necesito la vuestra?',                    respuesta: 'Puedes traer tu propia fórmula o dejar que nuestro equipo de nutricionistas la desarrolle desde cero según tus objetivos y público objetivo. En ambos casos, la fórmula es tuya.',                                                                                                                                                                                          orden: 3, activo: true },
    { pregunta: '¿Qué certificaciones tenéis?',                                            respuesta: 'Fabricamos bajo certificación GMP (Buenas Prácticas de Manufactura) y cumplimos los estándares ISO de gestión de calidad. Nuestros procesos garantizan la trazabilidad, seguridad alimentaria y control de calidad exigidos por la normativa europea. Solicita nuestros certificados por email.',                                                                           orden: 4, activo: true },
    { pregunta: '¿Os encargáis también del diseño del packaging?',                         respuesta: 'Sí. Ofrecemos servicio integral que incluye diseño gráfico de etiquetas conforme al Reglamento UE 1169/2011, selección de envases y personalización de packaging. Nos encargamos de todo para que solo tengas que preocuparte por vender.',                                                                                                                               orden: 5, activo: true },
    { pregunta: '¿Fabricáis suplementos deportivos para el mercado internacional?',        respuesta: 'Sí. Exportamos a varios países europeos y tenemos experiencia con las normativas de etiquetado y registro en mercados de la Unión Europea, Reino Unido y LATAM. Como laboratorio OEM en España, acompañamos a nuestros clientes en su expansión internacional.',                                                                                                          orden: 6, activo: true },
    { pregunta: '¿Qué tipos de suplementos deportivos podéis fabricar bajo marca blanca?', respuesta: 'Fabricamos una amplia gama: proteínas whey (concentrate, isolate, hidrolizado), creatina, aminoácidos (BCAA, EAA), pre-entrenos, colágeno, quemadores de grasa y vitaminas deportivas. Disponibles en polvo, cápsulas, comprimidos, sticks y barritas.',                                                                                                            orden: 7, activo: true },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function req(token, method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(DIRECTUS + path, {
        method, headers,
        body: body !== undefined ? JSON.stringify(body) : undefined
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    return { status: res.status, data };
}

function log(success, label, detail) {
    if (success) console.log('  ✓ ' + label + (detail ? ' — ' + detail : ''));
    else         console.error('  ✗ ' + label + (detail ? ' — ' + detail : ''));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log('\nConectando con Directus en ' + DIRECTUS + '...\n');

    // 1. Login
    const loginRes = await req(null, 'POST', '/auth/login', { email: EMAIL, password: PASSWORD });
    const token    = loginRes.data?.data?.access_token;
    if (!token) { console.error('Login fallido. ¿Está Directus corriendo?'); process.exit(1); }
    console.log('  ✓ Login OK\n');

    // 2. Schema: snapshot → diff → apply
    console.log('Configurando campos (schema)...');

    // 2a. Snapshot actual (incluye el hash necesario)
    const snapRes = await req(token, 'GET', '/schema/snapshot');
    if (snapRes.status !== 200) { console.error('Error al obtener snapshot:', snapRes.data); process.exit(1); }
    const currentHash = snapRes.data?.data?.hash;

    // 2b. Construir esquema deseado a partir del snapshot actual + campos nuevos
    const snap     = snapRes.data.data;
    const newFields = [
        { collection: 'faq_items', field: 'pregunta',  type: 'string',  schema: { data_type: 'varchar', max_length: 500, is_nullable: false },                            meta: { interface: 'input',          required: true,  sort: 1 } },
        { collection: 'faq_items', field: 'respuesta', type: 'text',    schema: { data_type: 'text',    is_nullable: false },                                             meta: { interface: 'input-multiline', required: true,  sort: 2 } },
        { collection: 'faq_items', field: 'orden',     type: 'integer', schema: { data_type: 'integer', default_value: '1',    is_nullable: true },                      meta: { interface: 'input',          required: false, sort: 3 } },
        { collection: 'faq_items', field: 'activo',    type: 'boolean', schema: { data_type: 'boolean', default_value: 'true', is_nullable: false, is_unsigned: false }, meta: { interface: 'boolean',        required: false, sort: 4 } },
    ];
    // Solo añadir campos que aún no existen en el snapshot
    const existingFieldKeys = new Set((snap.fields || []).map(f => f.collection + '.' + f.field));
    const fieldsToAdd       = newFields.filter(f => !existingFieldKeys.has(f.collection + '.' + f.field));

    const targetSchema = {
        ...snap,
        fields:    [...(snap.fields || []), ...fieldsToAdd],
        relations: snap.relations || []
    };

    // Eliminar duplicados (si los campos ya existen en el snapshot)
    const existingFields = new Set((snapRes.data?.data?.fields || []).map(f => f.collection + '.' + f.field));
    targetSchema.fields = targetSchema.fields.filter(f => {
        const key = f.collection + '.' + f.field;
        if (existingFields.has(key)) return true; // mantener existentes
        return true; // mantener todos
    });
    // Deduplicar
    const seen = new Set();
    targetSchema.fields = targetSchema.fields.filter(f => {
        const key = f.collection + '.' + f.field;
        if (seen.has(key)) return false;
        seen.add(key); return true;
    });

    // 2c. Diff
    const diffRes = await req(token, 'POST', '/schema/diff', targetSchema);
    if (diffRes.status !== 200 && diffRes.status !== 204) {
        console.error('Error en diff:', JSON.stringify(diffRes.data)); process.exit(1);
    }
    const diff = diffRes.data?.data;

    if (!diff || (!diff.collections?.length && !diff.fields?.length && !diff.relations?.length)) {
        log(true, 'Campos ya existentes — sin cambios necesarios');
    } else {
        // 2d. Apply
        const applyRes = await req(token, 'POST', '/schema/apply', { hash: currentHash, ...diff });
        if (applyRes.status === 204 || applyRes.status === 200) {
            const n = (diff.fields || []).filter(f => f.collection === 'faq_items').length;
            log(true, 'Campos creados: pregunta, respuesta, orden, activo');
        } else {
            log(false, 'Schema apply', JSON.stringify(applyRes.data));
            process.exit(1);
        }
    }

    // 3. Permisos de lectura pública
    console.log('\nConfigurando acceso público...');

    const policiesRes = await req(token, 'GET', '/policies');
    const allPolicies = policiesRes.data?.data || [];
    // La política pública es la que no tiene admin_access y no está en ningún rol de admin
    const publicPolicy = allPolicies.find(p => !p.admin_access && (p.name.includes('public') || p.name.includes('Public') || p.name.includes('public_label') || p.name.includes('$t:public')));

    const policyId = publicPolicy?.id || allPolicies.find(p => !p.admin_access)?.id;

    if (policyId) {
        const existPerm = await req(token, 'GET', '/permissions?filter[policy][_eq]=' + policyId + '&filter[collection][_eq]=faq_items&filter[action][_eq]=read');
        if (existPerm.data?.data?.length > 0) {
            log(true, 'Permiso público ya existente');
        } else {
            const permRes = await req(token, 'POST', '/permissions', {
                policy: policyId, collection: 'faq_items', action: 'read', fields: ['*']
            });
            log(permRes.status < 300, 'Permiso lectura pública activado');
        }
    } else {
        console.warn('  ! No se encontró política pública. Actívala manualmente en Settings → Access Control → Public → faq_items → Read');
    }

    // 4. Insertar preguntas
    console.log('\nCargando preguntas del FAQ...');

    const checkRes = await req(token, 'GET', '/items/faq_items?limit=1');
    if (checkRes.status === 200 && (checkRes.data?.data?.length || 0) > 0) {
        log(true, 'Ya existen preguntas — no se sobreescriben');
    } else if (checkRes.status === 200) {
        const insertRes = await req(token, 'POST', '/items/faq_items', FAQ_ITEMS);
        if (insertRes.status < 300) {
            log(true, FAQ_ITEMS.length + ' preguntas cargadas');
        } else {
            // Una a una como fallback
            let n = 0;
            for (const item of FAQ_ITEMS) {
                const r = await req(token, 'POST', '/items/faq_items', item);
                if (r.status < 300) n++;
            }
            log(n === FAQ_ITEMS.length, n + '/' + FAQ_ITEMS.length + ' preguntas insertadas');
        }
    } else {
        console.warn('  ! /items/faq_items devolvió ' + checkRes.status + '. Puede que los campos no se hayan creado aún.');
        console.warn('    Vuelve a ejecutar el script o inserta las preguntas desde el panel.');
    }

    console.log('\n¡Hecho! Edita el FAQ en: http://localhost:8055/admin/content/faq_items\n');
}

main().catch(err => { console.error('\nError inesperado:', err); process.exit(1); });
