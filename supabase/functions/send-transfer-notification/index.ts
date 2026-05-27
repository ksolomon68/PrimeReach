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

    const subject = `License Transfer Request — ${record.from_org} → ${record.to_org}`;

    const htmlBody = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0A1628;color:#F0EEE8;border-radius:12px;overflow:hidden">
        <div style="background:#0D1F38;padding:24px 32px;border-bottom:1px solid rgba(201,168,76,0.2)">
          <h1 style="font-size:20px;margin:0;color:#C9A84C">License Transfer Request</h1>
          <p style="margin:4px 0 0;color:rgba(240,238,232,0.6);font-size:14px">Authorization required — admin action needed</p>
        </div>
        <div style="padding:32px">
          <div style="background:rgba(201,168,76,0.07);border:1px solid rgba(201,168,76,0.2);border-radius:8px;padding:16px 20px;margin-bottom:24px">
            <div style="display:flex;align-items:center;gap:12px">
              <div style="text-align:center">
                <div style="font-size:13px;color:rgba(240,238,232,0.5);margin-bottom:4px">FROM</div>
                <div style="font-weight:700;color:#F0EEE8">${record.from_org}</div>
                <div style="font-size:12px;color:#C9A84C">${record.from_email}</div>
              </div>
              <div style="flex:1;text-align:center;color:#C9A84C;font-size:20px">→</div>
              <div style="text-align:center">
                <div style="font-size:13px;color:rgba(240,238,232,0.5);margin-bottom:4px">TO</div>
                <div style="font-weight:700;color:#F0EEE8">${record.to_org}</div>
                <div style="font-size:12px;color:#C9A84C">${record.to_email}</div>
              </div>
            </div>
          </div>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:rgba(240,238,232,0.6);font-size:13px;width:40%">Transfer Reason</td><td style="padding:8px 0">${record.transfer_reason || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:rgba(240,238,232,0.6);font-size:13px">Admin Notes</td><td style="padding:8px 0">${record.admin_notes || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:rgba(240,238,232,0.6);font-size:13px">Status</td><td style="padding:8px 0;color:#F5A623;font-weight:700">${record.status}</td></tr>
            <tr><td style="padding:8px 0;color:rgba(240,238,232,0.6);font-size:13px">Submitted</td><td style="padding:8px 0">${new Date(record.created_at).toLocaleString()}</td></tr>
          </table>
          <div style="margin-top:28px;text-align:center">
            <a href="${ADMIN_DASHBOARD_URL}" style="display:inline-block;background:#C9A84C;color:#0A1628;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">Review Transfer in Dashboard</a>
          </div>
          <p style="margin-top:20px;font-size:13px;color:rgba(240,238,232,0.4);text-align:center">This transfer requires your manual authorization before it is processed. No license has been modified.</p>
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
