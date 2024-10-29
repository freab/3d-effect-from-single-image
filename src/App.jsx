// App.jsx
import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import * as THREE from "three";
import { Fluid } from "@whatisjery/react-fluid-distortion";
import { EffectComposer } from "@react-three/postprocessing";

function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
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
        {/* <EffectComposer>
          <Fluid
            radius={0.3}
            curl={10}
            swirl={5}
            distortion={1}
            force={2}
            pressure={0.94}
            densityDissipation={0.98}
            velocityDissipation={0.99}
            intensity={0.3}
            rainbow={false}
            blend={1}
            // showBackground={true}
            // backgroundColor="#a7958b"
            fluidColor="#000"
          />
        </EffectComposer> */}
      </Canvas>
    </div>
  );
}

export default App;
