import useAppStore from '../../store/useAppStore'
import * as THREE from 'three'

export class CameraController {
  constructor(renderer, animationActions = null) {
    this.isPointerDown = false
    this.prevX = 0
    this.prevY = 0
    this.yaw = 0
    this.pitch = 0
    this.returning = false
    this.maxPitch = Math.PI / 2 - 0.1
    this.sensitivity = 0.002
    this.renderer = renderer
    this.pointerEventsAdded = false
    this.animationActions = animationActions
    this.subscriptions = []
    this.hasMoved = false
    this.hasLeftElement = false

    this.setupSubscriptions()
  }

  getOnceActions() {
    if (!this.animationActions) {
      return []
    }

    return Object.keys(this.animationActions)
      .filter((name) => name.includes('Once'))
      .map((name) => this.animationActions[name])
  }

  setupSubscriptions() {
    const filmSubscription = useAppStore.subscribe(
      (state) => state.filmPlaying,
      (filmPlaying, previousFilmPlaying) => {
        if (filmPlaying === previousFilmPlaying) {
          return
        }

        if (filmPlaying) {
          this.addPointerEvents(this.renderer.domElement)
          const onceActions = this.getOnceActions()
          for (const action of onceActions) {
            action.play()
          }
        } else {
          this.removePointerEvents(this.renderer.domElement)
          const onceActions = this.getOnceActions()
          for (const action of onceActions) {
            action.stop()
          }
        }
      }
    )
    this.subscriptions.push(filmSubscription)

    const filmEndedSubscription = useAppStore.subscribe(
      (state) => state.filmEnded,
      (filmEnded) => {
        if (filmEnded) {
          this.renderer.domElement.style.cursor = 'pointer'
          this.renderer.domElement.removeEventListener(
            'pointerdown',
            this.pointerDown
          )
          this.renderer.domElement.removeEventListener(
            'pointermove',
            this.pointerMove
          )
          this.renderer.domElement.removeEventListener(
            'pointerup',
            this.pointerUp
          )
          this.renderer.domElement.removeEventListener(
            'pointerleave',
            this.pointerLeave
          )
        }
      }
    )
    this.subscriptions.push(filmEndedSubscription)
  }

  addPointerEvents(domElement) {
    if (this.pointerEventsAdded) {
      return
    } else {
      domElement.style.touchAction = 'none'
      domElement.style.cursor = 'grab'
      domElement.addEventListener('pointerdown', this.pointerDown)
      domElement.addEventListener('pointermove', this.pointerMove)
      domElement.addEventListener('pointerup', this.pointerUp)
      domElement.addEventListener('pointerleave', this.pointerLeave)
      domElement.addEventListener('click', this.handleClick)
      this.pointerEventsAdded = true
    }
  }

  removePointerEvents(domElement) {
    if (!this.pointerEventsAdded) {
      return
    } else {
      domElement.style.cursor = ''
      domElement.removeEventListener('pointerdown', this.pointerDown)
      domElement.removeEventListener('pointermove', this.pointerMove)
      domElement.removeEventListener('pointerup', this.pointerUp)
      domElement.removeEventListener('pointerleave', this.pointerLeave)
      domElement.removeEventListener('click', this.handleClick)
      this.pointerEventsAdded = false
    }
  }

  handleClick = (e) => {
    if (useAppStore.getState().filmEnded) {
      useAppStore.getState().setFilmPlaying(false)
      return
    }
    if (this.hasMoved || this.hasLeftElement) {
      return
    }
    const currentPaused = useAppStore.getState().filmPaused
    useAppStore.getState().setFilmPaused(!currentPaused)
  }

  pointerDown = (e) => {
    this.isPointerDown = true
    this.returning = false
    this.hasMoved = false
    this.hasLeftElement = false
    this.prevX = e.clientX
    this.prevY = e.clientY
    e.target.style.cursor = 'grabbing'
  }

  pointerMove = (e) => {
    if (!this.isPointerDown) {
      return
    } else {
      const dx = e.clientX - this.prevX
      const dy = e.clientY - this.prevY

      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        this.hasMoved = true
      }

      this.prevX = e.clientX
      this.prevY = e.clientY

      this.yaw -= dx * this.sensitivity
      this.pitch -= dy * this.sensitivity
      this.pitch = Math.max(-this.maxPitch, Math.min(this.maxPitch, this.pitch))
    }
  }

  pointerUp = (e) => {
    this.isPointerDown = false
    this.returning = true
    e.target.style.cursor = 'grab'
  }

  pointerLeave = (e) => {
    if (this.isPointerDown) {
      this.hasLeftElement = true
    }
    this.pointerUp(e)
  }

  update(camera) {
    if (this.returning) {
      this.yaw = THREE.MathUtils.lerp(this.yaw, 0, 0.02)
      this.pitch = THREE.MathUtils.lerp(this.pitch, 0, 0.02)
      if (Math.abs(this.yaw) < 0.0001 && Math.abs(this.pitch) < 0.0001) {
        this.yaw = 0
        this.pitch = 0
        this.returning = false
      }
    }

    const quaternion = new THREE.Quaternion()
    quaternion.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'))
    camera.quaternion.copy(quaternion)
  }

  destroy() {
    if (this.renderer && this.renderer.domElement) {
      this.removePointerEvents(this.renderer.domElement)
    }
    this.subscriptions.forEach((unsubscribe) => unsubscribe())
    this.subscriptions = []
  }
}
