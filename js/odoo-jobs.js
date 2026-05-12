/**
 * OdooJobs — Integración con módulo Recruitment de Odoo
 *
 * CÓMO ACTIVAR:
 *  1. Descomenta la línea OdooJobs.init() al final del archivo.
 *  2. En equipo.html, descomenta el <script src="js/odoo-jobs.js">
 *  3. El módulo fetchea puestos publicados y reemplaza las tarjetas estáticas.
 *
 * REQUISITO en Odoo:
 *  - Módulo "Recruitment" instalado.
 *  - Puestos marcados como "Publicado en la web" (website_published = True).
 *  - CORS habilitado o proxy en mismo dominio.
 */

const OdooJobs = {

  /* ── Configuración ─────────────────────────────────────── */
  BASE_URL: 'https://www.akumalnutrition.com',
  CONTAINER_ID: 'odoo-jobs-feed',
  APPLY_BASE: '/jobs/apply',   // ruta de candidatura en el portal Odoo

  /* ── Fetch ─────────────────────────────────────────────── */
  async fetchJobs() {
    const res = await fetch(this.BASE_URL + '/web/dataset/call_kw', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        id: 1,
        params: {
          model: 'hr.job',
          method: 'search_read',
          args: [[['website_published', '=', true]]],
          kwargs: {
            fields: [
              'name',
              'no_of_recruitment',
              'description',
              'department_id',
              'address_id',
              'website_description'
            ],
            limit: 20,
            order: 'sequence asc, id desc'
          }
        }
      })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);
    return json.result || [];
  },

  /* ── Render de una tarjeta ─────────────────────────────── */
  renderCard(job) {
    const dept     = job.department_id ? job.department_id[1] : '';
    const location = job.address_id    ? job.address_id[1]    : 'España';
    const desc     = job.website_description || job.description || '';
    // Limpia HTML de Odoo a texto plano para el excerpt
    const excerpt  = desc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140);
    const applyUrl = this.BASE_URL + this.APPLY_BASE + '/' + job.id;

    return `
      <article class="job-card" data-job-id="${job.id}">
        <div class="job-card-main">
          <span class="job-card-tag">
            <span class="tag-dot"></span>
            ${job.no_of_recruitment} posición${job.no_of_recruitment !== 1 ? 'es' : ''} abierta${job.no_of_recruitment !== 1 ? 's' : ''}
          </span>
          <h3 class="job-card-title">${job.name}</h3>
          ${excerpt ? `<p class="job-card-desc">${excerpt}…</p>` : ''}
          <div class="job-card-meta">
            <span class="job-meta-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              ${location}
            </span>
            ${dept ? `<span class="job-meta-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
              Dep: ${dept}
            </span>` : ''}
          </div>
        </div>
        <div class="job-card-action">
          <a href="${applyUrl}" target="_blank" rel="noopener" class="btn-apply">
            Solicitar
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </a>
        </div>
      </article>`;
  },

  /* ── Estado vacío ──────────────────────────────────────── */
  renderEmpty() {
    return `<p class="jobs-empty">
      No hay vacantes publicadas en este momento.<br>
      <a href="contacto.html" class="link" style="color:var(--primary);margin-top:12px;display:inline-block;">
        Envíanos tu CV igualmente →
      </a>
    </p>`;
  },

  /* ── Init ──────────────────────────────────────────────── */
  async init() {
    const container = document.getElementById(this.CONTAINER_ID);
    if (!container) return;

    container.setAttribute('data-odoo-ready', 'loading');

    try {
      const jobs = await this.fetchJobs();
      container.setAttribute('data-odoo-ready', 'true');

      if (!jobs.length) {
        container.innerHTML = this.renderEmpty();
        return;
      }

      container.innerHTML = jobs.map(j => this.renderCard(j)).join('');

    } catch (err) {
      console.warn('[OdooJobs] fetch error — mostrando tarjetas estáticas.', err);
      container.setAttribute('data-odoo-ready', 'error');
      // Las tarjetas estáticas del HTML permanecen visibles.
    }
  }
};

// ── Activar cuando Odoo esté configurado ───────────────────────
// document.addEventListener('DOMContentLoaded', () => OdooJobs.init());
