/**
 * PrimeReach — Demo Data Seed Script
 * ====================================
 * Creates realistic demo users and opportunities for showcasing the platform.
 * Safe to run multiple times — uses INSERT IGNORE to skip existing records.
 *
 * Usage:  node seed-demo.js
 *
 * Demo credentials (all passwords: DemoPass1!)
 * ─────────────────────────────────────────────
 *  Admin:          demo-admin@primereachgov.com
 *  Prime #1:       apex.builders@demo.com
 *  Prime #2:       summit.construction@demo.com
 *  Small Biz #1:   greenpath.services@demo.com
 *  Small Biz #2:   truenorth.electric@demo.com
 *  Small Biz #3:   blueprint.consulting@demo.com
 *  Small Biz #4:   vanguard.landscape@demo.com
 */

const mysql  = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path   = require('path');
const { randomUUID: uuidv4 } = require('crypto');

dotenv.config({ path: path.join(__dirname, '.env') });

const DEMO_PASSWORD = 'DemoPass1!';

// ── Demo Users ────────────────────────────────────────────────────────────────
const DEMO_USERS = [
  {
    email:        'demo-admin@primereachgov.com',
    type:         'admin',
    contact_name: 'Alex Rivera',
    organization_name: 'PrimeReach Platform Admin',
    phone:        '916-555-0100',
    status:       'active'
  },
  {
    email:        'apex.builders@demo.com',
    type:         'prime_contractor',
    contact_name: 'Marcus Thompson',
    organization_name: 'Apex Builders Group',
    phone:        '916-555-0201',
    districts:    JSON.stringify(['1','4','7']),
    categories:   JSON.stringify(['Construction','Civil Engineering','Bridge Work']),
    status:       'active'
  },
  {
    email:        'summit.construction@demo.com',
    type:         'prime_contractor',
    contact_name: 'Diane Park',
    organization_name: 'Summit Construction Partners',
    phone:        '916-555-0202',
    districts:    JSON.stringify(['2','3','6','10']),
    categories:   JSON.stringify(['Highway Construction','Traffic Control','Environmental']),
    status:       'active'
  },
  {
    email:        'greenpath.services@demo.com',
    type:         'small_business',
    contact_name: 'Tanya Williams',
    business_name:'GreenPath Environmental Services',
    phone:        '510-555-0301',
    ein:          '82-1234567',
    certifications: 'DBE,SBE',
    certification_number: 'DBE-2024-0041',
    business_description: 'Environmental consulting, site assessment, NEPA compliance, and hazardous materials management for transportation and infrastructure projects.',
    districts:    JSON.stringify(['4','5','6']),
    categories:   JSON.stringify(['Environmental','Consulting','Hazmat']),
    years_in_business: '8',
    website:      'https://greenpathservices.demo',
    address:      '400 Lake Merritt Blvd',
    city:         'Oakland',
    state:        'CA',
    zip:          '94610',
    status:       'active'
  },
  {
    email:        'truenorth.electric@demo.com',
    type:         'small_business',
    contact_name: 'James Okafor',
    business_name:'TrueNorth Electrical Contractors',
    phone:        '213-555-0302',
    ein:          '83-2345678',
    certifications: 'DBE,MBE',
    certification_number: 'DBE-2023-0187',
    business_description: 'Licensed electrical contractor specializing in highway lighting, traffic signal installation, and electrical infrastructure for public works projects.',
    districts:    JSON.stringify(['7','8','11','12']),
    categories:   JSON.stringify(['Electrical','Traffic Signals','Lighting']),
    years_in_business: '12',
    website:      'https://truenorthelectric.demo',
    address:      '1221 S Figueroa St',
    city:         'Los Angeles',
    state:        'CA',
    zip:          '90015',
    status:       'active'
  },
  {
    email:        'blueprint.consulting@demo.com',
    type:         'small_business',
    contact_name: 'Sofia Ramirez',
    business_name:'Blueprint Engineering Consultants',
    phone:        '619-555-0303',
    ein:          '84-3456789',
    certifications: 'DBE,WBE',
    certification_number: 'DBE-2024-0099',
    business_description: 'Woman-owned civil engineering firm providing structural design, plan review, and project management support for bridge and highway construction projects.',
    districts:    JSON.stringify(['11','12']),
    categories:   JSON.stringify(['Engineering','Structural Design','Project Management']),
    years_in_business: '6',
    website:      'https://blueprintconsulting.demo',
    address:      '750 B Street, Suite 400',
    city:         'San Diego',
    state:        'CA',
    zip:          '92101',
    status:       'active'
  },
  {
    email:        'vanguard.landscape@demo.com',
    type:         'small_business',
    contact_name: 'Carlos Mendez',
    business_name:'Vanguard Landscape & Erosion Control',
    phone:        '559-555-0304',
    ein:          '85-4567890',
    certifications: 'SBE,DVB',
    certification_number: 'SBE-2023-0312',
    business_description: 'Veteran-owned landscape and erosion control firm serving highway corridors. Specializes in revegetation, slope stabilization, and stormwater BMP installation.',
    districts:    JSON.stringify(['5','6','9','10']),
    categories:   JSON.stringify(['Landscaping','Erosion Control','Environmental']),
    years_in_business: '9',
    website:      'https://vanguardlandscape.demo',
    address:      '2855 E Shields Ave',
    city:         'Fresno',
    state:        'CA',
    zip:          '93726',
    status:       'active'
  }
];

// ── Demo Opportunities ────────────────────────────────────────────────────────
const DEMO_OPPORTUNITIES = [
  {
    title:             'Highway 101 Median Barrier Replacement — DBE Subcontract',
    scope_summary:     'Seeking a DBE-certified firm to supply and install concrete median barriers along a 4.2-mile segment of US-101. Work includes demolition of existing barrier, grading, and concrete placement. Prime has 30% DBE goal.',
    district:          '4',
    district_name:     'District 4',
    category:          'construction',
    category_name:     'Construction',
    subcategory:       'Concrete Work',
    estimated_value:   '$380,000 – $450,000',
    due_date:          '2026-05-15',
    due_time:          '5:00 PM',
    submission_method: 'Email to apex.builders@demo.com with subject line "HWY-101 DBE Sub Bid"',
    status:            'published',
    duration:          '6 months',
    requirements:      'Must hold active DBE certification. Prevailing wage compliance required. Valid CA contractor license (Class A or C-8).',
    certifications:    'DBE',
    experience:        'Minimum 3 years concrete barrier installation on state highway projects.'
  },
  {
    title:             'Traffic Signal Upgrade — Electrical Subcontractor Needed',
    scope_summary:     'Prime contractor seeks a certified DBE or MBE electrical subcontractor to perform traffic signal upgrades at 14 intersections in the Los Angeles metro area. Work includes cabinet replacement, detector loops, and fiber conduit installation.',
    district:          '7',
    district_name:     'District 7',
    category:          'electrical',
    category_name:     'Electrical',
    subcategory:       'Traffic Signals',
    estimated_value:   '$620,000 – $750,000',
    due_date:          '2026-05-22',
    due_time:          '4:00 PM',
    submission_method: 'Submit via platform messaging to Summit Construction Partners',
    status:            'published',
    duration:          '9 months',
    requirements:      'DBE or MBE certification required. CA Electrical Contractor License (C-10). IMSA Signal Level I certification preferred.',
    certifications:    'DBE,MBE',
    experience:        'Minimum 5 years traffic signal installation. Experience with LADOT and/or state DOT specifications required.'
  },
  {
    title:             'Slope Stabilization & Revegetation — SR-99 Corridor',
    scope_summary:     'Subcontracting opportunity for SBE or DVB-certified landscape and erosion control firm. Scope includes hydroseeding, erosion control blanket installation, native plant establishment, and stormwater BMP maintenance along a 6-mile stretch of SR-99.',
    district:          '6',
    district_name:     'District 6',
    category:          'landscaping',
    category_name:     'Landscaping',
    subcategory:       'Erosion Control',
    estimated_value:   '$195,000 – $240,000',
    due_date:          '2026-05-30',
    due_time:          '3:00 PM',
    submission_method: 'Email bid package to summit.construction@demo.com',
    status:            'published',
    duration:          '4 months',
    requirements:      'SBE or DVBE certification required. CA C-27 Landscaping contractor license. Familiar with Caltrans Standard Plans and Stormwater Quality Handbooks.',
    certifications:    'SBE,DVBE',
    experience:        'Minimum 3 years revegetation and erosion control on state highway projects.'
  },
  {
    title:             'Environmental Site Assessment — Bridge Rehabilitation Project',
    scope_summary:     'Prime contractor seeking a DBE environmental consulting firm to conduct Phase I/II environmental site assessments and prepare NEPA documentation for a bridge rehabilitation project over the American River. Deliverables include ESA reports, hazmat survey, and regulatory agency coordination.',
    district:          '3',
    district_name:     'District 3',
    category:          'environmental',
    category_name:     'Environmental',
    subcategory:       'Site Assessment',
    estimated_value:   '$85,000 – $120,000',
    due_date:          '2026-06-06',
    due_time:          '5:00 PM',
    submission_method: 'Submit Statement of Qualifications through platform messaging',
    status:            'published',
    duration:          '5 months',
    requirements:      'DBE certification required. NEPA/CEQA documentation experience. Registered Environmental Assessor (REA) or PE license preferred.',
    certifications:    'DBE',
    experience:        'Minimum 4 years performing environmental assessments on federally-funded transportation projects.'
  },
  {
    title:             'Structural Engineering Plan Review — District 11 Bridge Program',
    scope_summary:     'Seeking a WBE or DBE-certified structural engineering firm to provide independent plan review and quality control support for six bridge replacement projects under the Local Bridge Seismic Safety Program. Work is remote/hybrid with occasional site visits.',
    district:          '11',
    district_name:     'District 11',
    category:          'engineering',
    category_name:     'Engineering',
    subcategory:       'Structural Design',
    estimated_value:   '$160,000 – $210,000',
    due_date:          '2026-06-13',
    due_time:          '4:00 PM',
    submission_method: 'Email SOQ to apex.builders@demo.com — subject: "D11 Bridge Plan Review SOQ"',
    status:            'published',
    duration:          '12 months',
    requirements:      'WBE or DBE certification. Licensed Civil/Structural Engineer (PE) in California. Experience with AASHTO LRFD and Caltrans Bridge Design Specifications.',
    certifications:    'WBE,DBE',
    experience:        'Minimum 6 years structural bridge design or plan review on state or local transportation projects.'
  },
  {
    title:             'Electrical & Lighting — I-5 HOV Lane Extension',
    scope_summary:     'DBE/MBE electrical subcontractor needed for high-occupancy vehicle lane extension project on Interstate 5. Scope includes roadway lighting, emergency call boxes, conduit and pull box installation, and coordination with utility companies.',
    district:          '12',
    district_name:     'District 12',
    category:          'electrical',
    category_name:     'Electrical',
    subcategory:       'Highway Lighting',
    estimated_value:   '$310,000 – $390,000',
    due_date:          '2026-06-20',
    due_time:          '5:00 PM',
    submission_method: 'Platform messaging — respond to this opportunity listing',
    status:            'published',
    duration:          '8 months',
    requirements:      'DBE or MBE certification. CA Electrical Contractor License (C-10). Prevailing wage and certified payroll experience.',
    certifications:    'DBE,MBE',
    experience:        'Minimum 3 years roadway lighting and electrical on freeway or highway projects.'
  },
  {
    title:             'Concrete Flatwork & Curb Ramp Installation — ADA Transition Program',
    scope_summary:     'Subcontracting opportunity for SBE or DBE concrete contractor to install ADA-compliant curb ramps, detectable warning surfaces, and sidewalk panels at 40+ locations across the Bay Area district. Work performed under a multi-year accessibility improvement contract.',
    district:          '4',
    district_name:     'District 4',
    category:          'construction',
    category_name:     'Construction',
    subcategory:       'ADA / Concrete',
    estimated_value:   '$220,000 – $270,000',
    due_date:          '2026-07-11',
    due_time:          '3:00 PM',
    submission_method: 'Email bid to summit.construction@demo.com',
    status:            'published',
    duration:          '10 months',
    requirements:      'SBE or DBE certification. Class A or C-8 Contractor License. ADA-compliant construction experience. Prevailing wage compliance.',
    certifications:    'SBE,DBE',
    experience:        'Demonstrated experience with ADA ramp and sidewalk installation on public right-of-way projects.'
  }
];

// ── Seed Function ─────────────────────────────────────────────────────────────
async function seed() {
  console.log('\n🌱 PrimeReach Demo Seed — Starting...\n');

  const db = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  // ── Users ──────────────────────────────────────────────────────────────────
  console.log('── Seeding demo users...');
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  let primeId = null;

  for (const u of DEMO_USERS) {
    try {
      const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [u.email]);
      if (existing.length > 0) {
        console.log(`  ⏭  ${u.email} already exists — skipping`);
        if (u.type === 'prime_contractor' && !primeId) primeId = existing[0].id;
        continue;
      }

      const [result] = await db.execute(
        `INSERT INTO users
          (email, password_hash, type, business_name, contact_name, organization_name,
           phone, ein, certifications, certification_number, business_description,
           districts, categories, years_in_business, website, address, city, state, zip, status)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          u.email, hash, u.type,
          u.business_name        || null,
          u.contact_name         || null,
          u.organization_name    || null,
          u.phone                || null,
          u.ein                  || null,
          u.certifications       || null,
          u.certification_number || null,
          u.business_description || null,
          u.districts            || null,
          u.categories           || null,
          u.years_in_business    || null,
          u.website              || null,
          u.address              || null,
          u.city                 || null,
          u.state                || null,
          u.zip                  || null,
          u.status
        ]
      );
      if (u.type === 'prime_contractor' && !primeId) primeId = result.insertId;
      console.log(`  ✅  Created: ${u.email} (${u.type})`);
    } catch (e) {
      console.error(`  ❌  Error seeding ${u.email}:`, e.message);
    }
  }

  // ── Opportunities ──────────────────────────────────────────────────────────
  console.log('\n── Seeding demo opportunities...');
  for (const opp of DEMO_OPPORTUNITIES) {
    try {
      const id = 'DEMO-' + uuidv4().split('-')[0].toUpperCase();
      await db.execute(
        `INSERT INTO opportunities
          (id, title, scope_summary, district, district_name, category, category_name,
           subcategory, estimated_value, due_date, due_time, submission_method,
           status, duration, requirements, certifications, experience, posted_by)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          id, opp.title, opp.scope_summary, opp.district, opp.district_name,
          opp.category, opp.category_name, opp.subcategory || null,
          opp.estimated_value || null, opp.due_date || null, opp.due_time || null,
          opp.submission_method || null, opp.status,
          opp.duration || null, opp.requirements || null,
          opp.certifications || null, opp.experience || null,
          primeId || null
        ]
      );
      console.log(`  ✅  Created: ${opp.title.substring(0, 55)}…`);
    } catch (e) {
      console.error(`  ❌  Error seeding opportunity "${opp.title}":`, e.message);
    }
  }

  await db.end();

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Demo seed complete!

Demo credentials (password for all: DemoPass1!)
  Admin:     demo-admin@primereachgov.com
  Prime #1:  apex.builders@demo.com
  Prime #2:  summit.construction@demo.com
  SB #1:     greenpath.services@demo.com
  SB #2:     truenorth.electric@demo.com
  SB #3:     blueprint.consulting@demo.com
  SB #4:     vanguard.landscape@demo.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
