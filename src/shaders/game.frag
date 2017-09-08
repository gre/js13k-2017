precision highp float;

varying vec2 uv;
uniform float time;
uniform vec3 origin;
uniform mat3 rot;
uniform sampler2D mapT;
uniform vec3 mapDim;

#define INF 999.0
#define N_MARCH 60
#define NORMAL_EPSILON 0.01

// Utility

float opU(float d1, float d2) {
  return min(d1, d2);
}
vec2 opU(vec2 d1, vec2 d2) {
  return mix(d1, d2, step(d2.x, d1.x));
}
float opUs(float k, float a, float b) {
  float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
  return mix( b, a, h ) - k*h*(1.0-h);
}
vec2 opUs(float k, vec2 d1, vec2 d2) {
  float v = opUs(k, d1.x, d2.x);
  return vec2(v, mix(d1.y, d2.y, step(d2.x, d1.x)));
}
float opS(float d1, float d2) {
  return max(-d1,d2);
}
float opI(float d1, float d2) {
  return max(d1,d2);
}
void rot2 (inout vec2 p, float a) {
  float c = cos(a);
  float s = sin(a);
  p = mat2(c, -s, s, c) * p;
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
float sdBoxWindow(vec3 p, vec3 b) {
  return max(abs(p.z) - b.z, vmin(b.xy - abs(p.xy)));
}
float sdBox(vec3 p, vec3 b) {
  return vmax(abs(p) - b); // cheap version
}
float sdSphere (vec3 p, float s) {
  return length(p)-s;
}
float sdTorus(vec3 p, vec2 t) {
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}

// game shapes

float cellValue (vec3 id) {
  float x = id[2] + mapDim[2] * (id[1] + mapDim[1] * id[0]);
  vec4 c = texture2D(mapT, vec2((x + 0.5) / (mapDim[0]*mapDim[1]*mapDim[2]), 0.5));
  return c.r;
}

vec2 sdCell (vec3 p, float v) {
  v *= 2.;
  float up = floor(v);
  v -= up;
  v *= 2.;
  float down = floor(v);
  v -= down;
  v *= 2.;
  float left = floor(v);
  v -= left;
  v *= 2.;
  float right = floor(v);
  v -= right;
  v *= 2.;
  float front = floor(v);
  v -= front;
  v *= 2.;
  float back = floor(v);

  float pipeW = 0.1;
  float sphereR = pipeW;
  float s = sdSphere(p, sphereR);
  float r = 0.3;

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
  return vec2(s, 1.0);
}

vec2 sdMap (vec3 p) {
  float mapLimit = vmin(mapDim / 2.0 - abs(p - mapDim/2.0 + 0.5));
  vec2 d = vec2(INF, 0.0);

  if (mapLimit >= 0.0) {

    vec3 id = pMod3(p, vec3(1.0));
    float cell = cellValue(id);

    if (cell != 0.) {
      d = opU(d, sdCell(p, cell));
    }
    else {
      // there is nothing here. we need to assume there is something in the next cell..
      // FIXME we need to cap that it "jumps to next cell"... maybe this should be done in the raymarcher, beccause we need the direction
      d = opU(d, vec2(vmin(0.9 - abs(p)), 0.0)); // FIXME why magic numbers
    }
  }

  return d;
}

vec2 scene(vec3 p) {
  //vec2 d = vec2(INF, 0.0);
  return sdMap(p/* + 0.5 - vec3(-mapDim[0] / 2.0, -mapDim[1] / 2.0, -mapDim[2] / 2.0)*/);
  //return d;
}

vec3 materialColor (float m, vec3 normal) {
  if (m <= 0.) return vec3(0.0);
  if (m <= 1.) return vec3(1.0, 0.0, 0.0);
  return vec3(1.0);
}

float materialSpecularIntensity (float m) {
  return 0.1;
}

vec2 raymarch(vec3 position, vec3 direction) {
  float total_distance = 0.1;
  vec2 result;
  for (int i = 0; i < N_MARCH; ++i) {
    vec3 p = position + direction * total_distance;
    result = scene(p);
    total_distance += result.x;
    if (result.x < 0.002) return vec2(total_distance, result.y);
  }
  return vec2(total_distance, result.y);
}

vec3 sceneNormal(vec3 p) {
  return normalize(vec3(
    scene(p + vec3(NORMAL_EPSILON, 0., 0.)).x - scene(p - vec3(NORMAL_EPSILON, 0., 0.)).x,
    scene(p + vec3(0., NORMAL_EPSILON, 0.)).x - scene(p - vec3(0., NORMAL_EPSILON, 0.)).x,
    scene(p + vec3(0.,0.,NORMAL_EPSILON)).x - scene(p - vec3(0.,0.,NORMAL_EPSILON)).x
  ));
}

void main() {
  vec3 direction = normalize(rot * vec3(uv, 2.5));
  vec2 result = raymarch(origin, direction);
  float material = result.y;
  float dist = result.x;
  vec3 intersection = origin + direction * dist;
  vec3 normal = sceneNormal(intersection);
  vec3 matColor = materialColor(material, normal);
  vec3 ambientColor = vec3(0.1);
  vec3 fogColor = vec3(1.0);
  vec3 lightDir = normalize(vec3(0.1, 0.2, -1.0));
  float diffuse = dot(lightDir, normal);
  diffuse = mix(diffuse, 1.0, 0.5); // half diffuse
  vec3 lightReflect = normalize(reflect(lightDir, normal));
  float specular = dot(-direction, lightReflect);
  specular = pow(specular, 4.0);
  float matSpecularIntensity = materialSpecularIntensity(material);
  vec3 diffuseLit;
  vec3 lightColor = vec3(1.0, 0.9, 0.8);
  float fog = smoothstep(10.0, 20.0, dist);
  diffuseLit = mix(matColor * (diffuse * lightColor + ambientColor + specular * lightColor * matSpecularIntensity), fogColor, fog);
  gl_FragColor = vec4(diffuseLit, 1.0);
}
