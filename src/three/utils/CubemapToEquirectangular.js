// Based on https://github.com/spite/THREE.CubemapToEquirectangular
// MIT License
// Copyright (c) 2017 Jaume Sanchez Elias, http://www.clicktorelease.com

import * as THREE from 'three'

const vertexShader = `
attribute vec3 position;
attribute vec2 uv;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

varying vec2 vUv;

void main()  {

  vUv = vec2( 1.0 - uv.x, 1.0 - uv.y );
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
`

const fragmentShader = `
precision mediump float;

uniform samplerCube map;

varying vec2 vUv;

#define M_PI 3.1415926535897932384626433832795

void main()  {

    vec2 uv = vUv;

    float longitude = uv.x * 2. * M_PI - M_PI + M_PI / 2.;
    float latitude = uv.y * M_PI;

    float yaw = M_PI / 2.0;
    longitude -= yaw;

    vec3 dir = vec3(
        - sin( longitude ) * sin( latitude ),
        cos( latitude ),
        - cos( longitude ) * sin( latitude )
    );
    normalize( dir );

    vec4 color = textureCube( map, dir );

    color.rgb = pow(color.rgb, vec3(1.0 / 2.2));

    gl_FragColor = color;

}
`

class CubemapToEquirectangular {
  constructor(renderer) {
    this.width = 1
    this.height = 1

    this.renderer = renderer

    this.material = new THREE.RawShaderMaterial({
      uniforms: {
        map: { type: 't', value: null },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: THREE.FrontSide,
      transparent: false,
    })

    this.scene = new THREE.Scene()
    this.quad = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1), // Updated from PlaneBufferGeometry to PlaneGeometry
      this.material
    )
    this.scene.add(this.quad)
    this.camera = new THREE.OrthographicCamera(
      1 / -2,
      1 / 2,
      1 / 2,
      1 / -2,
      -10000,
      10000
    )

    this.cubeCamera = null

    this.setSize(4096, 2048)

    const gl = this.renderer.getContext()
    this.cubeMapSize = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE)
    this.getCubeCamera(2048)
  }

  setSize(width, height) {
    this.width = width
    this.height = height

    this.quad.scale.set(this.width, this.height, 1)

    this.camera.left = this.width / -2
    this.camera.right = this.width / 2
    this.camera.top = this.height / 2
    this.camera.bottom = this.height / -2

    this.camera.updateProjectionMatrix()

    this.output = new THREE.WebGLRenderTarget(this.width, this.height, {
      colorSpace: THREE.SRGBColorSpace,
    })
  }

  getCubeCamera(size) {
    const cubeMapSize = Math.min(this.cubeMapSize, size)
    this.cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeMapSize)

    const options = {
      colorSpace: THREE.SRGBColorSpace,
    }
    this.cubeCamera.renderTarget = new THREE.WebGLCubeRenderTarget(
      cubeMapSize,
      options
    )

    return this.cubeCamera
  }

  convert(cubeCamera) {
    this.quad.material.uniforms.map.value = cubeCamera.renderTarget.texture
    this.renderer.render(this.scene, this.camera, this.output, true)

    const pixels = new Uint8Array(4 * this.width * this.height)
    this.renderer.readRenderTargetPixels(
      this.output,
      0,
      0,
      this.width,
      this.height,
      pixels
    )

    const imageData = new ImageData(
      new Uint8ClampedArray(pixels),
      this.width,
      this.height
    )

    return imageData
  }

  update(camera, scene) {
    const autoClear = this.renderer.autoClear
    this.renderer.autoClear = true

    camera.updateMatrixWorld(true)

    this.cubeCamera.matrix.copy(camera.matrixWorld)
    this.cubeCamera.matrix.decompose(
      this.cubeCamera.position,
      this.cubeCamera.quaternion,
      this.cubeCamera.scale
    )

    this.cubeCamera.update(this.renderer, scene)
    this.renderer.autoClear = autoClear

    this.convert(this.cubeCamera)
  }
}

export default CubemapToEquirectangular
