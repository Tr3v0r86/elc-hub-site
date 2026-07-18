/* ELC Portal feedback widget.
   Floating bottom-right pill + modal. On submit it POSTs to the feedback
   relay (a Cloudflare Worker that files a GitHub issue, docs/issues/0020);
   if the relay fails, it falls back to a pre-filled mailto to Trevor.
   Styles consume tokens.css custom properties only.
   Self-contained; include with <script src> after tokens.css. */
(function () {
  const VERSION = (window.PORTAL||{}).version || 'unknown';
  const TO = 'trevorc@elc.ac.th';
  const RELAY = 'https://elc-feedback-relay.elcportal.workers.dev/feedback';

  const css = `
    #fb-pill{position:fixed;bottom:26px;right:26px;z-index:9998;display:inline-flex;align-items:center;gap:10px;
      font-family:var(--sans);font-weight:600;font-size:13.5px;
      color:var(--white-pure);background:var(--aubergine);border:1px solid var(--aubergine);border-radius:999px;padding:12px 18px;cursor:pointer;
      box-shadow:0 8px 24px rgba(31,25,40,0.22);transition:background .18s,transform .06s;}
    #fb-pill:hover{background:var(--aubergine-2);}
    #fb-pill:active{transform:translateY(1px);}
    #fb-pill svg{width:15px;height:15px;stroke:var(--gold);stroke-width:1.8;fill:none;flex:none;}
    @media(max-width:720px){#fb-pill{bottom:80px;right:16px;padding:11px 15px;font-size:12.5px;}}

    #fb-overlay{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;padding:20px;
      background:rgba(31,25,40,0.44);backdrop-filter:blur(2px);}
    #fb-overlay.open{display:flex;}
    #fb-modal{width:100%;max-width:560px;background:var(--white);border:1px solid var(--rule);border-top:2px solid var(--purple);border-radius:12px;
      box-shadow:0 30px 80px rgba(31,25,40,0.28);padding:28px 30px 26px;font-family:var(--sans);
      max-height:90vh;overflow:auto;}
    #fb-modal *{box-sizing:border-box;}
    #fb-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:14px;}
    #fb-head h2{font-family:var(--serif);font-weight:400;font-size:25px;letter-spacing:-0.01em;color:var(--ink);line-height:1.1;}
    #fb-close{background:none;border:none;cursor:pointer;color:var(--muted);font-size:22px;line-height:1;padding:2px 4px;flex:none;}
    #fb-close:hover{color:var(--ink);}
    #fb-intro{font-weight:300;font-size:14px;line-height:1.6;color:var(--charcoal);margin-bottom:20px;}
    #fb-intro b{font-weight:600;color:var(--ink);}
    #fb-form label{display:block;font-family:var(--mono);font-size:9.5px;font-weight:700;letter-spacing:0.16em;
      text-transform:uppercase;color:var(--muted);margin-bottom:7px;}
    #fb-form .row{margin-bottom:16px;}
    #fb-name,#fb-body{width:100%;background:var(--paper);border:1px solid var(--rule);border-radius:8px;color:var(--ink);
      font-family:var(--sans);font-weight:300;font-size:14.5px;padding:11px 13px;outline:none;transition:border-color .18s;}
    #fb-name:focus,#fb-body:focus{border-color:var(--purple);}
    #fb-name::placeholder,#fb-body::placeholder{color:var(--faint);}
    #fb-body{min-height:140px;resize:vertical;line-height:1.5;}
    #fb-actions{display:flex;align-items:center;justify-content:flex-end;gap:14px;margin-top:4px;}
    #fb-note{font-family:var(--mono);font-size:9px;letter-spacing:0.06em;color:var(--faint);margin-right:auto;}
    #fb-submit{display:inline-flex;align-items:center;gap:9px;background:var(--aubergine);color:var(--white-pure);border:1px solid var(--aubergine);border-radius:6px;
      font-family:var(--sans);font-weight:600;font-size:13.5px;padding:12px 20px;cursor:pointer;transition:background .18s,transform .06s;}
    #fb-submit:hover{background:var(--aubergine-2);}
    #fb-submit:active{transform:translateY(1px);}
    #fb-submit .a{font-family:var(--mono);font-weight:700;}
    #fb-thanks{display:none;text-align:center;padding:14px 0 6px;}
    #fb-thanks.show{display:block;}
    #fb-thanks .mk{width:38px;height:38px;border-radius:50%;background:var(--sage);color:var(--white-pure);display:inline-flex;align-items:center;justify-content:center;font-size:18px;margin-bottom:12px;}
    #fb-thanks p{font-weight:300;font-size:15px;line-height:1.6;color:var(--charcoal);}
  `;

  const html = `
    <button id="fb-pill" aria-label="Share feedback">
      <svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
      Share feedback
    </button>
    <div id="fb-overlay" role="dialog" aria-modal="true" aria-labelledby="fb-title">
      <div id="fb-modal">
        <div id="fb-head">
          <h2 id="fb-title">Share feedback</h2>
          <button id="fb-close" aria-label="Close">&times;</button>
        </div>
        <div id="fb-live">
          <p id="fb-intro"><b>This is an early version, and your feedback shapes it.</b> Tell us what works, what is missing, or what is confusing. Every note is logged for the team. Leave your name if you would like a reply, or stay anonymous.</p>
          <div id="fb-form">
              <input id="fb-hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;height:0;opacity:0;">
            <div class="row">
              <label for="fb-name">Your name (optional)</label>
              <input id="fb-name" type="text" placeholder="e.g. a Year 4 parent, or your name" maxlength="80">
            </div>
            <div class="row">
              <label for="fb-body">Your feedback</label>
              <textarea id="fb-body" placeholder="What is working, what is missing, or what would help?"></textarea>
            </div>
            <div id="fb-actions">
              <span id="fb-note">Goes straight to Trevor &middot; ${VERSION}</span>
              <button id="fb-submit">Send feedback <span class="a">&rarr;</span></button>
            </div>
          </div>
        </div>
        <div id="fb-thanks">
          <div class="mk">&#10003;</div>
          <p>Thank you. Your note is on its way.</p>
        </div>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  const wrap = document.createElement('div');
  wrap.innerHTML = html;
  document.body.appendChild(wrap);

  const pill   = document.getElementById('fb-pill');
  const overlay= document.getElementById('fb-overlay');
  const closeB = document.getElementById('fb-close');
  const live   = document.getElementById('fb-live');
  const thanks = document.getElementById('fb-thanks');
  const submit = document.getElementById('fb-submit');
  const nameI  = document.getElementById('fb-name');
  const bodyI  = document.getElementById('fb-body');

  function open(){ overlay.classList.add('open'); setTimeout(()=>bodyI.focus(),50); }
  function close(){
    overlay.classList.remove('open');
    setTimeout(()=>{ live.style.display=''; thanks.classList.remove('show'); nameI.value=''; bodyI.value=''; submit.disabled=false; }, 300);
  }
  pill.addEventListener('click', open);
  closeB.addEventListener('click', close);
  overlay.addEventListener('click', function(e){ if(e.target===overlay) close(); });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape' && overlay.classList.contains('open')) close(); });

  submit.addEventListener('click', function(){
    const text = bodyI.value.trim();
    if(!text){ bodyI.focus(); return; }
    submit.disabled = true;
    const name = nameI.value.trim();
    // Directory URLs: /policies/ -> "policies", / -> "home".
    const page = location.pathname.replace(/index\.html$/,'').replace(/\/$/,'').split('/').pop() || 'home';

    function mailtoFallback(){
      const subject = encodeURIComponent('[Portal feedback] ' + page);
      const body = encodeURIComponent(
        'From: ' + (name || 'Anonymous') + '\n' +
        'Page: ' + page + '\n' +
        'Version: ' + VERSION + '\n\n' +
        text + '\n'
      );
      window.location.href = 'mailto:' + TO + '?subject=' + subject + '&body=' + body;
    }

    fetch(RELAY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name, body: text, page: page, version: VERSION,
        website: document.getElementById('fb-hp').value
      })
    })
      .then(function(r){ return r.json(); })
      .then(function(res){ if(!res.ok) mailtoFallback(); })
      .catch(mailtoFallback);

    live.style.display = 'none';
    thanks.classList.add('show');
  });
})();
