/* global
gl
glBindShader
glUniformLocation
gameShader
*/

/* eslint-disable no-undef */
/* eslint-enable no-unused-vars */

requestAnimationFrame(loop);

if (DEBUG) {
  console.log("DEBUG on"); // eslint-disable-line
}

// Game Render Loop

const getUserEvents = () => {
  let keyRightDelta =
    (keys[39] || keys[68]) - (keys[37] || keys[65] || keys[81]);
  let keyUpDelta = (keys[38] || keys[87] || keys[90]) - (keys[40] || keys[83]);
  return {
    keys,
    keyRightDelta,
    keyUpDelta
  };
};

var _lastT,
  _lastCheckSize = -9999;
function loop(_t) {
  requestAnimationFrame(loop);
  if (!_lastT) _lastT = _t;
  dt = Math.min(100, _t - _lastT);
  _lastT = _t;

  t += dt; // accumulate the game time (that is not the same as _t)

  const oldState = gameState;
  gameState = tickState(oldState, getUserEvents());

  // RENDER game
  render(gameState, oldState);
}

let mapData;

function render(state, oldState) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  glBindShader(gameShader);
  gl.uniform1f(glUniformLocation(gameShader, "time"), t / 1000);
  gl.uniform3fv(glUniformLocation(gameShader, "origin"), state.origin);

  if (state.map !== oldState.map) {
    const map = state.map;
    const mapDim = state.mapDim;
    const length = mapDim[0] * mapDim[1] * mapDim[2];
    mapData = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      const pos = indexToPosition(state.mapDim, i);
      const left = cellConnectsWith(state, pos, [-1, 0, 0]);
      const right = cellConnectsWith(state, pos, [1, 0, 0]);
      const up = cellConnectsWith(state, pos, [0, 1, 0]);
      const down = cellConnectsWith(state, pos, [0, -1, 0]);
      const front = cellConnectsWith(state, pos, [0, 0, 1]);
      const back = cellConnectsWith(state, pos, [0, 0, -1]);
      mapData[i] =
        (up << 7) |
        (down << 6) |
        (left << 5) |
        (right << 4) |
        (front << 3) |
        (back << 2) |
        0;
    }
    glBindTexture(mapTexture, 0);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.LUMINANCE,
      mapData.length,
      1,
      0,
      gl.LUMINANCE,
      gl.UNSIGNED_BYTE,
      mapData
    );
  }

  gl.uniformMatrix3fv(glUniformLocation(gameShader, "rot"), false, state.rot);
  gl.uniform3fv(glUniformLocation(gameShader, "cubeRot"), state.cubeRot);
  gl.uniform1i(glUniformLocation(gameShader, "mapT"), 0);
  gl.uniform3fv(glUniformLocation(gameShader, "mapDim"), state.mapDim);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}
