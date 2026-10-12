(function () {
'use strict';
var D = window.ARCH, root = document.getElementById('architecture');
if (!D || !root) return;
var byId = D.byId, R = D.root;
var rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
var path = [], sel = null, hover = null, three = null, exploded = false;

function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
function cur() { return path.length ? byId[path[path.length - 1]] : R; }
function where(id) { var p = byId[id].parent; return p && p !== R ? 'in ' + p.name : 'domain'; }

/* ---------------- DOM: toolbar, crumbs, list, detail ---------------- */
var list = document.getElementById('arch-nodes'), detail = document.getElementById('arch-detail'), stageEl = document.getElementById('arch-stage');
function tool(t) { var b = el('button', 'btn btn--ghost arch__tool', t); b.type = 'button'; return b; }
var bar = el('div', 'arch__tools'), crumbs = el('nav', 'arch__crumbs'), btns = el('div', 'arch__btns'), live = el('p', 'arch__sr');
crumbs.setAttribute('aria-label', 'Architecture breadcrumb'); live.setAttribute('role', 'status');
var bBack = tool('Back'), bTop = tool('Return to overview'), bEx = tool('Exploded view'), bRs = tool('Reset view');
bEx.setAttribute('aria-pressed', 'false'); bEx.hidden = true; bRs.hidden = true;
[bBack, bTop, bEx, bRs].forEach(function (b) { btns.appendChild(b); });
bar.appendChild(crumbs); bar.appendChild(btns); bar.appendChild(live);
if (stageEl && stageEl.parentNode) stageEl.parentNode.insertBefore(bar, stageEl); else list.parentNode.parentNode.insertBefore(bar, list.parentNode);

bBack.addEventListener('click', function () { navigate(path.slice(0, -1), { focus: true }); });
bTop.addEventListener('click', function () { navigate([], { focus: true }); });
bEx.addEventListener('click', function () { exploded = !exploded; bEx.setAttribute('aria-pressed', exploded ? 'true' : 'false'); if (three) three.explode(exploded); });
bRs.addEventListener('click', function () { if (three) three.reset(); select(null); });
root.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  if (sel) select(null); else if (path.length) navigate(path.slice(0, -1), { focus: true });
});

function renderCrumbs() {
  crumbs.textContent = '';
  var ol = el('ol');
  function item(label, np, last) {
    var li = el('li');
    if (last) { var s = el('span', '', label); s.setAttribute('aria-current', 'location'); li.appendChild(s); }
    else { var b = el('button', '', label); b.type = 'button'; b.addEventListener('click', function () { navigate(np, { focus: true }); }); li.appendChild(b); }
    ol.appendChild(li);
  }
  item('Overview', [], !path.length);
  path.forEach(function (id, i) { item(byId[id].name, path.slice(0, i + 1), i === path.length - 1); });
  crumbs.appendChild(ol);
  bBack.disabled = bTop.disabled = !path.length;
}

function related(id) {
  var sc = cur(), out = [];
  if (sc === R && (id === 'tenant' || id === 'controls')) return [{ n: 'All six operational domains', t: id === 'tenant' ? 'The school scopes every domain.' : 'Controls support every domain.' }];
  if (sc === R) { out.push({ n: 'School / Tenant', t: 'Scopes this domain.' }); out.push({ n: 'Engineering Controls', t: 'Supports this domain.' }); }
  sc.edges.forEach(function (e) { var o = e.a === id ? e.b : e.b === id ? e.a : null; if (o) out.push({ n: byId[o].name, t: e.t || 'Connected in this view.' }); });
  sc.ctxs.forEach(function (c) { if (c.to.indexOf(id) > -1) out.push({ n: byId[c.ref].name + ' (' + where(c.ref) + ')', t: c.t }); });
  return out;
}

function hov(b, id) {
  ['mouseenter', 'focus'].forEach(function (ev) { b.addEventListener(ev, function () { hover = id; if (three) three.apply(); }); });
  ['mouseleave', 'blur'].forEach(function (ev) { b.addEventListener(ev, function () { hover = null; if (three) three.apply(); }); });
}
function renderList() {
  list.textContent = '';
  var sc = cur();
  function head(t) { var h = el('li', 'arch__layer'); h.appendChild(el('span', 'eyebrow', t)); list.appendChild(h); }
  function row(n, i) {
    var li = el('li', 'arch__item'), b = el('button', 'arch__pick');
    b.type = 'button'; b.dataset.id = n.id; b.setAttribute('aria-pressed', sel === n.id ? 'true' : 'false');
    b.appendChild(el('span', 'arch__num', n.n || (sc === R ? '' : ('0' + (i + 1)).slice(-2))));
    b.appendChild(el('span', '', n.name));
    b.addEventListener('click', function () { select(sel === n.id ? null : n.id); });
    hov(b, n.id); li.appendChild(b);
    if (n.kids) {
      var o = el('button', 'arch__open', 'Open'); o.type = 'button'; o.setAttribute('aria-label', 'Open ' + n.name);
      o.addEventListener('click', function () { navigate(path.concat([n.id]), { focus: true }); }); li.appendChild(o);
    }
    list.appendChild(li);
  }
  if (sc === R) {
    head('Layer 1 \u00b7 Institutional boundary'); row(byId.tenant, 0);
    head('Layer 2 \u00b7 Operational domains');
    ['people', 'academic', 'learning', 'fees', 'resources', 'comms'].forEach(function (k, i) { row(byId[k], i); });
    head('Layer 3 \u00b7 Engineering foundation'); row(byId.controls, 0);
  } else {
    head('Inside \u00b7 ' + sc.name);
    sc.kids.forEach(row);
    if (sc.ctxs.length) {
      head('Connected from elsewhere');
      sc.ctxs.forEach(function (c) {
        var t = byId[c.ref], li = el('li', 'arch__item'), b = el('button', 'arch__pick'), s = el('span', '', t.name + ' \u00b7 ' + where(c.ref));
        b.type = 'button'; b.appendChild(el('span', 'arch__num', '\u2197')); s.appendChild(el('small', 'arch__rel', c.t)); b.appendChild(s);
        b.setAttribute('aria-label', 'Go to ' + t.name + ', ' + where(c.ref) + '. ' + c.t);
        b.addEventListener('click', function () { jump(c.ref); });
        hov(b, 'ctx:' + c.ref); li.appendChild(b); list.appendChild(li);
      });
    }
  }
}
function syncButtons() {
  [].forEach.call(list.querySelectorAll('.arch__pick[data-id]'), function (b) { b.setAttribute('aria-pressed', b.dataset.id === sel ? 'true' : 'false'); });
}

function renderDetail() {
  detail.textContent = '';
  var sc = cur(), n = sel ? byId[sel] : sc, isScene = n === sc;
  detail.appendChild(el('p', 'eyebrow', n === R ? 'Architecture overview' : isScene ? 'You are inside' : n.n ? 'Domain ' + n.n : n.parent === R ? 'Architecture layer' : 'Component'));
  detail.appendChild(el('h3', 'arch__dh', n.name));
  detail.appendChild(el('p', '', n.purpose));
  if (n === R) detail.appendChild(el('p', '', 'Click a domain to open its internal architecture, then click a component to go deeper. Exploded view separates the layers. Breadcrumbs, Back and Return to overview take you back up.'));
  else detail.appendChild(el('p', 'arch__status', n.ui ? 'This capability is visible in the demo admin dashboard (fictional, empty data). Its internal structure is conceptual.' : 'Conceptual architecture.'));
  if (n.kids) {
    detail.appendChild(el('p', 'arch__sub', isScene ? 'Components in this view' : 'Opens into'));
    var ul = el('ul'); n.kids.forEach(function (k) { ul.appendChild(el('li', '', k.name)); }); detail.appendChild(ul);
    if (!isScene) {
      var ob = el('button', 'btn btn--solid arch__openbtn', 'Open inside ' + n.name); ob.type = 'button';
      ob.addEventListener('click', function () { navigate(path.concat([n.id]), { focus: true }); }); detail.appendChild(ob);
    }
  }
  if (!isScene) {
    var rel = related(n.id);
    if (rel.length) {
      detail.appendChild(el('p', 'arch__sub', 'Conceptual relationships'));
      var u2 = el('ul'); rel.forEach(function (r) { u2.appendChild(el('li', '', r.n + ': ' + r.t)); }); detail.appendChild(u2);
    }
  }
  detail.appendChild(el('p', 'arch__fine', 'Conceptual view with fictional data. Component names, relationships and guarantees are not yet verified against the source code.'));
}

function select(id) { sel = id; syncButtons(); renderDetail(); if (three) three.apply(); }
function jump(ref) {
  var p = [], a = byId[ref].parent;
  for (; a && a !== R; a = a.parent) p.unshift(a.id);
  navigate(p, { select: ref, focus: true });
}
function navigate(np, o) {
  o = o || {};
  if (np.join('|') === path.join('|')) { select(o.select || null); return; }
  var dir = np.length > path.length ? 1 : np.length < path.length ? -1 : 0;
  var s = o.select; if (s === undefined && np.length < path.length) s = path[np.length];
  path = np; sel = s || null; hover = null;
  renderCrumbs(); renderList(); renderDetail();
  var sc = cur();
  live.textContent = path.length ? 'Opened ' + sc.name + '. ' + sc.kids.length + ' components.' : 'Showing the complete architecture.';
  if (three) three.swap(dir, o.fromId || null);
  if (o.focus) { var f = list.querySelector('button'); if (f) f.focus({ preventScroll: true }); }
}
renderCrumbs(); renderList(); renderDetail();

/* ---------------- 3D enhancement ---------------- */
function webgl() { try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; } }
(function setup() {
  if (!stageEl || !webgl() || (navigator.connection && navigator.connection.saveData) || !('IntersectionObserver' in window)) return;
  stageEl.hidden = false; stageEl.textContent = '';
  stageEl.appendChild(el('p', 'arch__loading', 'Loading 3D model...'));
  var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); load(); } }, { rootMargin: '250px' });
  io.observe(stageEl);
  function load() {
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js';
    s.onload = function () { try { build(stageEl); } catch (e) { stageEl.hidden = true; three = null; } };
    s.onerror = function () { stageEl.hidden = true; };
    document.head.appendChild(s);
  }
})();

function build(stage) {
  var T = window.THREE; stage.textContent = '';
  var GOLD = 0xC5A16A, IVORY = 0xF3EAE3, MAUVE = 0xA9829A, DUR = 280;
  var renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  var canvas = renderer.domElement; canvas.setAttribute('aria-hidden', 'true'); stage.appendChild(canvas);
  var scene = new T.Scene(), world = new T.Group(); scene.add(world);
  var camera = new T.PerspectiveCamera(40, 1, 0.1, 200);
  scene.add(new T.AmbientLight(0xffffff, 0.7));
  var dl = new T.DirectionalLight(0xffffff, 0.8); dl.position.set(4, 8, 6); scene.add(dl);
  var peek = el('div', 'arch__peek'), hint = el('div', 'arch__hint', 'Drag to rotate. Click a component to open it.'),
      legend = el('div', 'arch__legend', 'Slab: component \u00b7 Cylinder: record store \u00b7 Gem: event or external system');
  peek.setAttribute('aria-hidden', 'true'); hint.setAttribute('aria-hidden', 'true');
  stage.appendChild(peek); stage.appendChild(hint); stage.appendChild(legend);

  var SZ = { slab: [3, 0.5, 1.7], cyl: [2.3, 0.8, 2.3], gem: [2.2, 1.6, 2.2] };
  var items = {}, meshes = [], edges = [], adj = {}, plate = null, plateLab = null, plateAnchor = null, bnd = { mx: 5, mz: 4, minY: 0 };
  var RX0 = 0.42, RY0 = -0.45, t = { rx: RX0, ry: RY0 }, c = { rx: RX0, ry: RY0 };
  var exT = exploded ? 1 : 0, ex = exT, dist = 18, distT = 18, fade = 1, zoom = 1, look = { x: 0, y: 0 }, tr = null, raf = 0, W = 0, H = 0;
  var v = new T.Vector3(), ray = new T.Raycaster(), ndc = new T.Vector2();

  function ex3(p, e) { e = e == null ? ex : e; return [p[0] * (1 + 0.3 * e), p[1] * (1 + 0.9 * e), p[2] * (1 + 0.3 * e)]; }
  function ease(k) { return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }

  /* ----- layouts: each domain gets a distinct spatial structure ----- */
  function place(sc) {
    var k = sc.kids, n = k.length, P = {}, S = {}, i, L = sc.layout;
    k.forEach(function (x) { S[x.id] = SZ[x.shape || 'slab']; });
    if (L === 'overview') {
      P.tenant = [0, 3.4, 0]; S.tenant = [5, 0.3, 2.6]; P.controls = [0, -2.4, 0]; S.controls = [12.5, 0.4, 9.5];
      ['resources', 'people', 'academic', 'learning', 'comms', 'fees'].forEach(function (id, j) {
        var a = (j * 60 - 150) * Math.PI / 180; P[id] = [Math.cos(a) * 5.6, 0.4, Math.sin(a) * 4.4]; S[id] = SZ.slab;
      });
    } else if (L === 'hub') {
      P[k[0].id] = [0, 0.2, 0];
      for (i = 1; i < n; i++) { var a = (i - 1) / (n - 1) * 2 * Math.PI - Math.PI / 2, r = n > 5 ? 5.8 : 5; P[k[i].id] = [Math.cos(a) * r, i % 2 ? 0.5 : -0.3, Math.sin(a) * r * 0.8]; }
    } else if (L === 'ring') {
      var rr = Math.max(4.6, n * 0.85);
      k.forEach(function (x, j) { var a2 = j * 2 * Math.PI / n - Math.PI / 2; P[x.id] = [Math.cos(a2) * rr, 0, Math.sin(a2) * rr * 0.78]; });
    } else if (L === 'stack') {
      k.forEach(function (x, j) { P[x.id] = [j % 2 ? 1.1 : -1.1, ((n - 1) / 2 - j) * 1.7, 0]; });
    } else if (L === 'lanes') {
      k.forEach(function (x, j) { P[x.id] = [(j - (n - 1) / 2) * 4.3, j % 2 ? 0.35 : -0.1, j % 2 ? 1.1 : -1.1]; });
    } else if (L === 'rows') {
      var rows = (sc.rows || []).map(function (r2) { return r2.slice(); }), placed = {};
      rows.forEach(function (r2) { r2.forEach(function (key) { placed[key] = 1; }); });
      var extra = k.filter(function (x) { return !placed[x.key]; }).map(function (x) { return x.key; });
      if (extra.length) rows.push(extra);
      rows.forEach(function (r2, ri) {
        r2.forEach(function (key, j) {
          var node = k.filter(function (x) { return x.key === key; })[0]; if (!node) return;
          P[node.id] = [(j - (r2.length - 1) / 2) * 4.8, ((rows.length - 1) / 2 - ri) * 2.6, ri % 2 ? 1.3 : -1.3];
        });
      });
    }
    var maxX = 0; Object.keys(P).forEach(function (id) { maxX = Math.max(maxX, Math.abs(P[id][0]) + S[id][0] / 2); });
    sc.ctxs.forEach(function (cx, ci) { var id = 'ctx:' + cx.ref, side = ci % 2 ? 1 : -1; P[id] = [side * (maxX + 3.2), 0.6, -1.2 - Math.floor(ci / 2) * 2.8]; S[id] = SZ.slab; });
    return { pos: P, size: S };
  }

  function conn(a, b) { adj[a] = adj[a] || {}; adj[b] = adj[b] || {}; adj[a][b] = adj[b][a] = true; }
  function addEdge(a, b, color, op, drop) {
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(new Float32Array(6), 3));
    var l = new T.Line(g, new T.LineBasicMaterial({ color: color, transparent: true, opacity: op })); l.frustumCulled = false;
    world.add(l); edges.push({ line: l, a: a, b: b, base: op, drop: !!drop }); conn(a, b);
  }
  function add(a, pos, size) {
    var g;
    if (a.shape === 'cyl') g = new T.CylinderGeometry(size[0] / 2, size[0] / 2, size[1], 32);
    else if (a.shape === 'gem') { g = new T.OctahedronGeometry(size[0] / 2); g.scale(1, 0.8, 1); }
    else g = new T.BoxGeometry(size[0], size[1], size[2]);
    var col = a.ctx ? 0x2a1220 : a.shape === 'gem' ? 0x7a4a3a : a.shape === 'cyl' ? 0x4a2a40 : a.id === 'tenant' ? 0x6b3f5b : a.id === 'controls' ? 0x3a2233 : 0x58354B;
    var op = a.ctx ? 0.55 : a.id === 'controls' ? 0.85 : 0.95;
    var m = new T.Mesh(g, new T.MeshStandardMaterial({ color: col, roughness: 0.7, metalness: 0.1, transparent: true, opacity: op }));
    var e = new T.LineSegments(new T.EdgesGeometry(g, a.shape === 'cyl' ? 25 : 1), new T.LineBasicMaterial({ color: a.ctx ? MAUVE : GOLD, transparent: true, opacity: 0.75 }));
    m.add(e); m.userData.id = a.id; world.add(m); meshes.push(m);
    var lab = el('div', 'arch__label'); lab.setAttribute('aria-hidden', 'true'); stage.appendChild(lab);
    items[a.id] = { mesh: m, edge: e, label: lab, node: a.node, ctx: a.ctx, ref: a.ref, base: pos, size: size, baseOp: op, cur: pos.slice() };
  }

  function makeScene() {
    var sc = cur(), pl = place(sc), all = [];
    sc.kids.forEach(function (n) { all.push({ id: n.id, node: n, shape: n.shape || 'slab', ctx: false }); });
    sc.ctxs.forEach(function (cx) { all.push({ id: 'ctx:' + cx.ref, node: byId[cx.ref], shape: 'slab', ctx: true, ref: cx.ref }); });
    all.forEach(function (a) { add(a, pl.pos[a.id], pl.size[a.id]); });
    if (sc === R) {
      sc.edges.forEach(function (e) { addEdge(e.a, e.b, GOLD, 0.8); });
      ['people', 'academic', 'learning', 'fees', 'resources', 'comms'].forEach(function (d) { addEdge('tenant', d, GOLD, 0.25); addEdge(d, 'controls', MAUVE, 0.3, true); });
    } else {
      sc.edges.forEach(function (e) { addEdge(e.a, e.b, GOLD, 0.8); });
      sc.ctxs.forEach(function (cx) { cx.to.forEach(function (id) { addEdge('ctx:' + cx.ref, id, MAUVE, 0.55); }); });
    }
    var mx = 0, mz = 0, minY = 0;
    Object.keys(pl.pos).forEach(function (id) { var p = pl.pos[id], s = pl.size[id]; mx = Math.max(mx, Math.abs(p[0]) + s[0] / 2); mz = Math.max(mz, Math.abs(p[2]) + s[2] / 2); minY = Math.min(minY, p[1] - s[1] / 2); });
    bnd = { mx: mx, mz: mz, minY: minY };
    if (sc !== R) {
      plate = new T.Mesh(new T.BoxGeometry(1, 0.12, 1), new T.MeshStandardMaterial({ color: 0x3a2233, roughness: 0.9, transparent: true, opacity: 0.3 }));
      plateAnchor = new T.Object3D(); plateAnchor.position.set(0, 0, 0.5); plate.add(plateAnchor); world.add(plate);
      plateLab = el('div', 'arch__label arch__label--plate', 'Inside: ' + sc.name); plateLab.setAttribute('aria-hidden', 'true'); stage.appendChild(plateLab);
    }
    labels();
  }
  function clear() {
    Object.keys(items).forEach(function (id) {
      var it = items[id]; world.remove(it.mesh); it.mesh.geometry.dispose(); it.mesh.material.dispose(); it.edge.geometry.dispose(); it.edge.material.dispose();
      if (it.label.parentNode) it.label.parentNode.removeChild(it.label);
    });
    edges.forEach(function (e) { world.remove(e.line); e.line.geometry.dispose(); e.line.material.dispose(); });
    if (plate) { world.remove(plate); plate.geometry.dispose(); plate.material.dispose(); if (plateLab.parentNode) plateLab.parentNode.removeChild(plateLab); plate = null; }
    items = {}; meshes = []; edges = []; adj = {};
  }
  function labels() {
    Object.keys(items).forEach(function (id) {
      var it = items[id], n = it.node, s = (it.ctx ? '\u2197 ' : '') + (n.n && !it.ctx ? n.n + ' ' : '') + n.name;
      if (W && W < 560 && n.n && !it.ctx) s = n.n;
      it.label.textContent = s; it.label.classList.toggle('is-drill', !it.ctx && !!n.kids);
    });
  }
  function positions() {
    Object.keys(items).forEach(function (id) { var it = items[id], p = ex3(it.base); it.cur = p; it.mesh.position.set(p[0], p[1], p[2]); });
    edges.forEach(function (e) {
      var A = items[e.a].cur, B = items[e.b].cur, at = e.line.geometry.attributes.position;
      at.setXYZ(0, A[0], A[1], A[2]);
      if (e.drop) at.setXYZ(1, A[0], B[1] + 0.2, A[2]); else at.setXYZ(1, B[0], B[1], B[2]);
      at.needsUpdate = true;
    });
    if (plate) { plate.position.set(0, ex3([0, bnd.minY, 0])[1] - 1.6, 0); plate.scale.set((bnd.mx + 3) * 2 * (1 + 0.3 * ex), 1, (bnd.mz + 3) * 2 * (1 + 0.3 * ex)); }
  }
  function fit() {
    var tn = Math.tan(20 * Math.PI / 180), asp = camera.aspect || 1, Rm = 1, Hm = 1;
    Object.keys(items).forEach(function (id) {
      var it = items[id], p = ex3(it.base, exT), s = it.size;
      var hx = Math.abs(p[0]) + s[0] / 2 * (1 + 0.3 * exT), hz = Math.abs(p[2]) + s[2] / 2 * (1 + 0.3 * exT);
      Rm = Math.max(Rm, Math.sqrt(hx * hx + hz * hz)); Hm = Math.max(Hm, Math.abs(p[1]) + s[1]);
    });
    return Math.max(11, Math.max((Rm * 0.4 + Hm * 0.9) / tn, Rm * 1.05 / (tn * asp)));
  }

  function paint() {
    var d = hover || sel;
    Object.keys(items).forEach(function (id) {
      var it = items[id], on = !d || id === d || (adj[d] && adj[d][id]);
      it.mesh.material.opacity = it.baseOp * fade * (on ? 1 : 0.28);
      it.edge.material.opacity = fade * (on ? (id === d ? 1 : 0.75) : 0.2);
      it.edge.material.color.setHex(id === sel ? IVORY : (it.ctx ? MAUVE : GOLD));
      it.label.style.opacity = fade * (on ? 1 : 0.3);
    });
    edges.forEach(function (e) { e.line.material.opacity = fade * (!d ? e.base : ((e.a === d || e.b === d) ? 0.95 : 0.06)); });
    if (plate) { plate.material.opacity = 0.3 * fade; plateLab.style.opacity = fade; }
  }
  function updatePeek() {
    var id = hover || sel, it = id && items[id], sc = cur();
    peek.textContent = '';
    if (it) { peek.appendChild(el('strong', '', it.node.name + (it.ctx ? ' (' + where(it.ref) + ')' : ''))); peek.appendChild(document.createTextNode(' \u2014 ' + it.node.purpose)); }
    else { peek.appendChild(el('strong', '', sc === R ? sc.name : 'Inside: ' + sc.name)); peek.appendChild(document.createTextNode(' \u2014 ' + sc.purpose)); }
  }
  function draw() {
    world.rotation.set(c.rx, c.ry, 0);
    var d = dist * zoom, kx = look.x * 0.8, ky = look.y * 0.8;
    camera.position.set(kx, 1.5 + ky, d); camera.lookAt(kx, 0.4 + ky, 0); camera.updateMatrixWorld();
    renderer.render(scene, camera);
    function proj(obj, lab) { obj.getWorldPosition(v); v.project(camera); lab.style.transform = 'translate(' + ((v.x * 0.5 + 0.5) * W) + 'px,' + ((-v.y * 0.5 + 0.5) * H) + 'px) translate(-50%,-50%)'; }
    Object.keys(items).forEach(function (id) { proj(items[id].mesh, items[id].label); });
    if (plate) proj(plateAnchor, plateLab);
  }

  function rebuild() { clear(); makeScene(); positions(); distT = fit(); dist = distT; updatePeek(); }
  function frame(now) {
    raf = 0; var busy = false;
    if (rm) { c.rx = t.rx; c.ry = t.ry; ex = exT; dist = distT; }
    else {
      c.rx += (t.rx - c.rx) * 0.15; c.ry += (t.ry - c.ry) * 0.15; ex += (exT - ex) * 0.12; dist += (distT - dist) * 0.12;
      if (Math.abs(t.rx - c.rx) > 0.001 || Math.abs(t.ry - c.ry) > 0.001 || Math.abs(exT - ex) > 0.002 || Math.abs(distT - dist) > 0.02) busy = true;
      else { c.rx = t.rx; c.ry = t.ry; ex = exT; dist = distT; }
    }
    if (tr) {
      busy = true; var dt = now - tr.t0;
      if (tr.phase === 0) {
        var k = Math.min(1, dt / DUR), e1 = ease(k);
        fade = 1 - e1; zoom = 1 + ((tr.dir > 0 ? 0.55 : tr.dir < 0 ? 1.4 : 0.8) - 1) * e1; look.x = tr.pos.x * e1; look.y = tr.pos.y * e1;
        if (k >= 1) { rebuild(); tr.phase = 1; tr.t0 = now; }
      } else {
        var k2 = Math.min(1, dt / DUR), e2 = ease(k2), z0 = tr.dir > 0 ? 1.6 : tr.dir < 0 ? 0.6 : 1.3;
        fade = e2; zoom = z0 + (1 - z0) * e2; look.x = 0; look.y = 0;
        if (k2 >= 1) { tr = null; fade = 1; zoom = 1; }
      }
    }
    positions(); paint(); draw();
    if (busy) raf = requestAnimationFrame(frame);
  }
  function req() { if (!raf) raf = requestAnimationFrame(frame); }

  three = {
    apply: function () { updatePeek(); req(); },
    swap: function (dir, fromId) {
      if (rm) { rebuild(); fade = 1; zoom = 1; req(); return; }
      var pos = { x: 0, y: 0 };
      if (dir > 0 && fromId && items[fromId]) { items[fromId].mesh.getWorldPosition(v); pos = { x: v.x, y: v.y }; }
      tr = { phase: 0, t0: performance.now(), dir: dir, pos: pos }; req();
    },
    reset: function () { t.rx = RX0; t.ry = RY0; req(); },
    explode: function (on) { exT = on ? 1 : 0; distT = fit(); req(); }
  };

  function resize() {
    W = stage.clientWidth; H = stage.clientHeight; if (!W || !H) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, W < 600 ? 1.5 : 2));
    renderer.setSize(W, H); camera.aspect = W / H; camera.updateProjectionMatrix();
    distT = fit(); dist = distT; labels(); positions(); paint(); draw();
  }

  function pick(e) {
    var r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    var h = ray.intersectObjects(meshes, false); return h.length ? h[0].object.userData.id : null;
  }
  function activate(id) {
    var it = items[id]; if (!it) return;
    if (it.ctx) { jump(it.ref); return; }
    if (it.node.kids) navigate(path.concat([it.node.id]), { fromId: id });
    else select(sel === id ? null : id);
  }
  var drag = false, moved = 0, lx = 0, ly = 0;
  canvas.addEventListener('pointerdown', function (e) { drag = true; moved = 0; lx = e.clientX; ly = e.clientY; try { canvas.setPointerCapture(e.pointerId); } catch (x) {} });
  canvas.addEventListener('pointermove', function (e) {
    if (tr) return;
    if (drag) {
      var dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
      t.ry += dx * 0.008; if (e.pointerType !== 'touch') t.rx = Math.max(0.12, Math.min(0.85, t.rx + dy * 0.005)); req();
    } else if (e.pointerType === 'mouse') {
      var id = pick(e); if (id !== hover) { hover = id; canvas.style.cursor = id ? 'pointer' : 'grab'; three.apply(); }
    }
  });
  canvas.addEventListener('pointerup', function (e) { if (drag && moved < 6 && !tr) { var id = pick(e); if (id) activate(id); } drag = false; });
  canvas.addEventListener('pointercancel', function () { drag = false; });
  canvas.addEventListener('pointerleave', function () { if (hover) { hover = null; three.apply(); } });

  makeScene(); positions();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize', resize);
  bEx.hidden = false; bRs.hidden = false; bEx.setAttribute('aria-pressed', exploded ? 'true' : 'false');
  resize(); three.apply();
}
})();