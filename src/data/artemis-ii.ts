import * as THREE from 'three'

/** 任务阶段（时间为归一化 0–1，用于演示时间轴，非真实秒级） */
export type MissionPhase = {
  id: string
  name: string
  nameEn: string
  t0: number
  t1: number
  summary: string
}

export const EARTH_RADIUS = 2
export const MOON_RADIUS = 0.55
/** 地心为原点时月球中心位置（示意比例，非真实 AU） */
export const MOON_POSITION = new THREE.Vector3(22, 0, 0)

export const MISSION_PHASES: MissionPhase[] = [
  {
    id: 'launch',
    name: '发射与上升',
    nameEn: 'Launch & Ascent',
    t0: 0,
    t1: 0.07,
    summary: 'SLS 从肯尼迪航天中心升空，芯级与助推器分离，进入近地轨道。',
  },
  {
    id: 'leo',
    name: '近地轨道与检查',
    nameEn: 'LEO & Checkout',
    t0: 0.07,
    t1: 0.14,
    summary: '猎户座在地球轨道完成系统检查，为地月转移做准备。',
  },
  {
    id: 'tli',
    name: '地月转移',
    nameEn: 'Translunar Injection',
    t0: 0.14,
    t1: 0.38,
    summary: 'TLI 点火后进入奔月弹道，穿越范艾伦带，向月球方向滑行。',
  },
  {
    id: 'approach',
    name: '月球接近',
    nameEn: 'Lunar Approach',
    t0: 0.38,
    t1: 0.46,
    summary: '相对月球引力占优，轨道弯曲，准备近月飞越。',
  },
  {
    id: 'flyby',
    name: '近月飞越',
    nameEn: 'Lunar Flyby',
    t0: 0.46,
    t1: 0.52,
    summary: '在月球背面附近最近点掠过，利用引力辅助转向返航。',
  },
  {
    id: 'return',
    name: '返航滑行',
    nameEn: 'Return Coast',
    t0: 0.52,
    t1: 0.78,
    summary: '沿自由返回式弹道返回地球方向，长途滑行与导航。',
  },
  {
    id: 'entry',
    name: '再入与溅落',
    nameEn: 'Entry & Splashdown',
    t0: 0.78,
    t1: 1,
    summary: '再入大气层、防热大底承受高温，伞降溅落太平洋回收区。',
  },
]

/** 示意轨迹控制点（地心坐标系），Catmull-Rom 插值 */
const TRAJECTORY_CONTROL_POINTS: THREE.Vector3[] = [
  new THREE.Vector3(1.15, 0.45, 1.55),
  new THREE.Vector3(0.85, 1.05, 1.35),
  new THREE.Vector3(0, 2.05, 0.15),
  new THREE.Vector3(-0.4, 2.05, 1.8),
  new THREE.Vector3(5.5, 1.2, 3.2),
  new THREE.Vector3(13, 0.4, 1.5),
  new THREE.Vector3(20.2, -0.2, 0.9),
  new THREE.Vector3(21.4, 0.15, 0.35),
  new THREE.Vector3(20.8, 0.5, -0.6),
  new THREE.Vector3(14, -1.2, 4),
  new THREE.Vector3(6, -0.8, 2.5),
  new THREE.Vector3(0.5, 2.02, -0.4),
  new THREE.Vector3(0.2, 2.01, -0.25),
]

export function createTrajectoryCurve(): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(TRAJECTORY_CONTROL_POINTS, false, 'catmullrom', 0.35)
}

export function getPhaseAt(t: number): MissionPhase {
  const x = THREE.MathUtils.clamp(t, 0, 1)
  for (let i = 0; i < MISSION_PHASES.length; i++) {
    const p = MISSION_PHASES[i]
    const last = i === MISSION_PHASES.length - 1
    if (x >= p.t0 && (last ? x <= p.t1 : x < p.t1)) return p
  }
  return MISSION_PHASES[MISSION_PHASES.length - 1]
}

export function formatMissionClock(t: number): string {
  const totalHours = t * 10 * 24
  const d = Math.floor(totalHours / 24)
  const h = Math.floor(totalHours % 24)
  const m = Math.floor((totalHours % 1) * 60)
  return `T+ ${d}d ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}
