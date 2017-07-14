import Regl from 'regl'
import mat4 from 'gl-mat4'
import mat3 from 'gl-mat3'
import createCube from 'primitive-cube'
import createCamera from 'perspective-camera'
import glsl from 'glslify'
import createSphere from 'primitive-sphere'

const regl = Regl()

const drawSphere = regl({
  vert: `
    precision mediump float;

    attribute vec3 position, normal;
    uniform mat4 model, view, projection;
    varying vec3 surfacePosition, surfaceNormal;

    void main() {
      surfaceNormal = normal;
      surfacePosition = position;
      gl_Position = projection * view * model * vec4(position, 1.0);
    }
  `,
  frag: glsl`
    precision mediump float;

    uniform vec3 surfaceColor;

    void main() {
      gl_FragColor = vec4(surfaceColor, 1.0);
    }
  `,
  attributes: {
    position: regl.prop('positions'),
    normal: regl.prop('normals'),
  },
  uniforms: {
    model: regl.prop('model'),
    view: regl.context('view'),
    projection: regl.context('projection'),
    surfaceColor: regl.prop('surfaceColor')
  },
  elements: regl.prop('cells')
})

const drawCube = regl({
  context: {
    normalModel: function(context, props) {
      const modelView = mat4.multiply([], context.view, props.model)
      let normalModel = mat3.create()
      mat3.transpose(normalModel, mat3.invert(normalModel, mat3.fromMat4(normalModel, modelView)))

      return normalModel
    }
  },
  vert: `
    precision mediump float;

    attribute vec3 position, normal;
    uniform mat4 model, view, projection;
    uniform mat3 normalModel;
    varying vec3 surfacePosition, surfaceNormal;

    void main() {
      surfaceNormal = normalModel * normal;
      surfacePosition = (view * model * vec4(position, 1.0)).xyz;
      gl_Position = projection * view * model * vec4(position, 1.0);
    }
  `,
  frag: glsl`
    precision mediump float;
    #pragma glslify: lambert = require(glsl-diffuse-lambert)

    uniform vec3 eye, lightPosition, surfaceColor;
    varying vec3 surfacePosition, surfaceNormal;

    void main() {
      vec3 lightDirection = normalize(lightPosition - surfacePosition);
      vec3 normal = normalize(surfaceNormal);
      float diffuse = lambert(lightDirection, normal);
      vec3 color = 0.1 + surfaceColor * diffuse;
      gl_FragColor = vec4(color, 1.0);
    }
  `,
  attributes: {
    position: regl.prop('positions'),
    normal: regl.prop('normals'),
  },
  uniforms: {
    model: regl.prop('model'),
    normalModel: regl.context('normalModel'),
    view: regl.context('view'),
    eye: regl.context('eye'),
    projection: regl.context('projection'),
    lightPosition: regl.prop('lightPosition'),
    surfaceColor: regl.prop('surfaceColor')
  },
  elements: regl.prop('cells')
})

const camera = createCamera({
  fov: Math.PI / 4,
  near: 0.01,
  far: 1000,
  viewport: [0, 0, window.innerWidth, window.innerHeight]
})
camera.translate([0, 8, 0])
camera.lookAt([0, 0, 0])
camera.update()

const cube = createCube(1)
const cubeModel = mat4.identity([])

const lightPosition = [0, 3, 0]

const sphere = createSphere(0.02, { segments: 16 })
const sphereModel = mat4.translate([], mat4.identity([]), lightPosition)
// const sphereModel = mat4.identity([])

const setupCamera = regl({
  context: {
    view: regl.prop('view'),
    projection: regl.prop('projection'),
    eye: regl.prop('eye')
  },
  uniforms: {
    view: regl.context('view'),
    invView: function(context) {
      return mat4.invert([], context.view)
    },
    eye: regl.context('eye'),
    projection: regl.context('projection')
  }
})

regl.frame(() => {
  regl.clear({
    depth: 1,
    color: [0.95, 0.95, 0.95, 1]
  })

  mat4.rotateX(cubeModel, cubeModel, 0.01)
  mat4.rotateY(cubeModel, cubeModel, 0.00)

  setupCamera({
    view: camera.view,
    projection: camera.projection,
    eye: camera.position
  }, function(context) {
    drawCube({
      model: cubeModel,
      positions: cube.positions,
      normals: cube.normals,
      cells: cube.cells,
      lightPosition: lightPosition,
      surfaceColor: [0.7, 0.1, 0.8]
    })

    drawSphere({
      model: sphereModel,
      positions: sphere.positions,
      normals: sphere.normals,
      cells: sphere.cells,
      surfaceColor: [0.9, 0.1, 0.1]
    })
  })
})
