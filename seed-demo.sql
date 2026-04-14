-- ============================================================
--  PrimeReach — Demo Data Seed
--  Import via phpMyAdmin or: mysql -u USER -p DB_NAME < seed-demo.sql
--
--  All demo accounts use password: DemoPass1!
--  Hash: $2a$10$heNN0zv5gtZ4zvoitEa.bu8OFe3LaGNwEzI3slKduYSMRdVllYpgi
-- ============================================================

-- ── Demo Users ──────────────────────────────────────────────────────────────

INSERT IGNORE INTO `users`
  (email, password_hash, type, contact_name, organization_name, phone, status)
VALUES
  ('demo-admin@primereachgov.com',
   '$2a$10$heNN0zv5gtZ4zvoitEa.bu8OFe3LaGNwEzI3slKduYSMRdVllYpgi',
   'admin', 'Alex Rivera', 'PrimeReach Platform Admin', '916-555-0100', 'active');

INSERT IGNORE INTO `users`
  (email, password_hash, type, contact_name, organization_name, phone, districts, categories, status)
VALUES
  ('apex.builders@demo.com',
   '$2a$10$heNN0zv5gtZ4zvoitEa.bu8OFe3LaGNwEzI3slKduYSMRdVllYpgi',
   'prime_contractor', 'Marcus Thompson', 'Apex Builders Group', '916-555-0201',
   '["1","4","7"]', '["Construction","Civil Engineering","Bridge Work"]', 'active'),

  ('summit.construction@demo.com',
   '$2a$10$heNN0zv5gtZ4zvoitEa.bu8OFe3LaGNwEzI3slKduYSMRdVllYpgi',
   'prime_contractor', 'Diane Park', 'Summit Construction Partners', '916-555-0202',
   '["2","3","6","10"]', '["Highway Construction","Traffic Control","Environmental"]', 'active');

INSERT IGNORE INTO `users`
  (email, password_hash, type, contact_name, business_name, phone, ein,
   certifications, certification_number, business_description,
   districts, categories, years_in_business, website, address, city, state, zip, status)
VALUES
  ('greenpath.services@demo.com',
   '$2a$10$heNN0zv5gtZ4zvoitEa.bu8OFe3LaGNwEzI3slKduYSMRdVllYpgi',
   'small_business', 'Tanya Williams', 'GreenPath Environmental Services', '510-555-0301',
   '82-1234567', 'DBE,SBE', 'DBE-2024-0041',
   'Environmental consulting, site assessment, NEPA compliance, and hazardous materials management for transportation and infrastructure projects.',
   '["4","5","6"]', '["Environmental","Consulting","Hazmat"]',
   '8', 'https://greenpathservices.demo', '400 Lake Merritt Blvd', 'Oakland', 'CA', '94610', 'active'),

  ('truenorth.electric@demo.com',
   '$2a$10$heNN0zv5gtZ4zvoitEa.bu8OFe3LaGNwEzI3slKduYSMRdVllYpgi',
   'small_business', 'James Okafor', 'TrueNorth Electrical Contractors', '213-555-0302',
   '83-2345678', 'DBE,MBE', 'DBE-2023-0187',
   'Licensed electrical contractor specializing in highway lighting, traffic signal installation, and electrical infrastructure for public works projects.',
   '["7","8","11","12"]', '["Electrical","Traffic Signals","Lighting"]',
   '12', 'https://truenorthelectric.demo', '1221 S Figueroa St', 'Los Angeles', 'CA', '90015', 'active'),

  ('blueprint.consulting@demo.com',
   '$2a$10$heNN0zv5gtZ4zvoitEa.bu8OFe3LaGNwEzI3slKduYSMRdVllYpgi',
   'small_business', 'Sofia Ramirez', 'Blueprint Engineering Consultants', '619-555-0303',
   '84-3456789', 'DBE,WBE', 'DBE-2024-0099',
   'Woman-owned civil engineering firm providing structural design, plan review, and project management support for bridge and highway construction projects.',
   '["11","12"]', '["Engineering","Structural Design","Project Management"]',
   '6', 'https://blueprintconsulting.demo', '750 B Street, Suite 400', 'San Diego', 'CA', '92101', 'active'),

  ('vanguard.landscape@demo.com',
   '$2a$10$heNN0zv5gtZ4zvoitEa.bu8OFe3LaGNwEzI3slKduYSMRdVllYpgi',
   'small_business', 'Carlos Mendez', 'Vanguard Landscape & Erosion Control', '559-555-0304',
   '85-4567890', 'SBE,DVBE', 'SBE-2023-0312',
   'Veteran-owned landscape and erosion control firm serving highway corridors. Specializes in revegetation, slope stabilization, and stormwater BMP installation.',
   '["5","6","9","10"]', '["Landscaping","Erosion Control","Environmental"]',
   '9', 'https://vanguardlandscape.demo', '2855 E Shields Ave', 'Fresno', 'CA', '93726', 'active');

-- ── Demo Opportunities ───────────────────────────────────────────────────────
-- posted_by = id of 'apex.builders@demo.com' (set to NULL if not found via subquery)

INSERT IGNORE INTO `opportunities`
  (id, title, scope_summary, district, district_name, category, category_name,
   subcategory, estimated_value, due_date, due_time, submission_method,
   status, duration, requirements, certifications, experience, posted_by)
VALUES

('DEMO-OPP-001',
 'Highway 101 Median Barrier Replacement — DBE Subcontract',
 'Seeking a DBE-certified firm to supply and install concrete median barriers along a 4.2-mile segment of US-101. Work includes demolition of existing barrier, grading, and concrete placement. Prime has 30% DBE goal.',
 '4', 'District 4', 'construction', 'Construction', 'Concrete Work',
 '$380,000 – $450,000', '2026-05-15', '5:00 PM',
 'Email to apex.builders@demo.com with subject line "HWY-101 DBE Sub Bid"',
 'published', '6 months',
 'Must hold active DBE certification. Prevailing wage compliance required. Valid contractor license (Class A or C-8).',
 'DBE',
 'Minimum 3 years concrete barrier installation on state highway projects.',
 (SELECT id FROM users WHERE email = 'apex.builders@demo.com' LIMIT 1)),

('DEMO-OPP-002',
 'Traffic Signal Upgrade — Electrical Subcontractor Needed',
 'Prime contractor seeks a certified DBE or MBE electrical subcontractor to perform traffic signal upgrades at 14 intersections. Work includes cabinet replacement, detector loops, and fiber conduit installation.',
 '7', 'District 7', 'electrical', 'Electrical', 'Traffic Signals',
 '$620,000 – $750,000', '2026-05-22', '4:00 PM',
 'Submit via platform messaging to Summit Construction Partners',
 'published', '9 months',
 'DBE or MBE certification required. Electrical Contractor License (C-10). IMSA Signal Level I certification preferred.',
 'DBE,MBE',
 'Minimum 5 years traffic signal installation. Experience with state DOT specifications required.',
 (SELECT id FROM users WHERE email = 'summit.construction@demo.com' LIMIT 1)),

('DEMO-OPP-003',
 'Slope Stabilization & Revegetation — SR-99 Corridor',
 'Subcontracting opportunity for SBE or DVBE-certified landscape and erosion control firm. Scope includes hydroseeding, erosion control blanket installation, native plant establishment, and stormwater BMP maintenance along a 6-mile stretch of SR-99.',
 '6', 'District 6', 'landscaping', 'Landscaping', 'Erosion Control',
 '$195,000 – $240,000', '2026-05-30', '3:00 PM',
 'Email bid package to summit.construction@demo.com',
 'published', '4 months',
 'SBE or DVBE certification required. C-27 Landscaping contractor license. Familiar with Standard Plans and Stormwater Quality Handbooks.',
 'SBE,DVBE',
 'Minimum 3 years revegetation and erosion control on state highway projects.',
 (SELECT id FROM users WHERE email = 'summit.construction@demo.com' LIMIT 1)),

('DEMO-OPP-004',
 'Environmental Site Assessment — Bridge Rehabilitation Project',
 'Prime contractor seeking a DBE environmental consulting firm to conduct Phase I/II environmental site assessments and prepare NEPA documentation for a bridge rehabilitation project. Deliverables include ESA reports, hazmat survey, and regulatory agency coordination.',
 '3', 'District 3', 'environmental', 'Environmental', 'Site Assessment',
 '$85,000 – $120,000', '2026-06-06', '5:00 PM',
 'Submit Statement of Qualifications through platform messaging',
 'published', '5 months',
 'DBE certification required. NEPA/CEQA documentation experience. Registered Environmental Assessor (REA) or PE license preferred.',
 'DBE',
 'Minimum 4 years performing environmental assessments on federally-funded transportation projects.',
 (SELECT id FROM users WHERE email = 'apex.builders@demo.com' LIMIT 1)),

('DEMO-OPP-005',
 'Structural Engineering Plan Review — District 11 Bridge Program',
 'Seeking a WBE or DBE-certified structural engineering firm to provide independent plan review and quality control support for six bridge replacement projects under the Local Bridge Seismic Safety Program. Work is remote/hybrid with occasional site visits.',
 '11', 'District 11', 'engineering', 'Engineering', 'Structural Design',
 '$160,000 – $210,000', '2026-06-13', '4:00 PM',
 'Email SOQ to apex.builders@demo.com — subject: "D11 Bridge Plan Review SOQ"',
 'published', '12 months',
 'WBE or DBE certification. Licensed Civil/Structural Engineer (PE). Experience with AASHTO LRFD and Bridge Design Specifications.',
 'WBE,DBE',
 'Minimum 6 years structural bridge design or plan review on state or local transportation projects.',
 (SELECT id FROM users WHERE email = 'apex.builders@demo.com' LIMIT 1)),

('DEMO-OPP-006',
 'Electrical & Lighting — I-5 HOV Lane Extension',
 'DBE/MBE electrical subcontractor needed for high-occupancy vehicle lane extension project on Interstate 5. Scope includes roadway lighting, emergency call boxes, conduit and pull box installation, and coordination with utility companies.',
 '12', 'District 12', 'electrical', 'Electrical', 'Highway Lighting',
 '$310,000 – $390,000', '2026-06-20', '5:00 PM',
 'Platform messaging — respond to this opportunity listing',
 'published', '8 months',
 'DBE or MBE certification. Electrical Contractor License (C-10). Prevailing wage and certified payroll experience.',
 'DBE,MBE',
 'Minimum 3 years roadway lighting and electrical on freeway or highway projects.',
 (SELECT id FROM users WHERE email = 'summit.construction@demo.com' LIMIT 1)),

('DEMO-OPP-007',
 'Concrete Flatwork & Curb Ramp Installation — ADA Transition Program',
 'Subcontracting opportunity for SBE or DBE concrete contractor to install ADA-compliant curb ramps, detectable warning surfaces, and sidewalk panels at 40+ locations. Work performed under a multi-year accessibility improvement contract.',
 '4', 'District 4', 'construction', 'Construction', 'ADA / Concrete',
 '$220,000 – $270,000', '2026-07-11', '3:00 PM',
 'Email bid to summit.construction@demo.com',
 'published', '10 months',
 'SBE or DBE certification. Class A or C-8 Contractor License. ADA-compliant construction experience. Prevailing wage compliance.',
 'SBE,DBE',
 'Demonstrated experience with ADA ramp and sidewalk installation on public right-of-way projects.',
 (SELECT id FROM users WHERE email = 'summit.construction@demo.com' LIMIT 1));
