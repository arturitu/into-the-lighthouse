// hooks/useScrollIntent.js
import { useEffect, useRef } from 'react'
import useAppStore from '../store/useAppStore'

export const useScrollIntent = () => {
  const setScrollDelta = useAppStore((s) => s.setScrollDelta)
  const lastScrollTime = useRef(0)

  const throttleDelay = 16

  useEffect(() => {
    const now = () => new Date().getTime()
    const isThrottled = () => now() - lastScrollTime.current < throttleDelay

    const triggerDelta = (deltaY) => {
      if (!isThrottled()) {
        lastScrollTime.current = now()
        setScrollDelta(deltaY)
      }
    }

    const handleWheel = (e) => {
      if (useAppStore.getState().filmEnded) return
      if (Math.abs(e.deltaY) < 10) return
      triggerDelta(e.deltaY)
    }

    window.addEventListener('wheel', handleWheel, { passive: true })

    return () => {
      window.removeEventListener('wheel', handleWheel)
    }
  }, [setScrollDelta])
}
