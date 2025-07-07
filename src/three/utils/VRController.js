import useAppStore from '../../store/useAppStore'

export class VRController {
  constructor(renderer, vrOffsetGroup) {
    this.renderer = renderer
    this.vrOffsetGroup = vrOffsetGroup
    this.subscriptions = []

    if (useAppStore.getState().isXRSupported) {
      this.renderer.xr.addEventListener('sessionstart', this.onSessionStart)
      this.renderer.xr.addEventListener('sessionend', this.onSessionEnd)
    }

    const filmSubscription = useAppStore.subscribe(
      (state) => state.filmPlaying,
      (filmPlaying, previousFilmPlaying) => {
        if (filmPlaying === previousFilmPlaying) {
          return
        }

        if (filmPlaying && useAppStore.getState().isXRSupported) {
          this.enterVR()
        }
      }
    )
    this.subscriptions.push(filmSubscription)
  }

  onSessionStart = () => {
    this.vrOffsetGroup.position.set(0, -1.6, 0)
  }

  onSessionEnd = () => {
    useAppStore.getState().setFilmPaused(false)
    useAppStore.getState().setFilmPlaying(false)
    this.vrOffsetGroup.position.set(0, 0, 0)
  }

  enterVR = async () => {
    const session = await navigator.xr.requestSession('immersive-vr', {
      optionalFeatures: ['local-floor'],
    })
    this.renderer.xr.setSession(session)
  }

  destroy() {
    this.subscriptions.forEach((unsubscribe) => unsubscribe())
    this.subscriptions = []

    this.renderer.xr.removeEventListener('sessionstart', this.onSessionStart)
    this.renderer.xr.removeEventListener('sessionend', this.onSessionEnd)

    this.onSessionEnd()
  }
}
