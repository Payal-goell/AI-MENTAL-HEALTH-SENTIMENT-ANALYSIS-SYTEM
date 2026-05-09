import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/* ─────────────────────────────────────────────────────────────────────────
   GLSL Shaders — Domain-warped Perlin noise producing a living liquid
   surface with mouse-reactive distortion and deep green palette.
───────────────────────────────────────────────────────────────────────── */
const vertexShader = /* glsl */`
  uniform float uTime;
  uniform vec2  uMouse;
  uniform float uAmplitude;

  varying vec2  vUv;
  varying float vElevation;

  // Classic 3D Perlin noise helpers
  vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314*r; }
  vec3 fade(vec3 t){ return t*t*t*(t*(t*6.0-15.0)+10.0); }

  float cnoise(vec3 P){
    vec3 Pi0 = floor(P); vec3 Pi1 = Pi0 + vec3(1.0);
    Pi0 = mod(Pi0, 289.0); Pi1 = mod(Pi1, 289.0);
    vec3 Pf0 = fract(P); vec3 Pf1 = Pf0 - vec3(1.0);
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz; vec4 iz1 = Pi1.zzzz;
    vec4 ixy  = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);
    vec4 gx0 = ixy0 / 7.0; vec4 gy0 = fract(floor(gx0)/7.0) - 0.5;
    gx0 = fract(gx0); vec4 gz0 = vec4(0.5)-abs(gx0)-abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0)); gx0 -= sz0*(step(0.0,gx0)-0.5); gy0 -= sz0*(step(0.0,gy0)-0.5);
    vec4 gx1 = ixy1/7.0; vec4 gy1 = fract(floor(gx1)/7.0)-0.5;
    gx1 = fract(gx1); vec4 gz1 = vec4(0.5)-abs(gx1)-abs(gy1);
    vec4 sz1 = step(gz1,vec4(0.0)); gx1 -= sz1*(step(0.0,gx1)-0.5); gy1 -= sz1*(step(0.0,gy1)-0.5);
    vec3 g000=vec3(gx0.x,gy0.x,gz0.x); vec3 g100=vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010=vec3(gx0.z,gy0.z,gz0.z); vec3 g110=vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001=vec3(gx1.x,gy1.x,gz1.x); vec3 g101=vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011=vec3(gx1.z,gy1.z,gz1.z); vec3 g111=vec3(gx1.w,gy1.w,gz1.w);
    vec4 norm0 = taylorInvSqrt(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));
    g000*=norm0.x; g010*=norm0.y; g100*=norm0.z; g110*=norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));
    g001*=norm1.x; g011*=norm1.y; g101*=norm1.z; g111*=norm1.w;
    float n000=dot(g000,Pf0); float n100=dot(g100,vec3(Pf1.x,Pf0.yz));
    float n010=dot(g010,vec3(Pf0.x,Pf1.y,Pf0.z)); float n110=dot(g110,vec3(Pf1.xy,Pf0.z));
    float n001=dot(g001,vec3(Pf0.xy,Pf1.z)); float n101=dot(g101,vec3(Pf1.x,Pf0.y,Pf1.z));
    float n011=dot(g011,vec3(Pf0.x,Pf1.yz)); float n111=dot(g111,Pf1);
    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    return 2.2 * mix(n_yz.x, n_yz.y, fade_xyz.x);
  }

  void main(){
    vUv = uv;

    // Domain warp: sample noise at two offsets to create swirling flow
    float t = uTime * 0.18;
    vec3 p = vec3(position.xy * 1.8, t);

    // Layer 1 — large, slow warp
    float n1 = cnoise(p + vec3(uMouse * 0.6, 0.0));
    // Layer 2 — finer detail
    float n2 = cnoise(p * 2.5 + vec3(1.7, 9.2, t * 0.5));
    // Combine for domain warp
    float n  = n1 * 0.65 + n2 * 0.35;

    vElevation = n;

    // Lift vertices along Z + subtle XY ripple
    vec3 displaced = position;
    displaced.z += n * uAmplitude;
    displaced.x += n1 * 0.06;
    displaced.y += n2 * 0.04;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`

const fragmentShader = /* glsl */`
  uniform float uTime;
  uniform vec2  uMouse;

  varying vec2  vUv;
  varying float vElevation;

  void main(){
    // Deep midnight green base → neon green peak
    vec3 dark    = vec3(0.012, 0.043, 0.027);   // #031b0e
    vec3 mid     = vec3(0.010, 0.120, 0.065);   // #031e11 richer
    vec3 accent  = vec3(0.000, 1.000, 0.533);   // #00ff88

    float n = clamp(vElevation * 0.5 + 0.5, 0.0, 1.0);

    // Three-stop gradient driven by noise
    vec3 col = mix(dark, mid, smoothstep(0.0, 0.5, n));
    col      = mix(col, accent, smoothstep(0.55, 0.85, n) * 0.18);

    // Subtle vignette toward edges
    vec2 uv2 = vUv - 0.5;
    float vig = 1.0 - dot(uv2 * 1.4, uv2 * 1.4);
    col *= clamp(vig * 1.4, 0.0, 1.0);

    // Mouse proximity glow
    float mDist = length(vUv - (uMouse * 0.5 + 0.5));
    float glow  = 1.0 - smoothstep(0.0, 0.45, mDist);
    col += accent * glow * 0.06;

    // Alpha — let pure-dark fragments be semi-transparent
    float alpha = 0.55 + n * 0.35;

    gl_FragColor = vec4(col, alpha);
  }
`

/* ─── Reactive mouse tracker ─────────────────────────────────────────── */
const mouse = new THREE.Vector2(0, 0)
if (typeof window !== 'undefined') {
    window.addEventListener('mousemove', (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
    }, { passive: true })
}

/* ─── The living noise mesh ──────────────────────────────────────────── */
function NoiseMesh() {
    const meshRef = useRef()
    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uAmplitude: { value: 0.38 },
    }), [])

    useFrame(({ clock }) => {
        if (!meshRef.current) return
        uniforms.uTime.value = clock.elapsedTime
        // Smooth lerp toward real mouse position
        uniforms.uMouse.value.lerp(mouse, 0.06)
    })

    return (
        <mesh ref={meshRef} rotation={[-Math.PI / 5, 0, 0]} position={[0, 0.2, 0]}>
            {/* High-res plane for smooth displacement */}
            <planeGeometry args={[5, 4, 140, 110]} />
            <shaderMaterial
                key="noise-mat"
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                transparent
                depthWrite={false}
                side={THREE.DoubleSide}
            />
        </mesh>
    )
}

/* ─── Ambient floating particles ─────────────────────────────────────── */
function AmbientParticles({ count = 800 }) {
    const ref = useRef()
    const [pos, col] = useMemo(() => {
        const p = new Float32Array(count * 3)
        const c = new Float32Array(count * 3)
        for (let i = 0; i < count; i++) {
            p[i * 3] = (Math.random() - 0.5) * 10
            p[i * 3 + 1] = (Math.random() - 0.5) * 7
            p[i * 3 + 2] = (Math.random() - 0.5) * 4
            const bright = 0.3 + Math.random() * 0.5
            c[i * 3] = 0; c[i * 3 + 1] = bright; c[i * 3 + 2] = bright * 0.55
        }
        return [p, c]
    }, [count])

    useFrame(({ clock }) => {
        if (!ref.current) return
        ref.current.rotation.y = clock.elapsedTime * 0.04
        ref.current.rotation.x = mouse.y * 0.06
    })

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[pos, 3]} />
                <bufferAttribute attach="attributes-color" args={[col, 3]} />
            </bufferGeometry>
            <pointsMaterial size={0.025} vertexColors transparent opacity={0.55} sizeAttenuation depthWrite={false} />
        </points>
    )
}

/* ─── Canvas export ───────────────────────────────────────────────────── */
export default function AnimatedBackground({ isPaused = false }) {
    return (
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: -10 }} aria-hidden="true">
            <Canvas
                camera={{ position: [0, 0, 2.8], fov: 55 }}
                dpr={[1, 1.5]}
                gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
                style={{ background: 'transparent' }}
                frameloop={isPaused ? 'demand' : 'always'}
            >
                <NoiseMesh />
                <AmbientParticles count={800} />
            </Canvas>
        </div>
    )
}
