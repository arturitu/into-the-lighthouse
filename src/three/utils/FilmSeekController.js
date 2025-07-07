import useAppStore from '../../store/useAppStore'
import * as THREE from 'three'

export class FilmSeekController {
  constructor(animationCameraMixer, soundtrack, sceneLoaded) {
    this.animationCameraMixer = animationCameraMixer
    this.sceneLoaded = sceneLoaded
    this.inLoopAudios = sceneLoaded.positionalLoopAudios
    this.filmSyncedAudios = [
      ...sceneLoaded.positionalAudios,
      soundtrack,
    ].filter(Boolean)
    this.normalizedVolume = 1
    this.clipDuration = useAppStore.getState().clipDuration - 0.01
    this.currentTime = 0
    this.targetTime = 0
    this.isLerping = false
    this.lerpSpeed = 0.5
    this.accelerationFactor = 5
    this.audioTimeout = null
    this.fadeDuration = 0.3
    this.subscriptions = []
    this.fadeTimeouts = new Map()
    this.seeking = false
    this.setupSubscriptions()
  }

  setupSubscriptions() {
    const filmSubscription = useAppStore.subscribe(
      (state) => state.filmPlaying,
      (filmPlaying, previousFilmPlaying) => {
        if (filmPlaying === previousFilmPlaying) {
          return
        }
        this.reset()
        if (filmPlaying) {
          for (const audio of this.filmSyncedAudios) {
            audio.setVolume(this.normalizedVolume)
            audio.play()
          }
          for (const audio of this.inLoopAudios || []) {
            if (!audio.isPlaying) audio.play()
          }
        } else {
          for (const audio of this.filmSyncedAudios) {
            audio.stop()
          }
          for (const audio of this.inLoopAudios || []) {
            audio.stop()
          }
        }
      }
    )
    this.subscriptions.push(filmSubscription)

    const pauseSubscription = useAppStore.subscribe(
      (state) => state.filmPaused,
      (filmPaused, previousFilmPaused) => {
        if (filmPaused === previousFilmPaused) {
          return
        }

        if (filmPaused) {
          for (const audio of this.filmSyncedAudios) {
            if (audio.isPlaying) {
              audio.pause()
            }
          }
        } else {
          for (const audio of this.filmSyncedAudios) {
            if (!audio.isPlaying) {
              audio.play()
            }
          }
        }
      }
    )
    this.subscriptions.push(pauseSubscription)

    const scrollSubscription = useAppStore.subscribe(
      (state) => state.scrollDelta,
      (scrollDelta) => {
        if (scrollDelta === 0) return
        if (!useAppStore.getState().filmPlaying) return

        this.seek(scrollDelta)

        setTimeout(() => {
          useAppStore.getState().setScrollDelta(0)
        }, 100)
      }
    )
    this.subscriptions.push(scrollSubscription)
  }

  seek(deltaY) {
    const deltaSeconds = (deltaY * this.accelerationFactor) / 1000
    this.targetTime = Math.max(
      0,
      Math.min(this.clipDuration, this.currentTime + deltaSeconds)
    )

    this.isLerping = true

    this.stopAudio()

    this.scheduleAudioRestart()

    if (useAppStore.getState().filmPaused) {
      useAppStore.getState().setFilmPaused(false)
    }
  }

  update(delta) {
    const filmPaused = useAppStore.getState().filmPaused

    if (this.isLerping) {
      const timeDiff = this.targetTime - this.currentTime

      if (Math.abs(timeDiff) < 0.001) {
        this.isLerping = false
      }

      this.currentTime = THREE.MathUtils.lerp(
        this.currentTime,
        this.targetTime,
        this.lerpSpeed
      )
    } else if (!filmPaused) {
      this.currentTime += delta
    }

    this.currentTime = Math.max(
      0,
      Math.min(this.clipDuration, this.currentTime)
    )
    this.targetTime = this.currentTime
    if (
      this.currentTime >= this.clipDuration &&
      !useAppStore.getState().filmEnded
    ) {
      useAppStore.getState().setFilmEnded(true)
    }

    this.syncAudio()

    this.animationCameraMixer.setTime(this.currentTime)
    this.sceneLoaded.memoriesMaterial.opacity = this.seeking
      ? 0
      : this.sceneLoaded.memoriesDriver.scale.x
  }

  clearAllFadeTimeouts() {
    for (const [audio, timeouts] of this.fadeTimeouts) {
      timeouts.forEach((timeoutId) => clearTimeout(timeoutId))
    }
    this.fadeTimeouts.clear()
  }

  syncAudio() {
    if (
      this.seeking ||
      useAppStore.getState().filmPaused ||
      !useAppStore.getState().filmPlaying
    ) {
      return
    }

    if (!this._lastSyncTime || performance.now() - this._lastSyncTime > 1000) {
      this._lastSyncTime = performance.now()

      const threshold = 0.05
      let needsResync = false

      for (const audio of this.filmSyncedAudios) {
        if (!audio.isPlaying) {
          continue
        }

        if (audio.buffer && typeof audio.offset === 'number') {
          let audioCurrentTime

          if (audio.context && audio.startTime !== undefined) {
            audioCurrentTime =
              audio.context.currentTime - audio.startTime + audio.offset
          } else if (audio.source && audio.source.buffer) {
            const elapsedSinceStart =
              performance.now() / 1000 - (audio._playStartTime || 0)
            audioCurrentTime =
              audio.offset + elapsedSinceStart * audio.playbackRate
          }

          if (audioCurrentTime !== undefined) {
            const timeDifference = Math.abs(audioCurrentTime - this.currentTime)

            if (timeDifference > threshold) {
              needsResync = true
              break
            }
          }
        }
      }

      if (needsResync) {
        this.stopAudio()
        this.startAudio(this.currentTime)
      }
    }
  }

  scheduleAudioRestart() {
    if (this.filmSyncedAudios.length === 0) return

    this.fadeOutAudio()
    clearTimeout(this.audioTimeout)

    this.audioTimeout = setTimeout(() => {
      if (!this.isLerping && !useAppStore.getState().filmPaused) {
        this.startAudio(this.currentTime)
      }
    }, 200)
  }

  fadeAudio(audios, fromVolume, toVolume, onComplete = null) {
    this.clearAllFadeTimeouts()

    const steps = 10
    const stepDuration = this.fadeDuration / steps

    for (const audio of audios) {
      const fadeTimeouts = []

      for (let i = 1; i <= steps; i++) {
        const timeoutId = setTimeout(() => {
          const progress = i / steps
          const volume = fromVolume + (toVolume - fromVolume) * progress
          audio.setVolume(volume)

          if (i === steps && onComplete) {
            onComplete()
          }
        }, stepDuration * i * 500)

        fadeTimeouts.push(timeoutId)
      }

      this.fadeTimeouts.set(audio, fadeTimeouts)
    }
  }

  fadeOutAudio() {
    const playingAudios = this.filmSyncedAudios.filter(
      (audio) => audio.isPlaying
    )
    if (playingAudios.length === 0) return

    const startVolume = playingAudios[0]?.getVolume() || this.normalizedVolume
    this.seeking = true
    this.fadeAudio(playingAudios, startVolume, 0, () => {
      this.stopAudio()
    })
  }

  stopAudio() {
    for (const audio of this.filmSyncedAudios) {
      if (audio.isPlaying) {
        audio.stop()
      }
    }
  }

  startAudio(timeOffset) {
    if (this.filmSyncedAudios.length === 0) return

    for (const audio of this.filmSyncedAudios) {
      if (audio.isPlaying) {
        audio.stop()
      }
      audio.offset = timeOffset
      audio._playStartTime = performance.now() / 1000
      audio.play()
      audio.setVolume(0)
    }

    this.fadeAudio(this.filmSyncedAudios, 0, this.normalizedVolume, () => {
      this.seeking = false
    })
  }

  reset() {
    this.currentTime = 0
    this.targetTime = 0
    this.isLerping = false
    this.animationCameraMixer.setTime(0)

    clearTimeout(this.audioTimeout)
    this.clearAllFadeTimeouts()
    this.stopAudio()
  }

  destroy() {
    clearTimeout(this.audioTimeout)
    this.clearAllFadeTimeouts()
    this.stopAudio()
    this.subscriptions.forEach((unsubscribe) => unsubscribe())
    this.subscriptions = []
  }
}
