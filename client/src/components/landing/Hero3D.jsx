import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT = 24;

function OrbitingKnots() {
  const groupA = useRef(null);
  const groupB = useRef(null);
  const knotA = useRef(null);
  const knotB = useRef(null);
  const light = useRef(null);
  const particles = useRef(null);
  const { pointer, camera } = useThree();

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    if (knotA.current) knotA.current.rotation.y += delta * 0.15;
    if (knotB.current) knotB.current.rotation.y -= delta * 0.22;

    if (groupA.current) {
      groupA.current.position.set(Math.cos(t * 0.12) * 1.6, Math.sin(t * 0.09) * 0.6, 0);
    }
    if (groupB.current) {
      groupB.current.position.set(
        Math.cos(t * 0.1 + Math.PI) * 1.9,
        Math.sin(t * 0.14 + Math.PI) * 0.7,
        0
      );
    }

    if (light.current) {
      light.current.position.set(Math.cos(t * 0.3) * 3, Math.sin(t * 0.3) * 3, 2);
    }

    if (particles.current && groupA.current && groupB.current) {
      const a = groupA.current.position;
      const b = groupB.current.position;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const phase = ((t * 0.25 + i / PARTICLE_COUNT) % 1);
        dummy.position.lerpVectors(a, b, phase);
        dummy.scale.setScalar(0.05 + 0.03 * Math.sin(phase * Math.PI));
        dummy.updateMatrix();
        particles.current.setMatrixAt(i, dummy.matrix);
      }
      particles.current.instanceMatrix.needsUpdate = true;
    }

    // Subtle parallax — camera drifts toward the pointer, never far enough
    // to feel draggable/interactive, just alive.
    camera.position.x += (pointer.x * 0.4 - camera.position.x) * 0.02;
    camera.position.y += (pointer.y * 0.3 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 4, 5]} intensity={0.6} />
      <pointLight ref={light} intensity={12} color="#f97316" />

      <group ref={groupA}>
        <mesh ref={knotA}>
          <torusKnotGeometry args={[0.9, 0.28, 128, 16, 2, 3]} />
          <meshStandardMaterial color="#6366f1" metalness={0.6} roughness={0.25} />
        </mesh>
      </group>

      <group ref={groupB}>
        <mesh ref={knotB}>
          <torusKnotGeometry args={[0.7, 0.22, 128, 16, 3, 4]} />
          <meshStandardMaterial color="#f97316" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>

      <instancedMesh ref={particles} args={[null, null, PARTICLE_COUNT]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#c7d2fe" />
      </instancedMesh>
    </>
  );
}

function Hero3D() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 6], fov: 45 }}
      gl={{ antialias: true }}
      className="!absolute inset-0"
    >
      <OrbitingKnots />
    </Canvas>
  );
}

export default Hero3D;
