insert into licenses (
  tier, billing_cycle, status,
  holder_org, holder_contact, holder_email, holder_domain,
  agency_name, department, num_districts, program_description,
  original_owner, owner_email, is_owner_held,
  monthly_rate, annual_rate, notes, activated_at
) values (
  'professional', 'annual', 'active',
  'EVOBRAND Concepts', 'Keisha Solomon', 'ks@evobrand.net', 'caltransbizconnect.org',
  'California Department of Transportation',
  'Office of Civil Rights — Small Business Development Branch',
  '12',
  'Statewide DBE/SBE/MBE supportive services platform connecting prime contractors with certified small businesses across all 12 Caltrans districts. Originally deployed under MWS & Associates subcontract IFB 88A0179.',
  'EVOBRAND Concepts', 'ks@evobrand.net', true,
  9500.00, 95000.00,
  'Original deployment. License held by EVOBRAND Concepts pending resolution of scope/payment dispute with MWS & Associates. Transfer to Caltrans contingent on settlement.',
  now()
);
