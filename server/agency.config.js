/**
 * ============================================================
 *  SERVER-SIDE AGENCY CONFIGURATION — CommonJS Mirror
 * ============================================================
 *  This file mirrors agency.config.js (root) for use by the
 *  Node.js server (CORS origins, log prefix, manifest endpoint).
 *  Keep it in sync with the client-side config.
 * ============================================================
 */

module.exports = {
  // ── Identity ────────────────────────────────────────────
  name:        'PrimeReach',
  shortName:   'PrimeReach',
  appId:       'com.primereachgov.app',
  /** Production hostname — no protocol, no trailing slash. */
  domain:      'primereachgov.com',
  logoPath:    'images/logo-light.png',
  description: 'Connecting prime contractors with qualified small and disadvantaged businesses.',

  // ── Brand Colors ────────────────────────────────────────
  themeColor:      '#0A1628',
  backgroundColor: '#ffffff',

  // ── Contact & Legal ─────────────────────────────────────
  supportEmail:     'info@primereachgov.com',
  supportPhone:     '+1-800-000-0000',
  organizationName: 'PrimeReach',
  programName:      'Government Contracting Platform',
  address: {
    street: '',
    city:   '',
    state:  '',
    zip:    ''
  },

  // ── Storage Namespace ────────────────────────────────────
  storagePrefix: 'primereach',

  // ── Program Type ─────────────────────────────────────────
  programTypes: ['DBE', 'SBE', 'MBE', 'WBE', 'DVBE'],

  // ── Regional / District Data ─────────────────────────────
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
