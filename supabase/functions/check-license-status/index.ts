import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: CORS });
  }

  const domain = new URL(req.url).searchParams.get('domain')?.toLowerCase().trim();
  if (!domain) {
    return new Response(JSON.stringify({ error: 'domain parameter required' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data, error } = await sb
    .from('licenses')
    .select('status, tier, holder_org, agency_name')
    .eq('holder_domain', domain)
    .maybeSingle();

  if (error) {
    console.error(error);
    return new Response(JSON.stringify({ active: false, status: 'error' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  if (!data) {
    return new Response(JSON.stringify({ active: false, status: 'not_found' }), {
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  return new Response(JSON.stringify({
    active: data.status === 'active',
    status: data.status,
    tier: data.tier,
    org: data.holder_org || data.agency_name,
  }), {
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
});
