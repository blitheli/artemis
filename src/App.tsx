import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useState } from 'react'
import { FlightScene, type CameraViewMode } from './components/FlightScene'
import { MissionHUD } from './components/MissionHUD'
import './index.css'

function App() {
  const [progress, setProgress] = useState(0.12)
  const [playing, setPlaying] = useState(false)
  const [viewMode, setViewMode] = useState<CameraViewMode>('earth')

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
        style={{ width: '100vw', height: '100vh', display: 'block' }}
      >
        <Suspense fallback={null}>
          <FlightScene progress={progress} viewMode={viewMode} />
        </Suspense>
      </Canvas>
      <MissionHUD
        progress={progress}
        playing={playing}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onProgressChange={setProgress}
        onTogglePlay={() => setPlaying((v) => !v)}
      />
    </div>
  )
}

export default App
