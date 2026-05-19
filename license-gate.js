(function () {
  const ENDPOINT = 'https://dwpmujyycpgibpsculfd.supabase.co/functions/v1/check-license-status';
  const CACHE_KEY = 'pr_license_status';
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  function showLockout(status) {
    const reason = status === 'suspended'
      ? 'This license has been suspended due to a billing issue.'
      : status === 'not_found'
      ? 'No active PrimeReach license was found for this domain.'
      : 'This PrimeReach license is no longer active.';

    document.documentElement.style.overflow = 'hidden';
    const el = document.createElement('div');
    el.id = 'pr-lockout';
    el.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:999999',
      'display:flex', 'align-items:center', 'justify-content:center',
      'background:#0A1628', 'font-family:sans-serif',
    ].join(';');
    el.innerHTML = `
      <div style="max-width:480px;text-align:center;padding:40px 32px">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="1.5" style="margin-bottom:20px">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h1 style="color:#F0EEE8;font-size:22px;margin:0 0 12px">License Inactive</h1>
        <p style="color:rgba(240,238,232,0.6);font-size:15px;line-height:1.6;margin:0 0 28px">${reason}</p>
        <a href="mailto:ks@evobrand.net?subject=License%20Reactivation%20Request&body=Domain%3A%20${encodeURIComponent(window.location.hostname)}"
           style="display:inline-block;background:#C9A84C;color:#0A1628;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">
          Contact Licensing Support
        </a>
        <p style="margin:20px 0 0;font-size:12px;color:rgba(240,238,232,0.3)">
          PrimeReach Licensing · EVOBRAND Concepts
        </p>
      </div>
    `;
    document.body ? document.body.appendChild(el) : document.addEventListener('DOMContentLoaded', () => document.body.appendChild(el));
  }

  function check() {
    const domain = window.location.hostname;

    // Check session cache first
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { ts, active, status } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) {
          if (!active) showLockout(status);
          return;
        }
      }
    } catch (_) {}

    fetch(`${ENDPOINT}?domain=${encodeURIComponent(domain)}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({
            ts: Date.now(),
            active: data.active,
            status: data.status,
          }));
        } catch (_) {}
        if (!data.active) showLockout(data.status);
      })
      .catch(() => {
        // Fail open — don't block platform on network errors
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', check);
  } else {
    check();
  }
})();
