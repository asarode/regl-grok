import Regl from 'regl'
import vec3 from 'gl-vec3'
import mat4 from 'gl-mat4'
import hsv2rgb from 'hsv2rgb'
import Stats from 'stats.js'
import isEqual from 'lodash/isEqual'

const stats = new Stats()
stats.showPanel(0)
document.body.appendChild(stats.dom)

const regl = Regl()

const options = {
  numBoids: 500,
  nearbyDistance: 8,
  avoidDistance: 4,
  followMultiplier: 0.2,
  toCenterMultiplier: 0.02,
  maxSpeed: 6,
  minSpeed: 0.2,
  boundSize: 30,
  boundCorrection: 0.3,
  stepSize: 0.1
}

var BOID_DATA
var BOID_BUFFER

const getNearbyBoids = (boid, allBoids) => {
  return allBoids.filter((b) => {
    return b !== boid && vec3.squaredDistance(boid[0], b[0]) < Math.pow(options.nearbyDistance, 2)
  })
}

const flyToCenter = (boid, nearbyBoids) => {
  const positionSum = vec3.create()
  for (let i = 0; i < nearbyBoids.length; i++) {
    const b = nearbyBoids[i]
    vec3.add(positionSum, positionSum, b[0])
  }
  const center = vec3.scale([], positionSum, 1 / nearbyBoids.length)
  const vecToCenter = vec3.subtract([], center, boid[0])
  return vec3.scale([], vecToCenter, options.toCenterMultiplier)
}

const flyAwayFromOthers = (boid, nearbyBoids) => {
  const vecAway = vec3.create()
  for (let i = 0; i < nearbyBoids.length; i++) {
    const b = nearbyBoids[i]
    if (vec3.squaredDistance(b[0], boid[0]) < Math.pow(options.avoidDistance, 2)) {
      const vecAwayFromBoid = vec3.subtract([], b[0], boid[0])
      vec3.subtract(vecAway, vecAway, vecAwayFromBoid)
    }
  }
  return vecAway
}

const flyInSameDir = (boid, nearbyBoids) => {
  const velocitySum = vec3.create()
  for (let i = 0; i < nearbyBoids.length; i++) {
    const b = nearbyBoids[i]
    vec3.add(velocitySum, velocitySum, b[1])
  }
  const vecSameDir = vec3.scale([], velocitySum, 1 / nearbyBoids.length)
  const vecWithoutTargetBoidVelocity = vec3.subtract([], vecSameDir, boid[1])
  return vec3.scale([], vecWithoutTargetBoidVelocity, options.followMultiplier)
}

const limitVelocity = (velocity) => {
  const { maxSpeed, minSpeed } = options
  const length = vec3.length(velocity)
  if (length > maxSpeed) {
    vec3.scale(velocity, vec3.normalize(velocity, velocity), maxSpeed)
  } else if (length < minSpeed) {
    vec3.scale(velocity, vec3.normalize(velocity, velocity), minSpeed)
  }
  return velocity
}

const keepInside = ([x, y, z], velocity) => {
  const bound = options.boundSize
  if (x < -bound) {
    velocity[0] += options.boundCorrection
  } else if (x > bound) {
    velocity[0] -= options.boundCorrection
  }
  if (y < -bound) {
    velocity[1] += options.boundCorrection
  } else if (y > bound) {
    velocity[1] -= options.boundCorrection
  }
  if (z < -bound) {
    velocity[2] += options.boundCorrection
  } else if (z > bound) {
    velocity[2] -= options.boundCorrection
  }
  return velocity
}

const BOID_DATA_SIZE = 4 * (3 + 3 + 3)
BOID_DATA = Array(options.numBoids).fill().map(() => {
  const color = hsv2rgb(Math.random() * 110 + 250, 0.6, 1).map(v => v / 255)
  const position = vec3.random([], 25)
  const velocity = vec3.random([], 0.25)
  return [
    position,
    velocity,
    color
  ]
})

BOID_BUFFER = regl.buffer({
  data: BOID_DATA
})

const updateBoids = () => {
  BOID_DATA.forEach((boid, _, data) => {
    const nearbyBoids = getNearbyBoids(boid, data)
    const rule1 = flyToCenter(boid, nearbyBoids)
    const rule2 = flyAwayFromOthers(boid, nearbyBoids)
    const rule3 = flyInSameDir(boid, nearbyBoids)
    const ruleSum = [
      rule1[0] + rule2[0] + rule3[0],
      rule1[1] + rule2[1] + rule3[1],
      rule1[2] + rule2[2] + rule3[2],
    ]
    const newVelocity = limitVelocity(keepInside(boid[0], vec3.add([], boid[1], ruleSum)))
    const newPosition = vec3.add([], boid[0], vec3.scale([], newVelocity, options.stepSize))

    boid[0] = newPosition
    boid[1] = newVelocity
  })

  BOID_BUFFER({
    data: BOID_DATA
  })
}

const drawBoids = regl({
  vert: `
    precision mediump float;
    attribute vec3 position, velocity, color;
    uniform mat4 view, projection;
    varying vec3 fragColor;

    void main() {
      gl_PointSize = 2.0;
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
      buffer: BOID_BUFFER,
      stride: BOID_DATA_SIZE,
      offset: 0
    },
    velocity: {
      buffer: BOID_BUFFER,
      stride: BOID_DATA_SIZE,
      offset: 12
    },
    color: {
      buffer: BOID_BUFFER,
      stride: BOID_DATA_SIZE,
      offset: 24
    }
  },
  uniforms: {
    view: ({ tick }) => {
      const t = 0.01 * tick
      return mat4.lookAt([],
        [100 * Math.cos(t), 2.5, 100 * Math.sin(t)],
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
  count: regl.prop('numBoids'),
  primitive: 'points'
})

let lastTime = 0
regl.frame(() => {
  stats.begin()
  regl.clear({
    depth: 1,
    color: [0, 0, 0, 1]
  })

  updateBoids(options)
  drawBoids(options)
  stats.end()
})
