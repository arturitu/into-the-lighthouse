import { useEffect } from 'react'
import { loadAssets } from '../three/loaders/AssetLoader'
import assets from '../assets/assets'
import useAppStore from '../store/useAppStore'

const Preload = ({ children, basePath = '', setProgress, setLoading }) => {
  const setXRSupported = useAppStore((state) => state.setXRSupported)

  useEffect(() => {
    const handleProgress = (loadedBytes, totalBytes) => {
      const progressPercent = Math.floor((loadedBytes / totalBytes) * 100)
      setProgress(progressPercent)
    }

    const handleComplete = () => {
      if (navigator.xr && navigator.xr.isSessionSupported) {
        navigator.xr
          .isSessionSupported('immersive-vr')
          .then((supported) => {
            setXRSupported(supported)
            setLoading(false)
          })
          .catch(() => {
            setXRSupported(false)
            setLoading(false)
          })
      } else {
        setXRSupported(false)
        setLoading(false)
      }
    }

    loadAssets(basePath, assets, handleComplete, handleProgress, false)
  }, [basePath, setProgress, setLoading, setXRSupported])

  return <>{children}</>
}

export default Preload
