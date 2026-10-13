(function () {
'use strict';
var fig = document.getElementById('flow3d');
if (!fig) return;
var stage = document.getElementById('flow3d-stage'), cap = document.getElementById('flow3d-cap'),
    ctl = document.getElementById('flow3d-controls'), text = document.getElementById('flow3d-text');
var rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
var REF = 'TXN-80421', T_END = 22, STEPS = [3, 6, 10.5, 17.5, 22], PX = -8.2;
var C0 = [
  '1 \u00b7 Mwende pays her school fees. The mobile-money provider processes the payment.',
  '2 \u00b7 The payment succeeded, but the school portal has not updated yet. A delayed screen does not mean the payment failed.',
  '3 \u00b7 One payment, two callbacks. Both carry the same fictional reference, ' + REF + '.'
];
var CAP = {
  naive: C0.concat(['4 \u00b7 With no duplicate check, each callback is treated as a new payment, so two records are created.',
    '5 \u00b7 The money moved once, but the ledger shows two payments. The database is wrong even though the payment was real.']),
  safe: C0.concat(['4 \u00b7 The first callback is verified against a known request and recorded once. The duplicate has the same reference, so it is acknowledged and creates no record.',
    '5 \u00b7 One real transaction. One trustworthy record. The same event can arrive again; the same payment must not be recorded again.'])
};
function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
function seg(t, a, b) { return Math.max(0, Math.min(1, (t - a) / (b - a))); }
function ease(k) { return k * k * (3 - 2 * k); }
function lerp(a, b, k) { return a + (b - a) * k; }
function bump(t, a, b) { return Math.sin(Math.PI * seg(t, a, b)); }
function phase(t) { return t >= 17.5 ? 4 : t >= 10.5 ? 3 : t >= 6 ? 2 : t >= 3 ? 1 : 0; }
function webgl() { try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; } }
function fallback() { stage.hidden = true; ctl.hidden = true; cap.hidden = true; if (text) text.open = true; }

if (!webgl() || (navigator.connection && navigator.connection.saveData) || !('IntersectionObserver' in window)) { fallback(); return; }
stage.hidden = false; stage.appendChild(el('p', 'flow3d__loading', 'Loading 3D model...'));
var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); load(); } }, { rootMargin: '250px' });
io.observe(stage);
function load() {
  if (window.THREE) { try { build(); } catch (e) { fallback(); } return; }
  var s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js';
  s.onload = function () { try { build(); } catch (e) { fallback(); } };
  s.onerror = fallback;
  document.head.appendChild(s);
}

function build() {
  var T = window.THREE; stage.textContent = '';
  var GOLD = 0xC5A16A, MAUVE = 0xA9829A, GREEN = 0x7fc79a, BLUE = 0x7fb2e5, RED = 0xe58f8f;
  var mode = 'naive', tm = 0, playing = false, stopAt = T_END, lastKey = '', W = 0, H = 0, dist = 16;
  var RX0 = 0.3, RY0 = -0.28, rt = { rx: RX0, ry: RY0 }, rc = { rx: RX0, ry: RY0 }, raf = 0, lastNow = 0;

  var renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  var canvas = renderer.domElement; canvas.setAttribute('aria-hidden', 'true'); stage.appendChild(canvas);
  var scene = new T.Scene(), world = new T.Group(); scene.add(world);
  var camera = new T.PerspectiveCamera(40, 1, 0.1, 200);
  scene.add(new T.AmbientLight(0xffffff, 0.75));
  var dl = new T.DirectionalLight(0xffffff, 0.8); dl.position.set(4, 8, 6); scene.add(dl);
  var labels = [], v = new T.Vector3();

  var hud = el('div', 'flow3d__hud'); hud.setAttribute('aria-hidden', 'true');
  var hCb = el('b', '', '0'), hPay = el('b', '', '0'), hRec = el('b', '', '0');
  [['Callbacks received ', hCb], ['Real payments ', hPay], ['Payment records ', hRec]].forEach(function (r) { var d = el('div'); d.appendChild(document.createTextNode(r[0])); d.appendChild(r[1]); hud.appendChild(d); });
  stage.appendChild(hud);

  function solid(geom, color, opacity, edge) {
    var m = new T.Mesh(geom, new T.MeshStandardMaterial({ color: color, roughness: 0.7, metalness: 0.1, transparent: true, opacity: opacity == null ? 0.95 : opacity }));
    if (edge !== false) { var e = new T.LineSegments(new T.EdgesGeometry(geom, 25), new T.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.7 })); m.add(e); m.userData.edge = e; }
    world.add(m); return m;
  }
  function label(name, obj, dy, minor) {
    var d = el('div', 'flow3d__label' + (minor ? ' is-minor' : '')); d.setAttribute('aria-hidden', 'true');
    var n = el('span', '', name), s = el('small', ''); d.appendChild(n); d.appendChild(s);
    var a = new T.Object3D(); a.position.set(0, dy, 0); obj.add(a); stage.appendChild(d);
    var L = { el: d, name: n, small: s, anchor: a }; labels.push(L); return L;
  }
  function tint(m, c, k) { m.material.color.setHex(c); m.material.emissive.setHex(c); m.material.emissiveIntensity = k; }

  var floor = solid(new T.BoxGeometry(24, 0.12, 8), 0x2a1220, 0.55, false); floor.position.set(0, -0.06, 0);
  world.add(new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(PX, 0.9, 0), new T.Vector3(8, 0.9, 0)]), new T.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.3 })));

  var body = solid(new T.CylinderGeometry(0.4, 0.5, 1.3, 20), 0x58354B); body.position.set(-10, 0.65, 0.3);
  var head = solid(new T.SphereGeometry(0.3, 20, 14), 0x6b3f5b, 0.95, false); head.position.set(-10, 1.55, 0.3);
  label('Mwende', body, 1.5, true);
  var phone = solid(new T.BoxGeometry(0.7, 1.2, 0.12), 0x3a2233); phone.position.set(PX, 1.1, 0.3);
  var screen = new T.Mesh(new T.PlaneGeometry(0.56, 1.0), new T.MeshBasicMaterial({ color: MAUVE })); screen.position.z = 0.07; phone.add(screen);
  label("Mwende's phone", phone, 1.0);
  var prov = solid(new T.BoxGeometry(2, 1.4, 1.6), 0x58354B); prov.position.set(-4, 0.7, 0);
  label('Payment provider', prov, 1.35).small.textContent = 'fictional';

  var gateMat = new T.MeshStandardMaterial({ color: 0x6b3f5b, roughness: 0.6, metalness: 0.2 });
  function gp(w, h, d, x, y, z) { var g = new T.BoxGeometry(w, h, d), m = new T.Mesh(g, gateMat); m.position.set(x, y, z); m.add(new T.LineSegments(new T.EdgesGeometry(g), new T.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.8 }))); world.add(m); return m; }
  gp(0.35, 2.4, 0.5, 0, 1.2, -1.0); gp(0.35, 2.4, 0.5, 0, 1.2, 1.0);
  var lintel = gp(0.35, 0.4, 2.5, 0, 2.4, 0), gateLab = label('Callback gateway', lintel, 0.75);

  var app = solid(new T.BoxGeometry(2.2, 1.6, 1.8), 0x58354B); app.position.set(4, 0.8, 0); label('Application server', app, 1.4);
  var db = solid(new T.CylinderGeometry(1.1, 1.1, 1.8, 32), 0x3a2233, 0.28); db.position.set(8, 0.9, 0); label('Database', db, 1.45);
  var portal = solid(new T.BoxGeometry(2.8, 1.6, 0.14), 0x58354B); portal.position.set(8, 1.0, -3.2);
  var portalLab = label('School portal', portal, 1.3);

  var token = solid(new T.SphereGeometry(0.28, 18, 12), GOLD, 1, false);
  function env() { var g = new T.OctahedronGeometry(0.42); g.scale(1, 0.8, 1); return solid(g, GOLD, 1); }
  var envA = env(), envB = env();
  label('Callback 1', envA, 0.75, true).small.textContent = REF;
  label('Callback 2', envB, 1.25, true).small.textContent = REF;
  function rec(y) { var m = solid(new T.CylinderGeometry(0.7, 0.7, 0.28, 28), GOLD, 1); m.position.set(8, y, 0); return m; }
  var rec1 = rec(0.35), rec2 = rec(0.75); rec2.material.color.setHex(RED);

  function apply() {
    var t = tm, safe = mode === 'safe';
    token.visible = t < 3;
    var k = ease(seg(t, 0.5, 3));
    token.position.set(lerp(PX, -4, k), lerp(1.2, 0.9, k) + 0.5 * Math.sin(Math.PI * k), 0.3 * (1 - k));
    tint(token, GOLD, 0.5);
    screen.material.color.setHex(t >= 0.5 ? GOLD : MAUVE);
    prov.material.emissive.setHex(GOLD); prov.material.emissiveIntensity = (t >= 3 && t < 6) ? 0.2 + 0.15 * Math.sin(t * 6) : 0;

    envA.visible = t >= 6 && t < 14.5;
    var ax = t < 10.5 ? lerp(-4, -1.2, ease(seg(t, 6, 8.2))) : t < 13 ? lerp(-1.2, 4, ease(seg(t, 10.5, 13))) : lerp(4, 8, ease(seg(t, 13, 14.5)));
    envA.position.set(ax, 0.9, 0); envA.rotation.y = t * 1.2;
    tint(envA, safe && t >= 10.8 ? GREEN : GOLD, 0.35);

    var bx = -4, by = 0.9, bv = t >= 6.8, bo = 1;
    if (t < 13.5) bx = lerp(-4, -2.5, ease(seg(t, 6.8, 9)));
    else if (!safe) { bx = t < 16 ? lerp(-2.5, 4, ease(seg(t, 13.5, 16))) : lerp(4, 8, ease(seg(t, 16, 17.5))); if (t >= 17.5) bv = false; }
    else { bx = lerp(-2.5, -0.5, ease(seg(t, 13.5, 15))); var u = seg(t, 15, 17); by = 0.9 + 1.8 * ease(u); bo = 1 - u; if (t >= 17) bv = false; }
    envB.visible = bv; envB.position.set(bx, by, 0); envB.rotation.y = t * 1.2; envB.material.opacity = bo; envB.userData.edge.material.opacity = 0.7 * bo;
    tint(envB, safe ? (t >= 14.6 ? BLUE : GOLD) : (t >= 16 ? RED : GOLD), 0.35);

    rec1.visible = t >= 14.5; rec2.visible = !safe && t >= 17.5;
    var g = safe ? bump(t, 10.8, 12.2) : 0, b = safe ? bump(t, 14.6, 16) : 0;
    gateMat.emissive.setHex(g >= b ? GREEN : BLUE); gateMat.emissiveIntensity = Math.max(g, b) * 0.9;
    gateLab.name.textContent = safe ? 'Idempotency check' : 'Callback gateway';
    gateLab.small.textContent = safe ? 'verify \u00b7 record once' : 'no duplicate check';

    var st = t < 14.5 ? 0 : (!safe && t >= 17.5 ? 2 : 1);
    portal.material.color.setHex(st === 0 ? 0x58354B : st === 1 ? 0x2f5a42 : 0x6a2b2b);
    portalLab.small.textContent = st === 0 ? 'Fee balance: unpaid' : st === 1 ? (safe ? '1 confirmed payment' : '1 payment recorded') : '2 payments recorded';
    hCb.textContent = String((t >= 8.2 ? 1 : 0) + (t >= 9 ? 1 : 0));
    hPay.textContent = t >= 0.5 ? '1' : '0';
    hRec.textContent = String((t >= 14.5 ? 1 : 0) + (!safe && t >= 17.5 ? 1 : 0));
  }
  function draw() {
    if (!W || !H) return;
    apply();
    world.rotation.set(rc.rx, rc.ry, 0);
    camera.position.set(0, 3, dist); camera.lookAt(0, 0.8, 0);
    renderer.render(scene, camera);
    labels.forEach(function (L) {
      L.el.classList.toggle('is-off', !L.anchor.parent.visible);
      L.anchor.getWorldPosition(v); v.project(camera);
      L.el.style.transform = 'translate(' + ((v.x * 0.5 + 0.5) * W) + 'px,' + ((-v.y * 0.5 + 0.5) * H) + 'px) translate(-50%,-50%)';
    });
  }

  /* ---- controls ---- */
  function btn(x) { var b = el('button', 'btn btn--ghost flow3d__btn', x); b.type = 'button'; return b; }
  var bPrev = btn('Previous step'), bPlay = btn('Play'), bNext = btn('Next step'), bReset = btn('Reset view');
  var fs = el('fieldset'); fs.appendChild(el('legend', 'sr-only', 'Handler'));
  function radio(val, txt, on) {
    var l = el('label'), i = document.createElement('input'); i.type = 'radio'; i.name = 'flow3d-mode'; i.value = val; i.checked = on;
    l.appendChild(i); l.appendChild(document.createTextNode(' ' + txt)); fs.appendChild(l);
    i.addEventListener('change', function () { mode = val; tm = 0; stopAt = T_END; playing = !rm; lastKey = ''; req(); });
  }
  radio('naive', 'Without idempotency', true); radio('safe', 'With idempotency', false);
  var scrub = document.createElement('input'); scrub.type = 'range'; scrub.min = '0'; scrub.max = String(T_END); scrub.step = '0.05'; scrub.value = '0'; scrub.setAttribute('aria-label', 'Timeline');
  ctl.appendChild(fs); [bPrev, bPlay, bNext, bReset].forEach(function (b) { ctl.appendChild(b); }); ctl.appendChild(scrub);
  if (rm) bPlay.hidden = true;

  function goNext() {
    var target = T_END; for (var i = 0; i < STEPS.length; i++) { if (STEPS[i] > tm + 0.05) { target = STEPS[i]; break; } }
    if (rm) { tm = target; playing = false; } else { stopAt = target; playing = true; }
    req();
  }
  function goPrev() {
    var all = [0].concat(STEPS), target = 0; for (var i = all.length - 1; i >= 0; i--) { if (all[i] < tm - 0.05) { target = all[i]; break; } }
    tm = target; playing = false; stopAt = T_END; req();
  }
  bNext.addEventListener('click', goNext); bPrev.addEventListener('click', goPrev);
  bPlay.addEventListener('click', function () {
    if (playing) { playing = false; sync(); return; }
    if (tm >= T_END - 0.05) tm = 0;
    stopAt = T_END; playing = true; req();
  });
  bReset.addEventListener('click', function () { rt.rx = RX0; rt.ry = RY0; req(); });
  scrub.addEventListener('input', function () { tm = parseFloat(scrub.value); playing = false; stopAt = T_END; req(); });

  function sync() {
    var ph = phase(tm), key = mode + ph;
    if (key !== lastKey) { lastKey = key; cap.textContent = CAP[mode][ph]; }
    bPlay.textContent = playing ? 'Pause' : (tm >= T_END - 0.05 ? 'Replay' : 'Play');
    bPrev.disabled = tm <= 0.05; bNext.disabled = tm >= T_END - 0.05;
    scrub.value = String(tm); scrub.setAttribute('aria-valuetext', 'Step ' + (ph + 1) + ' of 5');
  }
  function frame(now) {
    raf = 0; var dt = Math.min(0.05, (now - lastNow) / 1000), busy = false; lastNow = now;
    if (playing) { tm += dt; busy = true; if (tm >= stopAt) { tm = stopAt; playing = false; busy = false; } }
    if (rm) { rc.rx = rt.rx; rc.ry = rt.ry; }
    else {
      rc.rx += (rt.rx - rc.rx) * 0.15; rc.ry += (rt.ry - rc.ry) * 0.15;
      if (Math.abs(rt.rx - rc.rx) > 0.001 || Math.abs(rt.ry - rc.ry) > 0.001) busy = true; else { rc.rx = rt.rx; rc.ry = rt.ry; }
    }
    draw(); sync();
    if (busy) raf = requestAnimationFrame(frame);
  }
  function req() { if (!raf) { lastNow = performance.now(); raf = requestAnimationFrame(frame); } }

  function resize() {
    W = stage.clientWidth; H = stage.clientHeight; if (!W || !H) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, W < 600 ? 1.5 : 2));
    renderer.setSize(W, H); camera.aspect = W / H; camera.updateProjectionMatrix();
    dist = Math.max(15, 31 / camera.aspect); draw(); sync();
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize', resize);

  var drag = false, lx = 0, ly = 0;
  canvas.addEventListener('pointerdown', function (e) { drag = true; lx = e.clientX; ly = e.clientY; try { canvas.setPointerCapture(e.pointerId); } catch (x) {} });
  canvas.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
    rt.ry = Math.max(-1.1, Math.min(0.6, rt.ry + dx * 0.008));
    if (e.pointerType !== 'touch') rt.rx = Math.max(0.08, Math.min(0.7, rt.rx + dy * 0.005));
    req();
  });
  canvas.addEventListener('pointerup', function () { drag = false; });
  canvas.addEventListener('pointercancel', function () { drag = false; });

  resize(); sync(); req();

  var started = false;
  new IntersectionObserver(function (es) {
    var e = es[0];
    if (e.intersectionRatio >= 0.5 && !started && !rm) { started = true; tm = 0; stopAt = T_END; playing = true; req(); }
    else if (e.intersectionRatio === 0 && playing) { playing = false; sync(); }
  }, { threshold: [0, 0.5] }).observe(stage);
}
})();