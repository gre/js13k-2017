/* global DEBUG glMat3Multiply glMat3Transpose dotProduct mat3FromAngleAndAxis transformMat3 dist mix3 MOBILE keys */

function dotProductWithAxes(v) {
  return deltas
    .map(function(a, i) {
      return { dot: dotProduct(v, a), a: a, i: i };
    })
    .sort(function(a, b) {
      return b.dot - a.dot;
    });
}

function indexToPosition(dim, i) {
  var v = Math.floor(i / dim[2]);
  var z = i - v * dim[2];
  i = v;
  v = Math.floor(i / dim[1]);
  var y = i - v * dim[1];
  var x = v;
  return [x, y, z];
}
function positionToIndex(dim, p) {
  return (p[0] * dim[1] + p[1]) * dim[2] + p[2];
}

function addEdge(edges, a, b) {
  var edge = a > b ? [b, a] : [a, b];
  edges.push(edge);
}

function edgeExists(edges, a, b) {
  if (a > b) {
    var tmp = a;
    a = b;
    b = tmp;
  }
  return edges.some(function(e) {
    return e[0] === a && e[1] === b;
  });
}

function addVec3(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function cellConnectsWith(map, pos, off) {
  var from = positionToIndex(map.dim, pos);
  var to = positionToIndex(map.dim, addVec3(pos, off));
  var exists = edgeExists(map.e, from, to);
  return exists ? 1 : 0;
}

// convention right,left,up,down,front,back
var deltas = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1]
];
function getCellConnections(state, pos) {
  return deltas.map(function(d) {
    return cellConnectsWith(state.map, pos, d);
  });
}
function deltaInverse(i) {
  return i % 2 === 0 ? i + 1 : i - 1;
}

function genMap(level) {
  var lvld = Math.round(2 + 2 * Math.log(1 + 0.3 * level));
  var diff = 1 - Math.exp(-0.05 * level);

  var dim = [lvld, lvld, lvld];
  var dimLength = dim[0] * dim[1] * dim[2];
  var edges = [];
  function posIndex(p) {
    return positionToIndex(dim, p);
  }
  function validCell(pos) {
    return (
      pos[0] >= 0 &&
      pos[0] < dim[0] &&
      pos[1] >= 0 &&
      pos[1] < dim[1] &&
      pos[2] >= 0 &&
      pos[2] < dim[2]
    );
  }

  function allNeighbors(pos) {
    return deltas
      .map(function(d) {
        return addVec3(pos, d);
      })
      .filter(validCell);
  }

  function randomInt(maxValue) {
    return Math.floor(maxValue * Math.random());
  }

  var exploredPosIndexes = [];
  var k = dim.map(randomInt); // k is the "key" to find

  function randomUnexploredPos() {
    for (var i = 0; i < 100; i++) {
      var r = randomInt(dimLength);
      if (exploredPosIndexes.indexOf(r) === -1) {
        return r;
      }
    }
    return randomInt(dimLength);
  }

  function digMaze(p, minLength, maxLength, intersectProbability) {
    var i;
    exploredPosIndexes.push(posIndex(p));
    var newEdges = [];
    for (i = 0; i < maxLength; i++) {
      var neighbors = allNeighbors(p)
        .map(function(pos) {
          var index = posIndex(pos);
          return {
            pos: pos,
            i: index,
            explored: exploredPosIndexes.indexOf(index) !== -1,
            random: Math.random()
          };
        })
        .sort(function(a, b) {
          return 9 * (a.explored - b.explored) + a.random - b.random;
        });
      var next = neighbors[0];
      if (next.explored && Math.random() > intersectProbability) break;
      if (!next.explored) exploredPosIndexes.push(next.i);
      addEdge(newEdges, posIndex(p), next.i);
      p = next.pos;
    }
    if (newEdges.length >= minLength) {
      edges = edges.concat(newEdges);
    }
    return i;
  }

  // Dig the main gallery
  digMaze(
    k,
    0,
    level === 0
      ? Math.round(3 + 3 * Math.random())
      : Math.floor(
          dimLength *
            Math.max(
              0.1,
              0.8 +
                0.6 * Math.random() -
                Math.random() * Math.random() * Math.random() -
                0.4 * diff
            )
        ),
    1
  );

  var initialMarble = indexToPosition(
    dim,
    exploredPosIndexes[Math.floor(2 + (exploredPosIndexes.length - 3) / 2)]
  );

  var countToDig =
    level === 0
      ? 0
      : Math.floor((0.5 * (Math.random() - 0.5) + diff) * dimLength);
  for (var i = 0; i < 10 && countToDig > 0; i++) {
    countToDig -= digMaze(
      indexToPosition(dim, randomUnexploredPos()),
      10,
      10 + Math.random() * countToDig,
      0.3
    );
  }

  return { e: edges, k: k, i: initialMarble, dim: dim };
}

// status:
// 1 game in play
// 2 game success
// 3 game over

function stateForLevel(level) {
  var map = genMap(level);
  return {
    acc: 0,
    level: level,
    status: 1,
    statusChangeT: 0,
    gameTime: 30 + 20 * map.dim[0],
    map: map,
    marble: map.i,
    cubeR: [1, 0, 0, 0, 1, 0, 0, 0, 1]
  };
}

// this is a immutable style tick function. take a state and return a new state
function tickState(state, events, dt /* in seconds */) {
  state = Object.assign({}, state);
  state.statusChangeT += dt;
  var level = state.level;

  if (state.status === 2 && state.statusChangeT > 3) {
    state = stateForLevel(level + 1);
  }
  if (DEBUG && keys[32] && (!level || state.statusChangeT > 3)) {
    state = stateForLevel(level + 1);
    state.statusChangeT = 2.5;
  }

  var text, subtext;

  if (state.status === 1) {
    text = level === 0 ? document.title : "Level " + level;
    subtext =
      level === 0
        ? MOBILE ? "Drag to rotate" : "Arrows + Shift / XBox controller"
        : "";

    // game is running
    state.gameTime -= dt;
    if (state.gameTime < 30) subtext = Math.ceil(state.gameTime);
    state.cubeR = state.cubeR.slice(0);
    var rotSpeed = 4;
    events.d.forEach(function(delta, i) {
      if (!delta) return;
      var axis = [0, 0, 0];
      axis[2 - i] = 1;
      glMat3Multiply(
        state.cubeR,
        state.cubeR,
        mat3FromAngleAndAxis(rotSpeed * dt * delta, axis)
      );
    });

    var gravityDir = [];
    transformMat3(gravityDir, [0, -1, 0], state.cubeR);

    var marbleA = state.marble.map(Math.floor);
    var marbleB = state.marble.map(Math.ceil);
    var p = dist(marbleA, state.marble); // progress from A to B (distance to A)
    var connectionsA = getCellConnections(state, marbleA);
    var connectionsB = getCellConnections(state, marbleB);

    if (p === 0) {
      // at a vertex
      var bestMotion = dotProductWithAxes(gravityDir).filter(function(o) {
        return connectionsA[o.i];
      })[0];
      if (bestMotion && bestMotion.dot > 0) {
        state.marble = bestMotion.a.map(function(d, i) {
          return marbleA[i] + d * 0.001;
        });
      } else {
        state.acc = 0;
      }
    } else {
      // in an edge
      var diff = marbleA.map(function(v, i) {
        return v - marbleB[i];
      });
      var dot = dotProduct(diff, gravityDir);
      state.acc = (state.acc + 0.003) * (0.9 + 0.1 * Math.abs(dot));
      var newP = Math.max(0, Math.min(p - state.acc * dot, 1));
      state.marble = mix3(marbleA, marbleB, newP);
    }

    if (dist(state.marble, state.map.k) < 0.01) {
      state.status = 2;
      state.statusChangeT = 0;
    } else if (state.gameTime <= 0) {
      state.status = 3;
      state.statusChangeT = 0;
    }
  }

  if (state.status === 2) {
    text = "Well Done!";
  }

  if (state.status === 3) {
    text = "GameOver lvl " + state.level;
    subtext = "Reload to restart – @greweb 2017";
  }

  state.text = text;
  state.subtext = subtext;
  return state;
}
