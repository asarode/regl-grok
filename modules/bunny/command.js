import vert from './bunny.vert'
import frag from './bunny.frag'


export function Bunny (reglInstance) {
  return reglInstance({
    vert,
    frag,
    context: {
      view: ({ tick }) => {
        const t = 0.01 * tick
        return mat4.lookAt([],
          [0, 10, 20],
          [0, 4, 0],
          [0, 1, 0])
      }
    },
    attributes: {
      position: bunny.positions,
      normal: normals(bunny.cells, bunny.positions)
    },
    elements: bunny.cells,
    uniforms: {
      view: regl.context('view'),
      invView: ({ view }) => mat4.invert([], view),
      projection: ({ viewportWidth, viewportHeight }) => mat4.perspective([],
        Math.PI / 4,
        viewportWidth / viewportHeight,
        0.01,
        1000),
      'light.color': [1, 0, 0],
      'light.intensity': 1,
      'light.shininess': 0.3,
      'light.position': ({ tick }) => {
        return [0, 0, 0]
        const t = 0.1 * tick
        return [
          10 * Math.cos(0.05 * (5 * t + 1)),
          10 * Math.sin(0.05 * (4 * t)),
          10 * Math.cos(0.05 * (0.1 * t))
        ]
      },
      ambientCoef: 0.2,
      diffuseCoef: 0.5,
      specularCoef: 0.2
    }
  })
}