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

function addEdge(edges, a, b) {
  const edge = a > b ? [b, a] : [a, b];
  edges.push(edge);
}

function edgeExists(edges, a, b) {
  if (a > b) {
    const tmp = a;
    a = b;
    b = tmp;
  }
  return edges.some(e => e[0] === a && e[1] === b);
}

function addVec3(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function cellConnectsWith({ map, mapDim }, pos, off) {
  const from = positionToIndex(mapDim, pos);
  const to = positionToIndex(mapDim, addVec3(pos, off));
  const exists = edgeExists(map.edges, from, to);
  return exists ? 1 : 0;
}

const deltas = [
  [0, 0, 1],
  [0, 0, -1],
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0]
];

function genMap(dim) {
  const dimLength = dim[0] * dim[1] * dim[2];
  const edges = [];
  const posIndex = p => positionToIndex(dim, p);
  const validCell = pos =>
    pos[0] >= 0 &&
    pos[0] < dim[0] &&
    pos[1] >= 0 &&
    pos[1] < dim[1] &&
    pos[2] >= 0 &&
    pos[2] < dim[2];

  const allNeighbors = pos => {
    return deltas.map(d => addVec3(pos, d)).filter(validCell);
  };

  const randomInt = maxValue => Math.floor(maxValue * Math.random());

  const exploredPosIndexes = [];
  const exit = [0, 0, 0];

  const randomUnexploredPos = () => {
    for (let i = 0; i < 100; i++) {
      const i = randomInt(dimLength);
      if (exploredPosIndexes.indexOf(i) === -1) {
        return i;
      }
    }
    return randomInt(dimLength);
  };

  const digMaze = (p, maxLength) => {
    for (let i = 0; i < maxLength; i++) {
      const neighbors = allNeighbors(p)
        .map(pos => {
          const index = posIndex(pos);
          return {
            pos,
            index,
            explored: exploredPosIndexes.indexOf(index) === -1,
            random: Math.random()
          };
        })
        .sort((a, b) => 9 * (b.explored - a.explored) + a.random - b.random);
      const next = neighbors[0];
      if (!next) return;
      exploredPosIndexes.push(next.index);
      addEdge(edges, posIndex(p), next.index);
      p = next.pos;
    }
  };

  // Dig the main gallery
  digMaze(exit, Math.floor(dimLength));
  // TODO dig some other maze from another pos
  for (let i = 0; i < 4; i++) {
    //digMaze(randomUnexploredPos(), Math.floor(0.1 * dimLength));
  }

  // TODO add some random connections

  console.log({ edges, exit });

  return { edges, exit };
}

function threshold(value, limit) {
  if (Math.abs(value) < limit) return 0;
  return value;
}

function initState() {
  return {
    map: [],
    mapDim: [0, 0, 0],
    rotX: 0,
    rotY: 0,
    origin: [0, 0, 0],
    rot: [],
    cubeRot: [0, 0, 0]
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
    origin: [0, 0, -2.2 * mapDim[2]],
    cubeRot: [0, 0, 0]
  };
}

function tickState(state, events) {
  state = Object.assign({}, state);
  if (state.map.length === 0) {
    state = Object.assign(state, stateForLevel(1));
  }

  state.cubeRot = state.cubeRot.slice(0);
  const roundedCubeRot = state.cubeRot.map(v => Math.round(v) % 4);

  console.log(roundedCubeRot.join(" "));

  const controlledIndexes = [];

  // FIXME debounced version of direction so if keyRightDelta is pressed and instant release it still do one rotation
  if (events.keyRightDelta) {
    let index = roundedCubeRot[0] % 2 ? 2 : 1;
    let mul = roundedCubeRot[0] < 2 ? -1 : 1;
    if (roundedCubeRot[0] % 2 === 0 && roundedCubeRot[2] === 1) {
      index = 2;
    }
    if (roundedCubeRot[0] === 2 && roundedCubeRot[2] === 3) {
      index = 1;
    }

    controlledIndexes.push(index);
    state.cubeRot[index] += mul * 0.05 * events.keyRightDelta;
  }
  if (events.keyUpDelta) {
    controlledIndexes.push(0);
    state.cubeRot[0] -= 0.05 * events.keyUpDelta;
  }

  state.cubeRot = state.cubeRot.map(
    (v, i) =>
      // keep the value mod 4
      (4 +
        (controlledIndexes.indexOf(i) !== -1
          ? v
          : v + 0.05 * (Math.round(v) - v))) %
      4
  );

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
    if (keys[18] && keys[16]) {
      g.rotY += 0.03 * keyRightDelta;
      move[2] += 0.1 * keyUpDelta;
    } else if (keys[18]) {
      g.rotY += 0.03 * keyRightDelta;
      g.rotX += 0.02 * keyUpDelta;
    } else if (keys[16]) {
      move[1] += 0.1 * keyUpDelta;
      move[0] += 0.1 * keyRightDelta;
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
