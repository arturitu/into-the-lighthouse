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

    const vrSubscription = useAppStore.subscribe(
      (state) => state.xrSession,
      (xrSession) => {
        if (xrSession && useAppStore.getState().isXRSupported) {
          this.renderer.xr.setSession(xrSession)
          this.onSessionStart()
        }
      }
    )
    this.subscriptions.push(vrSubscription)
  }

  onSessionStart = () => {
    this.vrOffsetGroup.position.set(0, -1.6, 0)
  }

  onSessionEnd = () => {
    useAppStore.getState().setFilmPaused(false)
    useAppStore.getState().setFilmPlaying(false)
    this.vrOffsetGroup.position.set(0, 0, 0)
  }

  destroy() {
    this.subscriptions.forEach((unsubscribe) => unsubscribe())
    this.subscriptions = []

    this.renderer.xr.removeEventListener('sessionstart', this.onSessionStart)
    this.renderer.xr.removeEventListener('sessionend', this.onSessionEnd)

    this.onSessionEnd()
  }
}
