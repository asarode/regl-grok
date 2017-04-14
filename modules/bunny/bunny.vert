precision mediump float;
attribute vec3 normal, position;
uniform mat4 view, projection;
varying vec3 fragNormal, fragPosition;

void main() {
  fragNormal = normal;
  fragPosition =  1.0 * position;
  gl_Position = projection * view * vec4(fragPosition, 1);
}