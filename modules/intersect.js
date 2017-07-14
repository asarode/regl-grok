import Regl from 'regl'
import mat4 from 'gl-mat4'
import createCube from 'primitive-cube';
import createCamera from 'perspective-camera';

const regl = Regl()

const drawCube = regl({
  vert: `
    precision mediump float;
    attribute vec3 position, normal;
    uniform mat4 model, view, projection;
    varying vec3 vNormal;

    void main() {
      vNormal = normal;
      gl_Position = projection * view * model * vec4(position, 1.0);
    }
  `,
  frag: `
    precision mediump float;
    varying vec3 vNormal;

    void main() {
      gl_FragColor = vec4(abs(vNormal), 1.0);
    }
  `,
  attributes: {
    position: regl.prop('positions'),
    normal: regl.prop('normals')
  },
  uniforms: {
    model: regl.prop('model'),
    view: regl.prop('view'),
    projection: regl.prop('projection')
  },
  elements: regl.prop('cells')
})

const camera = createCamera({
  fov: Math.PI / 4,
  near: 0.01,
  far: 1000,
  viewport: [0, 0, window.innerWidth, window.innerHeight]
})
camera.translate([1, 1, 1])
camera.lookAt([0, 0, 0])
camera.update()

const cube = createCube(0.1)
const cubeModel = mat4.identity([])

regl.frame(() => {
  regl.clear({
    depth: 1,
    color: [0.95, 0.95, 0.95, 1]
  })

  mat4.rotateX(cubeModel, cubeModel, 0.01)
  mat4.rotateY(cubeModel, cubeModel, 0.02)

  drawCube({
    model: cubeModel,
    view: camera.view,
    projection: camera.projection,
    positions: cube.positions,
    normals: cube.normals,
    cells: cube.cells
  })
})
