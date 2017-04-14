#pragma glslify: phongSpec = require(glsl-specular-phong)

precision mediump float;
uniform float ambientCoef, diffuseCoef, specularCoef;
uniform mat4 invView;
struct Light {
  vec3 color;
  float intensity;
  vec3 position;
  float shininess;
};
uniform Light light;
varying vec3 fragNormal, fragPosition;

void main() {
  float ambient = ambientCoef * light.intensity;
  vec3 lightDir = normalize(light.position - fragPosition);
  float diffuse = diffuseCoef * max(0.0, dot(lightDir, fragNormal));
  vec4 eye = invView * vec4(0, 0, 0, 1);
  vec3 eyeDir = normalize(eye.xyz / eye.w - fragPosition);
  vec3 reflection = normalize(reflect(lightDir, fragNormal));
  float specular = phongSpec(lightDir, eyeDir, fragNormal, light.shininess);
  vec4 lightColor = ambient + (diffuse + specular) * vec4(light.color, 1);
  gl_FragColor = lightColor;
}