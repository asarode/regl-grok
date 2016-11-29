import Regl from 'regl'
import mat4 from 'gl-mat4'
import bunny from 'bunny'
import normals from 'angle-normals'

const regl = Regl()

const drawBunny = regl({
  context: {
    view: ({ tick }) => {
      const t = 0.01 * tick
      return mat4.lookAt([],
        [0, 0, 100],
        [0, 0, 0],
        [0, 1, 0])
    }
  },
  vert: `
    precision mediump float;
    attribute vec3 normal, position;
    uniform mat4 view, projection;
    varying vec3 fragNormal, fragPosition;

    void main() {
      fragNormal = normal;
      fragPosition =  1.0 * position;
      gl_Position = projection * view * vec4(fragPosition, 1);
    }
  `,
  frag: `
    precision mediump float;
    uniform float ambientCoef, diffuseCoef, specularCoef;
    uniform mat4 invView;
    struct Light {
      vec3 color;
      float intensity;
      vec3 position;
    };
    uniform Light light;
    varying vec3 fragNormal, fragPosition;

    void main() {
      float ambient = ambientCoef * light.intensity;
      vec3 lightDir = normalize(light.position - fragPosition);
      float diffuse = diffuseCoef * dot(lightDir, fragNormal);
      vec4 eye = invView * vec4(0, 0, 0, 1);
      vec3 eyeDir = normalize(eye.xyz / eye.w - fragPosition);
      float specular = specularCoef * dot(eyeDir, reflect(lightDir, fragNormal));
      gl_FragColor = (ambient + diffuse + specular) * vec4(light.color, 1.0);
    }
  `,
  attributes: {
    position: bunny.positions,
    normal: normals(bunny.cells, bunny.positions)
  },
  elements: bunny.cells,
  uniforms: {
    view: regl.context('view'),
    invView: ({ view }) => mat4.invert([], view),
    projection: ({ viewportWidth, viewportHeight }) => mat4.perspective([],
      Math.PI / 4,
      viewportWidth / viewportHeight,
      0.01,
      1000),
    'light.color': [1, 0, 0],
    'light.intensity': 1,
    'light.position': [10, 10, 10],
    ambientCoef: 1,
    diffuseCoef: 0,
    specularCoef: 1
  }
})

regl.frame(() => {
  drawBunny()
})
