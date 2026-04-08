import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { FlightScene, type CameraViewMode } from './components/FlightScene'
import { MissionHUD } from './components/MissionHUD'
import { formatMissionClock, formatUtcFromMs } from './data/artemis-ii'
import {
  progressToUnixMs,
  telemetryAtProgress,
  useEphemeris,
} from './hooks/useEphemeris'
import './index.css'

function App() {
  const ephemeris = useEphemeris()
  const [progress, setProgress] = useState(0.12)
  const [playing, setPlaying] = useState(false)
  const [viewMode, setViewMode] = useState<CameraViewMode>('earth')

  const telemetry = useMemo(
    () => telemetryAtProgress(ephemeris, progress),
    [ephemeris, progress],
  )
  const utcMs = useMemo(
    () => progressToUnixMs(ephemeris, progress),
    [ephemeris, progress],
  )
  const clockLabel =
    utcMs !== null ? `UTC ${formatUtcFromMs(utcMs)}` : formatMissionClock(progress)

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
          <FlightScene progress={progress} viewMode={viewMode} ephemeris={ephemeris} />
        </Suspense>
      </Canvas>
      <MissionHUD
        progress={progress}
        playing={playing}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onProgressChange={setProgress}
        onTogglePlay={() => setPlaying((v) => !v)}
        ephemerisStatus={ephemeris.status}
        ephemerisError={ephemeris.errorMessage}
        clockLabel={clockLabel}
        telemetry={telemetry}
      />
    </div>
  )
}

export default App
