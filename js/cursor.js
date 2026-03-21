export function initCursor() {
  const COLORS = [
    [18 / 255, 113 / 255, 255 / 255],
    [221 / 255, 74 / 255, 255 / 255],
    [100 / 255, 220 / 255, 255 / 255],
    [200 / 255, 200 / 255, 50 / 255],
    [180 / 255, 180 / 255, 50 / 255],
  ];

  function lerpColor(a, b, t) {
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    ];
  }

  function colorAtProgress(t) {
    const scaled = t * (COLORS.length - 1);
    const i = Math.min(Math.floor(scaled), COLORS.length - 2);
    return lerpColor(COLORS[i], COLORS[i + 1], scaled - i);
  }

  const canvas = document.getElementById("c");
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  const gl = canvas.getContext("webgl", {
    premultipliedAlpha: false,
    alpha: true,
  });
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  const VS = `
      attribute vec2 a_pos;
      attribute vec2 a_uv;
      attribute float a_alpha;
      uniform vec2 u_res;
      varying vec2 v_uv;
      varying float v_alpha;
      void main(){
        vec2 clip=(a_pos/u_res)*2.0-1.0;
        clip.y*=-1.0;
        gl_Position=vec4(clip,0.0,1.0);
        v_uv=a_uv;
        v_alpha=a_alpha;
      }`;

  const FS = `
      precision highp float;
      varying vec2 v_uv;
      varying float v_alpha;
      uniform vec3 u_color;
      void main(){
        float d=length(v_uv);
        if(d>1.0)discard;
        float t=1.0-d;
        float gradient=t*t*t*(t*(t*6.0-15.0)+10.0);
        float alpha=gradient*v_alpha;
        gl_FragColor=vec4(u_color*alpha,alpha);
      }`;

  function mkShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const uRes = gl.getUniformLocation(prog, "u_res");
  const uColor = gl.getUniformLocation(prog, "u_color");
  const aPos = gl.getAttribLocation(prog, "a_pos");
  const aUv = gl.getAttribLocation(prog, "a_uv");
  const aAlpha = gl.getAttribLocation(prog, "a_alpha");
  const buf = gl.createBuffer();

  const trail = [];
  const LIFE = 380;
  const MAX = 45;

  let cursor = null;
  let insideCanvas = false;
  let leaveTime = null;
  const LEAVE_FADE = 500;

  window.addEventListener("mousemove", (e) => {
    insideCanvas = true;
    leaveTime = null;
    cursor = { x: e.clientX, y: e.clientY };
    trail.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    if (trail.length > MAX) trail.shift();
  });

  document.addEventListener("mouseleave", () => {
    insideCanvas = false;
    leaveTime = performance.now();
  });
  document.addEventListener("mouseenter", () => {
    insideCanvas = true;
    leaveTime = null;
  });

  function drawDot(x, y, color, alpha, size) {
    const verts = new Float32Array([
      x - size,
      y - size,
      -1,
      -1,
      alpha,
      x + size,
      y - size,
      1,
      -1,
      alpha,
      x + size,
      y + size,
      1,
      1,
      alpha,
      x - size,
      y - size,
      -1,
      -1,
      alpha,
      x + size,
      y + size,
      1,
      1,
      alpha,
      x - size,
      y + size,
      -1,
      1,
      alpha,
    ]);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.DYNAMIC_DRAW);
    const stride = 5 * 4;
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(aUv);
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, stride, 8);
    gl.enableVertexAttribArray(aAlpha);
    gl.vertexAttribPointer(aAlpha, 1, gl.FLOAT, false, stride, 16);
    gl.uniform3f(uColor, color[0], color[1], color[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function render() {
    requestAnimationFrame(render);
    const now = performance.now();
    const W = canvas.width,
      H = canvas.height;

    gl.viewport(0, 0, W, H);
    gl.clearColor(0.04, 0.04, 0.04, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(uRes, W, H);

    const alive = trail.filter((p) => now - p.t < LIFE);
    const len = alive.length;

    for (let i = 0; i < len; i++) {
      const p = alive[i];
      const age = (now - p.t) / LIFE;
      const prog_ = i / Math.max(len - 1, 1);
      const alpha = Math.pow(1 - age, 2.2) * (prog_ * 0.65 + 0.1);
      const size = 38 * (0.25 + prog_ * 0.75) * (1 - age * 0.55);
      const color = colorAtProgress(prog_);
      drawDot(p.x, p.y, color, alpha, size);
    }

    if (cursor) {
      let cursorAlpha;
      if (insideCanvas) {
        cursorAlpha = 0.65;
      } else if (leaveTime !== null) {
        const elapsed = now - leaveTime;
        cursorAlpha = Math.max(0, 0.65 * (1 - elapsed / LEAVE_FADE));
        if (cursorAlpha <= 0) cursor = null;
      }
      if (cursor && cursorAlpha > 0) {
        drawDot(cursor.x, cursor.y, COLORS[0], cursorAlpha, 38);
      }
    }
  }

  render();
}
