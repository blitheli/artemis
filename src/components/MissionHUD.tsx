import {
  getPhaseAt,
  MISSION_PHASES,
  NASA_ARTEMIS_II_MISSION_URL,
  ORION_GLB_SOURCE_NOTE,
} from '../data/artemis-ii'
import type { MissionTelemetry } from '../data/jpl-horizons'
import {
  formatKm,
  formatSpeedKms,
  type EphemerisStatus,
} from '../hooks/useEphemeris'
import type { CameraViewMode } from './FlightScene'

type MissionHUDProps = {
  progress: number
  playing: boolean
  viewMode: CameraViewMode
  onViewModeChange: (m: CameraViewMode) => void
  onProgressChange: (v: number) => void
  onTogglePlay: () => void
  ephemerisStatus: EphemerisStatus
  ephemerisError: string | null
  clockLabel: string
  telemetry: MissionTelemetry | null
}

export function MissionHUD({
  progress,
  playing,
  viewMode,
  onViewModeChange,
  onProgressChange,
  onTogglePlay,
  ephemerisStatus,
  ephemerisError,
  clockLabel,
  telemetry,
}: MissionHUDProps) {
  const phase = getPhaseAt(progress)

  return (
    <div className="hud">
      <header className="hud-header">
        <div className="hud-badge">NASA · ARTEMIS II</div>
        <h1 className="hud-title">猎户座绕月飞行示意</h1>
        <p className="hud-sub">
          Orion 载人绕月任务 · 轨道为 JPL{' '}
          <a
            className="hud-link"
            href="https://ssd.jpl.nasa.gov/horizons/"
            target="_blank"
            rel="noreferrer"
          >
            Horizons
          </a>{' '}
          星历（航天器 COMMAND <code className="hud-code">-1024</code>
          ）；任务说明见{' '}
          <a
            className="hud-link"
            href={NASA_ARTEMIS_II_MISSION_URL}
            target="_blank"
            rel="noreferrer"
          >
            NASA Artemis II
          </a>
          。{ORION_GLB_SOURCE_NOTE} 地月纹理来自 NASA-3D-Resources。
        </p>
        <div className="hud-view-bar" role="group" aria-label="视角切换">
          {(
            [
              { id: 'earth' as const, label: '地球' },
              { id: 'moon' as const, label: '月球' },
              { id: 'spacecraft' as const, label: '飞行器' },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={viewMode === id ? 'hud-view-btn active' : 'hud-view-btn'}
              onClick={() => onViewModeChange(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <section className="hud-panel" aria-live="polite">
        <div className="hud-eph-status" data-status={ephemerisStatus}>
          {ephemerisStatus === 'loading' && '正在从 JPL Horizons 加载星历…'}
          {ephemerisStatus === 'ready' && '星历已加载（地心黄道 J2000，几何矢量）'}
          {ephemerisStatus === 'error' &&
            `星历加载失败，已回退示意轨道：${ephemerisError ?? '未知错误'}`}
          {ephemerisStatus === 'demo' && '示意模式'}
        </div>
        <div className="hud-phase-label">{phase.name}</div>
        <div className="hud-phase-en">{phase.nameEn}</div>
        <p className="hud-desc">{phase.summary}</p>
        <div className="hud-clock">{clockLabel}</div>
        {telemetry && (
          <dl className="hud-telemetry">
            <div>
              <dt>距地球</dt>
              <dd>{formatKm(telemetry.distEarthKm)}</dd>
            </div>
            <div>
              <dt>距月球</dt>
              <dd>{formatKm(telemetry.distMoonKm)}</dd>
            </div>
            <div>
              <dt>地球绕日速度</dt>
              <dd>{formatSpeedKms(telemetry.earthHelioSpeedKms)}</dd>
            </div>
            <div>
              <dt>月球相对地心速度</dt>
              <dd>{formatSpeedKms(telemetry.moonGeocentricSpeedKms)}</dd>
            </div>
            <div>
              <dt>航天器相对地心速度</dt>
              <dd>{formatSpeedKms(telemetry.spacecraftGeocentricSpeedKms)}</dd>
            </div>
          </dl>
        )}
      </section>

      <footer className="hud-controls">
        <button
          type="button"
          className="hud-play"
          onClick={onTogglePlay}
          aria-pressed={playing}
        >
          {playing ? '暂停' : '播放'}
        </button>
        <label className="hud-slider-label">
          <span>任务进度</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={progress}
            onChange={(e) => onProgressChange(Number(e.target.value))}
          />
        </label>
        <div className="hud-ticks">
          {MISSION_PHASES.map((p, i) => (
            <button
              key={p.id}
              type="button"
              className={
                progress >= p.t0 &&
                (i === MISSION_PHASES.length - 1
                  ? progress <= p.t1
                  : progress < p.t1)
                  ? 'tick active'
                  : 'tick'
              }
              title={p.name}
              onClick={() => onProgressChange(p.t0 + 0.002)}
            />
          ))}
        </div>
      </footer>
    </div>
  )
}
