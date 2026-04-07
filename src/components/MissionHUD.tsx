import {
  formatMissionClock,
  getPhaseAt,
  MISSION_PHASES,
} from '../data/artemis-ii'

type MissionHUDProps = {
  progress: number
  playing: boolean
  onProgressChange: (v: number) => void
  onTogglePlay: () => void
}

export function MissionHUD({
  progress,
  playing,
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
          Orion 载人绕月任务 · 三维轨迹为教学示意，非精密星历
        </p>
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
