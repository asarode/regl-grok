import Regl from 'regl'
import mat4 from 'gl-mat4'
import vec4 from 'gl-vec4'
import goatRock from '../assets/points.xyz'

const regl = Regl()

const drawPointCloud = ({ positions, color }) => {
  return regl({
    vert: `
      precision highp float;
      attribute vec3 position;
      uniform mat4 view, projection;

      void main() {
        gl_PointSize = 1.0;
        gl_Position = projection * view * vec4(position, 1.0);
      }
    `,
    frag: `
      precision mediump float;
      uniform vec4 color;

      void main() {
        gl_FragColor = color;
      }
    `,
    attributes: {
      position: positions
    },
    uniforms: {
      color,
      view: mat4.lookAt([],
        [0, 120, 70],
        [0, 0, 0],
        [0, 0.3, 0.7]),
      projection: ({viewportWidth, viewportHeight}) =>
        mat4.perspective([],
          Math.PI / 4, viewportWidth / viewportHeight, 0.01, 1000)
    },
    count: positions.length,
    primitive: 'points'
  })
}

const parseXyz = (xyzStr) => xyzStr.split('\n').filter((line) => line !== '')
  .map((line) => line.split(',').map(Number.parseFloat).map(x => x))
const randColor = () => Math.random() * 0.2 + 0.4

const goatRockPoints = parseXyz(goatRock)

const xs = goatRockPoints.map((coord) => coord[0])
const ys = goatRockPoints.map((coord) => coord[1])
const zs = goatRockPoints.map((coord) => coord[2])
const minX = xs.reduce((min, x) => Math.min(min, x), Infinity)
const maxX = xs.reduce((max, x) => Math.max(max, x), -Infinity)
const minY = ys.reduce((min, y) => Math.min(min, y), Infinity)
const maxY = ys.reduce((max, y) => Math.max(max, y), - Infinity)
const minZ = zs.reduce((min, z) => Math.min(min, z), Infinity)
const maxZ = zs.reduce((max, z) => Math.max(max, z), -Infinity)
const center = [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2]
const centered = goatRockPoints.map(([x, y, z]) => {
  const cx = x - center[0]
  const cy = y - center[1]
  const cz = z - center[2]
  return [cx, cy, cz]
})
console.log(centered)
const pointCloud = {
  positions: centered,
  color: [1, 0.98, 0.88, 1]
}
regl.frame(() => {
  regl.clear({
    color: [0.22, 0.11, 0.47, 1]
  })
  drawPointCloud(pointCloud)()
})
