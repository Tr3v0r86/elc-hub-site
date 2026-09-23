/* An on-page request, with confirmation only after acknowledged storage. */
(function () {
  'use strict';
  var opener = document.getElementById('signup-open');
  var dialog = document.getElementById('signup-dialog');
  var form = document.getElementById('notify');
  var name = document.getElementById('first-name');
  var email = document.getElementById('email');
  var pack = document.getElementById('details-pack');
  var visit = document.getElementById('site-visit');
  var fields = document.getElementById('signup-fields');
  var interests = document.getElementById('interest-group');
  var choiceError = document.getElementById('choice-error');
  var message = document.getElementById('form-message');
  var button = form.querySelector('button[type="submit"]');
  var toast = document.getElementById('signup-toast');
  var busy = false;

  opener.addEventListener('click', function () {
    toast.hidden = true;
    dialog.showModal();
    document.body.classList.add('dialog-open');
    (busy ? document.getElementById('signup-close') : name).focus();
  });
  document.getElementById('signup-close').addEventListener('click', function () {
    dialog.close();
  });
  dialog.addEventListener('close', function () {
    document.body.classList.remove('dialog-open');
    opener.focus();
  });
  dialog.addEventListener('keydown', function (event) {
    if (event.key !== 'Tab') return;
    var controls = dialog.querySelectorAll('button:not(:disabled), input:not(:disabled):not([tabindex="-1"])');
    var first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  });
  document.getElementById('toast-close').addEventListener('click', function () {
    toast.hidden = true;
    opener.focus();
  });
  name.addEventListener('input', function () { name.setCustomValidity(''); });
  [pack, visit].forEach(function (checkbox) {
    checkbox.addEventListener('change', function () {
      if (pack.checked || visit.checked) {
        choiceError.hidden = true;
        interests.removeAttribute('aria-invalid');
      }
    });
  });

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (busy) return;
    message.hidden = true;
    name.value = name.value.trim();
    email.value = email.value.trim();
    name.setCustomValidity(name.value ? '' : 'Please enter your first name.');
    if (!form.reportValidity()) return;
    if (!pack.checked && !visit.checked) {
      choiceError.hidden = false;
      interests.setAttribute('aria-invalid', 'true');
      pack.focus();
      return;
    }
    choiceError.hidden = true;
    interests.removeAttribute('aria-invalid');

    var endpoint = window.HUB_SIGNUP_ENDPOINT;
    if (!endpoint) {
      message.textContent = 'Requests are temporarily unavailable. Please try again later.';
      message.hidden = false;
      return;
    }

    // Snapshot the selected interests. Closing the dialog never cancels a request in flight.
    var payload = {
      first_name: name.value,
      email: email.value,
      wants_details_pack: pack.checked,
      wants_october_30_visit: visit.checked,
      source: 'elc-hub.com / Years 7 and 8',
      consent: 'Email me about the options I choose.',
      consent_version: '2026-09-24',
      _gotcha: form.elements._gotcha.value
    };
    busy = true;
    fields.disabled = true;
    interests.disabled = true;
    button.disabled = true;
    button.textContent = 'Sending…';
    form.setAttribute('aria-busy', 'true');
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 15000);
    try {
      var response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      var result = await response.json();
      if (!response.ok || result.ok !== true) throw new Error('Save not acknowledged');

      var detail = payload.wants_details_pack && payload.wants_october_30_visit
        ? 'We’ll email you the details pack and information about visiting on 30 October.'
        : payload.wants_details_pack
          ? 'We’ll email you the Years 7–8 details pack.'
          : 'We’ve received your interest in visiting on 30 October. We’ll email you the time and details.';
      document.getElementById('toast-detail').textContent = detail;
      form.reset();
      if (dialog.open) dialog.close();
      toast.hidden = false;
    } catch (error) {
      message.textContent = 'We couldn’t confirm your request. Please try again.';
      message.hidden = false;
    } finally {
      clearTimeout(timeout);
      busy = false;
      fields.disabled = false;
      interests.disabled = false;
      button.disabled = false;
      button.textContent = 'Send my request';
      form.removeAttribute('aria-busy');
    }
  });
})();
