import Regl from 'regl'
import mat4 from 'gl-mat4'
import bunny from 'bunny'
import normals from 'angle-normals'
import glsl from 'glslify'

import { Bunny } from './bunny/command'

const regl = Regl()
const drawBunny = Bunny(regl)

regl.frame(() => {
  regl.clear({
    color: [0.04, 0.03, 0.14, 1]
  })
  drawBunny()
})
