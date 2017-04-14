import Regl from 'regl'
import vec3 from 'gl-vec3'
import mat4 from 'gl-mat4'
import hsv2rgb from 'hsv2rgb'

const regl = Regl()

const NUM_BOIDS = 128
const BOID_DATA_SIZE = 4 * (3 + 3 + 3)
const boidData = Array(NUM_BOIDS).fill().map(() => {
  const color = hsv2rgb(Math.random() * 110 + 250, 0.6, 1).map(v => v / 255)
  const position = vec3.random([], 5)
  const velocity = vec3.random([], 0.01)
  return [
    position,
    velocity,
    color
  ]
})
const boidBuffer = regl.buffer({
  data: boidData
})

const updateBoids = (timeStep) => {
  const newBoidData = boidData.map((boid) => {
    const position = vec3.fromValues(...boid[0])
    const velocity = vec3.fromValues(...boid[1])
    const movement = vec3.scale([], velocity, timeStep)
    const newPosition = vec3.add([], position, movement)

    boid[0] = newPosition
    return boid
  })

  boidBuffer({
    data: newBoidData
  })
}

const drawBoids = regl({
  vert: `
    precision mediump float;
    attribute vec3 position, velocity, color;
    uniform mat4 view, projection;
    varying vec3 fragColor;

    void main() {
      gl_PointSize = 3.0;
      gl_Position = projection * view * vec4(position, 1);
      fragColor = color;
    }
  `,
  frag: `
    precision lowp float;
    varying vec3 fragColor;

    void main() {
      gl_FragColor = vec4(fragColor, 1);
    }
  `,
  attributes: {
    position: {
      buffer: boidBuffer,
      stride: BOID_DATA_SIZE,
      offset: 0
    },
    velocity: {
      buffer: boidBuffer,
      stride: BOID_DATA_SIZE,
      offset: 12
    },
    color: {
      buffer: boidBuffer,
      stride: BOID_DATA_SIZE,
      offset: 24
    }
  },
  uniforms: {
    view: ({ tick }) => {
      const t = 0.001 * tick
      return mat4.lookAt([],
        [30 * Math.cos(t), 2.5, 30 * Math.sin(t)],
        [0, 0, 0],
        [0, 1, 0])
    },
    projection: ({ viewportWidth, viewportHeight }) => {
      return mat4.perspective([],
        Math.PI / 4,
        viewportWidth / viewportHeight,
        0.01,
        1000)
    }
  },
  count: NUM_BOIDS,
  primitive: 'points'
})

let lastTime = 0
regl.frame(({ time }) => {
  regl.clear({
    depth: 1,
    color: [0, 0, 0, 1]
  })

  const timeStep = time - lastTime
  updateBoids(timeStep)
  drawBoids()
})
