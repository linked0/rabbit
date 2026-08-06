"use client";

import { useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { TextureLoader, type Mesh } from "three";

// Real 3D sphere (not a CSS trick) — lighting genuinely moves across the
// surface as it spins, which a flat image + box-shadow can't fake past a
// few degrees of rotation. Texture is a 4-column x 2-row checkerboard grid
// (equator + 4 meridians) in the logo's own colors — green/magenta panels,
// indigo grid lines — so it reads as the original quadrant mark up close
// but reveals all 8 panels as it rotates.
function Ball() {
  const texture = useLoader(TextureLoader, "/profile/verex-ball-texture.png");
  const mesh = useRef<Mesh>(null);

  // 회전 속도(rad/s). 0.75 → 0.975 로 30% 상향 (jay, 2026-08-06).
  // delta 를 곱하므로 프레임레이트와 무관하게 같은 속도로 돈다.
  useFrame((_, delta) => {
    if (mesh.current) mesh.current.rotation.y += delta * 0.975;
  });

  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[0.62, 48, 48]} />
      <meshStandardMaterial map={texture} roughness={0.4} metalness={0.1} />
    </mesh>
  );
}

export default function VerexBall() {
  return (
    <Canvas
      camera={{ position: [0, 0, 3], fov: 28 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 4]} intensity={1.2} />
      {/* Fill light, kept above the sphere (positive y) like the key light —
          light from below ("uplighting") reads as unnatural/unsettling since
          it contradicts the overhead-light assumption the ground shadow implies. */}
      <directionalLight position={[-3, 2, -2]} intensity={0.25} />
      <Ball />
    </Canvas>
  );
}
