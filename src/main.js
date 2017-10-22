/* global
gl
glBindShader
glUniformLocation
gameShader
$t
touchStartPos
touchMove
*/

/* eslint-disable no-undef */
/* eslint-enable no-unused-vars */

requestAnimationFrame(loop);

if (DEBUG) {
  console.log("DEBUG on"); // eslint-disable-line
}

// Game Render Loop

function threshold(value, limit) {
  return Math.abs(value) < limit ? 0 : value;
}

function getUserEvents() {
  var keyboardX = (keys[39] || keys[68]) - (keys[37] || keys[65] || keys[81]),
    keyboardY = (keys[40] || keys[83]) - (keys[38] || keys[87] || keys[90]);
  var d = keys[16] ? [keyboardX, 0, keyboardY] : [0, keyboardX, keyboardY];
  var gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
  if (gamepads[0]) {
    var axes = gamepads[0].axes;
    var buttons = gamepads[0].buttons;
    if (axes.length >= 2) {
      d[1] += threshold(axes[0], 0.2);
      d[2] += threshold(axes[1], 0.2);
    }
    if (axes.length >= 4) {
      d[0] += threshold(axes[2], 0.2);
      d[2] += threshold(axes[3], 0.2);
    }
    if (buttons.length > 7) {
      d[0] += buttons[7].value - buttons[6].value;
    }
  }
  if (touchStartPos && touchMove) {
    var dx = touchMove[0] - touchStartPos[0];
    var dy = touchMove[1] - touchStartPos[1];
    d[1] -= dx / 100;
    d[2] -= dy / 100;
  }
  return {
    d: d
  };
}

var t = 0,
  dt,
  // Input state : updated by user events, handled & emptied by the update loop
  gameState = stateForLevel(0);

var _lastT,
  _lastCheckSize = -9999;
function loop(_t) {
  requestAnimationFrame(loop);
  if (!_lastT) _lastT = _t;
  dt = Math.min(100, _t - _lastT);
  _lastT = _t;

  t += dt; // accumulate the game time (that is not the same as _t)

  render(gameState, null);

  var oldState = gameState;
  gameState = tickState(oldState, getUserEvents(), dt / 1000);

  // RENDER game
  render(gameState, oldState);
}

var mapData;

function render(state, oldState) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  glBindShader(gameShader);
  var status = state.status;
  var map = state.map;

  if (!oldState || state.text !== oldState.text) {
    $t.textContent = state.text;
  }
  if (!oldState || state.subtext !== oldState.subtext) {
    $f.textContent = state.subtext || " ";
  }

  if (oldState && state.level > oldState.level) {
    texta_win();
  }

  if (!oldState || map !== oldState.map) {
    var length = map.dim[0] * map.dim[1] * map.dim[2];
    mapData = new Uint8Array(length);
    for (var i = 0; i < length; i++) {
      mapData[i] =
        getCellConnections(state, indexToPosition(map.dim, i)).reduce(function(
          acc,
          n
        ) {
          return (acc << 1) | n;
        }, 0) << 2;
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

    gl.uniformMatrix3fv(
      glUniformLocation(gameShader, "cubeR"),
      false,
      state.cubeR
    );
    gl.uniform3fv(glUniformLocation(gameShader, "key"), map.k);
    gl.uniform3fv(glUniformLocation(gameShader, "marble"), state.marble);
    gl.uniform1i(glUniformLocation(gameShader, "mapT"), 0);
    gl.uniform3fv(glUniformLocation(gameShader, "mapDim"), map.dim);
    gl.uniform1f(glUniformLocation(gameShader, "time"), t / 1000);
    var hurry = 0,
      dead = 0,
      boot = 0,
      boom = 0;
    if (status === 1) {
      hurry = smoothstep(30, 0, state.gameTime);
      dead = smoothstep(3, 0, state.gameTime);
      boot = smoothstep(3, 0, state.statusChangeT);
    }
    if (status === 2) {
      boom = smoothstep(0, 3, state.statusChangeT);
    }
    if (status === 3) {
      hurry = 1;
      dead = 1;
    }
    gl.uniform1f(glUniformLocation(gameShader, "hurry"), hurry);
    gl.uniform1f(glUniformLocation(gameShader, "dead"), dead);
    gl.uniform1f(glUniformLocation(gameShader, "boot"), boot);
    gl.uniform1f(glUniformLocation(gameShader, "boom"), boom);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
