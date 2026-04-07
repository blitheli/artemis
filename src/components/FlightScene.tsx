import { Suspense, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  Line,
  OrbitControls,
  Stars,
  useTexture,
  PerspectiveCamera,
} from '@react-three/drei'
import * as THREE from 'three'
import {
  createTrajectoryCurve,
  EARTH_RADIUS,
  MOON_POSITION,
  MOON_RADIUS,
} from '../data/artemis-ii'

type FlightSceneProps = {
  progress: number
}

function EarthBody() {
  const map = useTexture(
    'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
  )
  return (
    <mesh>
      <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
      <meshStandardMaterial map={map} roughness={0.8} metalness={0.05} />
    </mesh>
  )
}

function MoonBody() {
  const map = useTexture(
    'https://threejs.org/examples/textures/planets/moon_1024.jpg',
  )
  return (
    <mesh position={MOON_POSITION}>
      <sphereGeometry args={[MOON_RADIUS, 48, 48]} />
      <meshStandardMaterial map={map} roughness={0.95} metalness={0} />
    </mesh>
  )
}

function OrionCapsule({ progress }: { progress: number }) {
  const group = useRef<THREE.Group>(null)
  const curve = useMemo(() => createTrajectoryCurve(), [])

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
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.12, 0.35, 16]} />
        <meshStandardMaterial
          color="#c8d4e0"
          metalness={0.65}
          roughness={0.35}
          emissive="#1a3048"
          emissiveIntensity={0.25}
        />
      </mesh>
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.22, 20]} />
        <meshStandardMaterial
          color="#8fa0b2"
          metalness={0.5}
          roughness={0.45}
        />
      </mesh>
    </group>
  )
}

export function FlightScene({ progress }: FlightSceneProps) {
  const curve = useMemo(() => createTrajectoryCurve(), [])
  const linePoints = useMemo(() => curve.getPoints(220), [curve])

  return (
    <>
      <PerspectiveCamera makeDefault position={[12, 8, 18]} fov={45} />
      <color attach="background" args={['#04060a']} />
      <ambientLight intensity={0.22} />
      <directionalLight
        position={[40, 20, 30]}
        intensity={2.1}
        color="#fff5e6"
      />
      <directionalLight
        position={[-25, 10, -20]}
        intensity={0.35}
        color="#6a9cff"
      />
      <Stars
        radius={420}
        depth={80}
        count={9000}
        factor={3.2}
        saturation={0}
        fade
        speed={0.12}
      />
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
      <OrionCapsule progress={progress} />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={6}
        maxDistance={90}
        maxPolarAngle={Math.PI * 0.95}
      />
    </>
  )
}
