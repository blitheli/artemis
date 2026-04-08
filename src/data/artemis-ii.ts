import * as THREE from 'three'

/**
 * NASA 公开资源（GitHub 镜像 NASA-3D-Resources）与 Artemis II 任务信息。
 * 默认轨迹来自 JPL Horizons（航天器 -1024）；加载失败时回退为内置示意 Catmull-Rom。
 */
export const NASA_ARTEMIS_II_MISSION_URL =
  'https://www.nasa.gov/humans-in-space/artemis-ii/'

/** 猎户座舱体 3D 打印模型（STL），在场景中按包围盒归一化缩放 */
export const NASA_ORION_STL_URL =
  'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Printing/Orion%20Capsule/Orion%20Capsule%20(plug).stl'

export const NASA_EARTH_TEXTURE_URL =
  'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/Images%20and%20Textures/Earth%20(A)/Earth%20(A).jpg'

export const NASA_MOON_TEXTURE_URL =
  'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/Images%20and%20Textures/Moon/Moon.jpg'

/** 本地托管的 Orion GLB（源自社区 Artemis 可视化项目，非 NASA 官方 GLB） */
export const ORION_GLB_URL = '/models/orion.glb'

/** 来源说明（NASA 官方 3D 库目前主要为 Orion 的 STL） */
export const ORION_GLB_SOURCE_NOTE =
  'GLB 模型来自开源项目 artemis-viewer（GitHub: iandees/artemis-viewer）；NASA-3D-Resources 提供 STL 猎户座舱体。'

/** JPL Horizons 目标编号：https://ssd.jpl.nasa.gov/horizons/ */
export const HORIZONS_ARTEMIS_II_SPACECRAFT = '-1024'
export const HORIZONS_MOON = '301'
export const HORIZONS_EARTH = '399'
export const HORIZONS_SOLAR_SYSTEM_BARYCENTER = '500@0'

/** 物理常数（km）— 用于地月显示半径与 km→场景单位换算 */
export const EARTH_RADIUS_KM = 6378.137
export const MOON_RADIUS_KM = 1737.4

export const EARTH_RADIUS = 2
export const MOON_RADIUS = (MOON_RADIUS_KM / EARTH_RADIUS_KM) * EARTH_RADIUS
/** 无星历时的月球占位位置（示意） */
export const MOON_POSITION = new THREE.Vector3(22, 0, 0)

/** 任务阶段（时间为归一化 0–1，用于演示时间轴，非真实秒级） */
export type MissionPhase = {
  id: string
  name: string
  nameEn: string
  t0: number
  t1: number
  summary: string
}

/** 地心 J2000 黄道 km → 场景单位（地心为原点，地球半径为 EARTH_RADIUS） */
export function kmToSceneScale(): number {
  return EARTH_RADIUS / EARTH_RADIUS_KM
}

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

export function formatUtcFromMs(ms: number): string {
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'UTC',
      dateStyle: 'medium',
      timeStyle: 'medium',
      hour12: false,
    }).format(new Date(ms))
  } catch {
    return new Date(ms).toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
  }
}
