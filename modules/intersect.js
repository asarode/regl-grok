import Regl from 'regl'
import mat4 from 'gl-mat4'
import mat3 from 'gl-mat3'
import createCube from 'primitive-cube'
import createCamera from 'perspective-camera'
import glsl from 'glslify'
import createSphere from 'primitive-sphere'

const regl = Regl()

const drawSphere = regl({
  context: {
    model: function(context, props) {
      mat4.create()
    }
  },
  vert: glsl`
    precision mediump float;
    #pragma glslify: computeTranslateMat = require(glsl-matrix/computeTranslateMat);

    attribute vec3 position;
    uniform mat4 view, projection;
    uniform vec3 debugPosition;

    void main() {
      mat4 translation = computeTranslateMat(debugPosition);
      gl_Position = projection * view * translation * vec4(position, 1.0);
    }
  `,
  frag: `
    precision mediump float;

    uniform vec3 color;

    void main() {
      gl_FragColor = vec4(color, 1.0);
    }
  `,
  attributes: {
    position: regl.prop('positions'),
  },
  uniforms: {
    debugPosition: regl.prop('debugPosition'),
    view: regl.context('view'),
    projection: regl.context('projection'),
    color: regl.prop('color')
  },
  elements: regl.prop('cells')
})

const drawObject = regl({
  vert: glsl`
    precision mediump float;
    #pragma glslify: transpose = require(glsl-transpose)

    attribute vec3 position, normal;
    uniform mat4 model, view, projection, normalModel;
    varying vec3 surfaceNormal;
    varying vec4 surfacePosition;

    void main() {
      surfaceNormal = mat3(normalModel) * normal;
      surfacePosition = view * model * vec4(position, 1.0);
      gl_Position = projection * surfacePosition;
    }
  `,
  frag: `
    precision mediump float;

    uniform mat4 model, view;
    uniform vec3 eye, lightA, lightB, lightC, surfaceColor;
    varying vec3 surfaceNormal;
    varying vec4 surfacePosition;

    void main() {
      vec3 lightADir = normalize(view * model * vec4(lightA, 1.0) - surfacePosition).xyz;
      vec3 lightBDir = normalize(view * model * vec4(lightB, 1.0) - surfacePosition).xyz;
      vec3 lightCDir = normalize(view * model * vec4(lightC, 1.0) - surfacePosition).xyz;
      vec3 normal = normalize(surfaceNormal);
      float diffuseA = max(0.0, dot(lightADir, normal));
      float diffuseB = max(0.0, dot(lightBDir, normal));
      float diffuseC = max(0.0, dot(lightCDir, normal));
      vec3 color = surfaceColor * (diffuseA + diffuseB + diffuseC);
      gl_FragColor = vec4(color, 1.0);
    }
  `,
  context: {
    normalModel: (context, props) => {
      const normalModel = mat4.create()
      const viewModel = mat4.create()
      mat4.multiply(viewModel, context.view, props.model)
      return mat4.transpose(normalModel, mat4.invert(normalModel, viewModel))
    }
  },
  attributes: {
    position: (context, props) => props.geometry.positions,
    normal: (context, props) => props.geometry.normals,
  },
  uniforms: {
    model: regl.prop('model'),
    normalModel: regl.context('normalModel'),
    view: regl.context('view'),
    eye: regl.context('eye'),
    projection: regl.context('projection'),
    lightA: regl.prop('lightA'),
    lightB: regl.prop('lightB'),
    lightC: regl.prop('lightC'),
    surfaceColor: regl.prop('surfaceColor')
  },
  elements: (context, props) => props.geometry.cells
})

const drawLine = regl({
  vert: glsl`
    precision mediump float;
    #pragma glslify: computeTranslateMat = require(glsl-matrix/computeTranslateMat);

    attribute vec3 endpoint;
    uniform mat4 view, projection;

    void main() {
      mat4 translation = computeTranslateMat(endpoint);
      gl_Position = projection * view * translation * vec4(0.0, 0.0, 0.0, 1.0);
    }
  `,
  frag: `
    precision mediump float;

    uniform vec3 color;

    void main() {
      gl_FragColor = vec4(color, 1.0);
    }
  `,
  attributes: {
    endpoint: regl.prop('endpoints')
  },
  uniforms: {
    color: regl.prop('color'),
    projection: regl.context('projection'),
    view: regl.context('view')
  },
  count: 2,
  elements: [[1, 0]],
  lineWidth: 1
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

const drawDebugPoint = (passedProps) => {
  const defaultProps = {
    color: [1.0, 1.0, 0.0]
  }
  const props = { ...defaultProps, ...passedProps }
  drawSphere({
    positions: sphere.positions,
    cells: sphere.cells,
    debugPosition: props.debugPosition,
    color: props.color
  })
  drawLine({
    endpoints: [[0, 0, 0], props.debugPosition],
    color: props.color
  })
}

const sphere = createSphere(0.02, { segments: 16 })
const bigSphere = createSphere(1.0, { segments: 16 })
const cube = createCube(1)
const objectModel = mat4.identity([])
const lightA = [0.5, 1, -1]
const lightB = [1, 1, -1]
const lightC = [-1, 1, 0]

regl.frame(() => {
  regl.clear({
    depth: 1,
    color: [0.1, 0.05, 0.25, 1.0]
  })

  setupCamera({
    view: camera.view,
    projection: camera.projection,
    eye: camera.position
  }, function(context) {
    lightA[0] = Math.sin(context.tick / 100)
    lightA[2] = Math.cos(context.tick / 100)

    lightB[0] = Math.sin(context.tick / 100) * -2.4
    lightB[1] = Math.sin(context.tick / 10) * 1.4
    lightB[2] = 0.5 + Math.cos(context.tick / 100) * 1.8

    lightC[0] = Math.sin(context.tick / 100) * 3
    lightC[1] = Math.cos(context.tick / 100) * 3
    lightC[2] = Math.sin(context.tick / 100) * 3

    mat4.rotateY(objectModel, objectModel, 0.01)

    drawObject({
      model: objectModel,
      geometry: bigSphere,
      lightA,
      lightB,
      lightC,
      surfaceColor: [0.7, 0.1, 0.8]
    })

    drawDebugPoint({
      sphere,
      debugPosition: lightA,
    })

    drawDebugPoint({
      sphere,
      debugPosition: lightB,
      color: [1.0, 0.0, 0.0],
    })

    drawDebugPoint({
      sphere,
      debugPosition: lightC,
      color: [0.0, 1.0, 0.0],
    })
  })
})
