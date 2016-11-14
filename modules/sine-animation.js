import Regl from 'regl'

const regl = Regl()
const radius = 0.8
const resolution = 360
const waves = 12
const waveHeight = 0.1 * radius
const sinePct = 0.5
const smoothing = 0.14

const range = (length) => [...Array(length).keys()]
const toRadian = (degrees) => Math.PI / 180 * degrees

const drawWavyCircle = regl({
  context: {
    resolution: 360,
    smoothingDistance: 0.14
  },
  vert: `
    precision mediump float;
    attribute vec3 position;
    void main() {
      gl_Position = vec4(position, 1);
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
    position: ({ resolution, tick, smoothingDistance }, props) => {
      const {
        angleOffset = 0,
        wavyFill = 0.5,
        amplitude = 0.1,
        pattern = 'sin',
      } = props
      const pos = range(360).map((i) => {
        let smoothingFactor = 1
        if (i < wavyFill * resolution * smoothingDistance) {
          smoothingFactor = i / (wavyFill * resolution * smoothingDistance);
        }
        if (i > wavyFill * resolution * (1 - smoothingDistance) && i <= wavyFill * resolution) {
          smoothingFactor = (wavyFill * resolution - i) / (wavyFill * resolution * smoothingDistance);
        }
        if (i === resolution) {
          smoothingFactor = 0
        }

        const animTick = (tick / 85) + 90
        const angle = toRadian(i) + toRadian(angleOffset)
        let addon = 0
        if (i < wavyFill * resolution) {
          const sineFn = pattern === 'cos' ? Math.cos : Math.sin
          addon = amplitude * smoothingFactor * sineFn((angle + animTick) * waves)
        }

        const x = (radius + addon) * Math.cos(angle + animTick)
        const y = (radius + addon) * Math.sin(angle + animTick)
        const z = 0
        return [x, y, z]
      })
      return pos
    }
  },
  uniforms: {
    color: regl.prop('color')
  },
  primitive: 'line loop',
  count: 360,
  lineWidth: 7
})

regl.frame(() => {
  regl.clear({
    color: [0.03, 0.03, 0.03, 1],
    depth: 1
  })
  drawWavyCircle({
    radius: 0.8,
    amplitude: 0.1,
    pattern: 'sin',
    wavyFill: 0.3,
    angleOffset: 0,
    color: [1, 1, 0.8, 1]
  })
  drawWavyCircle({
    radius: 0.8,
    amplitude: 0.12,
    pattern: 'cos',
    wavyFill: 0.3,
    angleOffset: 0,
    color: [1, 0.8, 0.8, 1]
  })
  drawWavyCircle({
    radius: 0.8,
    amplitude: 0.08,
    pattern: 'cos',
    wavyFill: 0.3,
    angleOffset: 0,
    color: [0.8, 0.3, 0.3, 1]
  })

  drawWavyCircle({
    radius: 0.8,
    amplitude: 0.1,
    pattern: 'sin',
    wavyFill: 0.3,
    angleOffset: 180,
    color: [1, 1, 0.8, 1]
  })
  drawWavyCircle({
    radius: 0.8,
    amplitude: 0.12,
    pattern: 'cos',
    wavyFill: 0.3,
    angleOffset: 180,
    color: [1, 0.8, 0.8, 1]
  })
  drawWavyCircle({
    radius: 0.8,
    amplitude: 0.08,
    pattern: 'cos',
    wavyFill: 0.3,
    angleOffset: 180,
    color: [0.8, 0.3, 0.3, 1]
  })
})
