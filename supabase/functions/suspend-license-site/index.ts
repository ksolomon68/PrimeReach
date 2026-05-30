import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GITHUB_TOKEN      = Deno.env.get('GITHUB_TOKEN')!;
const GITHUB_REPO       = Deno.env.get('GITHUB_REPO') || 'ksolomon68/PrimeReach';
const GITHUB_BRANCH     = Deno.env.get('GITHUB_BRANCH') || 'main';
const ENV_FILE_PATH     = '.env.production';

const GH_HEADERS = {
  'Authorization': `Bearer ${GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'PrimeReach-License-System',
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS });
  }

  if (!GITHUB_TOKEN) {
    return new Response(JSON.stringify({ error: 'GITHUB_TOKEN secret not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  try {
    const { license_id, action } = await req.json();

    if (!license_id || !['suspend', 'reactivate'].includes(action)) {
      return new Response(JSON.stringify({ error: 'license_id and action (suspend|reactivate) required' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: license, error: licErr } = await sb
      .from('licenses')
      .select('id, holder_org, holder_domain')
      .eq('id', license_id)
      .single();

    if (licErr || !license) {
      return new Response(JSON.stringify({ error: 'License not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }

    // Read current .env.production from GitHub
    const getRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${ENV_FILE_PATH}?ref=${GITHUB_BRANCH}`,
      { headers: GH_HEADERS }
    );

    if (!getRes.ok) {
      const txt = await getRes.text();
      console.error('GitHub GET failed:', txt);
      return new Response(JSON.stringify({ error: 'Failed to read .env.production from GitHub' }), {
        status: 502, headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }

    const fileData = await getRes.json();
    const currentContent = atob(fileData.content.replace(/\n/g, ''));
    const newValue = action === 'suspend' ? 'true' : 'false';
    const updatedContent = currentContent.replace(/^MAINTENANCE_MODE=.*/m, `MAINTENANCE_MODE=${newValue}`);

    if (currentContent === updatedContent) {
      return new Response(JSON.stringify({ ok: true, note: 'Already in target state — no commit needed' }), {
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }

    const commitMsg = action === 'suspend'
      ? `Suspend license: ${license.holder_org} (${license.holder_domain || license_id})`
      : `Reactivate license: ${license.holder_org} (${license.holder_domain || license_id})`;

    const putRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${ENV_FILE_PATH}`,
      {
        method: 'PUT',
        headers: { ...GH_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: commitMsg,
          content: btoa(updatedContent),
          sha: fileData.sha,
          branch: GITHUB_BRANCH,
        }),
      }
    );

    if (!putRes.ok) {
      const txt = await putRes.text();
      console.error('GitHub PUT failed:', txt);
      return new Response(JSON.stringify({ error: 'Failed to commit .env.production to GitHub' }), {
        status: 502, headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }

    return new Response(JSON.stringify({ ok: true, action, org: license.holder_org }), {
      headers: { 'Content-Type': 'application/json', ...CORS },
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS } });
  }
});
