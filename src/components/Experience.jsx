import {
  OrbitControls,
  shaderMaterial,
  useKTX2,
  Text,
  Float
} from "@react-three/drei";
import { extend, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useRef, useEffect, useState } from "react";
import { useControls } from "leva";
import { easing } from "maath";

// Import your shader files
import fragment from "./shaders/fragment.glsl";
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
    resolution: new THREE.Vector4(),
    uNoiseScale: 3.0,
    uNoiseSpeed: 0.2,
    uGeometricStrength: 0.3,
    uDirectionalStrength: 0.4,
    uEdgeWidth: 0.1,
    uEdgeGlowStrength: 0.6,
    uRainbowSpeed: 0.1,
    uRainbowStrength: 0.4,
    uPulseSpeed: 3.0,
    uWaveFrequency: 20.0,
    uWaveAmplitude: 0.05,
    uGeometricPatternScale: 20.0,
    uAberrationStrength: 0.01,
    radius: 0.1,
    zoom: 1.5
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
  const [isMobile, setIsMobile] = useState(false);

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

  // const handleResize = () => {
  //   const mobile = window.innerWidth <= 768;
  //   setIsMobile(mobile);

  //   if (TextRef.current) {
  //     if (window.innerWidth > window.innerHeight) {
  //       // Landscape
  //       TextRef.current.scale.set(1, 1, 1);
  //     } else {
  //       // Portrait
  //       TextRef.current.scale.set(0.35, 0.35, 0.35);
  //     }
  //   }
  // };

  // Leva controls with folder closed by default
  const {
    progress,
    displacementStrength,
    noiseScale,
    noiseSpeed,
    geometricStrength,
    directionalStrength,
    edgeWidth,
    edgeGlowStrength,
    rainbowSpeed,
    rainbowStrength,
    pulseSpeed,
    waveFrequency,
    waveAmplitude,
    geometricPatternScale,
    aberrationStrength
  } = useControls(
    "Settings",
    {
      progress: { value: 0.0001, min: 0, max: 1, step: 0.000001 },
      displacementStrength: { value: 0.0, min: 0, max: 0.01, step: 0.0001 },
      noiseScale: { value: 7.9, min: 0, max: 10, step: 0.1 },
      noiseSpeed: { value: 0.55, min: 0, max: 1, step: 0.01 },
      geometricStrength: { value: 0.0, min: 0, max: 1, step: 0.01 },
      directionalStrength: { value: 0.6, min: 0, max: 1, step: 0.01 },
      edgeWidth: { value: 0.1, min: 0, max: 0.5, step: 0.01 },
      edgeGlowStrength: { value: 0.6, min: 0, max: 2, step: 0.01 },
      rainbowSpeed: { value: 0.1, min: 0, max: 1, step: 0.01 },
      rainbowStrength: { value: 0.4, min: 0, max: 1, step: 0.01 },
      pulseSpeed: { value: 3.0, min: 0, max: 10, step: 0.1 },
      waveFrequency: { value: 20.0, min: 0, max: 50, step: 0.1 },
      waveAmplitude: { value: 0.05, min: 0, max: 0.2, step: 0.01 },
      geometricPatternScale: { value: 20.0, min: 0, max: 50, step: 0.1 },
      aberrationStrength: { value: 0.01, min: 0, max: 0.1, step: 0.001 }
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

  // useEffect(() => {
  //   handleResize();
  //   window.addEventListener("resize", handleResize);
  //   return () => {
  //     window.removeEventListener("resize", handleResize);
  //   };
  // }, []);

  // Animation loop
  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.time = clock.getElapsedTime() * 0.05;
      materialRef.current.progress = progress;
      materialRef.current.uDisplacementStrength = displacementStrength;
      materialRef.current.uNoiseScale = noiseScale;
      materialRef.current.uNoiseSpeed = noiseSpeed;
      materialRef.current.uGeometricStrength = geometricStrength;
      materialRef.current.uDirectionalStrength = directionalStrength;
      materialRef.current.uEdgeWidth = edgeWidth;
      materialRef.current.uEdgeGlowStrength = edgeGlowStrength;
      materialRef.current.uRainbowSpeed = rainbowSpeed;
      materialRef.current.uRainbowStrength = rainbowStrength;
      materialRef.current.uPulseSpeed = pulseSpeed;
      materialRef.current.uWaveFrequency = waveFrequency;
      materialRef.current.uWaveAmplitude = waveAmplitude;
      materialRef.current.uGeometricPatternScale = geometricPatternScale;
      materialRef.current.uAberrationStrength = aberrationStrength;
    }
  });

  // Hover animation
  // useFrame((state, delta) => {
  //   state.events.update();
  //   easing.damp3(
  //     state.camera.position,
  //     [-state.pointer.x * 0.2, 0.02, 1.6],
  //     0,
  //     delta
  //   );
  //   state.camera.lookAt(0, 0, 0);
  // });

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

export const Experience = () => {
  return (
    <>
      <Scene />
    </>
  );
};
