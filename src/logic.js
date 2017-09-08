/* global DEBUG glMat3Multiply glMat3Transpose */

function indexToPosition(dim, i) {
  let v = Math.floor(i / dim[2]);
  const z = i - v * dim[2];
  i = v;
  v = Math.floor(i / dim[1]);
  const y = i - v * dim[1];
  const x = v;
  return [x, y, z];
}
function positionToIndex(dim, [x, y, z]) {
  return (x * dim[1] + y) * dim[2] + z;
}
function cellConnectsWith({ map, mapDim }, pos, off) {
  if (!map[positionToIndex(mapDim, pos)]) return 0;
  const x = pos[0] + off[0];
  if (x < 0 || x >= mapDim[0]) return 0;
  const y = pos[1] + off[1];
  if (y < 0 || y >= mapDim[1]) return 0;
  const z = pos[2] + off[2];
  if (z < 0 || z >= mapDim[2]) return 0;
  const index = positionToIndex(mapDim, [x, y, z]);
  return map[index];
}

function genMap(dim) {
  const array = new Array(dim[0] * dim[1] * dim[2]);
  for (let i = 0; i < array.length; i++) {
    const pos = indexToPosition(dim, i);
    array[i] = Math.random() < 0.5 ? 1 : 0;
  }
  return array;
}

function threshold(value, limit) {
  if (Math.abs(value) < limit) return 0;
  return value;
}

let debugFreeControls;

if (DEBUG) {
  const transformMat3 = function(out, a, m) {
    var x = a[0],
      y = a[1],
      z = a[2];
    out[0] = x * m[0] + y * m[3] + z * m[6];
    out[1] = x * m[1] + y * m[4] + z * m[7];
    out[2] = x * m[2] + y * m[5] + z * m[8];
    return out;
  };

  debugFreeControls = function(g, { keys, keyRightDelta, keyUpDelta }) {
    let move = [0, 0, 0];

    // keyboard
    if (keys[18]) {
      g.rotY += 0.03 * keyRightDelta;
      g.rotX += 0.02 * keyUpDelta;
    } else {
      if (keys[16]) {
        move[1] += 0.1 * keyUpDelta;
        move[0] += 0.1 * keyRightDelta;
      } else {
        g.rotY += 0.03 * keyRightDelta;
        move[2] += 0.1 * keyUpDelta;
      }
    }

    // gamepads
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    if (gamepads[0]) {
      const { axes, buttons } = gamepads[0];
      if (axes.length >= 2) {
        move[0] += 0.06 * threshold(axes[0], 0.2);
        move[2] -= 0.06 * threshold(axes[1], 0.2);
      }
      if (axes.length >= 4) {
        g.rotY += 0.04 * threshold(axes[2], 0.2);
        g.rotX += 0.03 * threshold(axes[3], 0.2);
      }
      if (buttons.length > 7) {
        move[1] += 0.05 * (buttons[7].value - buttons[6].value);
      }
    }
    const vector = [0, 0, 0];
    transformMat3(vector, move, g.rot);
    g.origin = [
      g.origin[0] + vector[0],
      g.origin[1] + vector[1],
      g.origin[2] + vector[2]
    ];
  };
}

function initState() {
  return {
    map: [],
    mapDim: [0, 0, 0],
    rotX: 0,
    rotY: 0,
    origin: [0, 0, 0],
    rot: []
  };
}

function stateForLevel(level) {
  const mapDim = [8, 8, 8];
  //const mapDim = [2, 2, 2];
  return {
    map: genMap(mapDim),
    mapDim,
    rotX: 0,
    rotY: 0,
    origin: mapDim.map(v => (v - 1) / 2)
  };
}

function tickState(state, events) {
  state = Object.assign({}, state);
  if (state.map.length === 0) {
    state = Object.assign(state, stateForLevel(1));
  }

  state.rotY += 0.001;

  const rot = [];
  const cx = Math.cos(state.rotX);
  const sx = Math.sin(state.rotX);
  const cy = Math.cos(state.rotY);
  const sy = Math.sin(state.rotY);
  // prettier-ignore
  glMat3Multiply(rot,
    [
      1, 0, 0,
      0, cx, sx,
      0, -sx, cx
    ],
    [
      cy, 0, sy,
      0, 1, 0,
      -sy, 0, cy
    ]);
  glMat3Transpose(rot, rot);
  state.rot = rot;
  if (DEBUG) {
    debugFreeControls(state, events);
  }
  return state;
}
