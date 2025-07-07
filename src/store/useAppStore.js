import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

const useAppStore = create(
  subscribeWithSelector((set) => ({
    isXRSupported: false,
    setXRSupported: (supported) => set({ isXRSupported: supported }),
    filmPlaying: false,
    setFilmPlaying: (isPlaying) => {
      set({ filmPlaying: isPlaying })
    },
    filmPaused: false,
    setFilmPaused: (isPaused) => {
      set({ filmPaused: isPaused })
    },
    filmEnded: false,
    setFilmEnded: (ended) => set({ filmEnded: ended }),
    clipDuration: 0,
    setClipDuration: (duration) => set({ clipDuration: duration }),
    scrollDelta: 0,
    setScrollDelta: (delta) => set({ scrollDelta: delta }),
  }))
)

export default useAppStore
