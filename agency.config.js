/**
 * ============================================================
 *  AGENCY CONFIGURATION — WHITE-LABEL ENTRY POINT
 * ============================================================
 *  This is the ONLY file that should contain agency-specific
 *  data. To rebrand this platform for a new deployment:
 *    1. Update the values in this file.
 *    2. Replace the logo image at `logoPath`.
 *    3. Update `data/districts.json` (optional — districts
 *       array here is the primary source).
 *  Do NOT hard-code agency names, colors, emails, or domain
 *  names anywhere else in the codebase.
 * ============================================================
 */

window.AGENCY = {

  // ── Identity ──────────────────────────────────────────────
  /** Full platform name shown in titles, headers, and notifications. */
  name: 'PrimeReach',
  /** Short name used in the PWA launcher and compact UI. */
  shortName: 'PrimeReach',
  /** Reverse-domain app identifier for the PWA manifest. */
  appId: 'com.primereachgov.app',
  /** Production hostname — no protocol, no trailing slash. */
  domain: 'primereachgov.com',
  /** Path to the agency logo (relative to site root). */
  logoPath: 'images/logo.png',
  /** Alternate text for the logo image. */
  logoAlt: 'PrimeReach Logo',

  // ── Brand Colors ──────────────────────────────────────────
  /**
   * These values are injected as CSS custom-property overrides at
   * runtime so they take precedence over design-system.css defaults.
   * Change them here and the entire UI rebrands automatically.
   */
  colors: {
    primary:       '#0A1628',   // deep navy
    primaryDark:   '#060e1a',
    primaryLight:  '#00B4D8',   // electric cyan (accent)
    secondary:     '#C9A84C',   // gold
    secondaryDark: '#a88838',
    secondaryLight:'#d4b86a',
    /** Theme color for browser chrome / PWA splash. */
    theme:         '#0A1628'
  },

  // ── Contact & Legal ───────────────────────────────────────
  /** Primary support / contact email. */
  supportEmail: 'info@primereachgov.com',
  /** Support phone number (E.164 format for schema.org). */
  supportPhone: '+1-800-000-0000',
  /** Legal entity name (for copyright notices and JSON-LD). */
  organizationName: 'PrimeReach',
  /** Full program name shown in footers and legal documents. */
  programName: 'Government Contracting Platform',
  /** Copyright year — set to 'auto' to always use the current year. */
  copyrightYear: 'auto',
  /** Mailing address for JSON-LD structured data. */
  address: {
    street: '',
    city:   '',
    state:  '',
    zip:    ''
  },

  // ── Storage Namespace ─────────────────────────────────────
  /**
   * Prefix for localStorage/sessionStorage keys and service-worker
   * cache names.  Must be a URL-safe identifier (no spaces).
   * Changing this will invalidate existing user sessions and caches —
   * treat like a major version bump.
   */
  storagePrefix: 'primereach',

  // ── Program Type ──────────────────────────────────────────
  /**
   * Certification program types supported by this deployment.
   * Used in eligibility copy, registration forms, and filter UI.
   * Common values: 'DBE', 'SBE', 'MBE', 'WBE', 'DVBE'
   */
  programTypes: ['DBE', 'SBE', 'MBE', 'WBE', 'DVBE'],

  // ── External Agency Links ─────────────────────────────────
  links: {
    agencyHome:       'https://primereachgov.com',
    contractingPortal: {
      url:   'https://primereachgov.com/opportunities',
      label: 'PrimeReach Opportunity Board'
    },
    civilRights:      'https://primereachgov.com/compliance',
    eventsCalendar:   'https://primereachgov.com/events',
    districtMap:      'https://primereachgov.com/districts',
    smallBizWorkforce:'https://primereachgov.com/resources',
    mentorProtege:    'https://primereachgov.com/mentor-protege'
  },

  // ── Regional / District Data ──────────────────────────────
  /**
   * Used to populate district drop-downs and filter UI.
   * Replace or extend for a different agency's regional structure.
   * The data/districts.json file mirrors this list and is used
   * by server-side code that cannot access window.AGENCY.
   *
   * Example (Caltrans deployment — 12 districts):
   */
  districts: [
    { id: '1',  name: 'District 1',  region: 'Region A' },
    { id: '2',  name: 'District 2',  region: 'Region A' },
    { id: '3',  name: 'District 3',  region: 'Region A' },
    { id: '4',  name: 'District 4',  region: 'Region B' },
    { id: '5',  name: 'District 5',  region: 'Region B' },
    { id: '6',  name: 'District 6',  region: 'Region B' },
    { id: '7',  name: 'District 7',  region: 'Region C' },
    { id: '8',  name: 'District 8',  region: 'Region C' },
    { id: '9',  name: 'District 9',  region: 'Region C' },
    { id: '10', name: 'District 10', region: 'Region D' },
    { id: '11', name: 'District 11', region: 'Region D' },
    { id: '12', name: 'District 12', region: 'Region D' }
  ]
};

// ── Runtime Injection ──────────────────────────────────────────────────────
// Runs immediately on script load (before DOMContentLoaded) so that
// subsequent scripts can rely on window.AGENCY right away.
(function applyAgencyConfig() {
  const cfg = window.AGENCY;
  if (!cfg) return;

  // 1. Inject brand-color CSS custom-property overrides.
  //    These override the defaults in design-system.css so renaming
  //    an agency only requires changing the values above.
  const styleId = 'agency-color-overrides';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = [
      ':root {',
      `  --color-primary:        ${cfg.colors.primary};`,
      `  --color-primary-dark:   ${cfg.colors.primaryDark};`,
      `  --color-primary-light:  ${cfg.colors.primaryLight};`,
      `  --color-secondary:      ${cfg.colors.secondary};`,
      `  --color-secondary-dark: ${cfg.colors.secondaryDark};`,
      `  --color-secondary-light:${cfg.colors.secondaryLight};`,
      '}'
    ].join('\n');
    // Append to <head> immediately if it exists, otherwise to <html>
    (document.head || document.documentElement).appendChild(style);
  }

  // 2. Set <meta name="theme-color"> to the configured theme color.
  //    Run after DOM is ready so the tag exists.
  function patchThemeColor() {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', cfg.colors.theme);
  }

  // 3. Patch page title: replace any occurrence of legacy platform names.
  function patchTitle() {
    if (document.title && cfg.name) {
      document.title = document.title
        .replace(/CaltransBizConnect/gi, cfg.name)
        .replace(/PrimeReach/gi, cfg.name);
    }
  }

  // 4. Swap logo src on all header/nav logos.
  function patchLogos() {
    // Match any logo image by common path patterns
    document.querySelectorAll('img[src*="logo"]').forEach(img => {
      if (img.src.includes('caltrans-logo') || img.src.includes('logo.png')) {
        img.src = cfg.logoPath;
        img.alt = cfg.logoAlt;
      }
    });
    // Also patch data-src lazy-loaded logos
    document.querySelectorAll('img[data-src*="logo"]').forEach(img => {
      img.dataset.src = cfg.logoPath;
      img.alt = cfg.logoAlt;
    });
  }

  // 5. Patch copyright year if set to 'auto'.
  function patchCopyright() {
    const year = cfg.copyrightYear === 'auto'
      ? new Date().getFullYear()
      : cfg.copyrightYear;
    document.querySelectorAll('[data-cms-copyright]').forEach(el => {
      el.textContent = `\u00A9 ${year} ${cfg.organizationName}. All rights reserved.`;
    });
    // Also update any hard-coded copyright text
    document.querySelectorAll('.footer-bottom p').forEach(el => {
      if (el.textContent.includes('California Department of Transportation') ||
          el.textContent.includes('CaltransBizConnect') ||
          el.textContent.includes('PrimeReach')) {
        if (el.textContent.includes('© ') || el.textContent.startsWith('\u00A9')) {
          el.textContent = `\u00A9 ${year} ${cfg.organizationName}. All rights reserved.`;
        }
      }
    });
  }

  // 6. Patch program name in footer.
  function patchProgramName() {
    document.querySelectorAll('[data-cms-global="site.programName"]').forEach(el => {
      el.textContent = `${cfg.name} — ${cfg.programName}`;
    });
  }

  // 7. Patch apple-mobile-web-app-title meta tag.
  function patchAppleMeta() {
    const appleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (appleMeta) appleMeta.setAttribute('content', cfg.shortName);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      patchThemeColor();
      patchTitle();
      patchLogos();
      patchCopyright();
      patchProgramName();
      patchAppleMeta();
    });
  } else {
    // Already ready (script loaded defer/async after parse)
    patchThemeColor();
    patchTitle();
    patchLogos();
    patchCopyright();
    patchProgramName();
    patchAppleMeta();
  }
}());
