import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { Experience } from "./components/Experience";

function ExperienceTwo() {
  return (
    <Canvas
      camera={{
        fov: 70,
        near: 0.001,
        far: 1000,
        position: [0, 0, 1.2]
      }}
      gl={{
        pixelRatio: window.devicePixelRatio,
        outputColorSpace: THREE.SRGBColorSpace
      }}
    >
      <color attach="background" args={["#fed703"]} />
      <Experience />
    </Canvas>
  );
}

export default ExperienceTwo;
