(function () {
'use strict';
var rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Video slot: stays hidden unless the file exists and its metadata loads */
var fig = document.getElementById('explainer'), vid = document.getElementById('explainer-video');
if (fig && vid && vid.dataset.src) {
  vid.addEventListener('loadedmetadata', function () { fig.hidden = false; });
  vid.src = vid.dataset.src;
}

var root = document.getElementById('demo');
if (!root) return;
var TXN = 'TXN-80421', timers = [];
var nIn = document.getElementById('demo-n'), nOut = document.getElementById('demo-n-out'),
    sendB = document.getElementById('demo-send'), resetB = document.getElementById('demo-reset'),
    log = document.getElementById('demo-log'), recs = document.getElementById('demo-records'),
    sentOut = document.getElementById('demo-sent'), countOut = document.getElementById('demo-count'),
    result = document.getElementById('demo-result');

function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
function mode() { return root.querySelector('input[name="mode"]:checked').value; }

function clearAll() {
  timers.forEach(clearTimeout); timers = [];
  log.textContent = ''; recs.textContent = '';
  sentOut.textContent = '0'; countOut.textContent = '0';
  result.textContent = 'Choose a handler and a number of deliveries, then press Send callbacks.';
  sendB.disabled = false;
}
function summary(m, n, r) {
  if (m === 'naive') {
    return n === 1
      ? 'One callback, one record. This looks fine until the same callback is delivered again.'
      : n + ' callbacks, ' + r + ' payment records. The money moved once, but the ledger now shows ' + r + ' payments.';
  }
  return n === 1
    ? 'One callback, one payment record.'
    : n + ' callbacks, 1 payment record. Repeated callbacks with the same verified transaction reference do not create additional records.';
}
function run() {
  clearAll();
  var m = mode(), n = parseInt(nIn.value, 10), r = 0;
  sendB.disabled = true;
  result.textContent = 'Delivering callbacks...';
  for (var i = 1; i <= n; i++) {
    (function (i) {
      timers.push(setTimeout(function () {
        var li = el('li'), outcome, cls;
        if (m === 'naive' || r === 0) {
          r++;
          var dup = (m === 'naive' && i > 1);
          cls = dup ? 'is-bad' : 'is-ok';
          outcome = dup ? 'Treated as a new payment. Duplicate record created.' : 'Verified and recorded as a payment.';
          recs.appendChild(el('li', cls, 'Payment record ' + r + ' \u00b7 ' + TXN));
        } else {
          cls = 'is-dup';
          outcome = 'Same transaction reference. Acknowledged, no new record.';
        }
        li.className = cls;
        li.appendChild(el('strong', '', 'Callback ' + i + ' \u00b7 ' + TXN));
        li.appendChild(el('span', '', outcome));
        log.appendChild(li);
        sentOut.textContent = String(i); countOut.textContent = String(r);
        if (i === n) { result.textContent = summary(m, n, r); sendB.disabled = false; }
      }, rm ? 0 : (i - 1) * 650 + 100));
    })(i);
  }
}
sendB.addEventListener('click', run);
resetB.addEventListener('click', clearAll);
nIn.addEventListener('input', function () { nOut.textContent = nIn.value; clearAll(); });
[].forEach.call(root.querySelectorAll('input[name="mode"]'), function (r) { r.addEventListener('change', clearAll); });
clearAll();
})();