import SocialLinks from './SocialLinks'
import Logo from '/assets/imgs/unboring.svg'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import useAppStore from '../store/useAppStore'

const Header = ({ progress = 100 }) => {
  const isLoaded = progress >= 100
  const logoRef = useRef(null)
  const socialLinksRef = useRef(null)
  const headingRef = useRef(null)
  const buttonRef = useRef(null)
  const headerRef = useRef(null)
  const setFilmPlaying = useAppStore((state) => state.setFilmPlaying)
  const setFilmEnded = useAppStore((state) => state.setFilmEnded)
  const setFilmPaused = useAppStore((state) => state.setFilmPaused)
  const filmPlaying = useAppStore((state) => state.filmPlaying)
  const clipDuration = useAppStore((state) => state.clipDuration)
  const setXRSession = useAppStore((state) => state.setXRSession)
  const [ignoreHashChange, setIgnoreHashChange] = useState(false)

  const handleButtonClick = async () => {
    buttonRef.current.disabled = true
    try {
      let silentAudio = null
      silentAudio = document.createElement('audio')
      silentAudio.setAttribute('x-webkit-airplay', 'deny')
      silentAudio.preload = 'auto'
      silentAudio.loop = true
      silentAudio.src = 'assets/audios/empty.mp3'
      await silentAudio.play()
    } catch (error) {
      console.warn('Audio fix failed:', error)
    }

    if (useAppStore.getState().isXRSupported) {
      navigator.xr
        ?.requestSession('immersive-vr', {
          optionalFeatures: ['local-floor'],
        })
        .then((session) => {
          setIgnoreHashChange(true)
          window.history.replaceState(null, '', window.location.pathname)
          window.history.pushState({ isFilm: true }, '', '#film')
          setFilmPlaying(true)
          setXRSession(session)
          setTimeout(() => setIgnoreHashChange(false), 100)
        })
    } else {
      const tl = gsap.timeline()
      tl.to(buttonRef.current, {
        y: -10,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.in',
      })
      tl.to(
        headingRef.current,
        { y: -50, opacity: 0, duration: 0.6, ease: 'power2.in' },
        '-=0.2'
      )
      tl.to(
        socialLinksRef.current,
        { y: -30, opacity: 0, duration: 0.3, ease: 'power2.in' },
        '-=0.25'
      )
      tl.to(
        logoRef.current,
        { y: -50, opacity: 0, duration: 0.4, ease: 'power3.in' },
        '-=0.25'
      )
      tl.to(
        headerRef.current,
        { pointerEvents: 'none', opacity: 0, duration: 0.1 },
        '-=0.2'
      )
      tl.add(() => {
        setIgnoreHashChange(true)
        window.history.replaceState(null, '', window.location.pathname)
        window.history.pushState({ isFilm: true }, '', '#film')
        setFilmPlaying(true)

        setTimeout(() => setIgnoreHashChange(false), 100)
      })
    }
  }

  // Función para formatear la duración de segundos a MM:SS
  const formatDuration = (totalSeconds) => {
    if (typeof totalSeconds !== 'number' || totalSeconds <= 0) {
      return '...'
    }
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = Math.round(totalSeconds % 60)
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  }

  useEffect(() => {
    const tl = gsap.timeline()
    if (filmPlaying) {
      tl.to(headerRef.current, {
        pointerEvents: 'none',
        opacity: 0,
        duration: 0.5,
        ease: 'power2.in',
      })
    } else {
      tl.fromTo(
        headerRef.current,
        { pointerEvents: 'auto', opacity: 0 },
        { opacity: 1, duration: 0.5, ease: 'power2.out' }
      )
      tl.fromTo(
        logoRef.current,
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      )
      tl.fromTo(
        socialLinksRef.current,
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
        '-=0.5'
      )
      tl.fromTo(
        headingRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: 'power2.out' },
        '+=0.2'
      )
      tl.fromTo(
        buttonRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
        '-=0.2'
      )
    }

    if (!filmPlaying && window.location.hash === '#film') {
      setIgnoreHashChange(true)
      window.history.replaceState(null, '', window.location.pathname)

      const blockForward = () => {
        if (window.location.hash === '#film') {
          window.history.replaceState(null, '', window.location.pathname)
        }
      }

      window.addEventListener('popstate', blockForward, { once: true })
      setTimeout(() => setIgnoreHashChange(false), 100)
    }
  }, [filmPlaying])

  useEffect(() => {
    const handleHashChange = () => {
      if (ignoreHashChange) return

      if (window.location.hash === '#film') {
        setFilmPlaying(true)
      } else {
        setFilmPlaying(false)
      }
    }

    const handlePopState = () => {
      if (ignoreHashChange) return

      if (filmPlaying && window.location.hash !== '#film') {
        setFilmEnded(false)
        setFilmPaused(false)
      }

      if (window.location.hash === '#film' && !filmPlaying) {
        window.history.replaceState(null, '', window.location.pathname)
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    window.addEventListener('popstate', handlePopState)

    if (!ignoreHashChange) handleHashChange()

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [
    setFilmPlaying,
    setFilmEnded,
    setFilmPaused,
    ignoreHashChange,
    filmPlaying,
  ])

  return (
    <header
      ref={headerRef}
      className={
        'max-w-6xl mx-auto px-6 pt-6 pb-10 flex flex-col gap-6 ' +
        (isLoaded ? 'relative z-10' : '')
      }
      style={{
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
    >
      <div className="flex justify-between items-start">
        <a href="https://unboring.net" target="_blank">
          <img
            ref={logoRef}
            src={Logo}
            alt="Unboring Logo"
            className="w-[64px] h-[56px] sm:w-[92px] sm:h-[80px] opacity-0"
          />
        </a>
        <div ref={socialLinksRef} className="opacity-0">
          <SocialLinks className="text-highlight" />
        </div>
      </div>
      <div
        ref={headingRef}
        className="flex flex-col items-center justify-center opacity-0"
      >
        <div className="bg-white/15 rounded-2xl shadow-md max-w-xl w-full border border-black/30 flex flex-col justify-between p-6 min-h-[20rem]">
          <div className="text-center pt-6">
            <h1 className="text-5xl font-bold font-serif">
              Into the lighthouse
            </h1>
            <p className="text-highlight text-lg mt-4">
              An Immersive Film by Arturo Paracuellos
            </p>
            <div className="flex mt-6 justify-center opacity-0" ref={buttonRef}>
              {isLoaded ? (
                <button
                  type="button"
                  className="relative h-12 w-36 rounded-full bg-highlight hover:bg-highlight-dark overflow-hidden focus:outline-none active:scale-95 transition-transform cursor-pointer"
                  onClick={handleButtonClick}
                >
                  <div
                    className="absolute top-0 left-0 h-full transition-all duration-300 ease-out"
                    style={{ width: progress + '%' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm tracking-wider uppercase">
                    Ready?
                  </div>
                </button>
              ) : (
                <div className="relative h-12 w-36 rounded-full bg-highlight/20 overflow-hidden transition-transform cursor-default">
                  <div
                    className="absolute top-0 left-0 h-full bg-highlight transition-all duration-300 ease-out"
                    style={{ width: progress + '%' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm tracking-wider">
                    Loading...
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center mt-20">
            <div className="text-sm text-highlight space-x-2">
              <a
                href="https://unboring.net/cases/into-the-lighthouse"
                className="underline hover:no-underline"
              >
                How It Was Made
              </a>
              <span>·</span>
              <a
                href="https://github.com/arturitu/into-the-lighthouse"
                target="_blank"
                className="underline hover:no-underline"
              >
                Source Code
              </a>
            </div>

            <div className="bg-black/10 font-semibold text-sm px-3 py-1 rounded-lg">
              {formatDuration(clipDuration)}
            </div>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-700 text-center">
          Best with headphones. Even better with a VR headset.
        </p>
      </div>
    </header>
  )
}

export default Header
