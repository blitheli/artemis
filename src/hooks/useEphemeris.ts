import { useEffect, useState } from 'react'
import * as THREE from 'three'
import {
  createTrajectoryCurve,
  HORIZONS_ARTEMIS_II_SPACECRAFT,
  HORIZONS_EARTH,
  HORIZONS_MOON,
  HORIZONS_SOLAR_SYSTEM_BARYCENTER,
  kmToSceneScale,
} from '../data/artemis-ii'
import {
  buildTelemetry,
  fetchHorizonsVectors,
  interpolateSamples,
  jdToUnixMs,
  type MissionTelemetry,
  type VectorSample,
} from '../data/jpl-horizons'

const HORIZONS_COMMON = {
  format: 'json',
  EPHEM_TYPE: 'VECTORS',
  VEC_TABLE: '2',
  OUT_UNITS: 'KM-S',
} as const

const EPHEM_START = '2026-Apr-01'
const EPHEM_STOP = '2026-Apr-12'
const EPHEM_STEP = '2h'

export type EphemerisStatus = 'loading' | 'ready' | 'error' | 'demo'

export type EphemerisState = {
  status: EphemerisStatus
  errorMessage: string | null
  jdStart: number
  jdEnd: number
  curve: THREE.CatmullRomCurve3
  spacecraftSamples: VectorSample[]
  moonGeoSamples: VectorSample[]
  earthHelioSamples: VectorSample[]
}

function eclipticKmToSceneVec(v: VectorSample): THREE.Vector3 {
  const s = kmToSceneScale()
  return new THREE.Vector3(v.x * s, v.y * s, v.z * s)
}

function zipEphemeris(
  sc: VectorSample[],
  moon: VectorSample[],
  earth: VectorSample[],
): Omit<EphemerisState, 'status' | 'errorMessage'> | null {
  const n = Math.min(sc.length, moon.length, earth.length)
  if (n < 2) return null

  for (let i = 0; i < n; i++) {
    if (sc[i].jd !== moon[i].jd || sc[i].jd !== earth[i].jd) return null
  }

  const points = sc.map((s) => eclipticKmToSceneVec(s))
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.4)

  return {
    jdStart: sc[0].jd,
    jdEnd: sc[n - 1].jd,
    curve,
    spacecraftSamples: sc.slice(0, n),
    moonGeoSamples: moon.slice(0, n),
    earthHelioSamples: earth.slice(0, n),
  }
}

function demoState(): EphemerisState {
  const curve = createTrajectoryCurve()
  return {
    status: 'demo',
    errorMessage: null,
    jdStart: 0,
    jdEnd: 1,
    curve,
    spacecraftSamples: [],
    moonGeoSamples: [],
    earthHelioSamples: [],
  }
}

export function useEphemeris(): EphemerisState {
  const [state, setState] = useState<EphemerisState>(() => ({
    ...demoState(),
    status: 'loading',
  }))

  useEffect(() => {
    let cancelled = false
    const params = {
      ...HORIZONS_COMMON,
      START_TIME: EPHEM_START,
      STOP_TIME: EPHEM_STOP,
      STEP_SIZE: EPHEM_STEP,
    }

    const load = async () => {
      try {
        const [sc, moon, earth] = await Promise.all([
          fetchHorizonsVectors({
            ...params,
            COMMAND: `'${HORIZONS_ARTEMIS_II_SPACECRAFT}'`,
            CENTER: 'geo',
            OBJ_DATA: 'NO',
            MAKE_EPHEM: 'YES',
          }),
          fetchHorizonsVectors({
            ...params,
            COMMAND: `'${HORIZONS_MOON}'`,
            CENTER: 'geo',
            OBJ_DATA: 'NO',
            MAKE_EPHEM: 'YES',
          }),
          fetchHorizonsVectors({
            ...params,
            COMMAND: `'${HORIZONS_EARTH}'`,
            CENTER: `'${HORIZONS_SOLAR_SYSTEM_BARYCENTER}'`,
            OBJ_DATA: 'NO',
            MAKE_EPHEM: 'YES',
          }),
        ])

        if (cancelled) return
        const zipped = zipEphemeris(sc, moon, earth)
        if (!zipped) {
          setState({
            ...demoState(),
            status: 'error',
            errorMessage: '星历采样无法对齐（时间与步长需一致）',
          })
          return
        }
        setState({
          status: 'ready',
          errorMessage: null,
          ...zipped,
        })
      } catch (e) {
        if (cancelled) return
        const msg = e instanceof Error ? e.message : String(e)
        setState({
          ...demoState(),
          status: 'error',
          errorMessage: msg,
        })
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return state
}

export function jdAtProgress(eph: EphemerisState, progress: number): number | null {
  if (eph.status !== 'ready' || eph.jdEnd <= eph.jdStart) return null
  const t = THREE.MathUtils.clamp(progress, 0, 1)
  return eph.jdStart + t * (eph.jdEnd - eph.jdStart)
}

export function telemetryAtProgress(
  eph: EphemerisState,
  progress: number,
): MissionTelemetry | null {
  const jd = jdAtProgress(eph, progress)
  if (jd === null || eph.spacecraftSamples.length === 0) return null
  const sc = interpolateSamples(eph.spacecraftSamples, jd)
  const moon = interpolateSamples(eph.moonGeoSamples, jd)
  const earth = interpolateSamples(eph.earthHelioSamples, jd)
  if (!sc || !moon || !earth) return null
  return buildTelemetry(sc, moon, earth)
}

export function moonScenePosition(eph: EphemerisState, progress: number): THREE.Vector3 {
  const jd = jdAtProgress(eph, progress)
  if (jd !== null && eph.moonGeoSamples.length > 0) {
    const m = interpolateSamples(eph.moonGeoSamples, jd)
    if (m) return eclipticKmToSceneVec(m)
  }
  return new THREE.Vector3(22, 0, 0)
}

export function formatKm(km: number): string {
  if (!Number.isFinite(km)) return '—'
  if (km >= 1e6) return `${(km / 1e6).toFixed(3)}×10⁶ km`
  if (km >= 1e4) return `${(km / 1e3).toFixed(1)}×10³ km`
  return `${km.toFixed(0)} km`
}

export function formatSpeedKms(v: number): string {
  if (!Number.isFinite(v)) return '—'
  return `${v.toFixed(3)} km/s`
}

export function progressToUnixMs(eph: EphemerisState, progress: number): number | null {
  const jd = jdAtProgress(eph, progress)
  if (jd === null) return null
  return jdToUnixMs(jd)
}
