import mat4 from 'gl-mat4'
import normals from 'angle-normals'
import Regl from 'regl'
import resl from 'resl'
import teapot from 'teapot'
import posxImg from '../assets/posx.jpg'
import negxImg from '../assets/negx.jpg'
import posyImg from '../assets/posy.jpg'
import negyImg from '../assets/negy.jpg'
import poszImg from '../assets/posz.jpg'
import negzImg from '../assets/negz.jpg'

const regl = Regl()
const setupEnvMap = regl({
  context: {
    view: ({tick}) => {
      const t = 0.01 * tick
      /*
       * [QUESTION]
       * How are lookAt (look-at? lookat?) matrices made? Is this a common
       * setup? Are there different types of setups? If so, what are there
       * tradeoffs between them?
       */
      return mat4.lookAt([],
        [30 * Math.cos(t), 2.5, 30 * Math.sin(t)],
        [0, 2.5, 0],
        [0, 1, 0])
    }
  },
  frag: `
  precision mediump float;
  uniform samplerCube envmap;
  varying vec3 reflectDir;
  void main () {
    // [QUESTION]
    // Looks like this 'reflectDir' value gets set by shaders in other commands.
    // I'm guessing that works because the commands are drawn together as
    // subcommands?
    gl_FragColor = textureCube(envmap, reflectDir);
  }`,
  uniforms: {
    // Props -> something specifically needed for the object
    envmap: regl.prop('cube'),
    // Context -> something that other commands share? [QUESTION]
    view: regl.context('view'),
    projection: ({viewportWidth, viewportHeight}) =>
      /*
      * [QUESTION]
      * How do you use a perspective matrix to create a projection and what is
      * it used for? Do you use a lookAt matrix with this somehow?
      */
      mat4.perspective([],
        Math.PI / 4,
        viewportWidth / viewportHeight,
        0.01,
        1000),
    invView: ({view}) => mat4.invert([], view) // [QUESTION]
  }
})

const drawBackground = regl({
  vert: `
  precision mediump float;
  attribute vec2 position;
  uniform mat4 view;
  varying vec3 reflectDir;
  void main() {
    // [QUESTION]
    // I forget that math. How does that end up getting you a reflection
    // direction? What is the direction in relation to? Are normals involved
    // somewhere?
    reflectDir = (view * vec4(position, 1, 0)).xyz;
    // [QUESTION]
    // What is gl_Position? What happens when a different position matrix gets
    // passed in?
    gl_Position = vec4(position, 0, 1);
  }
  `,
  attributes: {
    position: [
      -4, -4,
      -4, 4,
      8, 0]
  },
  depth: {
    mask: false,
    enable: false
  },
  count: 3
})

const drawteapot = regl({
  vert: `
  precision mediump float;
  attribute vec3 position, normal;
  uniform mat4 projection, view, invView;
  varying vec3 reflectDir;
  void main() {
    // [QUESTION] How is 'reflectDir' getting calculated here?
    vec4 eye = invView * vec4(0, 0, 0, 1);
    reflectDir = reflect(
      normalize(position.xyz - eye.xyz / eye.w),
      normal);
    gl_Position = projection * view * vec4(position, 1);
  }
  `,
  attributes: {
    // [QUESTION] What sort of API does `teapot` have?
    position: teapot.positions,
    normal: normals(teapot.cells, teapot.positions)
  },
  elements: teapot.cells
})

// [QUESTION]
//  I'm guessing this stands for "resource loader"? How does it work?
resl({
  manifest: {
    posx: {
      type: 'image',
      src: posxImg
    },
    negx: {
      type: 'image',
      src: negxImg
    },
    posy: {
      type: 'image',
      src: posyImg
    },
    negy: {
      type: 'image',
      src: negyImg
    },
    posz: {
      type: 'image',
      src: poszImg
    },
    negz: {
      type: 'image',
      src: negzImg
    }
  },
  // [QUESTION] Is it correct to call these textures?
  onDone: ({ posx, negx, posy, negy, posz, negz }) => {
    const cube = regl.cube(
      posx, negx,
      posy, negy,
      posz, negz)
    regl.frame(() => {
      // [QUESTION]
      // A-ha! So it makese sense that`reflectDir` is passed around as a varying between the two
      // commands -- they're subcomands.
      setupEnvMap({ cube }, () => {
        drawBackground()
        drawteapot()
      })
    })
  },
  onProgress: (fraction) => {
    const intensity = 1.0 - fraction
    regl.clear({
      color: [intensity, intensity, intensity, 1]
    })
  }
})
