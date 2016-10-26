import Regl from 'regl'

const regl = Regl()

const drawBox = options => regl({
  vert: `
  attribute vec3 position;
  void main() {
    gl_Position = vec4(position, 1.0);
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
    position: [
      [options.left, options.bottom, options.depth],
      [options.right, options.bottom, options.depth],
      [options.left, options.top, options.depth],

      [options.left, options.top, options.depth],
      [options.right, options.bottom, options.depth],
      [options.right, options.top, options.depth]
    ]
  },
  uniforms: {
    color: regl.prop('color')
  },
  count: 6
})

/**
 * CLIP SPACE
 * ==========
 *
 * Everything that you see on the screen, and nothing outside the screen, is
 * inside the "clip space". This space is represented as a 3D grid with 1 unit
 * long axes in the x, y, and z directions. So from (1, 1, 1) to (-1, -1, -1),
 * with (0, 0, 0) being the center.
 *
 * The magic output variable `gl_Position` in the vertex shader returns a 4
 * element vector (vec4) with the first three elements being the vertx's
 * position in clip space. (I haven't learned why the 4th element is useful, I
 * just know it _is_ useful and to leave it to 1.0 for now.)
 *
 * The z coordinate determines the depth of the vertex. This lets you draw
 * things on top of each other in the correct order. A negative z value moves
 * the vertex closer to the screen, a positive z value moves it farther back.
 * This might depend based on if camera transformations affects this.. need to
 * look into it more.
 */

drawBox({
  top    : 0.5,             // x
  bottom : -0.5,            // x
  left   : -0.5,            // y
  right  : 0.5,             // y
  depth  : 0,               // z
})({
  color  : [1, 0.4, 0.4, 1] // red
})

drawBox({
  top    : 0.9,             // x
  bottom : 0,               // x
  left   : -0.9,            // y
  right  : 0.9,             // y
  depth  : 0.5,             // z
})({
  color  : [0.4, 1, 0.4, 1] // green
})

drawBox({
  top    : 1,               // x
  bottom : -1,              // x
  left   : -1,              // y
  right  : 1,               // y
  depth  : -1.1,            // z
})({
  color  : [0.4, 0.4, 1, 1] // blue
})