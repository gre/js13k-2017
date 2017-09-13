function smoothstep(min, max, value) {
  var x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

function dotProduct(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function mix(a, b, v) {
  if (a === b) return a; // JS calc hack
  return a * (1 - v) + b * v;
}
function mix3(a, b, v) {
  return a.map(function(aV, i) {
    return mix(aV, b[i], v);
  });
}

function dist(a, b) {
  var dx = a[0] - b[0];
  var dy = a[1] - b[1];
  var dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function transformMat3(out, a, m) {
  var x = a[0],
    y = a[1],
    z = a[2];
  out[0] = x * m[0] + y * m[3] + z * m[6];
  out[1] = x * m[1] + y * m[4] + z * m[7];
  out[2] = x * m[2] + y * m[5] + z * m[8];
  return out;
}

function mat3FromAngleAndAxis(a, u) {
  var x = u[0];
  var y = u[1];
  var z = u[2];
  var c = Math.cos(a);
  var s = Math.sin(a);
  // prettier-ignore
  return [
    x*x*(1-c)+c, x*y*(1-c)-z*s, x*z*(1-c)+y*s,
    x*y*(1-c)+z*s, y*y*(1-c)+c, y*z*(1-c)-x*s,
    x*z*(1-c)-y*s, y*z*(1-c)+x*s, z*z*(1-c)+c
  ];
}
