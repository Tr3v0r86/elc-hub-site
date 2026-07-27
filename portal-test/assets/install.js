/* ELC Portal install affordance (issue 0076).

   Takes the bottom-left slot the deploy-injected project-window pill (#pw-pill)
   holds internally. That pill does not ship to v1, so at launch this is the only
   bottom-left chrome (Trevor 2026-07-26).

   Why this exists: the Portal never had install UI. It leaned on Chrome's own
   mini-infobar, which Chrome shows once per origin and then withdraws after an
   install-then-uninstall, so the install path vanished with nothing behind it. We
   now capture beforeinstallprompt ourselves and preventDefault it, which suppresses
   Chrome's one-shot bar and hands us the event to fire on demand.

   The affordance does NOT wait for that event on Android (2026-07-28, Trevor's
   Pixel): Chrome can withhold beforeinstallprompt entirely, for an unobservable
   stretch after an uninstall, and the first build only rendered the pill FROM the
   event, so a withheld event meant no install UI at all, which is the original bug
   wearing a new coat. Android now renders the pill unconditionally; a captured
   event upgrades the tap to the native prompt, and without one the tap coaches the
   menu path (browser menu, then Add to Home screen), which always exists.

   iOS Safari never fires beforeinstallprompt: Add to Home Screen is Share-sheet only,
   so iOS gets the two steps as a coach card. Line's in-app browser cannot install at
   all, and Bangkok families open links from inside it constantly, so it gets pointed
   out to a real browser (same detection render.js already uses for the
   coffee-mornings hint).

   Styles consume tokens.css custom properties only (ADR-0002).
   Self-check: node tools/install-mode.test.mjs */
(function () {
  'use strict';

  /* Pure branch selector. Keep it DOM-free: the self-check imports this file so the
     branch map can never drift from what deploys.
     ponytail: iPadOS 13+ reports as Macintosh, so an iPad in Safari lands on 'none'
     rather than 'ios'. Upgrade path if that starts to matter: take
     navigator.maxTouchPoints as a fourth argument and treat Macintosh plus touch as
     iOS. Not done now because phones do not hit it. */
  function mode(ua, standalone, hasPrompt) {
    if (standalone) return 'none';              // already installed, nothing to offer
    if (hasPrompt) return 'prompt';             // Chromium: drive the real prompt
    if (/\bLine\//i.test(ua)) return 'inapp';   // in-app browser: cannot install here
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';  // Safari: Share sheet, manual
    if (/Android/i.test(ua)) return 'android';  // pill now, event may upgrade the tap
    return 'none';                              // no install path we can offer
  }

  // The Node self-check imports this file, where there is no DOM to wire.
  if (typeof window === 'undefined') { globalThis.__portalInstallMode = mode; return; }

  function isStandalone() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      navigator.standalone === true;
  }

  // Already running as the app: never render, and never listen.
  if (isStandalone()) return;

  var deferred = null;
  var pill = null;

  /* Geometry mirrors #pw-pill exactly so this drops into that slot unchanged when the
     project window retires at v1. Whether the primary install CTA should stay a quiet
     outline pill or take a filled treatment is Claude Design's call (rule 7). */
  var css =
    '#install-pill{position:fixed;bottom:26px;left:26px;z-index:9998;' +
    'display:none;align-items:center;gap:8px;' +
    'font-family:var(--mono);font-size:12px;letter-spacing:.04em;' +
    'color:var(--aubergine);background:var(--paper);' +
    'border:1px solid var(--aubergine);border-radius:999px;' +
    'padding:9px 14px;cursor:pointer;white-space:nowrap;}' +
    '#install-pill.on{display:inline-flex;}' +
    '#install-pill svg{width:13px;height:13px;stroke:var(--aubergine);stroke-width:1.8;' +
    'fill:none;flex:none;}' +
    '@media(max-width:720px){#install-pill{bottom:80px;left:16px;' +
    'font-size:11.5px;padding:8px 12px;}}' +
    '#install-coach{border:1px solid var(--rule);border-top:2px solid var(--purple);' +
    'border-radius:12px;background:var(--white);color:var(--ink);' +
    'font-family:var(--sans);padding:24px 26px;max-width:420px;width:calc(100% - 32px);}' +
    '#install-coach::backdrop{background:rgba(31,25,40,0.44);}' +
    '#install-coach h2{font-family:var(--serif);font-weight:400;font-size:22px;' +
    'line-height:1.15;margin-bottom:12px;}' +
    '#install-coach p,#install-coach li{font-weight:300;font-size:14.5px;line-height:1.6;' +
    'color:var(--charcoal);}' +
    '#install-coach ol{margin:0 0 18px 18px;}' +
    '#install-coach li{margin-bottom:6px;}' +
    '#install-coach button{background:var(--aubergine);color:var(--white-pure);' +
    'border:1px solid var(--aubergine);border-radius:6px;font-family:var(--sans);' +
    'font-weight:600;font-size:13.5px;padding:10px 18px;cursor:pointer;}';

  var COACH = {
    ios: {
      title: 'Add the Portal to your home screen',
      steps: ['Tap the Share button in the Safari toolbar.', 'Choose Add to Home Screen.']
    },
    android: {
      title: 'Add the Portal to your home screen',
      steps: ['Tap the browser menu (the three dots, top right).',
        'Choose Add to Home screen, then Install.']
    },
    inapp: {
      title: 'Open the Portal in your browser first',
      steps: ['Tap the menu, then choose Open in browser.',
        'Add the Portal to your home screen from there.']
    }
  };

  function render(kind) {
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    pill = document.createElement('button');
    pill.id = 'install-pill';
    pill.type = 'button';
    pill.className = 'on';
    pill.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12"/>' +
      '<path d="M7 11l5 5 5-5"/><path d="M4 20h16"/></svg>Install app';
    document.body.appendChild(pill);

    var copy = COACH[kind];
    var dlg = null;
    if (copy) {
      dlg = document.createElement('dialog');
      dlg.id = 'install-coach';
      dlg.innerHTML = '<h2></h2><ol></ol><button type="button">Got it</button>';
      dlg.querySelector('h2').textContent = copy.title;
      copy.steps.forEach(function (step) {
        var li = document.createElement('li');
        li.textContent = step;
        dlg.querySelector('ol').appendChild(li);
      });
      document.body.appendChild(dlg);
      dlg.querySelector('button').addEventListener('click', function () { dlg.close(); });
    }

    /* ONE handler, decided at tap time, because the capabilities change under the
       pill: on Android the event can land (or be consumed) after render. Captured
       event -> the native prompt; none -> the coach card; neither (desktop 'prompt'
       pill whose event was consumed) -> nothing, honestly inert. */
    pill.addEventListener('click', function () {
      if (deferred) {
        var ev = deferred;
        // Kept only until it is used: a prompt event cannot be fired twice.
        deferred = null;
        ev.prompt();
        ev.userChoice.then(function (choice) {
          if (choice && choice.outcome === 'accepted') hide();
        });
        return;
      }
      // Native <dialog>: focus trap and Escape come from the platform, not from us.
      if (dlg) dlg.showModal();
    });
  }

  function hide() {
    if (pill) pill.classList.remove('on');
  }

  /* Chromium fires this once the app qualifies, after the manifest and SW settle, so
     an end-of-body listener is early enough. preventDefault kills Chrome's own bar. */
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferred = e;
    if (!pill) render('prompt');
  });

  window.addEventListener('appinstalled', function () {
    deferred = null;
    hide();
  });

  /* Startup branches resolve on load without waiting for any event: iOS and in-app
     never get one, and Android must not depend on one (a withheld event meant no
     install UI at all, the original bug). 'prompt' is deliberately absent here:
     hasPrompt is false until the event lands, and the listener above renders it the
     moment it does (desktop Chromium); on an already-rendered Android pill the event
     just upgrades the tap. */
  var startup = mode(navigator.userAgent || '', false, false);
  if (startup !== 'none') render(startup);
})();
