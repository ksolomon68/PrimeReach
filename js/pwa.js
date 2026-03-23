/**
 * CaltransBizConnect PWA – Service Worker Registration & Install Prompt
 */
(function () {
  'use strict';

  // ── Service Worker Registration ──────────────────────────────────────────
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then(reg => {
          // Check for updates every time the page loads
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdateBanner();
              }
            });
          });
        })
        .catch(err => console.warn('[PWA] Service worker registration failed:', err));

      // Reload once when a new SW takes control (after update)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    });
  }

  // ── Install Prompt ───────────────────────────────────────────────────────
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;

    // Don't show again if dismissed within the last 7 days
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed && Date.now() - parseInt(dismissed, 10) < 7 * 24 * 60 * 60 * 1000) return;

    showInstallBanner();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    removeInstallBanner();
    localStorage.setItem('pwa-installed', 'true');
    console.log('[PWA] App installed.');
  });

  // ── Install Banner UI ────────────────────────────────────────────────────
  function showInstallBanner() {
    if (document.getElementById('pwa-install-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Install app prompt');
    banner.innerHTML = `
      <div id="pwa-banner-inner">
        <img src="/assets/icon-192.png" alt="" aria-hidden="true" id="pwa-banner-logo">
        <div id="pwa-banner-text">
          <strong>Install CaltransBizConnect</strong>
          <span>Add to your home screen for quick access</span>
        </div>
        <div id="pwa-banner-actions">
          <button id="pwa-install-btn" aria-label="Install app">Install</button>
          <button id="pwa-dismiss-btn" aria-label="Dismiss install prompt">✕</button>
        </div>
      </div>
    `;

    injectBannerStyles();
    document.body.appendChild(banner);

    document.getElementById('pwa-install-btn').addEventListener('click', () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(choice => {
        deferredPrompt = null;
        removeInstallBanner();
        if (choice.outcome === 'dismissed') {
          localStorage.setItem('pwa-install-dismissed', Date.now().toString());
        }
      });
    });

    document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
      removeInstallBanner();
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    });
  }

  function removeInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.style.transform = 'translateY(120%)';
      setTimeout(() => banner.remove(), 300);
    }
  }

  // ── Update Banner UI ─────────────────────────────────────────────────────
  function showUpdateBanner() {
    if (document.getElementById('pwa-update-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-update-banner';
    banner.setAttribute('role', 'alert');
    banner.innerHTML = `
      <div id="pwa-banner-inner">
        <span>🔄 A new version of CaltransBizConnect is available.</span>
        <button id="pwa-reload-btn">Reload</button>
        <button id="pwa-update-dismiss-btn" aria-label="Dismiss update prompt">✕</button>
      </div>
    `;

    injectBannerStyles();
    document.body.appendChild(banner);

    document.getElementById('pwa-reload-btn').addEventListener('click', () => {
      window.location.reload();
    });

    document.getElementById('pwa-update-dismiss-btn').addEventListener('click', () => {
      banner.remove();
    });
  }

  // ── Inline Styles ────────────────────────────────────────────────────────
  function injectBannerStyles() {
    if (document.getElementById('pwa-banner-styles')) return;
    const style = document.createElement('style');
    style.id = 'pwa-banner-styles';
    style.textContent = `
      #pwa-install-banner,
      #pwa-update-banner {
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%) translateY(0);
        z-index: 99999;
        width: min(480px, calc(100vw - 2rem));
        background: #fff;
        border: 1.5px solid #005A8C;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.18);
        animation: pwaSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1) both;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      @keyframes pwaSlideUp {
        from { opacity: 0; transform: translateX(-50%) translateY(40px); }
        to   { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      #pwa-banner-inner {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.875rem 1rem;
      }
      #pwa-banner-logo {
        width: 40px;
        height: 40px;
        object-fit: contain;
        flex-shrink: 0;
        border-radius: 8px;
      }
      #pwa-banner-text {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
      }
      #pwa-banner-text strong {
        font-size: 0.9rem;
        color: #005A8C;
        font-weight: 700;
      }
      #pwa-banner-text span {
        font-size: 0.78rem;
        color: #555;
      }
      #pwa-banner-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-shrink: 0;
      }
      #pwa-install-btn,
      #pwa-reload-btn {
        background: #005A8C;
        color: #fff;
        border: none;
        border-radius: 6px;
        padding: 0.45rem 1rem;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      }
      #pwa-install-btn:hover,
      #pwa-reload-btn:hover { background: #004470; }
      #pwa-dismiss-btn,
      #pwa-update-dismiss-btn {
        background: transparent;
        border: none;
        color: #888;
        font-size: 1rem;
        cursor: pointer;
        padding: 0.25rem;
        line-height: 1;
        border-radius: 4px;
      }
      #pwa-dismiss-btn:hover,
      #pwa-update-dismiss-btn:hover { color: #333; background: #f0f0f0; }
      #pwa-update-banner #pwa-banner-inner {
        gap: 1rem;
        flex-wrap: wrap;
      }
      #pwa-update-banner span {
        flex: 1;
        font-size: 0.88rem;
        color: #333;
      }
      @media (max-width: 480px) {
        #pwa-install-banner, #pwa-update-banner {
          bottom: 70px;
          border-radius: 10px;
        }
      }
    `;
    document.head.appendChild(style);
  }
})();
