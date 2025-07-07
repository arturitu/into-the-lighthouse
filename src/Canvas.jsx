import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ThreeApp } from './three/ThreeApp'

const Canvas = () => {
  const containerRef = useRef()
  const threeAppRef = useRef()

  useEffect(() => {
    if (containerRef.current) {
      gsap.set(containerRef.current, { opacity: 0 })
      gsap.to(containerRef.current, {
        opacity: 1,
        duration: 2,
        ease: 'power2.in',
      })
    }

    threeAppRef.current = new ThreeApp(containerRef.current)

    return () => {
      if (threeAppRef.current) {
        threeAppRef.current.destroy()
        threeAppRef.current = null
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={'fixed inset-0 w-screen h-screen m-0 opacity-0'}
    />
  )
}

export default Canvas
