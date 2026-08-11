'use client';

import React from 'react';
import { NEON, type Equipment, type ExerciseCategory } from './MovementIcons';

// ============================================================
// EXERCISE ILLUSTRATIONS
//
// Larger, detailed two-pose illustrations (start -> end position)
// used in the exercise detail view. One template per movement
// category; each accepts an `equipment` prop so the same rig
// works for kettlebell, dumbbell, or bodyweight variants.
//
// Body rig: illustrated humanoid with hair/clothes/shoes, tapered
// limbs, near/far depth coding. Motion is shown either as:
//  - a vertical DOWN/UP arrow pair (squat, push, conditioning)
//  - a pendulum arc following the equipment's path (hinge)
//  - a horizontal pull arrow (pull, carry)
//  - a pulsing "HOLD" glow (core, mobility - isometric movements)
// ============================================================

export type Gender = 'female' | 'male';

export const illustrationStyles = `
  @keyframes illoArrowPulse {
    0%, 100% { opacity: 0.5; stroke-dashoffset: 0; }
    50% { opacity: 1; stroke-dashoffset: -8; }
  }
  .illo-arrow { stroke-dasharray: 4 4; animation: illoArrowPulse 1.8s linear infinite; }

  @keyframes illoPoseFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-2px); }
  }
  .illo-pose-end { animation: illoPoseFloat 2.4s ease-in-out infinite; }

  @keyframes illoHoldPulse {
    0%, 100% { opacity: 0.55; }
    50% { opacity: 1; }
  }
  .illo-hold-glow { animation: illoHoldPulse 1.6s ease-in-out infinite; }

  @keyframes illoDownPulse {
    0%, 45% { opacity: 1; }
    50%, 95% { opacity: 0.25; }
    100% { opacity: 1; }
  }
  @keyframes illoUpPulse {
    0%, 45% { opacity: 0.25; }
    50%, 95% { opacity: 1; }
    100% { opacity: 0.25; }
  }
  .illo-arrow-down { animation: illoDownPulse 2.8s ease-in-out infinite; stroke-dasharray: 4 3; }
  .illo-arrow-up { animation: illoUpPulse 2.8s ease-in-out infinite; stroke-dasharray: 4 3; }
`;

// ============================================================
// Body rig primitives
// ============================================================
function Hair({ gender, cx, cy, facing = 1 }: { gender: Gender; cx: number; cy: number; facing?: number }) {
  if (gender === 'female') {
    return (
      <>
        <path
          d={`M ${cx - 7 * facing} ${cy - 3} C ${cx - 9 * facing} ${cy - 11}, ${cx - 1 * facing} ${cy - 14}, ${cx + 5 * facing} ${cy - 10} C ${cx + 8 * facing} ${cy - 8}, ${cx + 8 * facing} ${cy - 4}, ${cx + 6 * facing} ${cy - 1}`}
          fill="none" stroke={NEON.limbNear} strokeWidth="1.6" strokeLinecap="round"
        />
        <path
          d={`M ${cx - 6 * facing} ${cy - 4} C ${cx - 13 * facing} ${cy - 1}, ${cx - 14 * facing} ${cy + 9}, ${cx - 8 * facing} ${cy + 15}`}
          fill="none" stroke={NEON.limbNear} strokeWidth="1.6" strokeLinecap="round"
        />
      </>
    );
  }
  return (
    <path
      d={`M ${cx - 7 * facing} ${cy - 2} C ${cx - 8 * facing} ${cy - 10}, ${cx + 2 * facing} ${cy - 13}, ${cx + 7 * facing} ${cy - 7} C ${cx + 8 * facing} ${cy - 5}, ${cx + 7 * facing} ${cy - 3}, ${cx + 5 * facing} ${cy - 2}`}
      fill="none" stroke={NEON.limbNear} strokeWidth="1.6" strokeLinecap="round"
    />
  );
}

function IllustratedHead({ cx, cy, gender, facing = 1 }: { cx: number; cy: number; gender: Gender; facing?: number }) {
  return (
    <g>
      <path
        d={`M ${cx - 6} ${cy - 4} C ${cx - 7} ${cy - 8}, ${cx - 3} ${cy - 11}, ${cx + 1} ${cy - 10} C ${cx + 6} ${cy - 9}, ${cx + 7} ${cy - 4}, ${cx + 6} ${cy} C ${cx + 5.5 * facing} ${cy + 4}, ${cx + 2} ${cy + 6}, ${cx - 1} ${cy + 5} C ${cx - 5} ${cy + 4}, ${cx - 7} ${cy - 1}, ${cx - 6} ${cy - 4} Z`}
        fill={NEON.surface} stroke={NEON.limbNear} strokeWidth="1.6" strokeLinejoin="round"
      />
      <path d={`M ${cx + 6} ${cy - 1} L ${cx + 8.5 * facing} ${cy + 0.5}`} stroke={NEON.limbNear} strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <path d={`M ${cx - 2} ${cy + 5} C ${cx - 2} ${cy + 8}, ${cx + 1} ${cy + 9}, ${cx + 2} ${cy + 8} L ${cx + 2} ${cy + 5}`} fill={NEON.surface} stroke={NEON.limbNear} strokeWidth="1.6" />
      <Hair gender={gender} cx={cx} cy={cy} facing={facing} />
    </g>
  );
}

function TaperedLimb({ x1, y1, x2, y2, w1, w2, bend, color = NEON.surface }: {
  x1: number; y1: number; x2: number; y2: number; w1: number; w2: number; bend?: number; color?: string;
}) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const midX = (x1 + x2) / 2 + (bend ?? 0) * nx;
  const midY = (y1 + y2) / 2 + (bend ?? 0) * ny;
  const p1a = [x1 + nx * w1, y1 + ny * w1];
  const p1b = [x1 - nx * w1, y1 - ny * w1];
  const p2a = [x2 + nx * w2, y2 + ny * w2];
  const p2b = [x2 - nx * w2, y2 - ny * w2];
  return (
    <path
      d={`M ${p1a[0]} ${p1a[1]} Q ${midX + nx * ((w1 + w2) / 2)} ${midY + ny * ((w1 + w2) / 2)} ${p2a[0]} ${p2a[1]} L ${p2b[0]} ${p2b[1]} Q ${midX - nx * ((w1 + w2) / 2)} ${midY - ny * ((w1 + w2) / 2)} ${p1b[0]} ${p1b[1]} Z`}
      fill={color} stroke={NEON.limbNear} strokeWidth="1.4" strokeLinejoin="round"
    />
  );
}

function Cap({ cx, cy, r = 3 }: { cx: number; cy: number; r?: number }) {
  return <circle cx={cx} cy={cy} r={r} fill={NEON.surface} stroke={NEON.limbNear} strokeWidth="1.4" />;
}

function Shoe({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  const scale = flip ? -1 : 1;
  return (
    <g transform={`translate(${x},${y}) scale(${scale},1)`}>
      <path d="M-3 -4 C-3 -6 -1 -6.5 1 -6.5 L7 -6.5 C9.5 -6.5 11 -4 12 -1 C13 1.5 11.5 3.5 8 3.5 L-1 3.5 C-3.5 3.5 -4 0 -3 -4 Z"
        fill={NEON.surface} stroke={NEON.limbNear} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M-1 -5 L-1 3" stroke={NEON.limbNear} strokeWidth="1" opacity="0.5" />
    </g>
  );
}

function IllustratedTorso({ shoulderX, shoulderY, hipX, hipY, shoulderW, hipW, waistPinch = 0.55, lean = 0 }: {
  shoulderX: number; shoulderY: number; hipX: number; hipY: number; shoulderW: number; hipW: number; waistPinch?: number; lean?: number;
}) {
  const waistX = (shoulderX + hipX) / 2 + lean;
  const waistY = (shoulderY + hipY) / 2;
  const waistWL = (shoulderW * (1 - waistPinch) + hipW * waistPinch) * waistPinch;
  return (
    <path
      d={`M ${shoulderX - shoulderW} ${shoulderY} C ${shoulderX - shoulderW} ${shoulderY + 6}, ${waistX - waistWL} ${waistY - 4}, ${waistX - waistWL} ${waistY} C ${waistX - waistWL} ${waistY + 4}, ${hipX - hipW} ${hipY - 6}, ${hipX - hipW * 0.85} ${hipY} C ${hipX - hipW * 0.7} ${hipY + 4}, ${hipX + hipW * 0.7} ${hipY + 4}, ${hipX + hipW * 0.85} ${hipY} C ${hipX + hipW} ${hipY - 6}, ${waistX + waistWL} ${waistY + 4}, ${waistX + waistWL} ${waistY} C ${waistX + waistWL} ${waistY - 4}, ${shoulderX + shoulderW} ${shoulderY + 6}, ${shoulderX + shoulderW} ${shoulderY} C ${shoulderX + shoulderW * 0.6} ${shoulderY - 4}, ${shoulderX - shoulderW * 0.6} ${shoulderY - 4}, ${shoulderX - shoulderW} ${shoulderY} Z`}
      fill={NEON.surface} stroke={NEON.limbNear} strokeWidth="1.6" strokeLinejoin="round"
    />
  );
}

function IllustratedTop({ shoulderX, shoulderY, hipY, shoulderW, gender, waistY }: {
  shoulderX: number; shoulderY: number; hipY: number; shoulderW: number; gender: Gender; waistY: number;
}) {
  const hemY = waistY + (hipY - waistY) * 0.15;
  const w = shoulderW * (gender === 'male' ? 1.08 : 0.95);
  return (
    <g>
      <path
        d={`M ${shoulderX - w} ${shoulderY - 2} C ${shoulderX - w - 1} ${shoulderY + 4}, ${shoulderX - w + 1} ${hemY - 2}, ${shoulderX - w + 2} ${hemY} C ${shoulderX - w * 0.4} ${hemY + 3}, ${shoulderX + w * 0.4} ${hemY + 3}, ${shoulderX + w - 2} ${hemY} C ${shoulderX + w - 1} ${hemY - 2}, ${shoulderX + w + 1} ${shoulderY + 4}, ${shoulderX + w} ${shoulderY - 2} C ${shoulderX + w * 0.5} ${shoulderY - 6}, ${shoulderX - w * 0.5} ${shoulderY - 6}, ${shoulderX - w} ${shoulderY - 2} Z`}
        fill={NEON.xp} stroke={NEON.limbNear} strokeWidth="1.4" strokeLinejoin="round" fillOpacity="0.28"
      />
    </g>
  );
}

function IllustratedShorts({ hipX, hipY, hipW, legSpread = 0 }: { hipX: number; hipY: number; hipW: number; legSpread?: number }) {
  const waistY = hipY - 6;
  const hemY = hipY + 14;
  return (
    <path
      d={`M ${hipX - hipW * 1.05} ${waistY} C ${hipX - hipW * 1.15} ${hipY - 1}, ${hipX - hipW * 1.0 - legSpread} ${hemY - 3}, ${hipX - hipW * 0.75 - legSpread} ${hemY} L ${hipX - hipW * 0.15} ${hemY - 6} C ${hipX} ${hemY - 4}, ${hipX} ${hemY - 4}, ${hipX + hipW * 0.15} ${hemY - 6} L ${hipX + hipW * 0.75 + legSpread} ${hemY} C ${hipX + hipW * 1.0 + legSpread} ${hemY - 3}, ${hipX + hipW * 1.15} ${hipY - 1}, ${hipX + hipW * 1.05} ${waistY} C ${hipX + hipW * 0.5} ${waistY - 3}, ${hipX - hipW * 0.5} ${waistY - 3}, ${hipX - hipW * 1.05} ${waistY} Z`}
      fill={NEON.limbFar} stroke={NEON.limbNear} strokeWidth="1.4" strokeLinejoin="round" fillOpacity="0.5"
    />
  );
}

function ShortsLegFar({ x, y, w = 6.5 }: { x: number; y: number; w?: number }) {
  return <ellipse cx={x} cy={y} rx={w} ry={w * 1.3} fill={NEON.limbFar} stroke={NEON.limbNear} strokeWidth="1.2" opacity="0.7" />;
}
function ShortsLegNear({ x, y, w = 7.5 }: { x: number; y: number; w?: number }) {
  return <ellipse cx={x} cy={y} rx={w} ry={w * 1.3} fill={NEON.limbNear} fillOpacity="0.15" stroke={NEON.limbNear} strokeWidth="1.4" />;
}

// ============================================================
// Equipment glyphs (neon)
// ============================================================
function IllustratedKettlebell({ x, y, scale = 1, rotation = 0 }: { x: number; y: number; scale?: number; rotation?: number }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${rotation}) scale(${scale})`} style={{ filter: `drop-shadow(0 0 4px ${NEON.kettlebell})` }}>
      <path d="M-7 -10 C-7 -17 -3.5 -21 0 -21 C3.5 -21 7 -17 7 -10" fill="none" stroke={NEON.kettlebell} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M-4 -11 L-3 -3 L3 -3 L4 -11 Z" fill={NEON.kettlebell} fillOpacity="0.3" stroke={NEON.kettlebell} strokeWidth="1.5" />
      <path d="M-13 -2 C-13 7 -10 16 0 16 C10 16 13 7 13 -2 C13 -6 8 -8 0 -8 C-8 -8 -13 -6 -13 -2 Z" fill={NEON.kettlebell} fillOpacity="0.4" stroke={NEON.kettlebell} strokeWidth="1.8" />
    </g>
  );
}

function IllustratedDumbbell({ x, y, rotation = 0, scale = 1 }: { x: number; y: number; rotation?: number; scale?: number }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${rotation}) scale(${scale})`} style={{ filter: `drop-shadow(0 0 4px ${NEON.dumbbell})` }}>
      <rect x="-9" y="-2.5" width="18" height="5" rx="2.5" fill={NEON.dumbbell} fillOpacity="0.35" stroke={NEON.dumbbell} strokeWidth="1.4" />
      <rect x="-15" y="-8" width="8" height="16" rx="2.5" fill={NEON.dumbbell} fillOpacity="0.4" stroke={NEON.dumbbell} strokeWidth="1.6" />
      <rect x="7" y="-8" width="8" height="16" rx="2.5" fill={NEON.dumbbell} fillOpacity="0.4" stroke={NEON.dumbbell} strokeWidth="1.6" />
    </g>
  );
}

interface EquipmentGlyphProps { x: number; y: number; scale?: number; rotation?: number; }
function IllustratedEquipment({ equipment, ...props }: { equipment: Equipment } & EquipmentGlyphProps) {
  if (equipment === 'kettlebell') return <IllustratedKettlebell {...props} />;
  if (equipment === 'dumbbell') return <IllustratedDumbbell {...props} />;
  return null;
}

/** Vertical DOWN/UP arrow pair placed in the gap between two poses. */
function VerticalMotionArrows({ arrowX, topY, bottomY }: { arrowX: number; topY: number; bottomY: number }) {
  return (
    <>
      <line className="illo-arrow-down" x1={arrowX - 6} y1={topY} x2={arrowX - 6} y2={bottomY - 4}
        stroke={NEON.dumbbell} strokeWidth="3.5" strokeLinecap="round" markerEnd="url(#illo-arrow-down-head)" />
      <line className="illo-arrow-up" x1={arrowX + 8} y1={bottomY} x2={arrowX + 8} y2={topY + 4}
        stroke={NEON.xp} strokeWidth="3.5" strokeLinecap="round" markerEnd="url(#illo-arrow-up-head)" />
    </>
  );
}

function ArrowMarkers() {
  return (
    <defs>
      <marker id="illo-arrow-down-head" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 Z" fill={NEON.dumbbell} />
      </marker>
      <marker id="illo-arrow-up-head" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 Z" fill={NEON.xp} />
      </marker>
      <marker id="illo-arrow-pull-head" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 Z" fill={NEON.mobility} />
      </marker>
    </defs>
  );
}

// ============================================================
// CATEGORY ILLUSTRATIONS - each renders two poses + a canvas-sized
// wrapper. Props: gender, equipment, size (base unit for each pose).
// ============================================================
interface IlloProps { gender?: Gender; equipment?: Equipment; size?: number; }

// --- SQUAT: standing -> deep squat, weight at chest ---
function SquatStart({ gender, size, equipment }: Required<IlloProps>) {
  const shoulderX = 48, shoulderY = 30, hipX = 48, hipY = 62;
  return (
    <svg viewBox="0 0 100 145" width={size} height={size * 1.45} fill="none">
      <TaperedLimb x1={hipX + 4} y1={hipY + 2} x2={52} y2={98} w1={6} w2={4} bend={-1} color={NEON.limbFar} />
      <TaperedLimb x1={52} y1={98} x2={54} y2={130} w1={4} w2={2.5} bend={1} color={NEON.limbFar} />
      <ShortsLegFar x={hipX + 5} y={hipY + 5} />
      <Shoe x={56} y={132} />
      <TaperedLimb x1={shoulderX - 8} y1={shoulderY + 4} x2={40} y2={48} w1={4} w2={2.6} bend={-2} color={NEON.limbFar} />
      <TaperedLimb x1={shoulderX + 8} y1={shoulderY + 4} x2={56} y2={48} w1={4} w2={2.6} bend={2} />
      {equipment !== 'bodyweight' && <IllustratedEquipment equipment={equipment} x={48} y={52} scale={equipment === 'kettlebell' ? 1.1 : 1} />}
      <IllustratedTorso shoulderX={shoulderX} shoulderY={shoulderY} hipX={hipX} hipY={hipY} shoulderW={10} hipW={9} />
      <IllustratedTop shoulderX={shoulderX} shoulderY={shoulderY} hipY={hipY} shoulderW={10} gender={gender} waistY={(shoulderY + hipY) / 2} />
      <IllustratedShorts hipX={hipX} hipY={hipY} hipW={9} />
      <IllustratedHead cx={shoulderX - 2} cy={shoulderY - 14} gender={gender} />
      <TaperedLimb x1={hipX - 4} y1={hipY + 2} x2={44} y2={98} w1={6.5} w2={4.5} bend={1} />
      <TaperedLimb x1={44} y1={98} x2={42} y2={130} w1={4.5} w2={3} bend={-1} />
      <ShortsLegNear x={hipX - 3} y={hipY + 6} />
      <Shoe x={36} y={132} />
    </svg>
  );
}
function SquatEnd({ gender, size, equipment }: Required<IlloProps>) {
  const shoulderX = 50, shoulderY = 46, hipX = 50, hipY = 78;
  return (
    <svg viewBox="0 0 100 145" width={size} height={size * 1.45} fill="none" className="illo-pose-end">
      <TaperedLimb x1={hipX + 7} y1={hipY + 2} x2={70} y2={86} w1={6.5} w2={4.5} bend={-2} color={NEON.limbFar} />
      <TaperedLimb x1={70} y1={86} x2={64} y2={122} w1={4.5} w2={3} bend={3} color={NEON.limbFar} />
      <ShortsLegFar x={hipX + 8} y={hipY + 4} />
      <Shoe x={66} y={126} />
      <TaperedLimb x1={shoulderX - 8} y1={shoulderY + 4} x2={42} y2={64} w1={4} w2={2.6} bend={-2} color={NEON.limbFar} />
      <TaperedLimb x1={shoulderX + 8} y1={shoulderY + 4} x2={58} y2={64} w1={4} w2={2.6} bend={2} />
      {equipment !== 'bodyweight' && <IllustratedEquipment equipment={equipment} x={50} y={68} scale={equipment === 'kettlebell' ? 1.15 : 1.05} />}
      <IllustratedTorso shoulderX={shoulderX} shoulderY={shoulderY} hipX={hipX} hipY={hipY} shoulderW={10} hipW={9.5} />
      <IllustratedTop shoulderX={shoulderX} shoulderY={shoulderY} hipY={hipY} shoulderW={10} gender={gender} waistY={(shoulderY + hipY) / 2} />
      <IllustratedShorts hipX={hipX} hipY={hipY} hipW={9.5} legSpread={4} />
      <IllustratedHead cx={shoulderX - 2} cy={shoulderY - 14} gender={gender} />
      <TaperedLimb x1={hipX - 5} y1={hipY + 2} x2={28} y2={86} w1={7} w2={4.8} bend={2} />
      <TaperedLimb x1={28} y1={86} x2={36} y2={122} w1={4.8} w2={3} bend={-3} />
      <ShortsLegNear x={hipX - 6} y={hipY + 6} />
      <Shoe x={30} y={126} />
    </svg>
  );
}

// --- HINGE: tall stand -> hip hinge, weight swings back (pendulum arc) ---
function HingeStart({ gender, size, equipment }: Required<IlloProps>) {
  const shoulderX = 52, shoulderY = 42, hipX = 40, hipY = 64;
  return (
    <svg viewBox="0 0 100 145" width={size} height={size * 1.45} fill="none">
      <TaperedLimb x1={hipX + 6} y1={hipY + 2} x2={48} y2={92} w1={6} w2={4} bend={-3} color={NEON.limbFar} />
      <TaperedLimb x1={48} y1={92} x2={54} y2={124} w1={4} w2={2.5} bend={2} color={NEON.limbFar} />
      <ShortsLegFar x={hipX + 7} y={hipY + 5} />
      <Shoe x={56} y={128} />
      <TaperedLimb x1={shoulderX + 1} y1={shoulderY + 4} x2={34} y2={78} w1={4} w2={2.5} bend={-3} />
      <TaperedLimb x1={34} y1={78} x2={30} y2={100} w1={2.5} w2={2} bend={2} />
      <Cap cx={29} cy={102} r={2.6} />
      <IllustratedTorso shoulderX={shoulderX} shoulderY={shoulderY} hipX={hipX} hipY={hipY} shoulderW={11} hipW={9} waistPinch={0.55} lean={-3} />
      <IllustratedTop shoulderX={shoulderX} shoulderY={shoulderY} hipY={hipY} shoulderW={11} gender={gender} waistY={(shoulderY + hipY) / 2 - 2} />
      <IllustratedShorts hipX={hipX} hipY={hipY} hipW={9} legSpread={2} />
      <IllustratedHead cx={shoulderX + 12} cy={shoulderY - 12} gender={gender} />
      <TaperedLimb x1={hipX - 2} y1={hipY + 2} x2={38} y2={92} w1={6.5} w2={4.5} bend={3} />
      <TaperedLimb x1={38} y1={92} x2={42} y2={126} w1={4.5} w2={3} bend={-2} />
      <ShortsLegNear x={hipX - 1} y={hipY + 6} />
      <Shoe x={32} y={130} />
      {equipment !== 'bodyweight' && <IllustratedEquipment equipment={equipment} x={26} y={104} scale={0.85} rotation={-15} />}
    </svg>
  );
}
function HingeEnd({ gender, size, equipment }: Required<IlloProps>) {
  const shoulderX = 48, shoulderY = 34, hipX = 48, hipY = 66;
  return (
    <svg viewBox="0 0 100 145" width={size} height={size * 1.45} fill="none" className="illo-pose-end">
      <TaperedLimb x1={hipX + 4} y1={hipY + 2} x2={52} y2={98} w1={6} w2={4} bend={-1} color={NEON.limbFar} />
      <TaperedLimb x1={52} y1={98} x2={54} y2={130} w1={4} w2={2.5} bend={1} color={NEON.limbFar} />
      <ShortsLegFar x={hipX + 5} y={hipY + 5} />
      <Shoe x={56} y={132} />
      <TaperedLimb x1={shoulderX + 9} y1={shoulderY + 2} x2={64} y2={31} w1={4} w2={2.8} bend={-2} />
      <TaperedLimb x1={64} y1={31} x2={76} y2={29} w1={2.8} w2={2.2} bend={-1} />
      <Cap cx={78} cy={29} r={2.6} />
      <IllustratedTorso shoulderX={shoulderX} shoulderY={shoulderY} hipX={hipX} hipY={hipY} shoulderW={10} hipW={9} waistPinch={0.5} />
      <IllustratedTop shoulderX={shoulderX} shoulderY={shoulderY} hipY={hipY} shoulderW={10} gender={gender} waistY={(shoulderY + hipY) / 2} />
      <IllustratedShorts hipX={hipX} hipY={hipY} hipW={9} />
      <IllustratedHead cx={shoulderX - 2} cy={shoulderY - 14} gender={gender} />
      <TaperedLimb x1={shoulderX - 8} y1={shoulderY + 3} x2={38} y2={58} w1={3.5} w2={2.5} bend={1} color={NEON.limbFar} />
      <Cap cx={37} cy={60} r={2.2} />
      <TaperedLimb x1={hipX - 4} y1={hipY + 2} x2={44} y2={98} w1={6.5} w2={4.5} bend={1} />
      <TaperedLimb x1={44} y1={98} x2={42} y2={130} w1={4.5} w2={3} bend={-1} />
      <ShortsLegNear x={hipX - 3} y={hipY + 6} />
      <Shoe x={36} y={132} />
      {equipment !== 'bodyweight' && <IllustratedEquipment equipment={equipment} x={80} y={30} scale={0.95} rotation={5} />}
    </svg>
  );
}

// --- PUSH: arm extended -> pressed toward body, chest-level lean ---
function PushStart({ gender, size, equipment }: Required<IlloProps>) {
  const shoulderX = 44, shoulderY = 60;
  return (
    <svg viewBox="0 0 100 130" width={size} height={size * 1.3} fill="none">
      <TaperedLimb x1={54} y1={64} x2={78} y2={80} w1={5} w2={3.5} bend={-2} color={NEON.limbFar} />
      <TaperedLimb x1={78} y1={80} x2={86} y2={94} w1={3.5} w2={2.8} bend={1} color={NEON.limbFar} />
      <IllustratedHead cx={70} cy={44} gender={gender} facing={-1} />
      <IllustratedTorso shoulderX={shoulderX + 14} shoulderY={shoulderY - 10} hipX={shoulderX - 4} hipY={shoulderY + 4} shoulderW={22} hipW={9} lean={0} />
      <IllustratedTop shoulderX={shoulderX + 14} shoulderY={shoulderY - 10} hipY={shoulderY + 4} shoulderW={20} gender={gender} waistY={shoulderY - 3} />
      <TaperedLimb x1={54} y1={58} x2={68} y2={74} w1={6} w2={4} bend={2} />
      <TaperedLimb x1={68} y1={74} x2={78} y2={80} w1={4} w2={3} bend={1} />
      <TaperedLimb x1={shoulderX - 8} y1={shoulderY - 4} x2={16} y2={56} w1={7} w2={5} bend={-3} />
      {equipment !== 'bodyweight' && <IllustratedEquipment equipment={equipment} x={14} y={58} scale={0.85} rotation={equipment === 'dumbbell' ? -20 : 0} />}
    </svg>
  );
}
function PushEnd({ gender, size, equipment }: Required<IlloProps>) {
  const shoulderX = 44, shoulderY = 60;
  return (
    <svg viewBox="0 0 100 130" width={size} height={size * 1.3} fill="none" className="illo-pose-end">
      <TaperedLimb x1={54} y1={64} x2={78} y2={80} w1={5} w2={3.5} bend={-2} color={NEON.limbFar} />
      <TaperedLimb x1={78} y1={80} x2={86} y2={94} w1={3.5} w2={2.8} bend={1} color={NEON.limbFar} />
      <IllustratedHead cx={54} cy={50} gender={gender} facing={-1} />
      <IllustratedTorso shoulderX={shoulderX + 4} shoulderY={shoulderY - 6} hipX={shoulderX - 4} hipY={shoulderY + 4} shoulderW={22} hipW={9} lean={0} />
      <IllustratedTop shoulderX={shoulderX + 4} shoulderY={shoulderY - 6} hipY={shoulderY + 4} shoulderW={20} gender={gender} waistY={shoulderY} />
      <TaperedLimb x1={54} y1={58} x2={68} y2={74} w1={6} w2={4} bend={2} />
      <TaperedLimb x1={68} y1={74} x2={78} y2={80} w1={4} w2={3} bend={1} />
      <TaperedLimb x1={shoulderX - 6} y1={shoulderY - 6} x2={32} y2={58} w1={7} w2={5} bend={-2} />
      {equipment !== 'bodyweight' && <IllustratedEquipment equipment={equipment} x={30} y={60} scale={0.85} rotation={equipment === 'dumbbell' ? -20 : 0} />}
    </svg>
  );
}

// --- PULL: arm extended forward -> pulled to ribs ---
function PullStart({ gender, size, equipment }: Required<IlloProps>) {
  const shoulderX = 34, shoulderY = 34, hipX = 40, hipY = 66;
  return (
    <svg viewBox="0 0 100 130" width={size} height={size * 1.3} fill="none">
      <TaperedLimb x1={hipX + 3} y1={hipY} x2={50} y2={96} w1={6} w2={4} bend={-1} color={NEON.limbFar} />
      <Shoe x={52} y={100} />
      <IllustratedTorso shoulderX={shoulderX} shoulderY={shoulderY} hipX={hipX} hipY={hipY} shoulderW={13} hipW={11} waistPinch={0.5} lean={4} />
      <IllustratedTop shoulderX={shoulderX} shoulderY={shoulderY} hipY={hipY} shoulderW={13} gender={gender} waistY={(shoulderY + hipY) / 2} />
      <IllustratedShorts hipX={hipX} hipY={hipY} hipW={10} />
      <IllustratedHead cx={shoulderX - 10} cy={shoulderY - 10} gender={gender} facing={-1} />
      <TaperedLimb x1={shoulderX - 4} y1={shoulderY + 8} x2={20} y2={70} w1={4} w2={2.8} bend={-2} color={NEON.limbFar} />
      <TaperedLimb x1={hipX - 4} y1={hipY} x2={32} y2={96} w1={6.5} w2={4.5} bend={1} />
      <Shoe x={26} y={100} flip />
      <TaperedLimb x1={shoulderX + 6} y1={shoulderY + 6} x2={70} y2={40} w1={6} w2={4} bend={2} />
      {equipment !== 'bodyweight' && <IllustratedEquipment equipment={equipment} x={72} y={40} scale={0.85} rotation={equipment === 'dumbbell' ? 15 : 0} />}
    </svg>
  );
}
function PullEnd({ gender, size, equipment }: Required<IlloProps>) {
  const shoulderX = 34, shoulderY = 34, hipX = 40, hipY = 66;
  return (
    <svg viewBox="0 0 100 130" width={size} height={size * 1.3} fill="none" className="illo-pose-end">
      <TaperedLimb x1={hipX + 3} y1={hipY} x2={50} y2={96} w1={6} w2={4} bend={-1} color={NEON.limbFar} />
      <Shoe x={52} y={100} />
      <IllustratedTorso shoulderX={shoulderX} shoulderY={shoulderY} hipX={hipX} hipY={hipY} shoulderW={13} hipW={11} waistPinch={0.5} lean={4} />
      <IllustratedTop shoulderX={shoulderX} shoulderY={shoulderY} hipY={hipY} shoulderW={13} gender={gender} waistY={(shoulderY + hipY) / 2} />
      <IllustratedShorts hipX={hipX} hipY={hipY} hipW={10} />
      <IllustratedHead cx={shoulderX - 10} cy={shoulderY - 10} gender={gender} facing={-1} />
      <TaperedLimb x1={shoulderX - 4} y1={shoulderY + 8} x2={20} y2={70} w1={4} w2={2.8} bend={-2} color={NEON.limbFar} />
      <TaperedLimb x1={hipX - 4} y1={hipY} x2={32} y2={96} w1={6.5} w2={4.5} bend={1} />
      <Shoe x={26} y={100} flip />
      <TaperedLimb x1={shoulderX + 6} y1={shoulderY + 6} x2={46} y2={44} w1={6} w2={4} bend={1} />
      {equipment !== 'bodyweight' && <IllustratedEquipment equipment={equipment} x={48} y={44} scale={0.85} rotation={equipment === 'dumbbell' ? 15 : 0} />}
    </svg>
  );
}

// --- CARRY: walking, weight held rigidly at the side ---
function CarryPose({ gender, size, equipment, legForward }: Required<IlloProps> & { legForward: 'left' | 'right' }) {
  const shoulderX = 40, shoulderY = 30, hipX = 40, hipY = 60;
  const frontX = legForward === 'left' ? 28 : 52;
  const backX = legForward === 'left' ? 52 : 28;
  return (
    <svg viewBox="0 0 100 130" width={size} height={size * 1.3} fill="none" className={legForward === 'right' ? 'illo-pose-end' : ''}>
      <TaperedLimb x1={hipX + 3} y1={hipY} x2={backX} y2={90} w1={6} w2={4} bend={legForward === 'left' ? 2 : -2} color={NEON.limbFar} />
      <Shoe x={backX + (legForward === 'left' ? 4 : -4)} y={96} flip={legForward !== 'left'} />
      <IllustratedTorso shoulderX={shoulderX} shoulderY={shoulderY} hipX={hipX} hipY={hipY} shoulderW={13} hipW={11} />
      <IllustratedTop shoulderX={shoulderX} shoulderY={shoulderY} hipY={hipY} shoulderW={13} gender={gender} waistY={(shoulderY + hipY) / 2} />
      <IllustratedShorts hipX={hipX} hipY={hipY} hipW={10} legSpread={6} />
      <IllustratedHead cx={shoulderX} cy={shoulderY - 14} gender={gender} />
      <TaperedLimb x1={shoulderX - 8} y1={shoulderY + 6} x2={24} y2={44} w1={4} w2={2.8} bend={-2} color={NEON.limbFar} />
      <TaperedLimb x1={shoulderX + 9} y1={shoulderY + 6} x2={56} y2={44} w1={4} w2={2.8} bend={2} />
      {equipment !== 'bodyweight' && <IllustratedEquipment equipment={equipment} x={56} y={48} scale={0.85} rotation={equipment === 'dumbbell' ? 90 : 0} />}
      <TaperedLimb x1={hipX - 3} y1={hipY} x2={frontX} y2={92} w1={6.5} w2={4.5} bend={legForward === 'left' ? -2 : 2} />
      <Shoe x={frontX + (legForward === 'left' ? -6 : 6)} y={96} flip={legForward === 'left'} />
    </svg>
  );
}

// --- CORE: plank with leg lift (isometric, single pose + hold glow) ---
function CoreHold({ gender, size }: Required<Pick<IlloProps, 'gender' | 'size'>>) {
  return (
    <svg viewBox="0 0 130 90" width={size * 1.4} height={size * 0.95} fill="none">
      <TaperedLimb x1={68} y1={52} x2={92} y2={70} w1={5} w2={3.2} bend={-1} color={NEON.limbFar} />
      <Shoe x={94} y={74} />
      <IllustratedHead cx={22} cy={44} gender={gender} facing={-1} />
      <IllustratedTorso shoulderX={44} shoulderY={44} hipX={68} hipY={48} shoulderW={9} hipW={16} />
      <IllustratedTop shoulderX={44} shoulderY={44} hipY={48} shoulderW={9} gender={gender} waistY={46} />
      <TaperedLimb x1={30} y1={48} x2={26} y2={68} w1={4} w2={2.8} bend={1} />
      <Shoe x={24} y={72} flip />
      <g className="illo-hold-glow">
        <TaperedLimb x1={68} y1={48} x2={100} y2={30} w1={5.5} w2={3.8} bend={2} color={NEON.xp} />
        <Shoe x={102} y={26} />
      </g>
    </svg>
  );
}

// --- MOBILITY: deep lunge + overhead reach (isometric hold) ---
function MobilityHold({ gender, size }: Required<Pick<IlloProps, 'gender' | 'size'>>) {
  return (
    <svg viewBox="0 0 100 130" width={size} height={size * 1.3} fill="none">
      <path d="M18 100 Q50 20 82 100" stroke={NEON.mobility} strokeWidth="1.5" strokeDasharray="3 5" fill="none" opacity="0.4" />
      <TaperedLimb x1={44} y1={78} x2={22} y2={92} w1={7} w2={5} bend={-2} color={NEON.limbFar} />
      <TaperedLimb x1={22} y1={92} x2={24} y2={110} w1={5} w2={3.5} bend={1} color={NEON.limbFar} />
      <Shoe x={26} y={112} flip />
      <IllustratedTorso shoulderX={48} shoulderY={44} hipX={44} hipY={76} shoulderW={13} hipW={10} />
      <IllustratedTop shoulderX={48} shoulderY={44} hipY={76} shoulderW={13} gender={gender} waistY={58} />
      <IllustratedShorts hipX={44} hipY={76} hipW={10} legSpread={3} />
      <IllustratedHead cx={48} cy={28} gender={gender} />
      <g className="illo-hold-glow">
        <TaperedLimb x1={56} y1={50} x2={78} y2={18} w1={5} w2={3.2} bend={-1} color={NEON.mobility} />
      </g>
      <TaperedLimb x1={40} y1={50} x2={26} y2={68} w1={4.5} w2={3} bend={2} />
      <TaperedLimb x1={48} y1={76} x2={68} y2={88} w1={7.5} w2={5.2} bend={2} />
      <TaperedLimb x1={68} y1={88} x2={64} y2={112} w1={5.2} w2={3.5} bend={-2} />
      <Shoe x={62} y={116} />
    </svg>
  );
}

// --- CONDITIONING: squat -> explosive jump ---
function ConditioningStart({ gender, size }: Required<Pick<IlloProps, 'gender' | 'size'>>) {
  const shoulderX = 48, shoulderY = 46, hipX = 48, hipY = 68;
  return (
    <svg viewBox="0 0 100 130" width={size} height={size * 1.3} fill="none">
      <TaperedLimb x1={hipX + 6} y1={hipY} x2={64} y2={82} w1={6} w2={4} bend={-1} color={NEON.limbFar} />
      <TaperedLimb x1={64} y1={82} x2={60} y2={110} w1={4} w2={2.8} bend={2} color={NEON.limbFar} />
      <Shoe x={62} y={114} />
      <IllustratedTorso shoulderX={shoulderX} shoulderY={shoulderY} hipX={hipX} hipY={hipY} shoulderW={12} hipW={10} />
      <IllustratedTop shoulderX={shoulderX} shoulderY={shoulderY} hipY={hipY} shoulderW={12} gender={gender} waistY={(shoulderY + hipY) / 2} />
      <IllustratedHead cx={shoulderX - 2} cy={shoulderY - 14} gender={gender} />
      <TaperedLimb x1={shoulderX - 6} y1={shoulderY + 6} x2={30} y2={64} w1={4.5} w2={3} bend={2} />
      <TaperedLimb x1={shoulderX + 8} y1={shoulderY + 6} x2={66} y2={62} w1={4.5} w2={3} bend={-2} />
      <TaperedLimb x1={hipX - 6} y1={hipY} x2={32} y2={82} w1={7} w2={4.8} bend={2} />
      <TaperedLimb x1={32} y1={82} x2={36} y2={110} w1={4.8} w2={3} bend={-2} />
      <Shoe x={34} y={114} flip />
    </svg>
  );
}
function ConditioningEnd({ gender, size }: Required<Pick<IlloProps, 'gender' | 'size'>>) {
  const shoulderX = 48, shoulderY = 30, hipX = 48, hipY = 52;
  return (
    <svg viewBox="0 0 100 130" width={size} height={size * 1.3} fill="none" className="illo-pose-end">
      <TaperedLimb x1={hipX + 5} y1={hipY} x2={62} y2={82} w1={5.5} w2={3.5} bend={-2} color={NEON.limbFar} />
      <Shoe x={64} y={88} />
      <IllustratedTorso shoulderX={shoulderX} shoulderY={shoulderY} hipX={hipX} hipY={hipY} shoulderW={12} hipW={10} />
      <IllustratedTop shoulderX={shoulderX} shoulderY={shoulderY} hipY={hipY} shoulderW={12} gender={gender} waistY={(shoulderY + hipY) / 2} />
      <IllustratedHead cx={shoulderX - 2} cy={shoulderY - 14} gender={gender} />
      <TaperedLimb x1={shoulderX - 8} y1={shoulderY + 2} x2={22} y2={10} w1={4.5} w2={3} bend={2} color={NEON.conditioning} />
      <TaperedLimb x1={shoulderX + 8} y1={shoulderY + 2} x2={72} y2={10} w1={4.5} w2={3} bend={-2} color={NEON.conditioning} />
      <TaperedLimb x1={hipX - 5} y1={hipY} x2={34} y2={82} w1={6.5} w2={4.2} bend={2} />
      <Shoe x={32} y={88} flip />
    </svg>
  );
}

// ============================================================
// Public API: ExerciseIllustration renders the right two-pose
// (or single-hold) illustration for a given category.
// ============================================================
export interface ExerciseIllustrationProps {
  category: ExerciseCategory;
  equipment: Equipment;
  gender?: Gender;
  size?: number;
}

export function ExerciseIllustration({ category, equipment, gender = 'female', size = 90 }: ExerciseIllustrationProps) {
  const gap = size * 0.35;

  if (category === 'core') {
    return (
      <div className="relative">
        <CoreHold gender={gender} size={size} />
        <span className="absolute -bottom-1 right-2 text-[10px] font-bold tracking-wider" style={{ color: NEON.xp, fontFamily: "'Oswald', sans-serif" }}>HOLD</span>
      </div>
    );
  }
  if (category === 'mobility') {
    return (
      <div className="relative">
        <MobilityHold gender={gender} size={size} />
        <span className="absolute bottom-0 right-4 text-[10px] font-bold tracking-wider" style={{ color: NEON.mobility, fontFamily: "'Oswald', sans-serif" }}>HOLD & BREATHE</span>
      </div>
    );
  }
  if (category === 'carry') {
    return (
      <div className="flex items-center gap-1">
        <CarryPose gender={gender} size={size * 0.85} equipment={equipment} legForward="left" />
        <svg width={gap} height={size * 0.4} viewBox={`0 0 ${gap} 40`}>
          <line className="illo-arrow" x1="4" y1="20" x2={gap - 8} y2="20" stroke={NEON.mobility} strokeWidth="3" strokeLinecap="round" markerEnd="url(#illo-arrow-pull-head)" />
          <ArrowMarkers />
        </svg>
        <CarryPose gender={gender} size={size * 0.85} equipment={equipment} legForward="right" />
      </div>
    );
  }
  if (category === 'conditioning') {
    const unit = size / 100;
    const arrowX = size + gap / 2;
    return (
      <div className="relative" style={{ width: size * 2 + gap, height: size * 1.3 }}>
        <div className="absolute left-0 top-0"><ConditioningStart gender={gender} size={size} /></div>
        <div className="absolute" style={{ left: size + gap, top: 0 }}><ConditioningEnd gender={gender} size={size} /></div>
        <svg className="absolute" width={size * 2 + gap} height={size * 1.3} viewBox={`0 0 ${size * 2 + gap} ${size * 1.3}`} style={{ left: 0, top: 0 }}>
          <ArrowMarkers />
          <VerticalMotionArrows arrowX={arrowX} topY={20 * unit} bottomY={90 * unit} />
        </svg>
      </div>
    );
  }
  if (category === 'pull') {
    return (
      <div className="flex items-center gap-1">
        <PullStart gender={gender} size={size * 0.9} equipment={equipment} />
        <svg width={gap} height={size * 0.5} viewBox={`0 0 ${gap} 50`}>
          <ArrowMarkers />
          <line className="illo-arrow" x1={gap - 4} y1="20" x2="6" y2="20" stroke={NEON.mobility} strokeWidth="3" strokeLinecap="round" markerEnd="url(#illo-arrow-pull-head)" />
        </svg>
        <PullEnd gender={gender} size={size * 0.9} equipment={equipment} />
      </div>
    );
  }
  if (category === 'squat') {
    const unit = size / 100;
    const arrowX = size + gap / 2;
    return (
      <div className="relative" style={{ width: size * 2 + gap, height: size * 1.45 }}>
        <div className="absolute left-0 top-0"><SquatStart gender={gender} size={size} equipment={equipment} /></div>
        <div className="absolute" style={{ left: size + gap, top: 0 }}><SquatEnd gender={gender} size={size} equipment={equipment} /></div>
        <svg className="absolute" width={size * 2 + gap} height={size * 1.45} viewBox={`0 0 ${size * 2 + gap} ${size * 1.45}`} style={{ left: 0, top: 0 }}>
          <ArrowMarkers />
          <VerticalMotionArrows arrowX={arrowX} topY={26 * unit} bottomY={78 * unit} />
        </svg>
      </div>
    );
  }
  if (category === 'push') {
    const unit = size / 100;
    const arrowX = size + gap / 2;
    return (
      <div className="relative" style={{ width: size * 2 + gap, height: size * 1.3 }}>
        <div className="absolute left-0 top-0"><PushStart gender={gender} size={size} equipment={equipment} /></div>
        <div className="absolute" style={{ left: size + gap, top: 0 }}><PushEnd gender={gender} size={size} equipment={equipment} /></div>
        <svg className="absolute" width={size * 2 + gap} height={size * 1.3} viewBox={`0 0 ${size * 2 + gap} ${size * 1.3}`} style={{ left: 0, top: 0 }}>
          <ArrowMarkers />
          <VerticalMotionArrows arrowX={arrowX} topY={40 * unit} bottomY={90 * unit} />
        </svg>
      </div>
    );
  }
  // hinge (default)
  const unit = size / 100;
  return (
    <div className="relative" style={{ width: size * 2.3, height: size * 1.45 }}>
      <div className="absolute left-0 top-0" style={{ transform: 'scale(0.82)', transformOrigin: 'top left' }}>
        <HingeStart gender={gender} size={size} equipment={equipment} />
      </div>
      <div className="absolute" style={{ left: size * 0.95, top: 0 }}>
        <HingeEnd gender={gender} size={size} equipment={equipment} />
      </div>
      <svg className="absolute" width={size * 2.3} height={size * 1.45} viewBox={`0 0 ${size * 2.3} ${size * 1.45}`} style={{ left: 0, top: 0 }}>
        <ArrowMarkers />
        <path className="illo-arrow" d={`M ${26 * unit * 0.82} ${104 * unit * 0.82} Q ${size * 1.1} ${size * 0.9} ${size * 0.95 + 70 * unit} ${32 * unit}`}
          fill="none" stroke={NEON.mobility} strokeWidth="3" strokeLinecap="round" markerEnd="url(#illo-arrow-pull-head)" />
      </svg>
    </div>
  );
}
