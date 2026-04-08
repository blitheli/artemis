/**
 * JPL Horizons 星历：通过 SSD Horizons API 获取矢量表并解析。
 * 文档：https://ssd-api.jpl.nasa.gov/doc/horizons.html
 * 生产环境需在宿主上把 `/api/horizons` 代理到 `https://ssd.jpl.nasa.gov/api/horizons.api`，或使用 VITE_HORIZONS_API 指向可跨域的端点。
 */

export type VectorSample = {
  jd: number
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
}

const JD_UNIX_EPOCH = 2440587.5

export function jdToUnixMs(jd: number): number {
  return (jd - JD_UNIX_EPOCH) * 86400000
}

const NUM = String.raw`[+-]?(?:\d+\.?\d*|\d*\.?\d+)(?:[eE][+-]?\d+)?`

export function parseHorizonsVectorResult(result: string): VectorSample[] {
  const start = result.indexOf('$$SOE')
  const end = result.indexOf('$$EOE')
  if (start === -1 || end === -1 || end <= start) return []

  const block = result.slice(start + 5, end)
  const lines = block.split(/\r?\n/)
  const samples: VectorSample[] = []

  const posRe = new RegExp(
    `X\\s*=\\s*(${NUM})\\s+Y\\s*=\\s*(${NUM})\\s+Z\\s*=\\s*(${NUM})`,
    'i',
  )
  const velRe = new RegExp(
    `VX\\s*=\\s*(${NUM})\\s+VY\\s*=\\s*(${NUM})\\s+VZ\\s*=\\s*(${NUM})`,
    'i',
  )

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const jdMatch = /^(\d+\.\d+)\s*=/.exec(line)
    if (!jdMatch) continue
    const jd = Number(jdMatch[1])
    let j = i + 1
    while (j < lines.length && !lines[j].trim()) j++
    const posLine = lines[j]?.trim() ?? ''
    const posMatch = posRe.exec(posLine)
    if (!posMatch) continue
    j++
    while (j < lines.length && !lines[j].trim()) j++
    const velLine = lines[j]?.trim() ?? ''
    const velMatch = velRe.exec(velLine)
    if (!velMatch) continue
    samples.push({
      jd,
      x: Number(posMatch[1]),
      y: Number(posMatch[2]),
      z: Number(posMatch[3]),
      vx: Number(velMatch[1]),
      vy: Number(velMatch[2]),
      vz: Number(velMatch[3]),
    })
    i = j
  }

  samples.sort((a, b) => a.jd - b.jd)
  return samples
}

function horizonsApiUrl(): string {
  const env = import.meta.env.VITE_HORIZONS_API?.trim()
  if (env) return env
  if (import.meta.env.DEV) return '/api/horizons'
  return 'https://ssd.jpl.nasa.gov/api/horizons.api'
}

export async function fetchHorizonsVectors(params: Record<string, string>): Promise<VectorSample[]> {
  const base = horizonsApiUrl()
  const u = new URL(base, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
  for (const [k, v] of Object.entries(params)) {
    u.searchParams.set(k, v)
  }
  const res = await fetch(u.toString())
  if (!res.ok) throw new Error(`Horizons HTTP ${res.status}`)
  const data = (await res.json()) as { result?: string; error?: string }
  if (data.error) throw new Error(data.error)
  const text = data.result ?? ''
  if (!text.includes('$$SOE')) {
    const errMatch = /No ephemeris|Cannot find|error/i.exec(text)
    throw new Error(errMatch ? text.slice(0, 400) : 'Horizons 返回中无星历表')
  }
  return parseHorizonsVectorResult(text)
}

function vecLen(x: number, y: number, z: number): number {
  return Math.sqrt(x * x + y * y + z * z)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function interpolateSamples(samples: VectorSample[], jd: number): VectorSample | null {
  if (samples.length === 0) return null
  if (samples.length === 1) return samples[0]
  if (jd <= samples[0].jd) return samples[0]
  const last = samples[samples.length - 1]
  if (jd >= last.jd) return last

  let lo = 0
  let hi = samples.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (samples[mid].jd <= jd) lo = mid
    else hi = mid
  }
  const a = samples[lo]
  const b = samples[hi]
  const span = b.jd - a.jd
  const t = span > 0 ? (jd - a.jd) / span : 0
  return {
    jd,
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t),
    vx: lerp(a.vx, b.vx, t),
    vy: lerp(a.vy, b.vy, t),
    vz: lerp(a.vz, b.vz, t),
  }
}

export type MissionTelemetry = {
  jd: number
  /** 航天器距地心，km */
  distEarthKm: number
  /** 航天器距月心，km */
  distMoonKm: number
  /** 地球绕日心（相对质心 500@0）速度模，km/s */
  earthHelioSpeedKms: number
  /** 月球相对地心速度模，km/s */
  moonGeocentricSpeedKms: number
  /** 航天器相对地心速度模，km/s */
  spacecraftGeocentricSpeedKms: number
}

export function buildTelemetry(
  sc: VectorSample,
  moon: VectorSample,
  earthHelio: VectorSample,
): MissionTelemetry {
  const dx = sc.x - moon.x
  const dy = sc.y - moon.y
  const dz = sc.z - moon.z
  return {
    jd: sc.jd,
    distEarthKm: vecLen(sc.x, sc.y, sc.z),
    distMoonKm: vecLen(dx, dy, dz),
    earthHelioSpeedKms: vecLen(earthHelio.vx, earthHelio.vy, earthHelio.vz),
    moonGeocentricSpeedKms: vecLen(moon.vx, moon.vy, moon.vz),
    spacecraftGeocentricSpeedKms: vecLen(sc.vx, sc.vy, sc.vz),
  }
}
