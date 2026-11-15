'use client';

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  BufferAttribute,
  BufferGeometry,
  CapsuleGeometry,
  CatmullRomCurve3,
  DoubleSide,
  MathUtils,
  Object3D,
  Shape,
  Vector3,
  type Group,
  type InstancedMesh,
  type PerspectiveCamera,
} from 'three';
import { JOURNEY, JOURNEY_THRESHOLDS, popEase, type JourneyStep } from './journey-steps';
import { JourneyCard } from './JourneyCard';

/* ------------------------------------------------------------------ */
/*  Layout (world units, road lies on the XZ plane)                    */
/* ------------------------------------------------------------------ */

/** Nodes zig-zag between the near and far side of the road so labels can
 *  alternate below / above without ever colliding. */
const NODES: readonly { pos: [number, number, number]; above: boolean }[] = [
  { pos: [-5.4, 0, 1.2], above: false },
  { pos: [-3.24, 0, -1.0], above: true },
  { pos: [-1.08, 0, 1.1], above: false },
  { pos: [1.08, 0, -1.0], above: true },
  { pos: [3.24, 0, 1.1], above: false },
  { pos: [5.4, 0, -1.0], above: true },
];

const ROAD_WIDTH = 0.95;
const STEM_LOW = 0.6;
const STEM_HIGH = 0.95;
const DASH_COUNT = 58;
const DASH_SPEED = 0.85; // dash spacings per second
const POP_WIDTH = 0.045; // progress needed for a node to fully pop
const LABEL_W = 216;

const FOV = 30;
const LOOK_AT = new Vector3(0, 0.45, 0.1);
const CAM_DIR = new Vector3(0, 8.5, 9.4).sub(LOOK_AT).normalize();
const BASE_DIST = 12.6;
const CONTENT_HALF_WIDTH = 6.4;

const COLORS = {
  road: '#ede0d1',      // slightly darker than egg so it reads on white
  roadEdge: '#ddd0be',  // visible edge contrast
  dash: '#ff6400',
  puck: '#ffffff',
  bottle: '#003223',
  egg: '#f5ebe1',
  orange: '#ff6400',
  salad: '#8cc850',
} as const;

function anchorY(step: JourneyStep, above: boolean): number {
  if (!above) return 0;
  return step.kind === 'target' ? 1.5 : STEM_HIGH + 0.12;
}

/* ------------------------------------------------------------------ */
/*  Geometry helpers                                                   */
/* ------------------------------------------------------------------ */

function makeRibbon(curve: CatmullRomCurve3, width: number, segments = 260): BufferGeometry {
  const positions = new Float32Array((segments + 1) * 6);
  const index: number[] = [];
  const p = new Vector3();
  const t = new Vector3();
  const side = new Vector3();
  const up = new Vector3(0, 1, 0);

  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    curve.getPointAt(u, p);
    curve.getTangentAt(u, t);
    side.crossVectors(up, t).normalize().multiplyScalar(width / 2);
    positions.set([p.x + side.x, 0, p.z + side.z, p.x - side.x, 0, p.z - side.z], i * 6);
    if (i < segments) {
      const a = i * 2;
      index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }

  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(positions, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();
  return geo;
}

/** Arc-length position (0–1) of each node, so the chain head can be
 *  interpolated in the same space the dashes are laid out in. */
function nodeArcPositions(curve: CatmullRomCurve3): number[] {
  const divisions = 400;
  const lengths = curve.getLengths(divisions);
  const total = lengths[divisions] ?? 1;
  return NODES.map((_, i) => {
    const t = i / (NODES.length - 1);
    return (lengths[Math.round(t * divisions)] ?? 0) / total;
  });
}

/** Scroll progress → arc-length head of the chain line. */
function headFromProgress(p: number, nodeU: number[]): number {
  const th = JOURNEY_THRESHOLDS;
  if (p <= (th[0] ?? 0)) return 0;
  for (let i = 0; i < th.length - 1; i++) {
    const a = th[i] ?? 0;
    const b = th[i + 1] ?? 1;
    if (p <= b) {
      const k = (p - a) / (b - a);
      return MathUtils.lerp(nodeU[i] ?? 0, nodeU[i + 1] ?? 1, k);
    }
  }
  return 1;
}

/* ------------------------------------------------------------------ */
/*  Camera                                                             */
/* ------------------------------------------------------------------ */

function FitCamera() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));

  useEffect(() => {
    const halfTan = Math.tan(MathUtils.degToRad(FOV / 2));
    const dist = Math.max(BASE_DIST, CONTENT_HALF_WIDTH / (halfTan * aspect) + 1.5);
    camera.position.copy(LOOK_AT).addScaledVector(CAM_DIR, dist);
    camera.lookAt(LOOK_AT);
    camera.updateProjectionMatrix();
  }, [camera, aspect]);

  return null;
}

/* ------------------------------------------------------------------ */
/*  Markers                                                            */
/* ------------------------------------------------------------------ */

interface MarkerProps {
  step: JourneyStep;
  index: number;
  position: [number, number, number];
  above: boolean;
  shown: MutableRefObject<number>;
}

function Puck({ color }: { color: string }) {
  return (
    <>
      {/* soft contact shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
        <circleGeometry args={[0.66, 40]} />
        <meshBasicMaterial color={COLORS.bottle} transparent opacity={0.07} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.5, 0.52, 0.16, 48]} />
        <meshStandardMaterial color={COLORS.puck} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.03, 48]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
    </>
  );
}

function StartFlag({ color }: { color: string }) {
  const flag = useRef<Group>(null);
  const pennant = useMemo(() => {
    const s = new Shape();
    s.moveTo(0, 0);
    s.quadraticCurveTo(0.3, -0.04, 0.6, -0.17);
    s.quadraticCurveTo(0.3, -0.3, 0, -0.36);
    s.closePath();
    return s;
  }, []);

  useFrame((state) => {
    if (flag.current) flag.current.rotation.y = Math.sin(state.clock.elapsedTime * 2.1) * 0.22;
  });

  return (
    <group position={[0, 0.18, 0]}>
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.026, 0.026, 1.24, 12]} />
        <meshStandardMaterial color={COLORS.bottle} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.27, 0]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color={COLORS.bottle} roughness={0.4} />
      </mesh>
      <group ref={flag} position={[0.02, 1.2, 0]}>
        <mesh>
          <shapeGeometry args={[pennant]} />
          <meshStandardMaterial color={color} roughness={0.6} side={DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

function Pin({ color, stem, index }: { color: string; stem: number; index: number }) {
  const head = useRef<Group>(null);
  useFrame((state) => {
    if (head.current) {
      head.current.position.y = 0.18 + stem + Math.sin(state.clock.elapsedTime * 1.6 + index) * 0.03;
    }
  });

  return (
    <>
      <mesh position={[0, 0.18 + stem / 2, 0]}>
        <cylinderGeometry args={[0.022, 0.022, stem, 10]} />
        <meshStandardMaterial color={COLORS.bottle} roughness={0.4} />
      </mesh>
      <group ref={head} position={[0, 0.18 + stem, 0]}>
        <mesh>
          <sphereGeometry args={[0.15, 32, 32]} />
          <meshStandardMaterial color={color} roughness={0.35} />
        </mesh>
      </group>
    </>
  );
}

function Bullseye() {
  /* Upright target, tilted back to face the camera, with an arrow in it. */
  const rings: [number, string][] = [
    [0.52, COLORS.orange],
    [0.39, COLORS.egg],
    [0.26, COLORS.orange],
    [0.12, COLORS.bottle],
  ];
  return (
    <group position={[0, 0.98, 0]} rotation={[-0.42, 0, 0]}>
      {/* stand */}
      <mesh position={[0, -0.42, -0.06]}>
        <cylinderGeometry args={[0.03, 0.03, 0.72, 10]} />
        <meshStandardMaterial color={COLORS.bottle} roughness={0.4} />
      </mesh>
      {rings.map(([r, c], i) => (
        <mesh key={r} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.012 + i * 0.012]}>
          <cylinderGeometry args={[r, r, 0.05, 56]} />
          <meshStandardMaterial color={c} roughness={0.5} />
        </mesh>
      ))}
      {/* arrow */}
      <group position={[0.03, 0.03, 0.06]} rotation={[0.25, 0.55, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.36]}>
          <cylinderGeometry args={[0.016, 0.016, 0.72, 8]} />
          <meshStandardMaterial color={COLORS.bottle} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.66]}>
          <boxGeometry args={[0.003, 0.14, 0.14]} />
          <meshStandardMaterial color={COLORS.salad} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.66]}>
          <boxGeometry args={[0.14, 0.003, 0.14]} />
          <meshStandardMaterial color={COLORS.salad} roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

function Marker({ step, index, position, above, shown }: MarkerProps) {
  const ref = useRef<Group>(null);
  const threshold = JOURNEY_THRESHOLDS[index] ?? 0;

  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const k = (shown.current - threshold) / POP_WIDTH;
    const s = k <= 0 ? 0 : popEase(k);
    g.visible = s > 0.001;
    g.scale.setScalar(Math.max(s, 0.0001));
  });

  return (
    <group ref={ref} position={position} visible={false}>
      <Puck color={step.color} />
      {step.kind === 'start' && <StartFlag color={step.color} />}
      {step.kind === 'step' && <Pin color={step.color} stem={above ? STEM_HIGH : STEM_LOW} index={index} />}
      {step.kind === 'target' && <Bullseye />}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  World                                                              */
/* ------------------------------------------------------------------ */

interface WorldProps {
  progress: MutableRefObject<number>;
  labels: MutableRefObject<(HTMLLIElement | null)[]>;
}

function JourneyWorld({ progress, labels }: WorldProps) {
  const curve = useMemo(
    () => new CatmullRomCurve3(NODES.map((n) => new Vector3(...n.pos)), false, 'catmullrom', 0.55),
    [],
  );
  const nodeU = useMemo(() => nodeArcPositions(curve), [curve]);
  const road = useMemo(() => makeRibbon(curve, ROAD_WIDTH), [curve]);
  const roadEdge = useMemo(() => makeRibbon(curve, ROAD_WIDTH + 0.08), [curve]);
  const dashGeo = useMemo(() => {
    const g = new CapsuleGeometry(0.034, 0.15, 4, 8);
    g.rotateZ(Math.PI / 2); // lie along +X so yaw aligns it to the tangent
    return g;
  }, []);

  const dashes = useRef<InstancedMesh>(null);
  const shown = useRef(0);
  const flow = useRef(0);
  const flowDir = useRef(1);

  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  const tmp = useMemo(
    () => ({ obj: new Object3D(), p: new Vector3(), t: new Vector3(), a: new Vector3() }),
    [],
  );

  useEffect(() => () => {
    road.dispose();
    roadEdge.dispose();
    dashGeo.dispose();
  }, [road, roadEdge, dashGeo]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const target = progress.current;

    // Flow follows the scroll direction: forward when travelling on,
    // backward when scrolling back up the path.
    const dir = target < shown.current - 0.0015 ? -1 : 1;
    flowDir.current = MathUtils.damp(flowDir.current, dir, 4, dt);
    shown.current = MathUtils.damp(shown.current, target, 5, dt);
    flow.current = (((flow.current + dt * DASH_SPEED * flowDir.current) % 1) + 1) % 1;

    const head = headFromProgress(shown.current, nodeU);

    /* --- Broken chain line ---------------------------------------- */
    const mesh = dashes.current;
    if (mesh) {
      const { obj, p, t } = tmp;
      for (let k = 0; k < DASH_COUNT; k++) {
        const u = (k + flow.current) / DASH_COUNT;
        // Dashes grow in just behind the head, so the line "draws" smoothly.
        const s = MathUtils.clamp((head - u) * DASH_COUNT, 0, 1);
        curve.getPointAt(u, p);
        curve.getTangentAt(u, t);
        obj.position.set(p.x, 0.014, p.z);
        obj.rotation.set(0, Math.atan2(-t.z, t.x), 0);
        obj.scale.set(s, s, s);
        obj.updateMatrix();
        mesh.setMatrixAt(k, obj.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }

    /* --- HTML labels, projected onto their anchors ----------------- */
    const { a } = tmp;
    const half = LABEL_W / 2 + 8;
    for (let i = 0; i < NODES.length; i++) {
      const el = labels.current[i];
      const node = NODES[i];
      const step = JOURNEY[i];
      if (!el || !node || !step) continue;

      a.set(node.pos[0], anchorY(step, node.above), node.pos[2]).project(camera);
      const x = MathUtils.clamp(((a.x + 1) / 2) * size.width, half, size.width - half);
      const y = ((1 - a.y) / 2) * size.height;

      const k = MathUtils.clamp((shown.current - (JOURNEY_THRESHOLDS[i] ?? 0) - 0.012) / POP_WIDTH, 0, 1);
      const lift = (1 - k) * (node.above ? 12 : -12);
      el.style.opacity = k.toFixed(3);
      el.style.visibility = k > 0 ? 'visible' : 'hidden';
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${(y + lift).toFixed(1)}px, 0) translate(-50%, ${
        node.above ? 'calc(-100% - 14px)' : '22px'
      })`;
    }
  });

  return (
    <>
      {/* Soft ground shadow so the scene has a visible footprint on the white bg */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0.3]}>
        <planeGeometry args={[14, 5.5]} />
        <meshBasicMaterial color="#e8d8c6" transparent opacity={0.45} depthWrite={false} />
      </mesh>

      {/* Road */}
      <mesh geometry={roadEdge} position={[0, 0.001, 0]}>
        <meshStandardMaterial color={COLORS.roadEdge} roughness={0.9} side={DoubleSide} />
      </mesh>
      <mesh geometry={road} position={[0, 0.005, 0]}>
        <meshStandardMaterial color={COLORS.road} roughness={0.85} side={DoubleSide} />
      </mesh>

      {/* Chain line */}
      <instancedMesh ref={dashes} args={[dashGeo, undefined, DASH_COUNT]} frustumCulled={false}>
        <meshBasicMaterial color={COLORS.dash} />
      </instancedMesh>

      {NODES.map((n, i) => {
        const step = JOURNEY[i];
        if (!step) return null;
        return <Marker key={step.id} step={step} index={i} position={n.pos} above={n.above} shown={shown} />;
      })}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Scene                                                              */
/* ------------------------------------------------------------------ */

interface SceneProps {
  /** 0 → 1 scroll progress through the section, written by the parent's ScrollTrigger. */
  progress: MutableRefObject<number>;
}

export default function JourneyScene({ progress }: SceneProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const labels = useRef<(HTMLLIElement | null)[]>([]);
  const [inView, setInView] = useState(false);

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
    <div ref={wrapRef} className="relative h-full w-full">
      <Canvas
        aria-hidden
        dpr={[1, 1.75]}
        frameloop={inView ? 'always' : 'never'}
        camera={{ position: [0, 8.5, 9.4], fov: FOV }}
        gl={{ antialias: true, alpha: true }}
      >
        <FitCamera />
        <ambientLight intensity={1.5} />
        <directionalLight position={[4, 9, 6]} intensity={2.2} color="#fff8ef" />
        <directionalLight position={[-5, 3, -4]} intensity={0.6} color="#e3f1d2" />
        <JourneyWorld progress={progress} labels={labels} />
      </Canvas>

      {/* Real DOM text: crisp at any DPR and readable by screen readers. */}
      <ol aria-label="Your learning journey" className="pointer-events-none absolute inset-0 m-0 list-none p-0">
        {JOURNEY.map((step, i) => (
          <li
            key={step.id}
            ref={(el) => {
              labels.current[i] = el;
            }}
            className="absolute left-0 top-0 will-change-transform"
            style={{ width: LABEL_W, opacity: 0, visibility: 'hidden' }}
          >
            <JourneyCard step={step} />
          </li>
        ))}
      </ol>
    </div>
  );
}
