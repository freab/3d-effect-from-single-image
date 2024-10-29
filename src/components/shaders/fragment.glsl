uniform float time;
uniform float progress;
uniform float uDisplacementStrength;
uniform sampler2D texture1;
uniform sampler2D uDiffuse;
uniform sampler2D uMotion;
uniform sampler2D uPosition;
uniform sampler2D uData;
uniform vec4 resolution;
uniform float uMouse;

uniform float uNoiseScale;
uniform float uNoiseSpeed;
uniform float uGeometricStrength;
uniform float uDirectionalStrength;
uniform float uEdgeWidth;
uniform float uEdgeGlowStrength;
uniform float uRainbowSpeed;
uniform float uRainbowStrength;
uniform float uPulseSpeed;
uniform float uWaveFrequency;
uniform float uWaveAmplitude;
uniform float uGeometricPatternScale;
uniform float uAberrationStrength;

varying vec2 vUv;
varying vec3 vPosition;

float PI = 3.141592653589793238;

vec2 random2(vec2 st) {
    st = vec2(dot(st,vec2(127.1,311.7)),
              dot(st,vec2(269.5,183.3)));
    return -1.0 + 2.0*fract(sin(st)*43758.5453123);
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    vec2 u = f*f*(3.0-2.0*f);
    return mix( mix( dot( random2(i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ),
                     dot( random2(i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                mix( dot( random2(i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ),
                     dot( random2(i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
}

float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 0.;
    for (int i = 0; i < 5; i++) {
        value += amplitude * noise(st);
        st *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

vec2 getSubUv(vec2 uv, float index) {
    float newIndex = index / 4.;
    vec2 newUv = uv/4.;
    newUv.y += 3./4.;
    newUv.x += floor(fract(newIndex) * 4.) / 4.;
    newUv.y -= floor(fract(newIndex /4.) * 4.) / 4.;
    return newUv;
}

vec4 getMap(sampler2D map, float blend, vec2 uv, vec2 uvNext, vec2 displacement, vec2 displacementNext) {
    vec4 mapData = texture2D(map, uv - displacement*blend);
    vec4 mapDataNext = texture2D(map, uvNext + displacementNext*(1. - blend));
    return mix(mapData, mapDataNext, blend);
} 

vec2 getDisplacement(sampler2D map, vec2 uv, float strength) {
    vec4 tData = texture2D(map, uv);
    vec2 displacement = tData.rg;
    displacement *= strength;
    return displacement;
}

vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    float index = mix(1., 15., uMouse);
    vec2 subUv = getSubUv(vUv, index);
    vec2 subUvNext = getSubUv(vUv, index + 1.);
    float blend = smoothstep(0.0, 1.0, fract(index)); // Smooth blending

    vec2 displacement = getDisplacement(uMotion, subUv, -uDisplacementStrength);
    vec2 displacementNext = getDisplacement(uMotion, subUvNext, -uDisplacementStrength);

    vec4 defaultMap = getMap(uDiffuse, blend, subUv, subUvNext, displacement, displacementNext);
    vec4 position = getMap(uPosition, blend, subUv, subUvNext, displacement, displacementNext);

    vec2 noiseCoord = vUv * uNoiseScale + time * uNoiseSpeed;
    float dissolveNoise = fbm(noiseCoord);
    
    float geometricPattern = step(0.5, fract(vUv.x * uGeometricPatternScale)) * 
                            step(0.5, fract(vUv.y * uGeometricPatternScale));
    dissolveNoise = mix(dissolveNoise, geometricPattern, uGeometricStrength);
    
    float mixedDissolve = mix(dissolveNoise, vUv.x, uDirectionalStrength); // More uniform dissolve
    float dissolveValue = smoothstep(progress - uEdgeWidth, progress + uEdgeWidth, mixedDissolve);
    
    float edgeGlow = smoothstep(progress - uEdgeWidth, progress, mixedDissolve) - 
                     smoothstep(progress, progress + uEdgeWidth, mixedDissolve);
    
    vec4 color = getMap(uDiffuse, blend, subUv, subUvNext, displacement, displacementNext);
    
    vec3 rainbowEdge = hsv2rgb(vec3(time * uRainbowSpeed + vUv.x, 1.0, 1.0));
    
    vec3 edgeColor1 = mix(vec3(1.0, 0.5, 0.0), rainbowEdge, 0.5 + 0.5 * sin(time));
    vec3 edgeColor2 = mix(vec3(1.0, 0.0, 0.0), rainbowEdge, 0.5 + 0.5 * cos(time));
    
    vec3 finalColor = mix(color.rgb, edgeColor1, edgeGlow * uEdgeGlowStrength);
    finalColor = mix(finalColor, edgeColor2, edgeGlow * edgeGlow * uRainbowStrength);
    
    float edgeMovement = sin(time * uPulseSpeed + vUv.x * 10.0) * 0.5 + 0.5;
    finalColor += edgeColor1 * edgeGlow * edgeMovement * 0.3;
    
    float edgeDistortion = noise(vUv * 10.0 + time) * edgeGlow * 0.1;
    finalColor += edgeDistortion;
    
    finalColor = mix(finalColor, rainbowEdge, edgeGlow * 0.3);

    float wave = sin(vUv.y * uWaveFrequency + time * 3.0) * uWaveAmplitude;
    dissolveValue *= 1.0 + wave;

    float pulse = sin(time * uPulseSpeed) * 0.5 + 0.5;
    finalColor += rainbowEdge * edgeGlow * pulse * 0.2;

    float geometricPulse = step(0.7, sin(vUv.x * uGeometricPatternScale) * sin(vUv.y * uGeometricPatternScale));
    finalColor += geometricPulse * edgeGlow * 0.1;

    gl_FragColor = vec4(finalColor, color.a * dissolveValue);
    
    float aberration = uAberrationStrength * edgeGlow;
    gl_FragColor.r += aberration;
    gl_FragColor.b -= aberration;
    
    gl_FragColor.a *= defaultMap.a;
}
