'use client';

import { useEffect, useRef, useState, type MutableRefObject, type RefObject } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Html, OrbitControls, RoundedBox } from '@react-three/drei';
import { MathUtils, type Group, type PerspectiveCamera } from 'three';
import { ScrollTrigger } from '@/lib/motion';
import { CourseFace } from './CourseFace';
import { PODIUM, type TopCourse } from './top-courses';

/* React 19 / Drei <Html> compatibility:
   In React 19, synchronous root.unmount() during layout effect cleanup throws
   "Attempted to synchronously unmount a root while React was already rendering".
   Deferring root.unmount via microtask/macrotask prevents this warning without affecting cleanup. */
if (typeof window !== 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const rd = require('react-dom/client');
    if (rd && rd.createRoot && !rd.createRoot.__react19_patched__) {
      const origCreateRoot = rd.createRoot;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rd.createRoot = function (container: any, options: any) {
        const root = origCreateRoot.call(this, container, options);
        if (root && typeof root.unmount === 'function') {
          const origUnmount = root.unmount;
          root.unmount = function () {
            setTimeout(() => {
              try {
                origUnmount.call(root);
              } catch {
                // Ignore if already cleanly unmounted
              }
            }, 0);
          };
        }
        return root;
      };
      rd.createRoot.__react19_patched__ = true;
    }
  } catch {
    // SSR guard
  }
}

/* Card geometry (world units). At HTML_DISTANCE_FACTOR = 4, 1 unit = 100 CSS px,
   so the 2.45 × 2.8 slab maps exactly onto CourseFace's 245 × 280 box. */
const CARD_W = 2.45;
const CARD_H = 2.8;
const CARD_D = 0.16;
const SPACING = 2.65;
const HTML_DISTANCE_FACTOR = 4;

const BASE_FOV = 31;
const BASE_Z = 8.4;
/** Half-width of the three-card row plus breathing room. */
const CONTENT_HALF_WIDTH = SPACING + CARD_W / 2 + 0.35;

/** Pull the camera back on narrow canvases so the row is never cropped. */
function FitCamera() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const aspect = useThree((s) => s.size.width / s.size.height);

  useEffect(() => {
    const halfFovTan = Math.tan(MathUtils.degToRad(BASE_FOV / 2));
    const zToFit = CONTENT_HALF_WIDTH / (halfFovTan * aspect);
    camera.position.z = Math.max(BASE_Z, zToFit);
    camera.updateProjectionMatrix();
  }, [camera, aspect]);

  return null;
}

interface CardProps {
  course: TopCourse;
  position: [number, number, number];
  rotation: [number, number, number];
  scroll: MutableRefObject<number>;
  portalRef: RefObject<HTMLElement | null>;
  onOpen: (id: string) => void;
}

function FloatingCourseCard({ course, position, rotation, scroll, portalRef, onOpen }: CardProps) {
  const ref = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    const g = ref.current;
    if (!g) return;

    // Frame-rate independent easing (≈ the original 0.12/frame at 60fps).
    const s = MathUtils.damp(g.scale.x, hovered ? 1.07 : 1, 8, delta);
    g.scale.setScalar(s);
    g.position.y = MathUtils.damp(g.position.y, position[1] + (hovered ? 0.07 : 0), 8, delta);

    // Section-relative scroll, centred so cards sit at rest mid-section.
    const p = scroll.current - 0.5;
    g.rotation.y = MathUtils.damp(g.rotation.y, rotation[1] - p * 0.3, 6, delta);
    g.rotation.x = MathUtils.damp(g.rotation.x, rotation[0] + p * 0.08, 6, delta);
    g.position.z = MathUtils.damp(g.position.z, position[2] - p * 0.3, 6, delta);
    g.rotation.z = rotation[2] + Math.sin(state.clock.elapsedTime * 0.65 + position[0]) * 0.018;
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    // Ignore the click that ends an orbit drag.
    if (e.delta > 4) return;
    e.stopPropagation();
    onOpen(course.id);
  };

  return (
    <group
      ref={ref}
      position={position}
      rotation={rotation}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = '';
      }}
      onClick={handleClick}
    >
      <RoundedBox args={[CARD_W, CARD_H, CARD_D]} radius={0.13} smoothness={5}>
        <meshStandardMaterial color={hovered ? '#ffffff' : '#fbfbfa'} roughness={0.72} metalness={0.02} />
      </RoundedBox>
      <mesh position={[0, 0.63, CARD_D / 2 + 0.01]}>
        <planeGeometry args={[2.18, 1.18]} />
        <meshBasicMaterial color={course.tint} />
      </mesh>
      <mesh position={[0, 0.03, CARD_D / 2 + 0.015]}>
        <planeGeometry args={[2.18, 0.05]} />
        <meshBasicMaterial color={course.accent} />
      </mesh>

      {/* Card text lives on the card, so it moves with it when orbiting.
          Pointer events pass through to the mesh (hover/click/drag);
          the button stays keyboard-focusable. */}
      <Html
        transform
        portal={portalRef as RefObject<HTMLElement>}
        position={[0, 0, CARD_D / 2 + 0.02]}
        distanceFactor={HTML_DISTANCE_FACTOR}
        pointerEvents="none"
        zIndexRange={[10, 0]}
      >
        <CourseFace
          course={course}
          variant="overlay"
          aria-label={`${course.title} — #${course.rank} most purchased. Open course`}
          onClick={() => onOpen(course.id)}
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
          className="rounded-[13px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange"
        />
      </Html>
    </group>
  );
}

interface SceneProps {
  onOpen: (id: string) => void;
}

export default function CourseCardScene({ onOpen }: SceneProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const scroll = useRef(0.5);
  const [inView, setInView] = useState(false);

  // Section-scoped scroll progress (0 entering → 1 leaving).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        scroll.current = self.progress;
      },
    });
    return () => st.kill();
  }, []);

  // Stop rendering when off-screen.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(Boolean(entry?.isIntersecting)), {
      rootMargin: '200px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative h-[440px] w-full"
      aria-label="Interactive 3D view of CourseCity's most purchased courses"
      role="group"
    >
      <Canvas
        dpr={[1, 1.5]}
        frameloop={inView ? 'always' : 'never'}
        camera={{ position: [0, 0.15, BASE_Z], fov: BASE_FOV }}
        gl={{ antialias: true, alpha: true }}
      >
        <FitCamera />
        <ambientLight intensity={1.6} />
        <directionalLight position={[3, 4, 6]} intensity={2.4} color="#fff8ef" />
        <directionalLight position={[-4, -2, 3]} intensity={1.1} color="#d7f4ff" />

        {PODIUM.map((course, i) => {
          const isCentre = i === 1;
          return (
            <FloatingCourseCard
              key={course.id}
              course={course}
              position={[(i - 1) * SPACING, isCentre ? 0.12 : -0.12, isCentre ? 0.25 : 0]}
              rotation={[0, isCentre ? 0 : i === 0 ? 0.045 : -0.045, i === 0 ? -0.06 : i === 2 ? 0.06 : 0]}
              scroll={scroll}
              portalRef={wrapRef}
              onOpen={onOpen}
            />
          );
        })}

        {/* Bounded orbit: enough to feel the depth, never enough to see the
            card backs (the HTML faces would mirror). */}
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableDamping
          dampingFactor={0.08}
          minPolarAngle={Math.PI / 2.3}
          maxPolarAngle={Math.PI / 1.75}
          minAzimuthAngle={-0.35}
          maxAzimuthAngle={0.35}
        />
      </Canvas>
    </div>
  );
}
