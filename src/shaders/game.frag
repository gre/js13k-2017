precision highp float;

varying vec2 uv;
uniform sampler2D mapT;
uniform float time,hurry,boot,dead,boom;
uniform vec3 key,marble,mapDim;
uniform mat3 cubeR;

vec3 dir; // shared direction

// Utility

float opU(float d1, float d2) {
  return min(d1, d2);
}
vec2 opU(vec2 d1, vec2 d2) {
  return mix(d1, d2, step(d2.x, d1.x));
}
float vmin(vec2 v) {
  return min(v.x, v.y);
}
float vmin(vec3 v) {
  return min(min(v.x, v.y), v.z);
}
float vmax(vec3 v) {
  return max(max(v.x, v.y), v.z);
}

vec3 pMod3(inout vec3 p, vec3 size) {
  vec3 c = floor((p + size*0.5)/size);
  p = mod(p + size*0.5, size) - size*0.5;
  return c;
}

// generic shapes
float sdCappedCylinder(vec3 p, vec2 h) {
  vec2 d = abs(vec2(length(p.xz),p.y)) - h;
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}
float sdBox(vec3 p, vec3 b) {
  return vmax(abs(p) - b); // cheap version
}
float sdSphere (vec3 p, float s) {
  return length(p)-s;
}

// game shapes

float cellValue (vec3 id) {
  return texture2D(mapT, vec2(
    (
      id[2] + mapDim[2] * (id[1] + mapDim[1] * id[0]) // index
     + 0.5 // safe for windows
    ) / (
      mapDim[0]*mapDim[1]*mapDim[2]
    ), 0.5)
  ).r;
}

vec3 globalDisp;

vec2 sdCell (vec3 p, float v, vec3 id) {
  v *= 2.;
  float right = floor(v);
  v -= right;
  v *= 2.;
  float left = floor(v);
  v -= left;
  v *= 2.;
  float up = floor(v);
  v -= up;
  v *= 2.;
  float down = floor(v);
  v -= down;
  v *= 2.;
  float front = floor(v);
  v -= front;
  v *= 2.;
  float back = floor(v);

  float disform = 0.03 * hurry;
  float pipeW = 0.18;
  float sphereR = pipeW;
  float r = 0.3;

  p -= disform * globalDisp;

  float s = sdSphere(p, sphereR);

  s = mix(
    s,
    opU(s, sdCappedCylinder(p - vec3(0.0, 0.25, 0.0), vec2(pipeW, 0.25))),
    up
  );
  s = mix(
    s,
    opU(s, sdCappedCylinder(p - vec3(0.0, -0.25, 0.0), vec2(pipeW, 0.25))),
    down
  );
  s = mix(
    s,
    opU(s, sdCappedCylinder(p.yxz - vec3(0.0, -0.25, 0.0), vec2(pipeW, 0.25))),
    left
  );
  s = mix(
    s,
    opU(s, sdCappedCylinder(p.yxz - vec3(0.0, 0.25, 0.0), vec2(pipeW, 0.25))),
    right
  );
  s = mix(
    s,
    opU(s, sdCappedCylinder(p.yzx - vec3(0.0, 0.25, 0.0), vec2(pipeW, 0.25))),
    front
  );
  s = mix(
    s,
    opU(s, sdCappedCylinder(p.yzx - vec3(0.0, -0.25, 0.0), vec2(pipeW, 0.25))),
    back
  );
  return vec2(s,
    0.99 * smoothstep(0.6, 0.3, length((p+id - marble)/mapDim)));
}

vec2 sdMap (vec3 p) {
  float box = sdBox(p - mapDim/2. + 0.5, mapDim/2. - 0.5);
  vec2 d = vec2(99., 0.0);

  float t = time * floor(1. + 5.*hurry);
  float f = 3.;
  globalDisp = vec3(
    cos(f*p.y + t),
    sin(f*p.z + t),
    cos(f*p.x + t)
  );

  if (box <= .5) {
    vec3 id = pMod3(p, vec3(1.0));
    float cell = cellValue(id);
    if (cell != 0.) {
      d = opU(d, sdCell(p, cell, id));
    }
    else {
      // there is nothing in this cell. so we reach the next neighbor edge to try to avoid joint glitch..
      // this is like a containing box but that understand the dir so it does not say something in close when ray wont go there..
      // FIXME there is a better algorithm to figure out that should calc the distance to the next grid collision... just need to put formula on paper and it will be the same kind of vmin thing
      d = opU(d, vec2(0.03 + vmin(vec3(
        mix(0.5 - p.x, 0.5 + p.x, step(0.,dir.x)),
        mix(0.5 - p.y, 0.5 + p.y, step(0.,dir.y)),
        mix(0.5 - p.z, 0.5 + p.z, step(0.,dir.z))
      ) / (1.0 + dir)), 0.));
    }
  }
  else {
    d = vec2(box, 0.0);
  }

  return d;
}

vec2 sdMarble (vec3 p, float isMarble) {
  float t = 3. * time + isMarble;
  float f = 10.+isMarble;
  float a = 0.03 + .02*isMarble;
  return vec2(sdSphere(p + a * vec3(
    cos(f*p.x + t),
    sin(f*p.y + t),
    cos(f*p.z + t)
  ), 0.4), isMarble * 1.2);
}

vec2 scene(vec3 p) {
  p.z -= 2.2 * mapDim.z;
  vec2 d = vec2(30.0 - p.z, 0.0); // a plane in the far back allow to shorter the raymarch iteration
  p = cubeR * p;
  p += mapDim / 2.0 - 0.5;
  d = opU(d, sdMap(p));
  d = opU(d, sdMarble(p - marble, 1. + 3.*boom));
  d = opU(d, sdMarble(p - key, 0. + 4.*boom));
  // hack distance to play with glitch :D
  d.x *= 1. - 2. * boot + 3. * boot * boot;
  d.x += boom*boom;
  return d;
}

// FIXME improve colors, specular, normal...
vec3 materialColor (float m, vec3 normal) {
  return mix(
    vec3(0.9),
    vec3(0.3, 0.7, 1.1),
    m * m * 0.6
  );
}

float materialSpecularIntensity (float m) {
  return 0.2 + 0.4 * step(3.,m)*step(m,3.999);
}

vec2 raymarch(vec3 dir) {
  int skipAfter = 12 + int(60. * (1.-dead) * (1. - hurry * hurry) * (1. + .1 * cos(mix(2.*time, 20.*time, hurry))));
  float total_distance = 0.1;
  vec2 result;
  for (int i = 0; i < 60; ++i) {
    vec3 p = dir * total_distance;
    result = scene(p);
    total_distance += result.x;
    if (result.x < 0.002 || i > skipAfter) return vec2(total_distance, result.y);
  }
  return vec2(total_distance, result.y);
}

vec3 sceneNormal(vec3 p) {
  return normalize(vec3(
    scene(p + vec3(.01, 0., 0.)).x - scene(p - vec3(.01, 0., 0.)).x,
    scene(p + vec3(0., .01, 0.)).x - scene(p - vec3(0., .01, 0.)).x,
    scene(p + vec3(0.,0.,.01)).x - scene(p - vec3(0.,0.,.01)).x
  ));
}

void main() {
  dir = normalize(vec3(uv, 2.5));
  vec2 result = raymarch(dir);
  float material = result.y;
  float dist = result.x;
  vec3 intersection = dir * dist;
  vec3 normal = sceneNormal(intersection);
  vec3 lightDir = normalize(vec3(0.1, 0.3, -1.0));
  gl_FragColor = vec4(mix(materialColor(material, normal) * (
    .1 // ambiant color
    + mix(vec3(1.), vec3(1.,.0,.0), dead) * ( // light color
      mix(dot(lightDir, normal), 1., .8) // normal diffuse
      + pow(dot(-dir, normalize(reflect(lightDir, normal))), 4.) * materialSpecularIntensity(material) // specular diffuse
    )
    ), vec3(1.),
    smoothstep(8.0, 22.0, dist) // fog
    ), 1.0);
}
