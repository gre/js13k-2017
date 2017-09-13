/* global c MOBILE
gameScale: true
glCreateFBO glCreateShader glCreateTexture glUniformLocation
STATIC_VERT
BLUR1D_FRAG
COPY_FRAG
GAME_VERT
GAME_FRAG
GLARE_FRAG
LASER_FRAG
PERSISTENCE_FRAG
Float32Array
*/

var gl = c.getContext("webgl") || c.getContext("experimental-webgl"),
  size = Math.min(
    (window.screen && Math.min(screen.width, screen.height)) || 500,
    500
  ),
  W = size,
  H = size,
  SEED = Math.random();

// DOM setup

var uiScale = MOBILE ? 1 : devicePixelRatio,
  FW = W * uiScale,
  FH = H * uiScale;
c.width = FW;
c.height = FH;
c.style.width = W + "px";
c.style.height = H + "px";

var lastW = 0,
  lastH = 0;
function checkSize() {
  var ww = window.innerWidth,
    wh = window.innerHeight;
  if (ww == lastW && wh == lastH) return;
  lastW = ww;
  lastH = wh;
}

// WebGL setup

gl.viewport(0, 0, FW, FH);
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

var buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([
    -1.0,
    -1.0,
    1.0,
    -1.0,
    -1.0,
    1.0,
    -1.0,
    1.0,
    1.0,
    -1.0,
    1.0,
    1.0
  ]),
  gl.STATIC_DRAW
);

var gameShader = glCreateShader(GAME_VERT, GAME_FRAG);

var mapTexture = glCreateTexture();
