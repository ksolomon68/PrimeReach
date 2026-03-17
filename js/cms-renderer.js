/**
 * CMS Renderer — CaltransBizConnect
 *
 * Fetches page content and global settings from /api/cms and hydrates
 * data-cms-field attributes in the DOM. Must be included after all other
 * page scripts so the DOM is fully parsed.
 *
 * Usage on a page:
 *   1. Add  data-cms-page="slug"  to  <body>
 *   2. Add  data-cms-field="section-id.fieldKey"  to editable elements
 *   3. Include this script last: <script src="js/cms-renderer.js"></script>
 *
 * Field path conventions
 *   "hero.title"             → sections[id=hero].fields.title
 *   "meta.title"             → meta.title
 *   "header.backgroundImage" → header.backgroundImage
 *   "global.site.name"       → global config key path
 *
 * Special data attributes on elements:
 *   data-cms-type="text"     → sets element's textContent (default)
 *   data-cms-type="html"     → sets element's innerHTML
 *   data-cms-type="src"      → sets element's src attribute (img)
 *   data-cms-type="href"     → sets element's href attribute (a)
 *   data-cms-type="alt"      → sets element's alt attribute (img)
 *   data-cms-type="bg"       → sets element's style.backgroundImage
 *   data-cms-type="iframe-src" → sets element's src on iframe
 *
 * @module cms-renderer
 */

(function () {
    'use strict';

    const API = (window.APP_CONFIG && window.APP_CONFIG.API_URL) || '/api';

    // ── Main entry ──────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', async function () {
        const slug = document.body.getAttribute('data-cms-page');
        if (!slug) return; // Page not opted into CMS

        try {
            const [pageData, globalData] = await Promise.all([
                fetchJson(`${API}/cms/pages/${slug}`),
                fetchJson(`${API}/cms/global`)
            ]);

            if (pageData)   hydratePage(pageData, globalData);
            if (globalData) hydrateGlobal(globalData);

        } catch (err) {
            console.warn('[CMS Renderer] Failed to load CMS content:', err.message);
        }
    });

    // ── Page hydration ───────────────────────────────────────────────────────
    /**
     * Walk every [data-cms-field] element and replace its content.
     * @param {object} pageData
     * @param {object|null} globalData
     */
    function hydratePage(pageData, globalData) {
        // Build a flat lookup: section-id → fields object
        const sectionMap = {};
        if (Array.isArray(pageData.sections)) {
            pageData.sections.forEach(s => {
                sectionMap[s.id] = s.fields || {};
            });
        }

        document.querySelectorAll('[data-cms-field]').forEach(el => {
            const fieldPath = el.getAttribute('data-cms-field');
            const cmsType   = el.getAttribute('data-cms-type') || 'text';

            // Resolve the value from fieldPath
            let value = resolvePath(fieldPath, pageData, sectionMap, globalData);
            if (value === null || value === undefined || value === '') return;

            applyValue(el, cmsType, value);
        });

        // Update <title> and <meta name="description">
        if (pageData.meta) {
            if (pageData.meta.title) document.title = pageData.meta.title;
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc && pageData.meta.description) {
                metaDesc.setAttribute('content', pageData.meta.description);
            }
        }

        // Header background image
        if (pageData.header && pageData.header.backgroundImage) {
            const heroEl = document.querySelector('.hero, .hero-inner');
            if (heroEl) {
                heroEl.style.backgroundImage = `url('${pageData.header.backgroundImage}')`;
                heroEl.style.backgroundSize  = 'cover';
                heroEl.style.backgroundPosition = 'center';
            }
        }

        // Logo swap (if page-specific logo set)
        if (pageData.header && pageData.header.logoImage) {
            const logoImg = document.querySelector('.site-logo img');
            if (logoImg) {
                logoImg.src = pageData.header.logoImage;
                if (pageData.header.logoAlt) logoImg.alt = pageData.header.logoAlt;
            }
        }
    }

    // ── Global hydration (footer, nav, external links) ───────────────────────
    /**
     * Hydrate footer columns and nav items from global.json.
     * Elements should carry data-cms-global="path.to.key".
     * @param {object} globalData
     */
    function hydrateGlobal(globalData) {
        document.querySelectorAll('[data-cms-global]').forEach(el => {
            const path    = el.getAttribute('data-cms-global');
            const cmsType = el.getAttribute('data-cms-type') || 'text';
            const value   = getNestedValue(globalData, path.split('.'));
            if (value !== null && value !== undefined && value !== '') {
                applyValue(el, cmsType, value);
            }
        });

        // Auto-update footer external links from global.externalPortals
        if (globalData.externalPortals) {
            document.querySelectorAll('[data-cms-portal]').forEach(el => {
                const key = el.getAttribute('data-cms-portal');
                const url = globalData.externalPortals[key];
                if (url && el.tagName === 'A') el.href = url;
            });
        }

        // Auto-update Smartsheet form links
        if (globalData.smartsheetForms) {
            document.querySelectorAll('[data-cms-smartsheet]').forEach(el => {
                const key = el.getAttribute('data-cms-smartsheet');
                const url = globalData.smartsheetForms[key];
                if (url && el.tagName === 'A') el.href = url;
            });
        }

        // Contact email
        if (globalData.site && globalData.site.contactEmail) {
            document.querySelectorAll('a[href^="mailto:SBEss"]').forEach(el => {
                el.href        = `mailto:${globalData.site.contactEmail}`;
                if (el.textContent.includes('@')) el.textContent = globalData.site.contactEmail;
            });
        }

        // Copyright
        if (globalData.site && globalData.site.copyrightText) {
            document.querySelectorAll('[data-cms-copyright]').forEach(el => {
                el.textContent = globalData.site.copyrightText;
            });
        }

        // Navigation active state sync
        if (globalData.navigation && Array.isArray(globalData.navigation.items)) {
            syncNavActiveState(globalData.navigation.items);
        }
    }

    // ── Path resolution ──────────────────────────────────────────────────────
    /**
     * Resolve a dotted field path like "hero.title" or "meta.description".
     * @param {string}      fieldPath
     * @param {object}      pageData
     * @param {object}      sectionMap   id → fields
     * @param {object|null} globalData
     * @returns {*}
     */
    function resolvePath(fieldPath, pageData, sectionMap, globalData) {
        const parts = fieldPath.split('.');

        // meta.xxx
        if (parts[0] === 'meta' && pageData.meta) {
            return getNestedValue(pageData.meta, parts.slice(1));
        }

        // header.xxx
        if (parts[0] === 'header' && pageData.header) {
            return getNestedValue(pageData.header, parts.slice(1));
        }

        // global.xxx
        if (parts[0] === 'global' && globalData) {
            return getNestedValue(globalData, parts.slice(1));
        }

        // section-id.field or section-id.subfield.deeper
        const [sectionId, ...fieldParts] = parts;
        const fields = sectionMap[sectionId];
        if (!fields) return null;
        return getNestedValue(fields, fieldParts);
    }

    /**
     * Walk a nested object by an array of keys.
     * @param {object}   obj
     * @param {string[]} keys
     * @returns {*}
     */
    function getNestedValue(obj, keys) {
        let cur = obj;
        for (const k of keys) {
            if (cur == null || typeof cur !== 'object') return null;
            cur = cur[k];
        }
        return cur ?? null;
    }

    // ── DOM application ──────────────────────────────────────────────────────
    /**
     * Apply a CMS value to a DOM element based on its cmsType.
     * @param {Element} el
     * @param {string}  cmsType
     * @param {*}       value
     */
    function applyValue(el, cmsType, value) {
        if (typeof value !== 'string' && typeof value !== 'number') return;
        const str = String(value);

        switch (cmsType) {
            case 'html':      el.innerHTML = str; break;
            case 'src':       el.src       = str; break;
            case 'href':      el.href      = str; break;
            case 'alt':       el.alt       = str; break;
            case 'bg':
                el.style.backgroundImage    = `url('${str}')`;
                el.style.backgroundSize     = 'cover';
                el.style.backgroundPosition = 'center';
                break;
            case 'iframe-src': el.src = str; break;
            case 'text':
            default:          el.textContent = str; break;
        }
    }

    // ── Nav active state ─────────────────────────────────────────────────────
    /**
     * Mark the nav link matching the current page as active.
     * Hides nav items whose active flag is false in global config.
     * @param {Array<{href:string, label:string, active:boolean}>} items
     */
    function syncNavActiveState(items) {
        const currentFile = window.location.pathname.split('/').pop() || 'index.html';

        items.forEach(item => {
            const navLink = document.querySelector(`.main-nav a[href="${item.href}"]`);
            if (!navLink) return;

            // Show/hide based on active flag
            const li = navLink.closest('li');
            if (li) li.style.display = item.active ? '' : 'none';

            // Set aria-current on matching page
            const linkFile = item.href.split('/').pop();
            if (linkFile === currentFile) {
                navLink.setAttribute('aria-current', 'page');
                navLink.classList.add('active');
            }

            // Sync label text
            if (item.label) navLink.textContent = item.label;
            // Restore login button style if needed
            if (item.href === 'login.html') {
                navLink.className = 'btn btn-secondary btn-small';
            }
        });
    }

    // ── Fetch helper ─────────────────────────────────────────────────────────
    /**
     * @param {string} url
     * @returns {Promise<object|null>}
     */
    async function fetchJson(url) {
        const res = await fetch(url);
        if (!res.ok) return null;
        return res.json();
    }

}());
