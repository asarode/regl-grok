import Regl from 'regl'
import vec3 from 'gl-vec3'
import mat4 from 'gl-mat4'
import hsv2rgb from 'hsv2rgb'

const regl = Regl()

const NUM_BOIDS = 128
const BOID_DATA_SIZE = 4 * (3 + 3 + 3)
const boidData = Array(NUM_BOIDS).fill().map(() => {
  const color = hsv2rgb(Math.random() * 110 + 250, 0.6, 1).map(v => v / 255)
  const position = vec3.random([], 25)
  const velocity = vec3.random([], 0.25)
  return [
    position,
    velocity,
    color
  ]
})
const boidBuffer = regl.buffer({
  data: boidData
})

const getNearbyBoids = (boid, allBoids) => {
  return allBoids.filter((b) => {
    // return b !== boid
    return b !== boid && vec3.squaredDistance(boid[0], b[0]) < 100
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
  return vec3.scale([], vecToCenter, 1 / 100)
}

const flyAwayFromOthers = (boid, nearbyBoids) => {
  const vecAway = vec3.create()
  for (let i = 0; i < nearbyBoids.length; i++) {
    const b = nearbyBoids[i]
    if (vec3.squaredDistance(b[0], boid[0]) < 25) {
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
  return vec3.scale([], vecWithoutTargetBoidVelocity, 1 / 8)
}

const limitVelocity = (velocity) => {
  const max = 0.5
  if (vec3.length(velocity) > max) {
    vec3.scale(velocity, vec3.normalize(velocity, velocity), max)
  }
  return velocity
}

const keepInside = ([x, y, z], velocity) => {
  const bound = 30
  if (x < -bound) {
    velocity[0] = 10
  } else if (x > bound) {
    velocity[0] = -10
  }
  if (y < -bound) {
    velocity[1] = 10
  } else if (y > bound) {
    velocity[1] = -10
  }
  if (z < -bound) {
    velocity[2] = 10
  } else if (z > bound) {
    velocity[2] = -10
  }
  return velocity
}

const updateBoids = () => {
  const newBoidData = boidData.map((boid, _, data) => {
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
    const newPosition = vec3.add([], boid[0], newVelocity)

    boid[0] = newPosition
    boid[1] = newVelocity
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
      gl_PointSize = 5.0;
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
      const t = 0.025 * tick
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
  lastTime = time
  updateBoids()
  drawBoids()
})
