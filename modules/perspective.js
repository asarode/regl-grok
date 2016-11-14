import Regl from 'regl'
import mat4 from 'gl-mat4'

const regl = Regl()

const drawCube = regl({
  vert: `
    precision mediump float;
    attribute vec3 position;
    attribute vec4 color;

    uniform mat4 model;
    uniform mat4 view;
    uniform mat4 projection;

    varying vec4 fragColor;

    void main() {
      fragColor = color;
      gl_Position = projection * view * model * vec4(position, 1.0);
    }
  `,
  frag: `
    precision mediump float;
    varying vec4 fragColor;

    void main() {
      gl_FragColor = fragColor;
    }
  `,
  attributes: {
    position: [
      // Front face
      -1.0, -1.0,  1.0,
        1.0, -1.0,  1.0,
        1.0,  1.0,  1.0,
      -1.0,  1.0,  1.0,

      // Back face
      -1.0, -1.0, -1.0,
      -1.0,  1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0, -1.0, -1.0,

      // Top face
      -1.0,  1.0, -1.0,
      -1.0,  1.0,  1.0,
        1.0,  1.0,  1.0,
        1.0,  1.0, -1.0,

      // Bottom face
      -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0,  1.0,
      -1.0, -1.0,  1.0,

      // Right face
        1.0, -1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0,  1.0,  1.0,
        1.0, -1.0,  1.0,

      // Left face
      -1.0, -1.0, -1.0,
      -1.0, -1.0,  1.0,
      -1.0,  1.0,  1.0,
      -1.0,  1.0, -1.0
    ],
    color: function () {
      const colorsOfFaces = [
        [0.3, 1.0, 1.0, 1.0],    // Front face: cyan
        [1.0, 0.3, 0.3, 1.0],    // Back face: red
        [0.3, 1.0, 0.3, 1.0],    // Top face: green
        [0.3, 0.3, 1.0, 1.0],    // Bottom face: blue
        [1.0, 1.0, 0.3, 1.0],    // Right face: yellow
        [1.0, 0.3, 1.0, 1.0]     // Left face: purple
      ]
      let colors = []
      for (let j = 0; j < 6; j++) {
        const polygonColor = colorsOfFaces[j]
        for (let i = 0; i < 4; i++) {
          colors = colors.concat(polygonColor)
        }
      }
      return colors
    }
  },
  elements: [
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23    // left
  ],
  uniforms: {
    model: ({ tick }, { seed }, batchId) => {
      const identity = mat4.identity([])
      const scale = mat4.scale([], identity, [0.3, 0.3, 0.3])
      const rotateX = mat4.rotateX([], identity, tick * 0.03 + 90)
      const rotateY = mat4.rotateY([], identity, tick * 0.05 + 90)
      const translate = mat4.translate([], identity, [Math.sin(batchId), 0.5 * batchId, Math.sin(batchId) + (10 * seed)])
      return multiplyPipeline([],
        identity,
        scale,
        rotateX,
        rotateY,
        translate,
      )
    },
    view: ({ tick }) => {
      const moveInAndOut = (Math.sin(tick * 0.03) * 4) + 10
      const moveLeftAndRight = 2 * Math.sin(tick * 0.02)
      const moveUpAndDown = 2 * Math.sin(tick * 0.01)
      const position = mat4.translate([], mat4.identity([]), [moveLeftAndRight, moveUpAndDown, moveInAndOut])
      return mat4.invert([], position)
    },
    projection: ({ viewportWidth, viewportHeight }) => {
      const fovRadians = Math.PI * 0.25
      const aspectRatio = viewportWidth / viewportHeight
      const nearPlane = 0.01
      const farPlane = 1000
      return mat4.perspective([], fovRadians, aspectRatio, nearPlane, farPlane)
    }
  },
})

const multiplyPipeline = (out, input, ...transforms) => {
  out = mat4.clone(input)
  out = transforms.reduce((acc, currTransform) => {
    return mat4.multiply(acc, acc, currTransform)
  }, out)
  return out
}

const props = new Array(200).fill(null).map((_) => ({ seed: Math.random() }))
regl.frame(() => {
  drawCube(props)
})
