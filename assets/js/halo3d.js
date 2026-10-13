/* ─────────────────────────────────────────────────────────────────────────
   halo3d.js — Hero "orbital halo": a small real-time WebGL scene
   ─────────────────────────────────────────────────────────────────────────
   Three glass-like lavender rings and two orbiting beads behind the hero
   headline, echoing the circle of the Universe Healing Haven mark.

   Written in raw WebGL (no Three.js) to keep the payload ~10 KB:
   - Starts only after window load + idle time, so it never delays the hero.
   - Renders only while the hero is on screen and the tab is visible.
   - Mobile: lower pixel ratio, fewer segments, 30 fps cap.
   - prefers-reduced-motion: renders one static frame, no loop.
   - Low-end devices / no WebGL / context loss: the static SVG halo already
     in the markup stays visible instead (.hero-halo without .is-3d).
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var hero = document.querySelector('.hero-section');
  var holder = hero && hero.querySelector('.hero-halo');
  if (!holder) return;

  var nav = navigator;
  var lowEnd =
    (nav.connection && nav.connection.saveData) ||
    (nav.deviceMemory && nav.deviceMemory <= 2) ||
    (nav.hardwareConcurrency && nav.hardwareConcurrency <= 2);
  if (lowEnd) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var isMobile = window.matchMedia('(max-width: 768px)').matches;

  /* ── Minimal 4×4 matrix helpers (column-major, like WebGL) ─────────── */
  function ident() { return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]; }
  function mul(a, b) {
    var o = new Array(16);
    for (var c = 0; c < 4; c++) {
      for (var r = 0; r < 4; r++) {
        o[c * 4 + r] =
          a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
      }
    }
    return o;
  }
  function rotX(t) { var c = Math.cos(t), s = Math.sin(t); return [1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]; }
  function rotY(t) { var c = Math.cos(t), s = Math.sin(t); return [c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]; }
  function rotZ(t) { var c = Math.cos(t), s = Math.sin(t); return [c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]; }
  function trans(x, y, z) { return [1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1]; }
  function scale(s) { return [s,0,0,0, 0,s,0,0, 0,0,s,0, 0,0,0,1]; }
  function persp(fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return [f / aspect,0,0,0, 0,f,0,0, 0,0,(far + near) * nf,-1, 0,0,2 * far * near * nf,0];
  }
  var DEG = Math.PI / 180;

  /* ── Geometry ──────────────────────────────────────────────────────── */
  function torus(R, r, radial, tubular) {
    var pos = [], nor = [], idx = [];
    for (var j = 0; j <= radial; j++) {
      var v = (j / radial) * Math.PI * 2;
      for (var i = 0; i <= tubular; i++) {
        var u = (i / tubular) * Math.PI * 2;
        var cx = Math.cos(u) * R, cy = Math.sin(u) * R;
        var x = (R + r * Math.cos(v)) * Math.cos(u);
        var y = (R + r * Math.cos(v)) * Math.sin(u);
        var z = r * Math.sin(v);
        pos.push(x, y, z);
        var nx = x - cx, ny = y - cy, nz = z, l = Math.hypot(nx, ny, nz) || 1;
        nor.push(nx / l, ny / l, nz / l);
      }
    }
    for (j = 1; j <= radial; j++) {
      for (i = 1; i <= tubular; i++) {
        var a = (tubular + 1) * j + i - 1, b = (tubular + 1) * (j - 1) + i - 1;
        var c = (tubular + 1) * (j - 1) + i, d = (tubular + 1) * j + i;
        idx.push(a, b, d, b, c, d);
      }
    }
    return { pos: pos, nor: nor, idx: idx };
  }

  function sphere(r, ws, hs) {
    var pos = [], nor = [], idx = [];
    for (var y = 0; y <= hs; y++) {
      var v = y / hs, th = v * Math.PI;
      for (var x = 0; x <= ws; x++) {
        var u = x / ws, ph = u * Math.PI * 2;
        var nx = -Math.cos(ph) * Math.sin(th), ny = Math.cos(th), nz = Math.sin(ph) * Math.sin(th);
        pos.push(nx * r, ny * r, nz * r);
        nor.push(nx, ny, nz);
      }
    }
    for (y = 0; y < hs; y++) {
      for (x = 0; x < ws; x++) {
        var a = y * (ws + 1) + x, b = a + ws + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    return { pos: pos, nor: nor, idx: idx };
  }

  /* ── Shaders: fresnel "glass" with soft key light + depth fade ─────── */
  var VS =
    'attribute vec3 aPos; attribute vec3 aNor;' +
    'uniform mat4 uMV; uniform mat4 uP;' +
    'varying vec3 vN; varying vec3 vV; varying float vZ;' +
    'void main(){' +
    '  vec4 mv = uMV * vec4(aPos, 1.0);' +
    '  vN = mat3(uMV) * aNor; vV = -mv.xyz; vZ = mv.z;' +
    '  gl_Position = uP * mv;' +
    '}';

  var FS =
    'precision mediump float;' +
    'varying vec3 vN; varying vec3 vV; varying float vZ;' +
    'uniform vec3 uTint; uniform vec3 uRim; uniform float uAlpha;' +
    'void main(){' +
    '  vec3 N = normalize(vN); vec3 V = normalize(vV);' +
    '  if (!gl_FrontFacing) N = -N;' +
    '  float fr = pow(1.0 - clamp(abs(dot(N, V)), 0.0, 1.0), 2.2);' +
    '  vec3 L = normalize(vec3(-0.45, 0.75, 0.6));' +
    '  float diff = max(dot(N, L), 0.0);' +
    '  float spec = pow(max(dot(reflect(-L, N), V), 0.0), 36.0);' +
    '  vec3 col = mix(uTint, uRim, fr * 0.7) * (0.72 + 0.28 * diff) + vec3(spec);' +
    '  float depth = mix(0.42, 1.0, smoothstep(-9.5, -5.5, vZ));' +
    '  float a = uAlpha * (0.28 + 0.72 * fr) * depth * (gl_FrontFacing ? 1.0 : 0.55) + spec * 0.55;' +
    '  a = clamp(a, 0.0, 1.0);' +
    '  gl_FragColor = vec4(col * a, a);' +
    '}';

  function hexToVec(h) {
    var n = parseInt(h.slice(1), 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }

  /* ── Boot: wait for load + idle so the hero paints first ───────────── */
  function whenIdle(fn) {
    var go = function () {
      if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout: 1500 });
      else setTimeout(fn, 200);
    };
    if (document.readyState === 'complete') go();
    else window.addEventListener('load', go, { once: true });
  }

  whenIdle(function init() {
    var canvas = document.createElement('canvas');
    canvas.className = 'hero-halo-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    var gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: 'low-power' });
    if (!gl) return; // static SVG halo remains

    function compile(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    }
    var vs = compile(gl.VERTEX_SHADER, VS), fs = compile(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    var loc = {
      pos: gl.getAttribLocation(prog, 'aPos'),
      nor: gl.getAttribLocation(prog, 'aNor'),
      mv: gl.getUniformLocation(prog, 'uMV'),
      p: gl.getUniformLocation(prog, 'uP'),
      tint: gl.getUniformLocation(prog, 'uTint'),
      rim: gl.getUniformLocation(prog, 'uRim'),
      alpha: gl.getUniformLocation(prog, 'uAlpha')
    };

    var buffers = [];
    function upload(geo) {
      var pb = gl.createBuffer(), nb = gl.createBuffer(), ib = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, pb);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geo.pos), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, nb);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geo.nor), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(geo.idx), gl.STATIC_DRAW);
      buffers.push(pb, nb, ib);
      return { pb: pb, nb: nb, ib: ib, count: geo.idx.length };
    }

    var q = isMobile ? 0.6 : 1; // segment quality
    var lavender = hexToVec('#D6B4FF'), soft = hexToVec('#E6D0FF'), light = hexToVec('#E0C6FF');
    var deep = hexToVec('#9B7DD4'), white = [1, 1, 1];

    // Scene objects (static geometry, animated transforms)
    var ringGlass = upload(torus(2.25, 0.034, Math.round(18 * q), Math.round(160 * q)));
    var ringFrame = upload(torus(1.78, 0.011, 8, Math.round(150 * q)));
    var ringCross = upload(torus(2.02, 0.008, 8, Math.round(150 * q)));
    var bead = upload(sphere(1, Math.round(28 * q), Math.round(18 * q)));

    gl.enableVertexAttribArray(loc.pos);
    gl.enableVertexAttribArray(loc.nor);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    function draw(mesh, model, view, tint, rim, alpha) {
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.pb);
      gl.vertexAttribPointer(loc.pos, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.nb);
      gl.vertexAttribPointer(loc.nor, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ib);
      gl.uniformMatrix4fv(loc.mv, false, new Float32Array(mul(view, model)));
      gl.uniform3fv(loc.tint, tint);
      gl.uniform3fv(loc.rim, rim);
      gl.uniform1f(loc.alpha, alpha);
      gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
    }

    /* ── Sizing ── */
    var W = 0, H = 0, aspect = 1, fit = 1, anchorY = 0, proj = ident();
    var headline = hero.querySelector('.hero-headline');
    var dprCap = isMobile ? 1.25 : 1.75;
    var FOV = 30 * DEG, CAM_Z = 7.2;
    function resize() {
      var r = holder.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      W = Math.max(1, Math.round(r.width * dpr));
      H = Math.max(1, Math.round(r.height * dpr));
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      gl.viewport(0, 0, W, H);
      aspect = W / H;
      proj = persp(FOV, aspect, 0.1, 50);
      // keep the widest ring inside the viewport on narrow screens
      var halfW = Math.tan(FOV / 2) * CAM_Z * aspect;
      fit = Math.min(1, (halfW * 0.96) / 2.32);
      // centre the halo on the headline (world units), wherever the layout puts it
      if (headline) {
        var hr = headline.getBoundingClientRect();
        var offPx = (r.top + r.height / 2) - (hr.top + hr.height / 2);
        anchorY = (offPx / (r.height / 2)) * Math.tan(FOV / 2) * CAM_Z;
      }
      gl.uniformMatrix4fv(loc.p, false, new Float32Array(proj));
    }

    /* ── Interaction state ── */
    var px = 0, py = 0, tx = 0, ty = 0; // pointer (lerped / target)
    var scrollP = 0;
    if (finePointer && !reduceMotion) {
      window.addEventListener('pointermove', function (e) {
        tx = (e.clientX / window.innerWidth) * 2 - 1;
        ty = (e.clientY / window.innerHeight) * 2 - 1;
      }, { passive: true });
    }
    function readScroll() {
      var h = hero.offsetHeight || 1;
      scrollP = Math.min(1, Math.max(0, window.scrollY / h));
    }

    /* ── Frame ── */
    var TAU = Math.PI * 2;
    var glassAlpha = isMobile ? 0.34 : 0.44;
    function render(t) {
      var s = t / 1000;
      px += (tx - px) * 0.045;
      py += (ty - py) * 0.045;

      var group = mul(
        trans(0, anchorY + scrollP * 0.55, 0),
        mul(
          rotX((-4 + Math.sin(s * TAU / 15) * 1.6 + py * 3 + scrollP * 14) * DEG),
          mul(rotY((Math.sin(s * TAU / 12) * 3.2 + px * 5) * DEG), scale(fit))
        )
      );
      var view = trans(0, 0, -CAM_Z);
      var fade = 1 - scrollP * 0.7;

      gl.clear(gl.COLOR_BUFFER_BIT);

      // 1 · Thin frame circle — nearly facing the viewer, gently breathing
      var breathe = 1 + Math.sin(s * TAU / 10) * 0.012;
      var mFrame = mul(group, mul(rotX(14 * DEG), mul(rotY(-10 * DEG), scale(breathe))));
      draw(ringFrame, mFrame, view, soft, deep, 0.5 * fade);

      // 2 · Crossing ring — slow precession
      var mCross = mul(group, mul(rotY((38 + s * 4) * DEG), rotX(62 * DEG)));
      draw(ringCross, mCross, view, light, deep, 0.36 * fade);

      // 3 · Glass orbit ring — wide, tilted like an orbit around the headline
      var tiltA = mul(rotZ((-7 + Math.sin(s * TAU / 14) * 2) * DEG), rotX(77 * DEG));
      var mGlass = mul(group, tiltA);
      draw(ringGlass, mGlass, view, lavender, deep, glassAlpha * fade);

      // 4 · Two beads travelling along the glass ring (opposite directions)
      var a1 = s * TAU / 48, a2 = -s * TAU / 70 + 2.4;
      var b1 = mul(mGlass, mul(trans(Math.cos(a1) * 2.25, Math.sin(a1) * 2.25, 0), scale(0.075)));
      var b2 = mul(mGlass, mul(trans(Math.cos(a2) * 2.25, Math.sin(a2) * 2.25, 0), scale(0.048)));
      draw(bead, b1, view, soft, deep, 0.85 * fade);
      draw(bead, b2, view, white, lavender, 0.8 * fade);
    }

    /* ── Loop control: only run while visible ── */
    var running = false, rafId = 0, last = 0, onScreen = true;
    var minDelta = isMobile ? 1000 / 30 : 0;
    function loop(t) {
      if (!running) return;
      rafId = requestAnimationFrame(loop);
      if (minDelta && t - last < minDelta) return;
      last = t;
      render(t);
    }
    function start() {
      if (running || reduceMotion || !onScreen || document.hidden) return;
      running = true;
      rafId = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(rafId);
    }

    holder.appendChild(canvas);
    resize();
    readScroll();
    render(reduceMotion ? 0 : performance.now());
    // Reveal the canvas and retire the static SVG fallback
    requestAnimationFrame(function () { holder.classList.add('is-3d'); });

    if (reduceMotion) {
      // One static frame; re-render only on size changes
      new ResizeObserver(function () { resize(); render(0); }).observe(holder);
    } else {
      new ResizeObserver(resize).observe(holder);
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        if (onScreen) start(); else stop();
      }).observe(hero);
      window.addEventListener('scroll', readScroll, { passive: true });
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) stop(); else start();
      });
      start();
    }

    canvas.addEventListener('webglcontextlost', function (e) {
      e.preventDefault();
      stop();
      holder.classList.remove('is-3d'); // fall back to the static SVG halo
    });

    // Free GPU resources when the page is really unloaded (kept for bfcache restores)
    window.addEventListener('pagehide', function (e) {
      stop();
      if (e.persisted) return;
      buffers.forEach(function (b) { gl.deleteBuffer(b); });
      gl.deleteProgram(prog);
    });
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) start();
    });
  });
})();
