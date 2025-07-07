import { useState } from 'react'
import Canvas from './Canvas'
import Preload from './components/Preload'
import Header from './components/Header'
import { useScrollIntent } from './hooks/useScrollIntent'

const App = () => {
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  useScrollIntent()

  return (
    <div className="min-h-screen">
      <Header progress={progress} />
      <Preload
        basePath="assets"
        setProgress={setProgress}
        setLoading={setLoading}
      >
        {loading ? null : <Canvas />}
      </Preload>
    </div>
  )
}

export default App
