/* A small, dependency-free WebGL viewer for the anatomy models (orbit, pinch zoom, tap to pick). */
(function (HA) {
  'use strict';

  // ---------- model loading ----------
  var cache = {};
  function parse(buf) {
    var dv = new DataView(buf);
    var hl = dv.getUint32(0, true);
    var hdr = JSON.parse(new TextDecoder('utf-8').decode(new Uint8Array(buf, 4, hl)));
    var base = 4 + hl;
    var meshes = hdr.meshes.map(function (m) {
      return {
        name: m.name, color: m.color, opacity: m.opacity, nv: m.nv, ni: m.ni, bmin: m.bmin, bmax: m.bmax,
        pos: new Uint16Array(buf, base + m.pos, m.nv * 3),
        nor: m.nor >= 0 ? new Int8Array(buf, base + m.nor, m.nv * 3) : null,
        idx: m.idx32 ? new Uint32Array(buf, base + m.idx, m.ni) : new Uint16Array(buf, base + m.idx, m.ni)
      };
    });
    var mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
    meshes.forEach(function (m) { for (var a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], m.bmin[a]); mx[a] = Math.max(mx[a], m.bmax[a]); } });
    return { meshes: meshes, bmin: mn, bmax: mx };
  }
  HA.models = {
    load: function (url) {
      if (!cache[url]) {
        cache[url] = fetch(url).then(function (r) {
          if (!r.ok) throw new Error('Could not load ' + url);
          return r.arrayBuffer();
        }).then(parse);
        cache[url].catch(function () { delete cache[url]; });
      }
      return cache[url];
    }
  };
  // A soft sphere (used for the see-through lung shapes in the Organ Lab).
  HA.sphereModel = function (radius, color, opacity) {
    var lat = 20, lon = 28, p = [], n = [], idx = [];
    for (var i = 0; i <= lat; i++) {
      var th = Math.PI * i / lat;
      for (var j = 0; j <= lon; j++) {
        var ph = 2 * Math.PI * j / lon;
        var x = Math.sin(th) * Math.cos(ph), y = Math.cos(th), z = Math.sin(th) * Math.sin(ph);
        p.push(Math.round((x * radius / (2 * radius) + 0.5) * 65535), Math.round((y * radius / (2 * radius) + 0.5) * 65535), Math.round((z * radius / (2 * radius) + 0.5) * 65535));
        n.push(Math.round(x * 127), Math.round(y * 127), Math.round(z * 127));
      }
    }
    for (var a = 0; a < lat; a++) for (var b = 0; b < lon; b++) {
      var f = a * (lon + 1) + b, s = f + lon + 1;
      idx.push(f, s, f + 1, s, s + 1, f + 1);
    }
    var mesh = { name: 'sphere', color: color, opacity: opacity, nv: p.length / 3, ni: idx.length,
      bmin: [-radius, -radius, -radius], bmax: [radius, radius, radius],
      pos: new Uint16Array(p), nor: new Int8Array(n), idx: new Uint16Array(idx) };
    return { meshes: [mesh], bmin: mesh.bmin, bmax: mesh.bmax };
  };

  // ---------- tiny matrix helpers (column-major) ----------
  function ident() { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); }
  function mul(a, b) {
    var o = new Float32Array(16);
    for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) {
      var s = 0; for (var k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      o[c * 4 + r] = s;
    }
    return o;
  }
  function persp(fovy, asp, n, f) {
    var t = 1 / Math.tan(fovy / 2), o = new Float32Array(16);
    o[0] = t / asp; o[5] = t; o[10] = (f + n) / (n - f); o[11] = -1; o[14] = 2 * f * n / (n - f);
    return o;
  }
  function lookAt(e, c, u) {
    var zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2], zl = Math.hypot(zx, zy, zz); zx /= zl; zy /= zl; zz /= zl;
    var xx = u[1] * zz - u[2] * zy, xy = u[2] * zx - u[0] * zz, xz = u[0] * zy - u[1] * zx, xl = Math.hypot(xx, xy, xz); xx /= xl; xy /= xl; xz /= xl;
    var yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    return new Float32Array([xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
      -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1]);
  }
  function objMatrix(o) {
    var s = o.scale, cy = Math.cos(o.ry || 0), sy = Math.sin(o.ry || 0), cz = Math.cos(o.rz || 0), sz = Math.sin(o.rz || 0);
    // M = T * Rz * Ry * S
    var ry = new Float32Array([cy, 0, -sy, 0, 0, 1, 0, 0, sy, 0, cy, 0, 0, 0, 0, 1]);
    var rz = new Float32Array([cz, sz, 0, 0, -sz, cz, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    var sm = new Float32Array([s[0], 0, 0, 0, 0, s[1], 0, 0, 0, 0, s[2], 0, 0, 0, 0, 1]);
    var m = mul(rz, mul(ry, sm));
    m[12] = o.pos[0]; m[13] = o.pos[1]; m[14] = o.pos[2];
    return m;
  }
  function normalMat(m) { // inverse transpose of the upper 3x3
    var a = m[0], b = m[1], c = m[2], d = m[4], e = m[5], f = m[6], g = m[8], h = m[9], i = m[10];
    var A = e * i - f * h, B = f * g - d * i, C = d * h - e * g;
    var det = a * A + b * B + c * C; if (Math.abs(det) < 1e-12) det = 1;
    var id = 1 / det;
    return new Float32Array([A * id, (c * h - b * i) * id, (b * f - c * e) * id,
      B * id, (a * i - c * g) * id, (c * d - a * f) * id,
      C * id, (b * g - a * h) * id, (a * e - b * d) * id]);
  }

  var VS = 'attribute vec3 aPos;attribute vec3 aNor;uniform mat4 uVP;uniform mat4 uModel;uniform mat3 uNM;uniform vec3 uBmin;uniform vec3 uBext;varying vec3 vN;varying vec3 vP;' +
    'void main(){vec3 p=uBmin+aPos*uBext;vec4 w=uModel*vec4(p,1.0);vP=w.xyz;vN=uNM*aNor;gl_Position=uVP*w;}';
  var FS = 'precision mediump float;uniform vec3 uColor;uniform float uAlpha;uniform float uEmit;uniform vec3 uCam;uniform vec3 uL1;uniform vec3 uL2;varying vec3 vN;varying vec3 vP;' +
    'void main(){vec3 n=normalize(vN);if(!gl_FrontFacing)n=-n;vec3 v=normalize(uCam-vP);vec3 l1=normalize(uL1);vec3 l2=normalize(uL2);' +
    'float d1=max(dot(n,l1),0.0);float d2=max(dot(n,l2),0.0);vec3 h=normalize(l1+v);float sp=pow(max(dot(n,h),0.0),36.0)*0.22;' +
    'float hemi=0.5+0.5*n.y;vec3 col=uColor*(0.34+0.18*hemi+0.62*d1+0.2*d2)+vec3(sp)+vec3(uEmit);' +
    'col=min(col,vec3(1.0));gl_FragColor=vec4(col*uAlpha,uAlpha);}';
  var PFS = 'precision mediump float;uniform vec3 uId;void main(){gl_FragColor=vec4(uId,1.0);}';

  function compile(gl, type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function program(gl, vs, fs) {
    var p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs)); gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'aPos'); gl.bindAttribLocation(p, 1, 'aNor');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) { var info = gl.getActiveUniform(p, i); u[info.name] = gl.getUniformLocation(p, info.name); }
    return { p: p, u: u };
  }

  HA.webglSupported = function () {
    try { var c = document.createElement('canvas'); return !!(c.getContext('webgl') || c.getContext('experimental-webgl')); } catch (e) { return false; }
  };

  // ---------- viewer ----------
  function Viewer(canvas, opts) {
    opts = opts || {};
    this.canvas = canvas;
    this.fov = (opts.fov || 42) * Math.PI / 180;
    var gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: true, depth: true }) ||
      canvas.getContext('experimental-webgl');
    if (!gl) throw new Error('WebGL is not available');
    this.gl = gl;
    this.prog = program(gl, VS, FS);
    this.pickProg = program(gl, VS, PFS);
    this.gpu = new Map();
    this.objects = [];
    this.target = [0, 0, 0]; this.dist = 5; this.yaw = 0; this.pitch = 0.15;
    this.home = { target: [0, 0, 0], dist: 5, yaw: 0, pitch: 0.15 };
    this.minDist = 0.5; this.maxDist = 60;
    this.autoRotate = false; this.autoSpeed = 0.35;
    this.dirty = true; this.raf = 0; this.visible = true; this.disposed = false;
    this.onPick = null; this.onFrame = null;
    this.interactive = true;
    this._pts = new Map(); this._down = null; this._dragging = false; this._last = performance.now();
    this._bind();
    var self = this;
    if (window.ResizeObserver) { this._ro = new ResizeObserver(function () { self._resize(); }); this._ro.observe(canvas); }
    this._vis = function () { if (!document.hidden) self.invalidate(); };
    document.addEventListener('visibilitychange', this._vis);
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); });
    canvas.addEventListener('webglcontextrestored', function () { self.gpu = new Map(); self.pickFbo = null; self.invalidate(); });
    this._resize();
  }
  Viewer.prototype._ensureIO = function () {
    if (this._io || this._ioTried || !this.canvas.isConnected || !window.IntersectionObserver) return;
    this._ioTried = true;
    var self = this;
    this._io = new IntersectionObserver(function (e) { self.visible = e[e.length - 1].isIntersecting; if (self.visible) self.invalidate(); });
    this._io.observe(this.canvas);
  };
  Viewer.prototype._resize = function () {
    this._ensureIO();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(2, Math.round(this.canvas.clientWidth * dpr)), h = Math.max(2, Math.round(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; this.pickFbo = null; }
    this.invalidate();
  };
  Viewer.prototype._bind = function () {
    var self = this, c = this.canvas;
    c.style.touchAction = 'none';
    if (!c.hasAttribute('tabindex')) c.setAttribute('tabindex', '0');
    c.addEventListener('pointerdown', function (e) {
      if (!self.interactive) return;
      try { c.setPointerCapture(e.pointerId); } catch (x) {}
      self._pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (self._pts.size === 1) { self._down = { x: e.clientX, y: e.clientY, t: Date.now(), moved: 0 }; self._dragging = true; }
      else { self._down = null; self._pinch = self._pinchDist(); }
    });
    c.addEventListener('pointermove', function (e) {
      var p = self._pts.get(e.pointerId); if (!p) return;
      var dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      if (self._pts.size === 1) {
        if (self._down) self._down.moved += Math.abs(dx) + Math.abs(dy);
        self.yaw -= dx * 0.009; self.pitch = Math.max(-1.45, Math.min(1.45, self.pitch + dy * 0.009));
        self.invalidate();
      } else if (self._pts.size === 2) {
        var d = self._pinchDist();
        if (self._pinch > 0 && d > 0) { self.zoomBy(self._pinch / d); }
        self._pinch = d;
      }
    });
    function up(e) {
      var had = self._pts.has(e.pointerId);
      self._pts.delete(e.pointerId);
      if (had && self._pts.size === 0) {
        self._dragging = false;
        var d = self._down;
        if (d && d.moved < 8 && Date.now() - d.t < 600 && e.type === 'pointerup' && self.onPick) {
          var r = c.getBoundingClientRect();
          var o = self.pick(e.clientX - r.left, e.clientY - r.top);
          self.onPick(o);
        }
        self._down = null;
      }
    }
    c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
    c.addEventListener('wheel', function (e) {
      if (!self.interactive) return;
      e.preventDefault(); self.zoomBy(Math.exp(e.deltaY * 0.0012));
    }, { passive: false });
    c.addEventListener('keydown', function (e) {
      var k = e.key, used = true;
      if (k === 'ArrowLeft') self.yaw += 0.15; else if (k === 'ArrowRight') self.yaw -= 0.15;
      else if (k === 'ArrowUp') self.pitch = Math.min(1.45, self.pitch + 0.12); else if (k === 'ArrowDown') self.pitch = Math.max(-1.45, self.pitch - 0.12);
      else if (k === '+' || k === '=') self.zoomBy(0.88); else if (k === '-' || k === '_') self.zoomBy(1.14);
      else used = false;
      if (used) { e.preventDefault(); self.invalidate(); }
    });
  };
  Viewer.prototype._pinchDist = function () {
    var a = Array.from(this._pts.values()); if (a.length < 2) return 0;
    return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
  };
  Viewer.prototype.zoomBy = function (f) { this.dist = Math.max(this.minDist, Math.min(this.maxDist, this.dist * f)); this.invalidate(); };
  Viewer.prototype.setHome = function (target, dist, yaw, pitch) {
    this.home = { target: target.slice(), dist: dist, yaw: yaw || 0, pitch: pitch === undefined ? 0.15 : pitch };
    this.minDist = dist * 0.25; this.maxDist = dist * 3;
    this.resetView();
  };
  Viewer.prototype.resetView = function () {
    var h = this.home; this.target = h.target.slice(); this.dist = h.dist; this.yaw = h.yaw; this.pitch = h.pitch; this.invalidate();
  };
  Viewer.prototype.add = function (obj) {
    obj.pos = obj.pos || [0, 0, 0];
    obj.scale = typeof obj.scale === 'number' ? [obj.scale, obj.scale, obj.scale] : (obj.scale || [1, 1, 1]);
    if (obj.pickable === undefined) obj.pickable = true;
    this.objects.push(obj); this.invalidate(); return obj;
  };
  Viewer.prototype.clear = function () { this.objects = []; this.invalidate(); };
  Viewer.prototype.bounds = function (list) {
    var mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
    (list || this.objects).forEach(function (o) {
      for (var a = 0; a < 3; a++) {
        var lo = o.pos[a] + o.model.bmin[a] * o.scale[a], hi = o.pos[a] + o.model.bmax[a] * o.scale[a];
        mn[a] = Math.min(mn[a], lo, hi); mx[a] = Math.max(mx[a], lo, hi);
      }
    });
    return { min: mn, max: mx, center: [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2],
      radius: Math.hypot(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]) / 2 };
  };
  Viewer.prototype.invalidate = function () {
    this.dirty = true; this._ensureIO();
    if (!this.raf && !this.disposed) { var self = this; this.raf = requestAnimationFrame(function (t) { self._loop(t); }); }
  };
  Viewer.prototype._animating = function () {
    if (this.autoRotate) return true;
    for (var i = 0; i < this.objects.length; i++) if (this.objects[i].anim) return true;
    return !!this.alwaysAnimate;
  };
  Viewer.prototype._loop = function (now) {
    this.raf = 0;
    if (this.disposed) return;
    if (!this.visible || document.hidden) return;
    var dt = Math.min(0.1, (now - this._last) / 1000); this._last = now;
    var t = now / 1000;
    if (this.autoRotate && !this._dragging) this.yaw += dt * this.autoSpeed;
    for (var i = 0; i < this.objects.length; i++) { var o = this.objects[i]; if (o.anim) o.anim(t, o); }
    this.draw();
    if (this.onFrame) this.onFrame(t);
    this.dirty = false;
    if (this._animating()) this.invalidate();
  };
  Viewer.prototype._eye = function () {
    var cp = Math.cos(this.pitch), t = this.target;
    return [t[0] + this.dist * Math.sin(this.yaw) * cp, t[1] + this.dist * Math.sin(this.pitch), t[2] + this.dist * Math.cos(this.yaw) * cp];
  };
  Viewer.prototype._matrices = function () {
    var w = this.canvas.width, h = this.canvas.height;
    var proj = persp(this.fov, w / h, Math.max(0.02, this.dist * 0.02), this.dist * 6 + 40);
    var eye = this._eye();
    var view = lookAt(eye, this.target, [0, 1, 0]);
    this.vp = mul(proj, view); this.eyePos = eye;
    return this.vp;
  };
  Viewer.prototype.project = function (p) {
    var m = this.vp || this._matrices();
    var x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
      z = m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14], w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
    if (w <= 0) return { x: 0, y: 0, visible: false, depth: 1 };
    var nx = x / w, ny = y / w;
    return { x: (nx * 0.5 + 0.5) * this.canvas.clientWidth, y: (0.5 - ny * 0.5) * this.canvas.clientHeight, visible: Math.abs(nx) <= 1.2 && Math.abs(ny) <= 1.2, depth: z / w };
  };
  Viewer.prototype._gpuMesh = function (mesh) {
    var g = this.gpu.get(mesh), gl = this.gl;
    if (g) return g;
    g = { pb: gl.createBuffer(), nb: mesh.nor ? gl.createBuffer() : null, ib: gl.createBuffer(), type: mesh.idx instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT };
    gl.bindBuffer(gl.ARRAY_BUFFER, g.pb); gl.bufferData(gl.ARRAY_BUFFER, mesh.pos, gl.STATIC_DRAW);
    if (g.nb) { gl.bindBuffer(gl.ARRAY_BUFFER, g.nb); gl.bufferData(gl.ARRAY_BUFFER, mesh.nor, gl.STATIC_DRAW); }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.idx, gl.STATIC_DRAW);
    this.gpu.set(mesh, g); return g;
  };
  Viewer.prototype._drawObj = function (obj, P, vp, pick, idColor) {
    var gl = this.gl, u = P.u;
    var m = objMatrix(obj), nm = normalMat(m);
    gl.uniformMatrix4fv(u.uModel, false, m); gl.uniformMatrix3fv(u.uNM, false, nm);
    if (obj.cull) { gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK); } else gl.disable(gl.CULL_FACE);
    for (var i = 0; i < obj.model.meshes.length; i++) {
      var mesh = obj.model.meshes[i], g = this._gpuMesh(mesh);
      gl.uniform3f(u.uBmin, mesh.bmin[0], mesh.bmin[1], mesh.bmin[2]);
      gl.uniform3f(u.uBext, (mesh.bmax[0] - mesh.bmin[0]) || 1, (mesh.bmax[1] - mesh.bmin[1]) || 1, (mesh.bmax[2] - mesh.bmin[2]) || 1);
      if (pick) gl.uniform3f(u.uId, idColor[0], idColor[1], idColor[2]);
      else {
        var c = obj.color || mesh.color;
        gl.uniform3f(u.uColor, c[0], c[1], c[2]);
        gl.uniform1f(u.uAlpha, obj.alpha !== undefined && obj.alpha !== null ? obj.alpha : mesh.opacity);
        gl.uniform1f(u.uEmit, obj.emit || 0);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, g.pb); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.UNSIGNED_SHORT, true, 0, 0);
      if (g.nb) { gl.bindBuffer(gl.ARRAY_BUFFER, g.nb); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.BYTE, true, 0, 0); }
      else { gl.disableVertexAttribArray(1); gl.vertexAttrib3f(1, 0, 1, 0); }
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.ib);
      gl.drawElements(gl.TRIANGLES, mesh.ni, g.type, 0);
    }
  };
  Viewer.prototype._alphaOf = function (o) { return o.alpha !== undefined && o.alpha !== null ? o.alpha : o.model.meshes[0].opacity; };
  Viewer.prototype.draw = function () {
    var gl = this.gl; if (gl.isContextLost && gl.isContextLost()) return;
    var vp = this._matrices(), eye = this.eyePos, P = this.prog, u = P.u;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    gl.useProgram(P.p);
    gl.uniformMatrix4fv(u.uVP, false, vp);
    gl.uniform3f(u.uCam, eye[0], eye[1], eye[2]);
    // headlight (from above-left of the camera) plus a soft fill light
    var fx = eye[0] - this.target[0], fy = eye[1] - this.target[1], fz = eye[2] - this.target[2], fl = Math.hypot(fx, fy, fz) || 1;
    fx /= fl; fy /= fl; fz /= fl;
    var rx = fz, rz = -fx, rl = Math.hypot(rx, rz) || 1; rx /= rl; rz /= rl;
    gl.uniform3f(u.uL1, fx - rx * 0.45, fy + 0.65, fz - rz * 0.45);
    gl.uniform3f(u.uL2, -fx + rx * 0.7, 0.35, -fz + rz * 0.7);
    var opaque = [], clear = [], self = this;
    this.objects.forEach(function (o) { if (o.hidden) return; (self._alphaOf(o) >= 0.999 ? opaque : clear).push(o); });
    gl.disable(gl.BLEND); gl.depthMask(true);
    opaque.forEach(function (o) { self._drawObj(o, P, vp, false); });
    if (clear.length) {
      clear.sort(function (a, b) {
        var da = Math.hypot(a.pos[0] - eye[0], a.pos[1] - eye[1], a.pos[2] - eye[2]);
        var db = Math.hypot(b.pos[0] - eye[0], b.pos[1] - eye[1], b.pos[2] - eye[2]);
        return db - da;
      });
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
      clear.forEach(function (o) { self._drawObj(o, P, vp, false); });
      gl.depthMask(true); gl.disable(gl.BLEND);
    }
  };
  Viewer.prototype._ensurePick = function () {
    var gl = this.gl, w = this.canvas.width, h = this.canvas.height;
    if (this.pickFbo && this.pickW === w && this.pickH === h) return;
    this.pickW = w; this.pickH = h;
    this.pickFbo = gl.createFramebuffer();
    var tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    var rb = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, rb); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.pickFbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);
  };
  Viewer.prototype.pick = function (cssX, cssY) {
    var gl = this.gl; this._ensurePick();
    var vp = this._matrices(), P = this.pickProg;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.pickFbo);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.depthMask(true);
    gl.useProgram(P.p); gl.uniformMatrix4fv(P.u.uVP, false, vp);
    var list = this.objects.filter(function (o) { return o.pickable && !o.hidden; }), self = this;
    list.forEach(function (o, i) { var id = i + 1; self._drawObj(o, P, vp, true, [(id & 255) / 255, ((id >> 8) & 255) / 255, 0]); });
    var sx = this.canvas.width / this.canvas.clientWidth, sy = this.canvas.height / this.canvas.clientHeight;
    var px = Math.max(0, Math.min(this.canvas.width - 1, Math.floor(cssX * sx))), py = Math.max(0, Math.min(this.canvas.height - 1, Math.floor(this.canvas.height - 1 - cssY * sy)));
    var out = new Uint8Array(4); gl.readPixels(px, py, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, out);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.invalidate();
    var id = out[0] + (out[1] << 8);
    return id > 0 && id <= list.length ? list[id - 1] : null;
  };
  Viewer.prototype.dispose = function () {
    this.disposed = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this._ro) this._ro.disconnect();
    if (this._io) this._io.disconnect();
    document.removeEventListener('visibilitychange', this._vis);
    try { var ext = this.gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); } catch (e) {}
  };
  HA.Viewer = Viewer;
})(window.HA);
