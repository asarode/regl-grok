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

    attribute float increment;

    uniform float tick;
    uniform float resolution;
    uniform float smoothingDistance;
    uniform float angleOffset;
    uniform float wavyFill;
    uniform float amplitude;
    uniform float waves;
    uniform float radius;
    uniform int pattern;

    void main() {
      float smoothingFactor = 1.0;
      if (increment < wavyFill * resolution * smoothingDistance) {
        smoothingFactor = increment / (wavyFill * resolution * smoothingDistance);
      } else if (increment > wavyFill * resolution * (1.0 - smoothingDistance) && increment <= wavyFill * resolution) {
        smoothingFactor = (wavyFill * resolution - increment) / (wavyFill * resolution * smoothingDistance);
      } else if (increment == resolution) {
        smoothingFactor = 0.0;
      }

      float animTick = tick / 85.0 + 90.0;
      float angle = radians(increment) + radians(angleOffset);
      float addon = 0.0;
      if (increment < wavyFill * resolution) {
        float sineOutput;
        if (pattern == 0) {
          sineOutput = sin((angle + animTick) * waves);
        } else if (pattern == 1) {
          sineOutput = cos((angle + animTick) * waves);
        }
        addon = amplitude * smoothingFactor * sineOutput;
      }

      float x = (radius + addon) * cos(angle + animTick);
      float y = (radius + addon) * sin(angle + animTick);
      float z = 0.0;

      gl_Position = vec4(x, y, z, 1);
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
    increment: range(resolution)
  },
  uniforms: {
    color: regl.prop('color'),
    tick: regl.context('tick'),
    resolution: regl.context('resolution'),
    smoothingDistance: regl.context('smoothingDistance'),
    angleOffset: regl.prop('angleOffset'),
    wavyFill: regl.prop('wavyFill'),
    amplitude: regl.prop('amplitude'),
    waves: (context, props) => props.waves || 12,
    radius: regl.prop('radius'),
    pattern: () => regl.prop('pattern') === 'sin' ? 0 : 1,
  },
  primitive: 'line loop',
  count: resolution,
  lineWidth: 7
})

regl.frame(() => {
  regl.clear({
    color: [0.03, 0.03, 0.03, 1],
    depth: 1
  })
  drawWavyCircle({
    radius: 0.75,
    amplitude: 0.03,
    pattern: 'sin',
    wavyFill: 0.5,
    angleOffset: 0,
    waves: 16,
    color: [1, 1, 0.8, 1]
  })
  drawWavyCircle({
    radius: 0.8,
    amplitude: 0.05,
    pattern: 'cos',
    wavyFill: 0.5,
    angleOffset: 0,
    waves: 16,
    color: [1, 0.8, 0.8, 1]
  })
  drawWavyCircle({
    radius: 0.775,
    amplitude: 0.04,
    pattern: 'cos',
    wavyFill: 0.5,
    angleOffset: 0,
    waves: 16,
    color: [0.8, 0.3, 0.3, 1]
  })
})
