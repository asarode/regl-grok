import Regl from 'regl'
import mat4 from 'gl-mat4'
import vec4 from 'gl-vec4'
import Plane from 'primitive-plane'
import calcNormals from 'angle-normals'

const regl = Regl()

const drawSurface = regl({
  vert: `
    precision mediump float;
    attribute vec3 position;
    attribute vec3 normal;
    uniform mat4 view;
    uniform mat4 projection;
    varying vec3 vNormal;

    void main() {
      vNormal = normal;
      gl_Position = projection * view * vec4(position, 1.0);
    }
  `,
  frag: `
    precision mediump float;
    varying vec3 vNormal;

    void main() {
      gl_FragColor = vec4(abs(vNormal), 1.0);
    }
  `,
  attributes: {
    position: regl.prop('positions'),
    normal: regl.prop('normals')
  },
  elements: regl.prop('cells'),
  uniforms: {
    view: mat4.lookAt([],
      [0, -8, 4],
      [0, 0, 0],
      [0, 1, 0]),
    projection: ({ viewportWidth, viewportHeight }) => {
      return mat4.perspective([],
        Math.PI / 4,
        viewportWidth / viewportHeight,
        0.01,
        100)
    }
  }
})

const { positions, cells } = Plane(5, 5, 100, 100)
  positions.forEach((v, i) => {
    const luck = Math.abs(positions.length / 2 - i) / (positions.length / 2)
    const height = Math.random() * luck
    v[2] = height * 0.1
  })
  const normals = calcNormals(cells, positions)

regl.frame(() => {
  regl.clear({
    color: [0, 0, 0, 1]
  })
  
  console.log(positions)
  drawSurface({
    positions,
    cells,
    normals
  })
})
