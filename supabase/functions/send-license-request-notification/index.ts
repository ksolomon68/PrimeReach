import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const ADMIN_EMAIL = 'ks@evobrand.net';
const ADMIN_DASHBOARD_URL = 'https://primereachgov.com/admin/licenses.html';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const payload = await req.json();
    const record = payload.record;
    if (!record) return new Response('No record', { status: 400 });

    const tierLabels: Record<string, string> = {
      starter: 'Starter — $4,500/mo',
      professional: 'Professional — $9,500/mo',
      enterprise: 'Enterprise — Custom Pricing',
    };

    const subject = `New PrimeReach License Request — ${record.agency_name} (${record.tier})`;

    const htmlBody = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0A1628;color:#F0EEE8;border-radius:12px;overflow:hidden">
        <div style="background:#0D1F38;padding:24px 32px;border-bottom:1px solid rgba(0,212,170,0.15)">
          <h1 style="font-size:20px;margin:0;color:#00D4AA">PrimeReach License Request</h1>
          <p style="margin:4px 0 0;color:rgba(240,238,232,0.6);font-size:14px">New request received — action required</p>
        </div>
        <div style="padding:32px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:rgba(240,238,232,0.6);font-size:13px;width:40%">Agency</td><td style="padding:8px 0;font-weight:600">${record.agency_name}</td></tr>
            <tr><td style="padding:8px 0;color:rgba(240,238,232,0.6);font-size:13px">Department</td><td style="padding:8px 0">${record.department || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:rgba(240,238,232,0.6);font-size:13px">Contact</td><td style="padding:8px 0">${record.contact_name} — ${record.contact_title || ''}</td></tr>
            <tr><td style="padding:8px 0;color:rgba(240,238,232,0.6);font-size:13px">Email</td><td style="padding:8px 0"><a href="mailto:${record.contact_email}" style="color:#00D4AA">${record.contact_email}</a></td></tr>
            <tr><td style="padding:8px 0;color:rgba(240,238,232,0.6);font-size:13px">Phone</td><td style="padding:8px 0">${record.contact_phone || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:rgba(240,238,232,0.6);font-size:13px">Tier</td><td style="padding:8px 0;color:#00D4AA;font-weight:700">${tierLabels[record.tier] || record.tier}</td></tr>
            <tr><td style="padding:8px 0;color:rgba(240,238,232,0.6);font-size:13px">Billing</td><td style="padding:8px 0">${record.billing_pref || 'monthly'}</td></tr>
            <tr><td style="padding:8px 0;color:rgba(240,238,232,0.6);font-size:13px">Districts</td><td style="padding:8px 0">${record.num_districts || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:rgba(240,238,232,0.6);font-size:13px">Launch Date</td><td style="padding:8px 0">${record.launch_date || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:rgba(240,238,232,0.6);font-size:13px">Domain</td><td style="padding:8px 0">${record.custom_domain || '—'}</td></tr>
            <tr><td colspan="2" style="padding:12px 0 4px;color:rgba(240,238,232,0.6);font-size:13px">Program Description</td></tr>
            <tr><td colspan="2" style="padding:0 0 8px;font-size:14px;line-height:1.6">${record.program_description || '—'}</td></tr>
          </table>
          <div style="margin-top:28px;text-align:center">
            <a href="${ADMIN_DASHBOARD_URL}" style="display:inline-block;background:#00D4AA;color:#0A1628;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">Review in Admin Dashboard</a>
          </div>
        </div>
        <div style="padding:16px 32px;background:#0D1F38;text-align:center;font-size:12px;color:rgba(240,238,232,0.35)">
          PrimeReach License System · EVOBRAND Concepts · ks@evobrand.net
        </div>
      </div>
    `;

    if (RESEND_API_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'PrimeReach Licensing <noreply@primereachgov.com>',
          to: [ADMIN_EMAIL],
          subject,
          html: htmlBody,
        }),
      });
      const result = await res.json();
      return new Response(JSON.stringify({ ok: true, result }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, note: 'RESEND_API_KEY not set — email skipped' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
