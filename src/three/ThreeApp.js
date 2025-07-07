import * as THREE from 'three'
import assets from '../assets/assets'
import { CameraController } from './utils/CameraController'
import { VRController } from './utils/VRController'
import { WindowResizeController } from './utils/WindowResizeController'
import { SceneLoader } from './utils/SceneLoader'
import { AnimationController } from './utils/AnimationController'

export class ThreeApp {
  constructor(container) {
    this.container = container
    this.scene = new THREE.Scene()
    this.subscriptions = []

    this.camera = new THREE.PerspectiveCamera(
      80,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    )
    this.vrOffsetGroup = new THREE.Group()

    this.listener = new THREE.AudioListener()
    this.camera.add(this.listener)

    this.sceneLoader = new SceneLoader(this.listener)
    this.sceneLoaded = this.sceneLoader.getScene()

    this.soundtrack = new THREE.Audio(this.listener)
    this.soundtrack.setBuffer(assets.track_audio)
    this.scene.add(this.soundtrack)

    this.animationController = new AnimationController(
      this.sceneLoaded,
      this.soundtrack
    )
    this.animationActions = this.animationController.getAnimationActions()

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    })
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.VSMShadowMap
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.xr.enabled = true

    this.container.appendChild(this.renderer.domElement)

    this.cameraController = new CameraController(
      this.renderer,
      this.animationActions
    )

    this.scene.add(this.sceneLoaded)

    const cameraRig = this.sceneLoader.getCameraRig()
    if (cameraRig) {
      this.vrOffsetGroup.add(this.camera)
      cameraRig.add(this.vrOffsetGroup)
    }

    this.ambientLight = new THREE.AmbientLight(0xffffff, 1 * Math.PI)
    this.scene.add(this.ambientLight)

    this.animate = this.animate.bind(this)
    this.renderer.setAnimationLoop(this.animate)

    this.vrController = new VRController(this.renderer, this.vrOffsetGroup)
    this.windowResizeController = new WindowResizeController(
      this.camera,
      this.renderer
    )

    this.targetFPS = 60
    this.currentPixelRatio = 1
  }

  // Based on this post: https://x.com/dangreenheck/status/1937552118837088262
  adaptivePixelRatio(delta) {
    const fps = 1 / delta
    if (fps < this.targetFPS * 0.8) {
      this.currentPixelRatio = Math.max(1, this.currentPixelRatio - 0.1)
    } else if (fps > this.targetFPS * 0.95) {
      this.currentPixelRatio = Math.min(2, this.currentPixelRatio + 0.1)
    }
    if (!this.renderer.xr.isPresenting) {
      this.renderer.setPixelRatio(this.currentPixelRatio)
    }
  }

  animate(timestamp) {
    if (!this.lastTimestamp) {
      this.lastTimestamp = timestamp
    }
    const delta = (timestamp - this.lastTimestamp) / 1000
    this.lastTimestamp = timestamp

    this.adaptivePixelRatio(delta)
    this.cameraController.update(this.camera)

    this.renderer.render(this.scene, this.camera)
    this.animationController.update(delta)
  }

  destroy() {
    this.renderer.setAnimationLoop(null)
    this.renderer.dispose()
    this.container.innerHTML = ''

    if (this.animationController) {
      this.animationController.destroy()
    }
    if (this.cameraController && this.cameraController.destroy) {
      this.cameraController.destroy()
    }
    if (this.vrController && this.vrController.destroy) {
      this.vrController.destroy()
    }
  }
}
