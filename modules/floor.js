import Regl from 'regl'
import mat4 from 'gl-mat4'
import bunny from 'bunny'
import normals from 'angle-normals'
import setupCamera from 'regl-camera'

const regl = Regl()
const camera = setupCamera(regl, {
  center: [0, 2.5, 0],
  damping: 0,
  distance: 30
})

const drawBunny = regl({
  vert: `
    precision mediump float;
    uniform mat4 projection, view;
    attribute vec3 position, normal;
    varying vec3 vnormal;
    void main () {
      vnormal = normal;
      gl_Position = projection * view * vec4(position, 1.0);
    }`,
  frag: `
    precision mediump float;
    varying vec3 vnormal;
    void main () {
      gl_FragColor = vec4(abs(vnormal), 1.0);
    }`,
  attributes: {
    position: bunny.positions,
    normal: normals(bunny.cells, bunny.positions)
  },
  elements: bunny.cells
})

regl.frame(() => {
  regl.clear({
    color: [0, 0, 0, 1]
  })
  camera(() => {
    drawBunny()
  })
})
