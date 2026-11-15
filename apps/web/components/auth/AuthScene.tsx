'use client';

/**
 * CourseCity — "Course Dial" auth scene.
 *
 * Creative thesis: choosing what to learn should feel tactile. A machined
 * ceramic dial (focal point) sits in a ring of eight course segments. A fixed
 * orange selection bracket marks the active segment and a single leader line
 * connects it to the matching course card on an arc (secondary element).
 *
 * Interaction: drag the dial (inertia + detent spring), click a segment or a
 * card, or use the accessible DOM buttons. While idle and un-hovered the dial
 * steps forward slowly, "browsing" the catalogue. Reduced-motion users get a
 * static composition with instant selection changes.
 *
 * Performance notes: all geometry is built once (no per-frame allocation),
 * the leader line is static (the selected slot never moves — the arc scrolls
 * under it), lighting comes from a procedurally-baked Lightformer environment
 * rendered a single time, and text is SDF (troika) with local font files.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls, RoundedBox, Text } from '@react-three/drei';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import {
  CatmullRomCurve3,
  Color,
  ExtrudeGeometry,
  LatheGeometry,
  MathUtils,
  Object3D,
  Path,
  Shape,
  TubeGeometry,
  Vector2,
  Vector3,
  type Camera,
  type Group,
  type InstancedMesh,
  type Mesh,
  type MeshStandardMaterial,
} from 'three';

/* ────────────────────────────────────────────────────────────────────────── */
/*  Content & tokens                                                         */
/* ────────────────────────────────────────────────────────────────────────── */

const FONT_MEDIUM = '/fonts/jakarta-500.woff';
const FONT_BOLD = '/fonts/jakarta-700.woff';
const FONT_HEAVY = '/fonts/jakarta-800.woff';

const COURSES = [
  { title: 'Design Systems', meta: '18 lessons · Intermediate' },
  { title: 'Creative Coding', meta: '24 lessons · Beginner' },
  { title: 'Typography', meta: '12 lessons · Beginner' },
  { title: 'Data Visualization', meta: '16 lessons · Intermediate' },
  { title: 'UX Research', meta: '14 lessons · Beginner' },
  { title: 'Product Strategy', meta: '10 lessons · Advanced' },
  { title: 'Frontend Development', meta: '32 lessons · Intermediate' },
  { title: 'Leadership', meta: '9 lessons · Advanced' },
] as const;

const N = COURSES.length;
const SEG = (Math.PI * 2) / N;

const C = {
  orange: '#FF6400',
  bottle: '#003223',
  ink: '#55645E',
  egg: '#F5EBE1',
  ceramic: '#F6F2EC',
  knurl: '#E4DCD1',
  paper: '#E7DED2',
  platter: '#0F392C',
  tick: '#2E3A36',
} as const;

/* ── Exploded-view tokens ─────────────────────────────────────────────── */

const PILL_COLORS = [
  '#FF6400', '#8CC850', '#1F6FD6', '#7C3AED',
  '#EC4899', '#0D9488', '#D97706', '#4F46E5',
] as const;

const EXP_PILL_W = 1.5;
const EXP_PILL_H = 0.38;
const EXP_PILL_D = 0.12;

/* Globe distribution — Fibonacci sphere for natural 3D spacing */
const EXP_SPHERE_R = 3.2;
const EXP_POSITIONS = COURSES.map((_, i) => {
  const y = 1 - (i / (N - 1)) * 2;           // -1 → 1
  const r = Math.sqrt(1 - y * y);              // horizontal radius at this latitude
  const phi = i * Math.PI * (3 - Math.sqrt(5)); // golden angle
  return new Vector3(
    Math.cos(phi) * r * EXP_SPHERE_R,
    y * EXP_SPHERE_R * 0.8,
    Math.sin(phi) * r * EXP_SPHERE_R,
  );
});

/* Hex background grid — lighter, reduced */
const HEX_DATA: { x: number; y: number; z: number; s: number; green: boolean; ry: number }[] = [];
(() => {
  const sp = 0.78;
  for (let row = -4; row <= 4; row++) {
    for (let col = -5; col <= 5; col++) {
      const off = row % 2 === 0 ? 0 : sp * 0.5;
      const x = col * sp + off;
      const y = row * sp * 0.866;
      const d = Math.sqrt(x * x + y * y);
      if (d < 2.8 || d > 5.0) continue;
      const h = Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
      HEX_DATA.push({ x, y, z: -2.8 + h * 0.3, s: 0.26 + h * 0.05, green: h < 0.25, ry: h * Math.PI });
    }
  }
})();

/* Floating layered tiles (green + white like image reference) */
const TILE_DATA: { pos: [number, number, number]; rot: [number, number, number]; sc: number }[] = [
  { pos: [-5.2, 3.2, -1.5], rot: [0.1, 0.2, -0.15], sc: 1.1 },
  { pos: [5.5, -2.2, -2], rot: [-0.1, -0.15, 0.1], sc: 0.85 },
  { pos: [-4.2, -3.5, -1.2], rot: [0.05, 0.1, 0.2], sc: 0.7 },
  { pos: [4.4, 4, -2.5], rot: [-0.15, 0.2, -0.1], sc: 0.95 },
  { pos: [-6, 0.5, -2.8], rot: [0.1, -0.1, 0.05], sc: 0.8 },
  { pos: [6.2, 1.8, -2.2], rot: [0.05, 0.15, -0.05], sc: 1.0 },
];

const COL_EGG = new Color(C.egg);
const COL_WHITE = new Color('#FFFFFF');

/* Dial geometry (dial-space units) */
const RING_IN = 0.6;
const RING_OUT = 1.02;
const RING_DEPTH = 0.06;
const RING_BEVEL = 0.014;
const RING_TOP = RING_DEPTH + RING_BEVEL;
const PLATTER_R = 1.32;

/* Course arc */
const ARC_R = 2.42;
const ARC_STEP = 0.27;
const THETA0 = -0.1; // selected slot sits just under the horizon → elbowed leader line
const CARD_W = 1.72;
const CARD_H = 0.46;
const CARD_D = 0.07;

/* Composition framing */
const COMP_CX = 0.975; // dial-space x of the composition's visual centre
const COMP_W = 4.75;
const COMP_H = 4.0;
const REST_TILT_Y = 0.2; // dial (focal) slightly closer, arc recedes
const REST_TILT_X = -0.05;

/* Detent spring (slightly under-damped → a small, believable overshoot) */
const STIFFNESS = 120;
const DAMPING = 16;

/* ────────────────────────────────────────────────────────────────────────── */
/*  Helpers                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const mod = (x: number, n: number) => ((x % n) + n) % n;
/** Wrap a continuous index offset into [-N/2, N/2). */
const wrap = (x: number) => mod(x + N / 2, N) - N / 2;
const nowSec = () => performance.now() / 1000;

function annularSector(rIn: number, rOut: number, half: number) {
  const s = new Shape();
  s.absarc(0, 0, rOut, -half, half, false);
  s.absarc(0, 0, rIn, half, -half, true);
  s.closePath();
  return s;
}

const tmpV = new Vector3();
/** Screen-space angle (CCW, radians) of a pointer around an object's projected centre. */
function screenAngle(obj: Object3D, camera: Camera, canvas: HTMLCanvasElement, x: number, y: number) {
  obj.getWorldPosition(tmpV).project(camera);
  const r = canvas.getBoundingClientRect();
  const cx = r.left + ((tmpV.x + 1) / 2) * r.width;
  const cy = r.top + ((1 - tmpV.y) / 2) * r.height;
  return Math.atan2(-(y - cy), x - cx);
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Shared mutable state (refs, never React state, inside the frame loop)    */
/* ────────────────────────────────────────────────────────────────────────── */

interface Physics {
  phi: number; // dial angle — selection = phi / SEG
  v: number;
  target: number;
  dragging: boolean;
  lastAngle: number;
  lastMoveMs: number;
  lastInteract: number; // seconds (performance clock)
  hover: number; // hovered card index or -1
  introStart: number;
  introT: number;
}

interface PointerState {
  x: number;
  y: number;
  inside: boolean;
}

interface DialApi {
  step: (dir: number) => void;
  goTo: (index: number) => void;
}

type Ref<T> = MutableRefObject<T>;
type TroikaText = Mesh & { fillOpacity: number };

/* ────────────────────────────────────────────────────────────────────────── */
/*  Driver — physics, intro clock, idle browsing, selection notify           */
/*  Rendered first so every other frame callback reads this frame's values.  */
/* ────────────────────────────────────────────────────────────────────────── */

function DialDriver({
  phys,
  pointer,
  reduced,
  onSelect,
}: {
  phys: Ref<Physics>;
  pointer: Ref<PointerState>;
  reduced: boolean;
  onSelect: (i: number) => void;
}) {
  const lastIdx = useRef(-1);

  useFrame((state, delta) => {
    const p = phys.current;
    const dt = Math.min(delta, 1 / 30);

    if (p.introStart < 0) p.introStart = state.clock.elapsedTime;
    p.introT = reduced ? 99 : state.clock.elapsedTime - p.introStart;

    // Idle browsing: only after the entrance, never under the cursor or while dragging.
    const t = nowSec();
    if (!reduced && !p.dragging && !pointer.current.inside && p.introT > 2.4 && t - p.lastInteract > 4.2) {
      p.target += SEG;
      p.lastInteract = t;
    }

    if (!p.dragging) {
      if (reduced) {
        p.phi = p.target;
        p.v = 0;
      } else {
        const h = dt / 2;
        for (let i = 0; i < 2; i++) {
          const a = -STIFFNESS * (p.phi - p.target) - DAMPING * p.v;
          p.v += a * h;
          p.phi += p.v * h;
        }
      }
    }

    const idx = mod(Math.round(p.phi / SEG), N);
    if (idx !== lastIdx.current) {
      lastIdx.current = idx;
      onSelect(idx);
    }
  });

  return null;
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  The Dial — focal object                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

function Dial({ phys, api, selected, reduced }: { phys: Ref<Physics>; api: Ref<DialApi | null>; selected: number; reduced: boolean }) {
  const assembly = useRef<Group>(null);
  const rotor = useRef<Group>(null);
  const knurl = useRef<InstancedMesh>(null);
  const { camera, gl } = useThree();

  /* Geometry — built once, disposed on unmount */
  const knobGeo = useMemo(() => {
    const profile = [
      new Vector2(0.47, 0),
      new Vector2(0.482, 0.02),
      new Vector2(0.482, 0.19),
      new Vector2(0.468, 0.224),
      new Vector2(0.435, 0.244),
      new Vector2(0.3, 0.257),
      new Vector2(0.0001, 0.262),
    ];
    const g = new LatheGeometry(profile, 96);
    g.rotateX(Math.PI / 2); // lathe axis Y → dial axis Z (towards camera)
    return g;
  }, []);

  const segmentGeo = useMemo(() => {
    const inset = RING_BEVEL;
    const g = new ExtrudeGeometry(annularSector(RING_IN + inset, RING_OUT - inset, SEG / 2 - 0.03 - inset / 0.8), {
      depth: RING_DEPTH,
      bevelEnabled: true,
      bevelThickness: RING_BEVEL,
      bevelSize: inset,
      bevelSegments: 3,
      curveSegments: 28,
    });
    return g;
  }, []);

  const bracketGeo = useMemo(() => {
    const half = SEG / 2;
    const outer = annularSector(RING_IN - 0.035, RING_OUT + 0.035, half);
    const hole = new Path();
    hole.absarc(0, 0, RING_OUT + 0.035 - 0.03, -half + 0.045, half - 0.045, false);
    hole.absarc(0, 0, RING_IN - 0.035 + 0.03, half - 0.045, -half + 0.045, true);
    hole.closePath();
    outer.holes.push(hole);
    return new ExtrudeGeometry(outer, {
      depth: 0.016,
      bevelEnabled: true,
      bevelThickness: 0.006,
      bevelSize: 0.006,
      bevelSegments: 2,
      curveSegments: 28,
    });
  }, []);

  useEffect(
    () => () => {
      knobGeo.dispose();
      segmentGeo.dispose();
      bracketGeo.dispose();
    },
    [knobGeo, segmentGeo, bracketGeo],
  );

  /* Knurled rim — one draw call */
  useLayoutEffect(() => {
    const m = knurl.current;
    if (!m) return;
    const d = new Object3D();
    const count = m.count;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      d.position.set(Math.cos(a) * 0.486, Math.sin(a) * 0.486, 0.105);
      d.rotation.set(0, 0, a);
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, []);

  /* Drag-to-turn with inertia → detent */
  useEffect(() => {
    const canvas = gl.domElement;
    const move = (ev: PointerEvent) => {
      const p = phys.current;
      if (!p.dragging || !assembly.current) return;
      const a = screenAngle(assembly.current, camera, canvas, ev.clientX, ev.clientY);
      let da = a - p.lastAngle;
      if (da > Math.PI) da -= Math.PI * 2;
      else if (da < -Math.PI) da += Math.PI * 2;
      p.lastAngle = a;
      p.phi += da;
      p.target = p.phi;
      const ms = performance.now();
      const dts = Math.max(1, ms - p.lastMoveMs) / 1000;
      p.v = p.v * 0.6 + (da / dts) * 0.4;
      p.lastMoveMs = ms;
      p.lastInteract = ms / 1000;
    };
    const up = () => {
      const p = phys.current;
      if (!p.dragging) return;
      p.dragging = false;
      if (performance.now() - p.lastMoveMs > 90) p.v = 0; // held still before letting go
      const projected = p.phi + MathUtils.clamp(p.v, -14, 14) * 0.14;
      p.target = Math.round(projected / SEG) * SEG;
      canvas.style.cursor = '';
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [camera, gl, phys]);

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    if (!assembly.current) return;
    e.stopPropagation();
    const p = phys.current;
    p.dragging = true;
    p.v = 0;
    p.lastAngle = screenAngle(assembly.current, camera, gl.domElement, e.nativeEvent.clientX, e.nativeEvent.clientY);
    p.lastMoveMs = performance.now();
    p.lastInteract = nowSec();
    gl.domElement.style.cursor = 'grabbing';
  };

  useFrame(() => {
    const p = phys.current;
    if (rotor.current) rotor.current.rotation.z = p.phi;
    if (assembly.current) {
      const rise = reduced ? 1 : easeOutCubic(clamp01(p.introT / 0.9));
      assembly.current.position.z = (1 - rise) * -0.6;
    }
  });

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <group
      ref={assembly}
      onPointerDown={onDown}
      onPointerOver={() => {
        if (!phys.current.dragging) gl.domElement.style.cursor = 'grab';
      }}
      onPointerOut={() => {
        if (!phys.current.dragging) gl.domElement.style.cursor = '';
      }}
    >
      {/* Platter — the dark base the dial is mounted on */}
      <mesh position={[0, 0, -0.04]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <cylinderGeometry args={[PLATTER_R, PLATTER_R, 0.04, 96]} />
        <meshStandardMaterial color={C.platter} roughness={0.92} metalness={0} />
      </mesh>

      {/* Rotor: knob + course ring turn together */}
      <group ref={rotor}>
        <mesh geometry={knobGeo} castShadow receiveShadow>
          <meshPhysicalMaterial color={C.ceramic} roughness={0.32} metalness={0} clearcoat={0.7} clearcoatRoughness={0.22} />
        </mesh>

        <instancedMesh ref={knurl} args={[undefined, undefined, 72]} castShadow>
          <boxGeometry args={[0.014, 0.016, 0.15]} />
          <meshStandardMaterial color={C.knurl} roughness={0.55} metalness={0} />
        </instancedMesh>

        {/* Rotation tick — the only marking that turns, so motion stays legible */}
        <mesh position={[0, 0.385, 0.246]}>
          <sphereGeometry args={[0.02, 16, 16]} />
          <meshStandardMaterial color={C.tick} roughness={0.5} />
        </mesh>

        {COURSES.map((_, i) => {
          const a = -i * SEG;
          return (
            <group key={i} rotation={[0, 0, a]}>
              <mesh
                geometry={segmentGeo}
                castShadow
                receiveShadow
                onClick={(e) => {
                  if (e.delta > 5) return;
                  e.stopPropagation();
                  api.current?.goTo(i);
                }}
              >
                <meshStandardMaterial color={C.paper} roughness={0.82} metalness={0} />
              </mesh>
              <Text
                font={FONT_BOLD}
                fontSize={0.075}
                position={[(RING_IN + RING_OUT) / 2, 0, RING_TOP + 0.002]}
                color={C.bottle}
                fillOpacity={i === selected ? 1 : 0.42}
                anchorX="center"
                anchorY="middle"
              >
                {pad(i + 1)}
              </Text>
            </group>
          );
        })}
      </group>

      {/* Fixed selection bracket — the brand accent, used once */}
      <mesh geometry={bracketGeo} position={[0, 0, RING_TOP + 0.004]} castShadow>
        <meshStandardMaterial color={C.orange} roughness={0.42} metalness={0} />
      </mesh>

      {/* Fixed readout on the knob face */}
      <group position={[0, 0, 0.268]}>
        <Text font={FONT_BOLD} fontSize={0.04} letterSpacing={0.18} position={[0, 0.125, 0]} color={C.ink} anchorX="center" anchorY="middle">
          COURSE
        </Text>
        <Text font={FONT_HEAVY} fontSize={0.19} letterSpacing={-0.03} position={[0, -0.005, 0]} color={C.bottle} anchorX="center" anchorY="middle">
          {pad(selected + 1)}
        </Text>
        <Text font={FONT_MEDIUM} fontSize={0.044} position={[0, -0.135, 0]} color={C.ink} anchorX="center" anchorY="middle">
          {`of ${pad(N)}`}
        </Text>
      </group>
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Leader line — static; it draws in once during the entrance               */
/* ────────────────────────────────────────────────────────────────────────── */

function LeaderLine({ phys, reduced }: { phys: Ref<Physics>; reduced: boolean }) {
  const startCap = useRef<Mesh>(null);
  const endCap = useRef<Mesh>(null);

  const { geo, end, perStep } = useMemo(() => {
    const reach = ARC_R - CARD_W / 2 - 0.03;
    const endPt = new Vector3(Math.cos(THETA0) * reach, Math.sin(THETA0) * reach, 0.1);
    const curve = new CatmullRomCurve3(
      [
        new Vector3(RING_OUT + 0.045, 0, RING_TOP + 0.012),
        new Vector3(1.2, 0, RING_TOP + 0.016),
        new Vector3(1.33, -0.04, 0.092),
        new Vector3(1.44, -0.13, 0.097),
        endPt,
      ],
      false,
      'centripetal',
    );
    const radial = 8;
    const g = new TubeGeometry(curve, 64, 0.0085, radial, false);
    return { geo: g, end: endPt, perStep: radial * 6 };
  }, []);

  useEffect(() => () => geo.dispose(), [geo]);

  useFrame(() => {
    const t = phys.current.introT;
    const prog = reduced ? 1 : easeInOut(clamp01((t - 1.05) / 0.55));
    const total = geo.index ? geo.index.count : 0;
    geo.setDrawRange(0, Math.floor((total / perStep) * prog) * perStep);
    if (startCap.current) startCap.current.scale.setScalar(reduced ? 1 : clamp01((t - 1.0) / 0.12));
    if (endCap.current) endCap.current.scale.setScalar(prog > 0.985 ? 1 : 0.0001);
  });

  return (
    <group>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial color={C.orange} roughness={0.5} metalness={0} />
      </mesh>
      <mesh ref={startCap} position={[RING_OUT + 0.045, 0, RING_TOP + 0.012]}>
        <sphereGeometry args={[0.022, 16, 16]} />
        <meshStandardMaterial color={C.orange} roughness={0.45} />
      </mesh>
      <mesh ref={endCap} position={end}>
        <sphereGeometry args={[0.026, 16, 16]} />
        <meshStandardMaterial color={C.orange} roughness={0.45} />
      </mesh>
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Course card on the arc — secondary elements                              */
/* ────────────────────────────────────────────────────────────────────────── */

function CourseCard({ index, phys, api, reduced }: { index: number; phys: Ref<Physics>; api: Ref<DialApi | null>; reduced: boolean }) {
  const group = useRef<Group>(null);
  const bodyMat = useRef<MeshStandardMaterial>(null);
  const accent = useRef<Mesh>(null);
  const title = useRef<TroikaText>(null);
  const meta = useRef<TroikaText>(null);
  const hoverAmt = useRef(0);
  const { gl } = useThree();
  const course = COURSES[index]!;

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const p = phys.current;
    const d = wrap(index - p.phi / SEG);
    const ad = Math.abs(d);

    const appear = reduced ? 1 : easeOutCubic(clamp01((p.introT - 0.55 - Math.min(ad, 4) * 0.07) / 0.6));
    const theta = THETA0 - d * ARC_STEP;
    const r = ARC_R - (1 - appear) * 0.55;
    const k = Math.max(0, 1 - ad); // closeness to the selected slot

    hoverAmt.current = MathUtils.damp(hoverAmt.current, p.hover === index ? 1 : 0, 12, delta);

    g.position.set(Math.cos(theta) * r, Math.sin(theta) * r, k * 0.1 + hoverAmt.current * 0.04);
    g.rotation.z = theta;
    g.scale.setScalar(1 - Math.min(ad, 3) * 0.045);

    const o = clamp01(1 - Math.max(0, ad - 0.5) * 0.32) * appear;
    g.visible = o > 0.01;

    if (bodyMat.current) {
      bodyMat.current.opacity = o;
      bodyMat.current.color.lerpColors(COL_EGG, COL_WHITE, k);
    }
    if (title.current) title.current.fillOpacity = o;
    if (meta.current) meta.current.fillOpacity = o * 0.9;
    if (accent.current) {
      accent.current.visible = k > 0.02 && o > 0.01;
      accent.current.scale.y = Math.max(0.001, k);
    }
  });

  return (
    <group ref={group}>
      <RoundedBox
        args={[CARD_W, CARD_H, CARD_D]}
        radius={0.07}
        smoothness={4}
        castShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          phys.current.hover = index;
          gl.domElement.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          if (phys.current.hover === index) phys.current.hover = -1;
          gl.domElement.style.cursor = '';
        }}
        onClick={(e) => {
          if (e.delta > 5) return;
          e.stopPropagation();
          api.current?.goTo(index);
        }}
      >
        <meshStandardMaterial ref={bodyMat} color={C.egg} roughness={0.78} metalness={0} transparent />
      </RoundedBox>

      <mesh ref={accent} position={[-CARD_W / 2 + 0.075, 0, CARD_D / 2 + 0.004]}>
        <boxGeometry args={[0.026, 0.25, 0.01]} />
        <meshStandardMaterial color={C.orange} roughness={0.45} />
      </mesh>

      <Text
        ref={title}
        font={FONT_BOLD}
        fontSize={0.098}
        letterSpacing={-0.015}
        maxWidth={CARD_W - 0.3}
        position={[-CARD_W / 2 + 0.17, 0.055, CARD_D / 2 + 0.002]}
        color={C.bottle}
        anchorX="left"
        anchorY="middle"
      >
        {course.title}
      </Text>
      <Text
        ref={meta}
        font={FONT_MEDIUM}
        fontSize={0.062}
        position={[-CARD_W / 2 + 0.17, -0.085, CARD_D / 2 + 0.002]}
        color={C.ink}
        anchorX="left"
        anchorY="middle"
      >
        {course.meta}
      </Text>
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Scene                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

function Scene({
  phys,
  pointer,
  api,
  selected,
  onSelect,
  reduced,
}: {
  phys: Ref<Physics>;
  pointer: Ref<PointerState>;
  api: Ref<DialApi | null>;
  selected: number;
  onSelect: (i: number) => void;
  reduced: boolean;
}) {
  const rig = useRef<Group>(null);
  const viewport = useThree((s) => s.viewport);

  // Imperative API used by clicks in the scene and by the DOM controls.
  useEffect(() => {
    api.current = {
      step: (dir) => {
        const p = phys.current;
        p.target = Math.round(p.target / SEG + dir) * SEG;
        p.lastInteract = nowSec();
      },
      goTo: (i) => {
        const p = phys.current;
        const cur = Math.round(p.target / SEG);
        p.target = (cur + wrap(i - mod(cur, N))) * SEG;
        p.lastInteract = nowSec();
      },
    };
    return () => {
      api.current = null;
    };
  }, [api, phys]);

  // Damped, bounded pointer tilt that settles back to rest on leave.
  useFrame((_, delta) => {
    const g = rig.current;
    if (!g) return;
    const px = reduced ? 0 : pointer.current.x;
    const py = reduced ? 0 : pointer.current.y;
    g.rotation.y = MathUtils.damp(g.rotation.y, REST_TILT_Y + px * 0.1, 3.5, delta);
    g.rotation.x = MathUtils.damp(g.rotation.x, REST_TILT_X - py * 0.07, 3.5, delta);
  });

  // Responsive framing: fit the composition to the panel, not the other way round.
  const scale = Math.min(1.15, (viewport.width * 0.9) / COMP_W, (viewport.height * 0.6) / COMP_H);

  return (
    <>
      <DialDriver phys={phys} pointer={pointer} reduced={reduced} onSelect={onSelect} />

      {/* Studio lighting baked once into an environment map — no network HDR */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.4} color="#FFF4E6" position={[-4, 5, 6]} scale={[8, 5, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.5} color={C.orange} position={[7, 1.5, 2]} scale={[3, 7, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.55} color="#DCEFE7" position={[-7, -3, 2]} scale={[5, 5, 1]} target={[0, 0, 0]} />
        <Lightformer form="circle" intensity={0.7} color="#FFFFFF" position={[0, 0, 10]} scale={4} target={[0, 0, 0]} />
      </Environment>

      <ambientLight intensity={0.12} />
      <directionalLight
        position={[-3.5, 5, 8]}
        intensity={1.5}
        color="#FFF3E6"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-4.5}
        shadow-camera-right={4.5}
        shadow-camera-top={4.5}
        shadow-camera-bottom={-4.5}
        shadow-camera-near={1}
        shadow-camera-far={20}
      />

      <group ref={rig} position={[0, -viewport.height * 0.05, 0]} scale={scale} rotation={[REST_TILT_X, REST_TILT_Y, 0]}>
        <group position={[-COMP_CX, 0.12, 0]}>
          <Dial phys={phys} api={api} selected={selected} reduced={reduced} />
          <LeaderLine phys={phys} reduced={reduced} />
          {COURSES.map((c, i) => (
            <CourseCard key={c.title} index={i} phys={phys} api={api} reduced={reduced} />
          ))}

          {/* Invisible catcher so cards cast soft shadows onto "the page" */}
          <mesh position={[COMP_CX, 0, -0.32]} receiveShadow>
            <planeGeometry args={[14, 10]} />
            <shadowMaterial transparent opacity={0.26} />
          </mesh>
        </group>
      </group>
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Exploded view — hub-and-spoke layout with 360° OrbitControls             */
/* ────────────────────────────────────────────────────────────────────────── */

/** Resets the camera when returning from exploded → dial view. */
function CameraReset() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 0, 9.5);
    camera.lookAt(0, 0, 0);
    if ('fov' in camera) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c = camera as any;
      c.fov = 30;
      c.updateProjectionMatrix();
    }
  }, [camera]);
  return null;
}

/** Polished exploded hub — glowing core, orbital rings, readout card. */
function ExplodedHub({ selected }: { selected: number }) {
  const hub = useRef<Group>(null);
  const innerRing = useRef<Group>(null);
  const outerRing = useRef<Group>(null);
  const glow = useRef<Mesh>(null);
  const pad2 = (n: number) => String(n).padStart(2, '0');

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (innerRing.current) innerRing.current.rotation.z += delta * 0.15;
    if (outerRing.current) outerRing.current.rotation.z -= delta * 0.08;
    if (glow.current) glow.current.scale.setScalar(0.88 + Math.sin(t * 1.5) * 0.12);
    // Inverse-zoom
    if (hub.current) {
      const dist = state.camera.position.length();
      hub.current.scale.setScalar(dist / 8);
    }
  });

  return (
    <group ref={hub}>
      {/* Glowing core sphere */}
      <mesh castShadow>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshPhysicalMaterial
          color="#FFF8F0"
          roughness={0.12}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.08}
          emissive={C.orange}
          emissiveIntensity={0.35}
        />
      </mesh>

      {/* Pulsing glow shell */}
      <mesh ref={glow}>
        <sphereGeometry args={[0.44, 24, 24]} />
        <meshStandardMaterial color={C.orange} transparent opacity={0.06} side={2} />
      </mesh>

      {/* Inner orbital ring — tilted, with course-colour dots */}
      <group ref={innerRing} rotation={[Math.PI / 6, 0, 0]}>
        <mesh>
          <torusGeometry args={[0.65, 0.022, 16, 64]} />
          <meshStandardMaterial color={C.orange} roughness={0.35} metalness={0.1} />
        </mesh>
        {COURSES.map((_, i) => {
          const a = (i / N) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.65, Math.sin(a) * 0.65, 0]}>
              <sphereGeometry args={[0.032, 8, 8]} />
              <meshStandardMaterial color={PILL_COLORS[i]} roughness={0.4} emissive={PILL_COLORS[i]} emissiveIntensity={0.25} />
            </mesh>
          );
        })}
      </group>

      {/* Outer orbital ring — counter-tilt */}
      <group ref={outerRing} rotation={[-Math.PI / 5, Math.PI / 4, 0]}>
        <mesh>
          <torusGeometry args={[0.88, 0.014, 12, 64]} />
          <meshStandardMaterial color={C.paper} roughness={0.55} transparent opacity={0.55} />
        </mesh>
      </group>

      {/* Equatorial ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.98, 0.008, 8, 64]} />
        <meshStandardMaterial color={C.egg} roughness={0.7} transparent opacity={0.35} />
      </mesh>

      {/* Readout card — floating below hub */}
      <group position={[0, -1.4, 0.1]}>
        <RoundedBox args={[1.3, 0.52, 0.04]} radius={0.07} smoothness={4} castShadow>
          <meshStandardMaterial color="#FFFFFF" roughness={0.78} transparent opacity={0.92} />
        </RoundedBox>
        {/* Accent bar */}
        <mesh position={[-0.6, 0, 0.025]}>
          <boxGeometry args={[0.03, 0.32, 0.01]} />
          <meshStandardMaterial color={C.orange} roughness={0.45} />
        </mesh>
        <Text font={FONT_BOLD} fontSize={0.055} letterSpacing={0.12} position={[0.05, 0.1, 0.025]} color={C.ink} anchorX="center" anchorY="middle">
          COURSE
        </Text>
        <Text font={FONT_HEAVY} fontSize={0.17} letterSpacing={-0.02} position={[-0.08, -0.07, 0.025]} color={C.bottle} anchorX="center" anchorY="middle">
          {pad2(selected + 1)}
        </Text>
        <Text font={FONT_MEDIUM} fontSize={0.055} position={[0.25, -0.07, 0.025]} color={C.ink} anchorX="center" anchorY="middle">
          {`/ ${pad2(N)}`}
        </Text>
      </group>
    </group>
  );
}

/** Connection tube from center hub to a pill — built once per pill. */
function BeamConnector({ index }: { index: number }) {
  const pos = EXP_POSITIONS[index]!;
  const color = PILL_COLORS[index]!;

  const geo = useMemo(() => {
    const mid1 = new Vector3(pos.x * 0.3, pos.y * 0.3, 0.15);
    const mid2 = new Vector3(pos.x * 0.7, pos.y * 0.7, 0.08);
    const curve = new CatmullRomCurve3(
      [new Vector3(0, 0, 0.1), mid1, mid2, pos.clone()],
      false,
      'centripetal',
    );
    return new TubeGeometry(curve, 48, 0.024, 8, false);
  }, [pos]);

  useEffect(() => () => geo.dispose(), [geo]);

  return (
    <mesh geometry={geo} castShadow>
      <meshStandardMaterial color={color} roughness={0.45} transparent opacity={0.8} />
    </mesh>
  );
}

/** A single coloured course pill in the exploded view — billboards toward camera. */
function ExplodedPill({
  index,
  selected,
  onSelect,
}: {
  index: number;
  selected: number;
  onSelect: (i: number) => void;
}) {
  const pos = EXP_POSITIONS[index]!;
  const color = PILL_COLORS[index]!;
  const course = COURSES[index]!;
  const isSelected = index === selected;
  const { gl } = useThree();
  const group = useRef<Group>(null);

  // Billboard: face the camera each frame so text is always readable
  useFrame((state) => {
    if (group.current) group.current.lookAt(state.camera.position);
  });

  return (
    <group ref={group} position={pos}>
      {/* Coloured body */}
      <RoundedBox
        args={[EXP_PILL_W, EXP_PILL_H, EXP_PILL_D]}
        radius={0.08}
        smoothness={4}
        castShadow
        onPointerOver={(e) => { e.stopPropagation(); gl.domElement.style.cursor = 'pointer'; }}
        onPointerOut={() => { gl.domElement.style.cursor = ''; }}
        onClick={(e) => { e.stopPropagation(); onSelect(index); }}
      >
        <meshStandardMaterial
          color={color}
          roughness={0.55}
          emissive={color}
          emissiveIntensity={isSelected ? 0.15 : 0}
        />
      </RoundedBox>

      {/* White face overlay for legibility */}
      <RoundedBox
        args={[EXP_PILL_W - 0.06, EXP_PILL_H - 0.06, 0.004]}
        radius={0.06}
        smoothness={4}
        position={[0, 0, EXP_PILL_D / 2 + 0.003]}
      >
        <meshStandardMaterial color="#FFFFFF" roughness={0.8} transparent opacity={isSelected ? 0.92 : 0.72} />
      </RoundedBox>

      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <torusGeometry args={[0.95, 0.012, 8, 32]} />
          <meshStandardMaterial color={C.orange} emissive={C.orange} emissiveIntensity={0.5} roughness={0.4} />
        </mesh>
      )}

      {/* Text */}
      <Text
        font={FONT_BOLD}
        fontSize={0.082}
        letterSpacing={-0.015}
        maxWidth={EXP_PILL_W - 0.25}
        position={[0, 0.04, EXP_PILL_D / 2 + 0.01]}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {course.title}
      </Text>
      <Text
        font={FONT_MEDIUM}
        fontSize={0.048}
        position={[0, -0.09, EXP_PILL_D / 2 + 0.01]}
        color={C.ink}
        anchorX="center"
        anchorY="middle"
      >
        {course.meta}
      </Text>
    </group>
  );
}

/** Animated hex background — each tile drifts and reacts to pointer. */
function AnimatedHexBackground({ pointer }: { pointer: Ref<PointerState> }) {
  const meshes = useRef<(Mesh | null)[]>([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const px = pointer.current.x * 5;
    const py = pointer.current.y * 4;

    for (let i = 0; i < HEX_DATA.length; i++) {
      const m = meshes.current[i];
      if (!m) continue;
      const h = HEX_DATA[i]!;
      const phase = h.ry;

      // Gentle orbital drift
      const x = h.x + Math.sin(t * 0.12 + phase) * 0.5;
      const y = h.y + Math.cos(t * 0.1 + phase * 1.4) * 0.4;
      const z = h.z + Math.sin(t * 0.07 + phase * 0.8) * 0.2;

      // Pointer repulsion
      const dx = px - x;
      const dy = py - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const push = dist < 2.5 ? (2.5 - dist) * 0.12 : 0;
      const nx = dist > 0.01 ? dx / dist : 0;
      const ny = dist > 0.01 ? dy / dist : 0;

      m.position.set(x - nx * push, y - ny * push, z);
      m.rotation.y = t * 0.04 + phase;
    }
  });

  return (
    <group>
      {HEX_DATA.map((h, i) => (
        <mesh
          key={i}
          ref={(el: Mesh | null) => { meshes.current[i] = el; }}
          position={[h.x, h.y, h.z]}
          rotation={[Math.PI / 2, h.ry, 0]}
          scale={h.s}
        >
          <cylinderGeometry args={[1, 1, 0.12, 6]} />
          <meshStandardMaterial
            color={h.green ? '#8CC850' : '#E8E4DE'}
            roughness={0.8}
            transparent
            opacity={h.green ? 0.28 : 0.35}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Floating tiles with gentle animation. */
function AnimatedFloatingTiles() {
  const group = useRef<Group>(null);

  useFrame((state) => {
    if (group.current) {
      const t = state.clock.elapsedTime;
      group.current.children.forEach((child, i) => {
        child.position.y += Math.sin(t * 0.15 + i * 1.8) * 0.0008;
        child.rotation.z += Math.cos(t * 0.1 + i * 2.1) * 0.0002;
      });
    }
  });

  return (
    <group ref={group}>
      {TILE_DATA.map((t, i) => (
        <group key={i} position={t.pos} rotation={t.rot} scale={t.sc}>
          <RoundedBox args={[1.8, 1.4, 0.08]} radius={0.14} smoothness={4} position={[0.1, -0.1, -0.05]}>
            <meshStandardMaterial color="#8CC850" roughness={0.6} transparent opacity={0.65} />
          </RoundedBox>
          <RoundedBox args={[1.8, 1.4, 0.08]} radius={0.14} smoothness={4} castShadow>
            <meshStandardMaterial color="#F4F0EA" roughness={0.7} transparent opacity={0.9} />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}

/** Pointer-responsive parallax wrapper — shifts children based on pointer at a given depth factor. */
function ParallaxLayer({ children, factor, pointer }: { children: React.ReactNode; factor: number; pointer: Ref<PointerState> }) {
  const group = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!group.current) return;
    const tx = pointer.current.x * factor * 0.6;
    const ty = pointer.current.y * factor * 0.4;
    group.current.position.x = MathUtils.damp(group.current.position.x, tx, 4, delta);
    group.current.position.y = MathUtils.damp(group.current.position.y, ty, 4, delta);
  });

  return <group ref={group}>{children}</group>;
}

/** Full exploded scene — parallax layers, entrance animation, 225° orbit. */
function ExplodedScene({ selected, onSelect, pointer }: { selected: number; onSelect: (i: number) => void; pointer: Ref<PointerState> }) {
  const { camera } = useThree();
  const content = useRef<Group>(null);
  const introRef = useRef(0);
  const particles = useRef<Group>(null);

  useEffect(() => {
    introRef.current = 0;
    camera.position.set(0, 2, 8);
    camera.lookAt(0, 0, 0);
    if ('fov' in camera) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c = camera as any;
      c.fov = 35;
      c.updateProjectionMatrix();
    }
  }, [camera]);

  useFrame((state, delta) => {
    introRef.current += delta;
    // Entrance: scale content from 0 to 1
    if (content.current) {
      const s = easeOutCubic(clamp01(introRef.current / 0.8));
      content.current.scale.setScalar(s);
    }
    // Orbiting particles
    if (particles.current) {
      particles.current.rotation.y += delta * 0.03;
      particles.current.rotation.x += delta * 0.01;
    }
  });

  return (
    <>
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.8} color="#FFF4E6" position={[-4, 5, 6]} scale={[10, 6, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.6} color={C.orange} position={[7, 1.5, 2]} scale={[4, 8, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.8} color="#DCEFE7" position={[-7, -3, 2]} scale={[6, 6, 1]} target={[0, 0, 0]} />
        <Lightformer form="circle" intensity={0.9} color="#FFFFFF" position={[0, 0, 10]} scale={5} target={[0, 0, 0]} />
      </Environment>

      <ambientLight intensity={0.35} />
      <directionalLight
        position={[-3, 5, 8]}
        intensity={1.8}
        color="#FFF3E6"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[4, -2, 5]} intensity={0.6} color="#E8F4FF" />

      <OrbitControls
        enablePan={false}
        enableZoom
        enableRotate
        minDistance={4}
        maxDistance={14}
        minAzimuthAngle={-Math.PI * 0.625}
        maxAzimuthAngle={Math.PI * 0.625}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI * 4 / 5}
        autoRotate
        autoRotateSpeed={0.4}
        dampingFactor={0.08}
        enableDamping
      />

      {/* Background parallax layer — deep (0.6x shift) */}
      <ParallaxLayer factor={0.6} pointer={pointer}>
        <AnimatedHexBackground pointer={pointer} />
      </ParallaxLayer>

      {/* Mid parallax layer — tiles (0.35x shift) */}
      <ParallaxLayer factor={0.35} pointer={pointer}>
        <AnimatedFloatingTiles />
      </ParallaxLayer>

      {/* Main content — entrance-animated, no extra parallax (OrbitControls handles it) */}
      <group ref={content}>
        <ExplodedHub selected={selected} />
        {COURSES.map((_, i) => (
          <BeamConnector key={`beam-${i}`} index={i} />
        ))}
        {COURSES.map((_, i) => (
          <ExplodedPill key={`pill-${i}`} index={i} selected={selected} onSelect={onSelect} />
        ))}
      </group>

      {/* Orbiting particle dots */}
      <group ref={particles}>
        {Array.from({ length: 24 }, (_, i) => {
          const h = Math.abs(Math.sin(i * 7.31 + 4.17) * 43758.5453) % 1;
          const lat = Math.acos(1 - 2 * (i + 0.5) / 24);
          const lon = i * Math.PI * (3 - Math.sqrt(5));
          const r = 4.5 + h * 2;
          return (
            <mesh key={`dot-${i}`} position={[
              Math.sin(lat) * Math.cos(lon) * r,
              Math.sin(lat) * Math.sin(lon) * r,
              Math.cos(lat) * r,
            ]}>
              <sphereGeometry args={[0.03 + h * 0.04, 8, 8]} />
              <meshStandardMaterial
                color={h < 0.3 ? C.orange : h < 0.5 ? '#8CC850' : '#E8E4DE'}
                roughness={0.5}
                emissive={h < 0.3 ? C.orange : h < 0.5 ? '#8CC850' : '#E8E4DE'}
                emissiveIntensity={0.3}
                transparent
                opacity={0.5 + h * 0.3}
              />
            </mesh>
          );
        })}
      </group>

      <mesh position={[0, 0, -4]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <shadowMaterial transparent opacity={0.1} />
      </mesh>
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Fallback, reduced-motion hook, exported panel                            */
/* ────────────────────────────────────────────────────────────────────────── */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(m.matches);
    sync();
    m.addEventListener('change', sync);
    return () => m.removeEventListener('change', sync);
  }, []);
  return reduced;
}

function StaticFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <ul className="space-y-2">
        {COURSES.slice(0, 5).map((c, i) => (
          <li key={c.title} className={`rounded-xl px-5 py-3 ${i === 0 ? 'bg-white text-bottle' : 'bg-white/10 text-white/70'}`}>
            <p className="text-sm font-bold">{c.title}</p>
            <p className="text-xs opacity-70">{c.meta}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AuthScene() {
  const reduced = usePrefersReducedMotion();
  const [selected, setSelected] = useState(0);
  const [exploded, setExploded] = useState(false);
  const api = useRef<DialApi | null>(null);
  const pointer = useRef<PointerState>({ x: 0, y: 0, inside: false });
  const phys = useRef<Physics>({
    phi: -2 * SEG, // winds into place during the entrance
    v: 0,
    target: 0,
    dragging: false,
    lastAngle: 0,
    lastMoveMs: 0,
    lastInteract: 0,
    hover: -1,
    introStart: -1,
    introT: 0,
  });

  const course = COURSES[selected]!;
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div
      className="absolute inset-0"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        pointer.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        pointer.current.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
        pointer.current.inside = true;
      }}
      onPointerLeave={() => {
        pointer.current.x = 0;
        pointer.current.y = 0;
        pointer.current.inside = false;
      }}
    >
      <div className="absolute inset-0" aria-hidden="true">
        <Canvas
          shadows
          dpr={[1, 1.75]}
          camera={{ position: [0, 0, 9.5], fov: 30, near: 0.1, far: 60 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            gl.toneMappingExposure = 1.05;
          }}
          fallback={<StaticFallback />}
          style={{ position: 'absolute', inset: 0 }}
        >
          {exploded ? (
            <ExplodedScene selected={selected} onSelect={setSelected} pointer={pointer} />
          ) : (
            <>
              <CameraReset />
              <Scene phys={phys} pointer={pointer} api={api} selected={selected} onSelect={setSelected} reduced={reduced} />
            </>
          )}
        </Canvas>
      </div>

      {exploded ? (
        /* ── Exploded view overlay ── */
        <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between p-8 xl:p-12">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">Selected</p>
            <p className="mt-0.5 text-lg font-bold text-white">{course.title}</p>
            <p className="text-sm text-white/50">{course.meta}</p>
          </div>
          <button
            type="button"
            onClick={() => setExploded(false)}
            className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/80 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
          >
            <ArrowLeft size={16} />
            Back to dial
          </button>
        </div>
      ) : (
        /* ── Dial view overlay (existing + explore button) ── */
        <>
          <div className="absolute bottom-10 right-10 z-20 flex items-center gap-3 xl:bottom-12 xl:right-12">
            <button
              type="button"
              onClick={() => setExploded(true)}
              className="mr-2 rounded-full border border-orange/30 bg-orange/10 px-4 py-2 text-xs font-semibold text-orange transition-colors hover:bg-orange/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
            >
              Explore 3D
            </button>
            <div className="mr-1 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">Drag the dial</p>
              <p className="text-sm font-bold tabular-nums text-white/80">
                {pad(selected + 1)} <span className="text-white/35">/ {pad(N)}</span>
              </p>
            </div>
            {[
              { dir: -1, label: 'Previous course', Icon: ChevronUp },
              { dir: 1, label: 'Next course', Icon: ChevronDown },
            ].map(({ dir, label, Icon }) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                onClick={() => api.current?.step(dir)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
              >
                <Icon size={18} />
              </button>
            ))}
          </div>
          <p className="sr-only" aria-live="polite">
            {`Course ${selected + 1} of ${N}: ${course.title}, ${course.meta}`}
          </p>
        </>
      )}
    </div>
  );
}
