import * as THREE from 'three'

export class WindowResizeController {
  constructor(camera, renderer) {
    this.camera = camera
    this.renderer = renderer

    this.onWindowResize = this.onWindowResize.bind(this)
    window.addEventListener('resize', this.onWindowResize)
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.onWindowResize()
      }, 200)
    })
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', this.onWindowResize)
      window.visualViewport.addEventListener('scroll', this.onWindowResize)
    }
    this.onWindowResize()
  }

  onWindowResize() {
    const viewportWidth = window.visualViewport
      ? window.visualViewport.width
      : window.innerWidth
    const viewportHeight = window.visualViewport
      ? window.visualViewport.height
      : window.innerHeight

    this.aspect = viewportWidth / viewportHeight

    let newFov = 80
    if (this.aspect > 1.5) {
      newFov = 60
    } else if (this.aspect > 1) {
      newFov = THREE.MathUtils.lerp(50, 80, 1.5 - this.aspect)
    } else if (this.aspect > 0.5) {
      newFov = THREE.MathUtils.lerp(80, 50, (this.aspect - 0.5) * 2)
    }
    this.camera.fov = newFov * 0.85

    this.camera.aspect = this.aspect
    this.camera.updateProjectionMatrix()
    if (this.renderer && !this.renderer.xr.isPresenting) {
      this.renderer.setSize(viewportWidth, viewportHeight)
    }
  }
}
