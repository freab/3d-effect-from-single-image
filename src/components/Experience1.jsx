import {
  OrbitControls,
  shaderMaterial,
  useKTX2,
  Text,
  Float
} from "@react-three/drei";
import { extend, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRef, useEffect, useState } from "react";
import { useControls } from "leva";

// Import your shader files
import fragment from "./shaders/fragment1.glsl";
import vertex from "./shaders/vertex.glsl";

// Your texture paths
const tDiffuse = "/gameboy_diffuse-high.png.ktx2";
const tPosition = "/gameboy_position-high.png.ktx2";
const tMotion = "/gameboy_mv-high.png.ktx2";
const tData = "/gameboy_data-high.png.ktx2";

// Create custom shader material
const GameboyShaderMaterial = shaderMaterial(
  {
    time: 0,
    progress: 0.29,
    uDiffuse: null,
    uDisplacementStrength: 0.0025,
    uMouse: 0,
    uPosition: null,
    uMotion: null,
    uData: null,
    resolution: new THREE.Vector4()
  },
  vertex,
  fragment
);

// Extend the material to use in JSX
extend({ GameboyShaderMaterial });

const Scene = () => {
  const materialRef = useRef();
  const meshRef = useRef();
  const TextRef = useRef();
  const [hovered, setHovered] = useState(false);

  // Load all textures using useKTX2
  const [diffuseTexture, positionTexture, motionTexture, dataTexture] = useKTX2(
    [tDiffuse, tPosition, tMotion, tData]
  );

  // Configure textures
  [diffuseTexture, positionTexture, motionTexture, dataTexture].forEach(
    (texture) => {
      if (texture) {
        texture.colorSpace = THREE.LinearSRGBColorSpace;
        texture.needsUpdate = true;
      }
    }
  );

  // Leva controls with folder closed by default
  const { progress, displacementStrength } = useControls(
    "Settings",
    {
      progress: { value: 0.0001, min: 0, max: 1, step: 0.000001 },
      displacementStrength: { value: 0.0, min: 0, max: 0.01, step: 0.0001 }
    },
    { collapsed: true }
  );

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (materialRef.current) {
        materialRef.current.uMouse = e.clientX / window.innerWidth;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Animation loop
  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.time = clock.getElapsedTime() * 0.05;
      materialRef.current.progress = progress;
      materialRef.current.uDisplacementStrength = displacementStrength;
    }
  });

  // Update material uniforms when textures are loaded
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uDiffuse = diffuseTexture;
      materialRef.current.uPosition = positionTexture;
      materialRef.current.uMotion = motionTexture;
      materialRef.current.uData = dataTexture;
    }
  }, [diffuseTexture, positionTexture, motionTexture, dataTexture]);

  return (
    <>
      <Float>
        <mesh
          ref={meshRef}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
        >
          <planeGeometry args={[1.5, 1.5, 100, 100]} />
          <gameboyShaderMaterial
            ref={materialRef}
            side={THREE.DoubleSide}
            transparent
          />
        </mesh>
      </Float>
      <Text
        position={[0, 0, -0.8]}
        color={"#000"}
        fontSize={1.7}
        font="/SCHABO-Condensed.otf"
        anchorX="center"
        anchorY="middle"
        ref={TextRef}
      >
        buttermax
      </Text>
    </>
  );
};

export const Experience1 = () => {
  return (
    <>
      <Scene />
      <OrbitControls enableZoom={false} />
    </>
  );
};
