/* global gl, W, H, DEBUG */

function glCreateShader(vert, frag) {
  var handle,
    type = gl.VERTEX_SHADER,
    src = vert;
  handle = gl.createShader(type);
  gl.shaderSource(handle, src);
  gl.compileShader(handle);
  var vertex = handle;

  if (DEBUG) {
    if (!gl.getShaderParameter(handle, gl.COMPILE_STATUS))
      throw gl.getShaderInfoLog(handle);
  }

  type = gl.FRAGMENT_SHADER;
  src = frag;
  handle = gl.createShader(type);
  gl.shaderSource(handle, src);
  gl.compileShader(handle);
  var fragment = handle;

  if (DEBUG) {
    if (!gl.getShaderParameter(handle, gl.COMPILE_STATUS))
      throw gl.getShaderInfoLog(handle);
  }

  var program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);

  if (DEBUG) {
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw gl.getProgramInfoLog(program);
  }

  gl.useProgram(program);
  var p = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(p);
  gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);
  return [program];
}
function glBindShader(shader) {
  gl.useProgram(shader[0]);
}
function glUniformLocation(shader, name) {
  return (
    shader[name] || (shader[name] = gl.getUniformLocation(shader[0], name))
  );
}
function glCreateTexture() {
  var tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}
function glSetTexture(t, value) {
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, value);
}
function glBindTexture(t, unit) {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, t);
  return unit;
}
function glCreateFBO() {
  var handle = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, handle);
  var color = glCreateTexture();
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    W,
    H,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null
  );
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    color,
    0
  );
  return [handle, color];
}
function glBindFBO(fbo) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[0]);
}
function glGetFBOTexture(fbo) {
  return fbo[1];
}

function glMat3Multiply(out, a, b) {
  var a00 = a[0],
    a01 = a[1],
    a02 = a[2];
  var a10 = a[3],
    a11 = a[4],
    a12 = a[5];
  var a20 = a[6],
    a21 = a[7],
    a22 = a[8];
  var b00 = b[0],
    b01 = b[1],
    b02 = b[2];
  var b10 = b[3],
    b11 = b[4],
    b12 = b[5];
  var b20 = b[6],
    b21 = b[7],
    b22 = b[8];
  out[0] = b00 * a00 + b01 * a10 + b02 * a20;
  out[1] = b00 * a01 + b01 * a11 + b02 * a21;
  out[2] = b00 * a02 + b01 * a12 + b02 * a22;
  out[3] = b10 * a00 + b11 * a10 + b12 * a20;
  out[4] = b10 * a01 + b11 * a11 + b12 * a21;
  out[5] = b10 * a02 + b11 * a12 + b12 * a22;
  out[6] = b20 * a00 + b21 * a10 + b22 * a20;
  out[7] = b20 * a01 + b21 * a11 + b22 * a21;
  out[8] = b20 * a02 + b21 * a12 + b22 * a22;
  return out;
}

function glMat3Transpose(out, a) {
  // If we are transposing ourselves we can skip a few steps but have to cache some values
  if (out === a) {
    var a01 = a[1],
      a02 = a[2],
      a12 = a[5];
    out[1] = a[3];
    out[2] = a[6];
    out[3] = a01;
    out[5] = a[7];
    out[6] = a02;
    out[7] = a12;
  } else {
    out[0] = a[0];
    out[1] = a[3];
    out[2] = a[6];
    out[3] = a[1];
    out[4] = a[4];
    out[5] = a[7];
    out[6] = a[2];
    out[7] = a[5];
    out[8] = a[8];
  }

  return out;
}
