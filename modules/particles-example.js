/*
  <p>This example show how you can render point particles in regl</p>
 */
import Regl from 'regl'
import mat4 from 'gl-mat4'
import hsv2rgb from 'hsv2rgb'
import goatRock from '../assets/goat-rock.xyz'
const regl = Regl()

const NUM_POINTS = 1000
const VERT_SIZE = 4 * (4 + 4 + 3)

const pointBuffer = regl.buffer(Array(NUM_POINTS).fill().map(function () {
  const color = hsv2rgb(Math.random() * 360, 0.6, 1)
  return [
    // freq
    Math.random() * 10,
    Math.random() * 10,
    Math.random() * 10,
    Math.random() * 10,
    // phase
    2.0 * Math.PI * Math.random(),
    2.0 * Math.PI * Math.random(),
    2.0 * Math.PI * Math.random(),
    2.0 * Math.PI * Math.random(),
    // color
    color[0] / 255, color[1] / 255, color[2] / 255
  ]
}))

const parseXyz = (xyzStr) => xyzStr.split('\n').filter((line) => line !== '')
  .map((line) => line.split(',').map(Number.parseFloat))
  // .map(([x, y, z]) => [x / 1000000, y / 1000000, z])
const randColor = () => Math.random() * 0.2 + 0.4

const goatRockPoints = parseXyz(goatRock)
console.log(goatRockPoints)
const pointCloud = {
  positions: goatRockPoints,
  color: [1, 0, 0]
}

const drawParticles = ({ positions, color }) => regl({
  vert: `
  precision mediump float;
  attribute vec3 position;
  uniform vec3 color;
  uniform float time;
  uniform mat4 view, projection;
  varying vec3 fragColor;
  void main() {
    gl_PointSize = 5.0;
    gl_Position = projection * view * vec4(position, 1);
    fragColor = color;
  }`,

  frag: `
  precision lowp float;
  varying vec3 fragColor;
  void main() {
    gl_FragColor = vec4(fragColor, 1);
  }`,

  attributes: {
    position: positions
  },

  uniforms: {
    color,
    view: ({tick}) => {
      const t = 0.01 * tick
      return mat4.lookAt([],
        [3000000, 2.5, 1],
        [0, 0, 0],
        [0, 1, 0])
    },
    projection: ({viewportWidth, viewportHeight}) =>
      mat4.perspective([],
        Math.PI / 4,
        viewportWidth / viewportHeight,
        0.01,
        1000),
    time: ({tick}) => tick * 0.001
  },

  count: positions.length,

  primitive: 'points'
})

regl.frame(() => {
  regl.clear({
    depth: 1,
    color: [0.9, 0.9, 0.9, 1]
  })

  drawParticles(pointCloud)()
})
