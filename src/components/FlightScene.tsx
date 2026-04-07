import {
  forwardRef,
  Suspense,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react'
import type { RefObject } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { Line, OrbitControls, Stars, useTexture, PerspectiveCamera } from '@react-three/drei'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import * as THREE from 'three'
import {
  createTrajectoryCurve,
  EARTH_RADIUS,
  MOON_POSITION,
  MOON_RADIUS,
  NASA_EARTH_TEXTURE_URL,
  NASA_MOON_TEXTURE_URL,
  NASA_ORION_STL_URL,
} from '../data/artemis-ii'

export type CameraViewMode = 'earth' | 'moon' | 'spacecraft'

type FlightSceneProps = {
  progress: number
  viewMode: CameraViewMode
}

function EarthBody() {
  const map = useTexture(NASA_EARTH_TEXTURE_URL, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
  })
  return (
    <mesh>
      <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
      <meshStandardMaterial map={map} roughness={0.85} metalness={0.06} />
    </mesh>
  )
}

function MoonBody() {
  const map = useTexture(NASA_MOON_TEXTURE_URL, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
  })
  return (
    <mesh position={MOON_POSITION}>
      <sphereGeometry args={[MOON_RADIUS, 48, 48]} />
      <meshStandardMaterial map={map} roughness={0.95} metalness={0} />
    </mesh>
  )
}

const OrionSpacecraft = forwardRef<THREE.Group, { progress: number }>(
  function OrionSpacecraft({ progress }, ref) {
  const group = useRef<THREE.Group>(null)
  useImperativeHandle(ref, () => group.current!, [])
  const curve = useMemo(() => createTrajectoryCurve(), [])
  const geom = useLoader(STLLoader, NASA_ORION_STL_URL)

  const { scaledGeometry, scale } = useMemo(() => {
    const g = geom.clone()
    g.computeVertexNormals()
    g.center()
    const box = new THREE.Box3().setFromBufferAttribute(g.attributes.position as THREE.BufferAttribute)
    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z, 1e-6)
    const s = 0.42 / maxDim
    return { scaledGeometry: g, scale: s }
  }, [geom])

  useFrame(() => {
    if (!group.current) return
    const t = THREE.MathUtils.clamp(progress, 0, 1)
    const pos = curve.getPointAt(t)
    const tan = curve.getTangentAt(t)
    group.current.position.copy(pos)
    group.current.lookAt(pos.clone().add(tan))
  })

  return (
    <group ref={group}>
      <mesh
        geometry={scaledGeometry}
        scale={[scale, scale, scale]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial
          color="#c8d4e0"
          metalness={0.55}
          roughness={0.42}
          emissive="#1a3048"
          emissiveIntensity={0.2}
          flatShading={false}
        />
      </mesh>
    </group>
  )
},
)

function CameraRig({
  progress,
  viewMode,
  spacecraftRef,
}: {
  progress: number
  viewMode: CameraViewMode
  spacecraftRef: RefObject<THREE.Group | null>
}) {
  const { camera, controls } = useThree()
  const curve = useMemo(() => createTrajectoryCurve(), [])
  const earthCenter = useMemo(() => new THREE.Vector3(0, 0, 0), [])
  const moonCenter = useMemo(() => MOON_POSITION.clone(), [])
  const tmp = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      tan: new THREE.Vector3(),
      cam: new THREE.Vector3(),
      tgt: new THREE.Vector3(),
    }),
    [],
  )

  useLayoutEffect(() => {
    const c = controls as { target?: THREE.Vector3; update: () => void } | null
    if (!c?.target) return
    c.target.copy(earthCenter)
    camera.position.set(12, 8, 18)
    c.update()
  }, [camera, controls, earthCenter])

  useFrame(() => {
    const c = controls as { target: THREE.Vector3; update: () => void } | null
    if (!c?.target) return

    const t = THREE.MathUtils.clamp(progress, 0, 1)
    const { pos, tan, cam, tgt } = tmp
    curve.getPointAt(t, pos)
    curve.getTangentAt(t, tan)

    if (viewMode === 'earth') {
      tgt.copy(earthCenter)
      cam.set(14, 10, 22)
    } else if (viewMode === 'moon') {
      tgt.copy(moonCenter)
      const outward = moonCenter.clone().normalize().multiplyScalar(7)
      cam.copy(moonCenter).add(outward).add(new THREE.Vector3(0, 2.2, 0))
    } else {
      if (!spacecraftRef.current) return
      spacecraftRef.current.getWorldPosition(tgt)
      const back = tan.clone().normalize().multiplyScalar(-3.8)
      const worldUp = new THREE.Vector3(0, 1, 0)
      const side = new THREE.Vector3().crossVectors(tan, worldUp)
      if (side.lengthSq() < 1e-6) side.set(1, 0, 0)
      else side.normalize().multiplyScalar(1.4)
      cam.copy(tgt).add(back).add(side).add(new THREE.Vector3(0, 0.85, 0))
    }

    c.target.lerp(tgt, 0.12)
    camera.position.lerp(cam, 0.12)
    c.update()
  })

  return null
}

export function FlightScene({ progress, viewMode }: FlightSceneProps) {
  const curve = useMemo(() => createTrajectoryCurve(), [])
  const linePoints = useMemo(() => curve.getPoints(220), [curve])
  const spacecraftRef = useRef<THREE.Group>(null)

  return (
    <>
      <PerspectiveCamera makeDefault position={[12, 8, 18]} fov={45} />
      <color attach="background" args={['#04060a']} />
      <ambientLight intensity={0.22} />
      <directionalLight position={[40, 20, 30]} intensity={2.1} color="#fff5e6" />
      <directionalLight position={[-25, 10, -20]} intensity={0.35} color="#6a9cff" />
      <Stars radius={420} depth={80} count={9000} factor={3.2} saturation={0} fade speed={0.12} />
      <Suspense fallback={null}>
        <EarthBody />
        <MoonBody />
      </Suspense>
      <Line
        points={linePoints}
        color="#ff8c42"
        lineWidth={1.8}
        transparent
        opacity={0.9}
      />
      <Suspense fallback={null}>
        <OrionSpacecraft ref={spacecraftRef} progress={progress} />
      </Suspense>
      <CameraRig progress={progress} viewMode={viewMode} spacecraftRef={spacecraftRef} />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={4}
        maxDistance={120}
        maxPolarAngle={Math.PI * 0.95}
      />
    </>
  )
}
