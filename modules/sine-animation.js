import Regl from 'regl'

const regl = Regl()
const radius = 0.8
const resolution = 360
const waves = 12
const waveHeight = 0.1 * radius
const sinePct = 0.5
const smoothing = 0.14

const range = (length) => [...Array(length).keys()]

const circle = (v) => regl({
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
    position: v
  },
  uniforms: {
    color: regl.prop('color')
  },
  primitive: 'line loop',
  count: v.length,
  lineWidth: 7
})

regl.frame(({ tick }) => {
  const vertices = (type) => range(resolution).map((i) => {
    let smoothPct = 1
    const angle = Math.PI / 180 * i

    if (i < sinePct * resolution * smoothing) {
      smoothPct = i / (sinePct * resolution * smoothing);
    }
    if (i > sinePct * resolution * (1 - smoothing) && i <= sinePct * resolution) {
      smoothPct = (sinePct * resolution - i) / (sinePct * resolution * smoothing);
    }
    if (i === resolution) {
      smoothPct = 0
    }

    let addon = 0
    if (i < sinePct * resolution) {
      if (type === 0) {
        addon = waveHeight * smoothPct * Math.sin((angle + tick / 100) * waves)
      }
      if (type === 1) {
        addon = waveHeight * smoothPct * Math.cos((angle + tick / 100) * waves)
      }
      if (type === 2) {
        addon = waveHeight * smoothPct * Math.cos(((angle + (Math.PI / 180 * 120) + tick / 100)) * waves)
      }
    }
    let x, y, z
    if (type === 0) {
      x = (radius + addon) * Math.cos(angle + tick / 75)
      y = (radius + addon) * Math.sin(angle + tick / 75)
      z = 0
    }
    if (type === 1) {
      x = (radius - 0.015 + addon) * Math.cos(angle + tick / 75)
      y = (radius - 0.015 + addon) * Math.sin(angle + tick / 75)
      z = 0
    }
    if (type === 2) {
      x = (radius + 0.015 + addon) * Math.cos(angle + tick / 75)
      y = (radius + 0.015 + addon) * Math.sin(angle + tick / 75)
      z = 0
    }
    return [x, y, z]
  })
  regl.clear({
    color: [0, 0, 0, 1],
    depth: 1
  })
  circle(vertices(0))({ color: [1, 1, 0.7, 1] })
  circle(vertices(1))({ color: [1, 0.7, 1, 1] })
  circle(vertices(2))({ color: [0.7, 1, 1, 1] })
})