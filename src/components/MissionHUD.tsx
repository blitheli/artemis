import {
  formatMissionClock,
  getPhaseAt,
  MISSION_PHASES,
  NASA_ARTEMIS_II_MISSION_URL,
} from '../data/artemis-ii'
import type { CameraViewMode } from './FlightScene'

type MissionHUDProps = {
  progress: number
  playing: boolean
  viewMode: CameraViewMode
  onViewModeChange: (m: CameraViewMode) => void
  onProgressChange: (v: number) => void
  onTogglePlay: () => void
}

export function MissionHUD({
  progress,
  playing,
  viewMode,
  onViewModeChange,
  onProgressChange,
  onTogglePlay,
}: MissionHUDProps) {
  const phase = getPhaseAt(progress)

  return (
    <div className="hud">
      <header className="hud-header">
        <div className="hud-badge">NASA · ARTEMIS II</div>
        <h1 className="hud-title">猎户座绕月飞行示意</h1>
        <p className="hud-sub">
          Orion 载人绕月任务 · 三维轨迹为教学示意，非精密星历。任务与数据参见{' '}
          <a
            className="hud-link"
            href={NASA_ARTEMIS_II_MISSION_URL}
            target="_blank"
            rel="noreferrer"
          >
            NASA Artemis II
          </a>
          ；猎户座舱体 STL 与地月纹理来自 NASA-3D-Resources（GitHub）。
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
        <div className="hud-phase-label">{phase.name}</div>
        <div className="hud-phase-en">{phase.nameEn}</div>
        <p className="hud-desc">{phase.summary}</p>
        <div className="hud-clock">{formatMissionClock(progress)}</div>
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
