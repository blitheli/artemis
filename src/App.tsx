import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useState } from 'react'
import { FlightScene } from './components/FlightScene'
import { MissionHUD } from './components/MissionHUD'
import './index.css'

function App() {
  const [progress, setProgress] = useState(0.12)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => {
      setProgress((p) => (p >= 1 ? 0 : p + 0.00035))
    }, 48)
    return () => window.clearInterval(id)
  }, [playing])

  return (
    <div className="app-root">
      <Canvas
        className="app-canvas"
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <FlightScene progress={progress} />
        </Suspense>
      </Canvas>
      <MissionHUD
        progress={progress}
        playing={playing}
        onProgressChange={setProgress}
        onTogglePlay={() => setPlaying((v) => !v)}
      />
    </div>
  )
}

export default App
