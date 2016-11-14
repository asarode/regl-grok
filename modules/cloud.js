import Regl from 'regl'
import mat4 from 'gl-mat4'
import goatRock from '../assets/goat-rock.xyz'

const regl = Regl()

const drawPointCloud = ({ positions, color }) => {
  console.log(positions)
  return regl({
    vert: `
      precision mediump float;
      attribute vec3 position;
      uniform mat4 view, projection;

      void main() {
        gl_Position = projection * view * vec4(position, 1.0);
        gl_PointSize = 10.0;
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
      view: ({tick}) => {
        const t = 0.01 * tick
        return mat4.lookAt([],
          [30 * Math.cos(t), 2.5, 30 * Math.sin(t)],
          [0, 0, 0],
          [0, 1, 0])
      },
      projection: ({viewportWidth, viewportHeight}) =>
        mat4.perspective([],
          Math.PI / 4, viewportWidth / viewportHeight, 0.01, 1000)
    },
    count: positions.length,
    primitive: 'points'
  })
}

const parseXyz = (xyzStr) => xyzStr.split('\n').filter((line) => line !== '')
  .map((line) => line.split(',').map(Number.parseFloat))
const randColor = () => Math.random() * 0.2 + 0.4

const goatRockPoints = parseXyz(goatRock)
const pointCloud = {
  positions: goatRockPoints,
  color: [1, 0, 0, 1]
}
console.log(pointCloud)
regl.frame(() => {
  regl.clear({
    color: [0.9, 0.9, 0.9, 1]
  })
  drawPointCloud(pointCloud)()
})
