import * as THREE from 'three'
import assets from '../../assets/assets'
import useAppStore from '../../store/useAppStore'
import { FilmSeekController } from './FilmSeekController'

export class AnimationController {
  constructor(sceneLoaded, soundtrack = null) {
    this.sceneLoaded = sceneLoaded
    this.soundtrack = soundtrack
    this.animationMixer = new THREE.AnimationMixer(this.sceneLoaded)
    this.animationCameraMixer = new THREE.AnimationMixer(this.sceneLoaded)
    this.animationActions = {}
    this.filmSeekController = null
    this.setupAnimations()
  }

  setupAnimations() {
    const clips = assets.scene_model.animations
    const setClipDuration = useAppStore.getState().setClipDuration

    const onceClips = clips.filter((clip) => clip.name.includes('Once'))

    if (onceClips.length > 0) {
      const primaryClip =
        onceClips.find((clip) => clip.name === 'CameraRigAction_Once') ||
        onceClips[0]
      setClipDuration(primaryClip.duration)

      this.filmSeekController = new FilmSeekController(
        this.animationCameraMixer,
        this.soundtrack,
        this.sceneLoaded
      )
    }

    clips.forEach((clip) => {
      const isOnceClip = clip.name.includes('Once')
      this.animationActions[clip.name] = isOnceClip
        ? this.animationCameraMixer.clipAction(clip)
        : this.animationMixer.clipAction(clip)

      let loopType = THREE.LoopOnce
      let clampWhenFinished = true
      if (clip.name.includes('Loop')) {
        loopType = THREE.LoopRepeat
        clampWhenFinished = false
      } else if (clip.name.includes('PingPong')) {
        loopType = THREE.LoopPingPong
        clampWhenFinished = false
      }
      this.animationActions[clip.name].setLoop(loopType)
      this.animationActions[clip.name].clampWhenFinished = clampWhenFinished
      this.animationActions[clip.name].play()
    })
  }

  update(delta) {
    this.animationMixer.update(delta)

    if (useAppStore.getState().filmPlaying) {
      this.filmSeekController.update(delta)
    }
  }

  getAnimationActions() {
    return this.animationActions
  }

  destroy() {
    if (this.filmSeekController) {
      this.filmSeekController.destroy()
    }
  }
}
