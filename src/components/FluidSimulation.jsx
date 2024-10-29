import { useEffect, useRef } from "react";

const FluidSimulation = ({
  width = window.innerWidth,
  height = window.innerHeight
}) => {
  const canvasRef = useRef(null);
  const glRef = useRef(null);
  const programsRef = useRef({});
  const fbosRef = useRef({});
  const paramsRef = useRef({
    SIM_RESOLUTION: 128,
    DYE_RESOLUTION: 1024,
    DENSITY_DISSIPATION: 0.995,
    VELOCITY_DISSIPATION: 0.9,
    PRESSURE_ITERATIONS: 10,
    SPLAT_RADIUS: 3 / window.innerHeight
  });

  const pointerRef = useRef({
    x: 0.65 * window.innerWidth,
    y: 0.5 * window.innerHeight,
    dx: 0,
    dy: 0,
    moved: false,
    firstMove: true
  });

  // Shader sources
  const vertexShaderSource = `
    precision highp float;
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
      v_uv = (a_position + 1.0) * 0.5;
      gl_Position = vec4(a_position, 0, 1);
    }
  `;

  const fragmentShaderSource = `
    precision highp float;
    varying vec2 v_uv;
    uniform sampler2D u_input_txr;
    uniform vec2 u_point;
    uniform vec3 u_point_value;
    uniform float u_point_size;
    uniform float u_ratio;
    
    void main() {
      vec2 p = v_uv - u_point;
      p.x *= u_ratio;
      vec3 splat = u_point_value * exp(-dot(p, p) / u_point_size);
      vec3 base = texture2D(u_input_txr, v_uv).xyz;
      gl_FragColor = vec4(base + splat, 1.0);
    }
  `;

  const createShader = (gl, source, type) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Shader compile error:", gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  };

  const createProgram = (gl, vertexShader, fragmentShader) => {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return null;
    }

    return program;
  };

  const createFBO = (gl, w, h, type = gl.RGBA) => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, type, w, h, 0, type, gl.FLOAT, null);

    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );

    return {
      texture,
      fbo,
      width: w,
      height: h
    };
  };

  const createDoubleFBO = (gl, w, h, type) => {
    let fbo1 = createFBO(gl, w, h, type);
    let fbo2 = createFBO(gl, w, h, type);

    return {
      read: fbo1,
      write: fbo2,
      swap: () => {
        const temp = fbo1;
        fbo1 = fbo2;
        fbo2 = temp;
      }
    };
  };

  const blit = (gl, target) => {
    const vertices = new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    if (target) {
      gl.viewport(0, 0, target.width, target.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    } else {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl");
    glRef.current = gl;

    if (!gl.getExtension("OES_texture_float")) {
      console.error("OES_texture_float not supported");
      return;
    }

    // Create shaders
    const vertexShader = createShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = createShader(
      gl,
      fragmentShaderSource,
      gl.FRAGMENT_SHADER
    );
    const program = createProgram(gl, vertexShader, fragmentShader);

    programsRef.current = {
      fluid: {
        program,
        uniforms: {
          u_input_txr: gl.getUniformLocation(program, "u_input_txr"),
          u_point: gl.getUniformLocation(program, "u_point"),
          u_point_value: gl.getUniformLocation(program, "u_point_value"),
          u_point_size: gl.getUniformLocation(program, "u_point_size"),
          u_ratio: gl.getUniformLocation(program, "u_ratio")
        }
      }
    };

    // Create FBOs
    fbosRef.current = {
      fluid: createDoubleFBO(gl, width, height, gl.RGBA)
    };

    // Animation loop
    let animationFrameId;
    const render = () => {
      const gl = glRef.current;
      const program = programsRef.current.fluid;
      const fluid = fbosRef.current.fluid;

      if (pointerRef.current.moved) {
        gl.useProgram(program.program);

        // Update uniforms
        gl.uniform2f(
          program.uniforms.u_point,
          pointerRef.current.x / width,
          1.0 - pointerRef.current.y / height
        );
        gl.uniform3f(program.uniforms.u_point_value, 1, 1, 1); // Inversion color
        gl.uniform1f(
          program.uniforms.u_point_size,
          paramsRef.current.SPLAT_RADIUS
        );
        gl.uniform1f(program.uniforms.u_ratio, width / height);

        // Render to FBO
        gl.bindTexture(gl.TEXTURE_2D, fluid.read.texture);
        blit(gl, fluid.write);
        fluid.swap();

        pointerRef.current.moved = false;
      }

      // Display result
      gl.useProgram(program.program);
      gl.bindTexture(gl.TEXTURE_2D, fluid.read.texture);
      blit(gl, null);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handlePointer = (e) => {
      pointerRef.current = {
        x: e.clientX,
        y: e.clientY,
        dx: e.clientX - pointerRef.current.x,
        dy: e.clientY - pointerRef.current.y,
        moved: true
      };
    };

    canvas.addEventListener("mousemove", handlePointer);
    canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
      handlePointer(e.touches[0]);
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener("mousemove", handlePointer);
      canvas.removeEventListener("touchmove", handlePointer);
    };
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        pointerEvents: "none",
        mixBlendMode: "difference"
      }}
    />
  );
};

export default FluidSimulation;
