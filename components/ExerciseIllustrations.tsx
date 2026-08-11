'use client';

import React from 'react';
import { BRAND, type Equipment, type ExerciseCategory } from './MovementIcons';

// ============================================================
// EXERCISE ILLUSTRATIONS — pictogram style
//
// Simple, gender-neutral stick-figure pictograms (circle head +
// thick rounded-stroke limbs/torso, no hair or clothing), matching
// the WODXP poster reference. Two poses (start -> end) connected
// by a motion cue, per movement category. Same pose choreography
// as before, just rendered with much simpler shapes for maximum
// clarity to beginners.
// ============================================================

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
// Pictogram primitives — everything is a circle (head) or a thick
// rounded stroke (torso/arms/legs). No hair, no clothes, no gender.
// ============================================================
function Head({ cx, cy, r = 7, depth = 'near' }: { cx: number; cy: number; r?: number; depth?: 'near' | 'far' }) {
  return <circle cx={cx} cy={cy} r={r} fill={depth === 'far' ? BRAND.limbFar : BRAND.limbNear} />;
}

/** A single body segment (torso, arm, or leg) as a thick rounded stroke. */
function Stroke({ x1, y1, x2, y2, width = 9, depth = 'near', color }: {
  x1: number; y1: number; x2: number; y2: number; width?: number; depth?: 'near' | 'far'; color?: string;
}) {
  const stroke = color ?? (depth === 'far' ? BRAND.limbFar : BRAND.limbNear);
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={width} strokeLinecap="round" />;
}

/** Small rounded foot marker at the base of a leg. */
function Foot({ cx, cy, depth = 'near' }: { cx: number; cy: number; depth?: 'near' | 'far' }) {
  return <ellipse cx={cx} cy={cy} rx={6} ry={4} fill={depth === 'far' ? BRAND.limbFar : BRAND.limbNear} />;
}

// ============================================================
// Equipment glyphs
// ============================================================
function IllustratedKettlebell({ x, y, scale = 1, rotation = 0 }: { x: number; y: number; scale?: number; rotation?: number }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${rotation}) scale(${scale})`} style={{ filter: `drop-shadow(0 0 4px ${BRAND.kettlebell})` }}>
      <path d="M-7 -10 C-7 -17 -3.5 -21 0 -21 C3.5 -21 7 -17 7 -10" fill="none" stroke={BRAND.kettlebell} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M-13 -2 C-13 7 -10 16 0 16 C10 16 13 7 13 -2 C13 -6 8 -8 0 -8 C-8 -8 -13 -6 -13 -2 Z" fill={BRAND.kettlebell} />
    </g>
  );
}

function IllustratedDumbbell({ x, y, rotation = 0, scale = 1 }: { x: number; y: number; rotation?: number; scale?: number }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${rotation}) scale(${scale})`} style={{ filter: `drop-shadow(0 0 4px ${BRAND.dumbbell})` }}>
      <rect x="-9" y="-2.5" width="18" height="5" rx="2.5" fill={BRAND.dumbbell} fillOpacity="0.5" />
      <rect x="-15" y="-8" width="8" height="16" rx="2.5" fill={BRAND.dumbbell} />
      <rect x="7" y="-8" width="8" height="16" rx="2.5" fill={BRAND.dumbbell} />
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
        stroke={BRAND.dumbbell} strokeWidth="3.5" strokeLinecap="round" markerEnd="url(#illo-arrow-down-head)" />
      <line className="illo-arrow-up" x1={arrowX + 8} y1={bottomY} x2={arrowX + 8} y2={topY + 4}
        stroke={BRAND.xp} strokeWidth="3.5" strokeLinecap="round" markerEnd="url(#illo-arrow-up-head)" />
    </>
  );
}

function ArrowMarkers() {
  return (
    <defs>
      <marker id="illo-arrow-down-head" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 Z" fill={BRAND.dumbbell} />
      </marker>
      <marker id="illo-arrow-up-head" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 Z" fill={BRAND.xp} />
      </marker>
      <marker id="illo-arrow-pull-head" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 Z" fill={BRAND.mobility} />
      </marker>
    </defs>
  );
}

// ============================================================
// CATEGORY ILLUSTRATIONS — pictogram poses. Props: equipment, size.
// ============================================================
interface IlloProps { equipment?: Equipment; size?: number; }

// --- SQUAT: standing -> deep squat, weight at chest ---
function SquatStart({ size, equipment }: Required<IlloProps>) {
  return (
    <svg viewBox="0 0 100 145" width={size} height={size * 1.45} fill="none">
      <Head cx={48} cy={22} />
      <Stroke x1={48} y1={29} x2={48} y2={62} width={11} />
      <Stroke x1={48} y1={38} x2={40} y2={48} width={7} depth="far" />
      <Stroke x1={48} y1={38} x2={56} y2={48} width={7} />
      {equipment !== 'bodyweight' && <IllustratedEquipment equipment={equipment} x={48} y={52} scale={equipment === 'kettlebell' ? 1.1 : 1} />}
      <Stroke x1={44} y1={62} x2={40} y2={98} width={9} depth="far" />
      <Stroke x1={40} y1={98} x2={44} y2={130} width={7} depth="far" />
      <Foot cx={46} cy={132} depth="far" />
      <Stroke x1={52} y1={62} x2={56} y2={98} width={9} />
      <Stroke x1={56} y1={98} x2={52} y2={130} width={7} />
      <Foot cx={50} cy={132} />
    </svg>
  );
}
function SquatEnd({ size, equipment }: Required<IlloProps>) {
  return (
    <svg viewBox="0 0 100 145" width={size} height={size * 1.45} fill="none" className="illo-pose-end">
      <Head cx={50} cy={38} />
      <Stroke x1={50} y1={45} x2={50} y2={78} width={11} />
      <Stroke x1={50} y1={54} x2={42} y2={64} width={7} depth="far" />
      <Stroke x1={50} y1={54} x2={58} y2={64} width={7} />
      {equipment !== 'bodyweight' && <IllustratedEquipment equipment={equipment} x={50} y={68} scale={equipment === 'kettlebell' ? 1.15 : 1.05} />}
      <Stroke x1={44} y1={78} x2={70} y2={86} width={9} depth="far" />
      <Stroke x1={70} y1={86} x2={64} y2={122} width={7} depth="far" />
      <Foot cx={66} cy={126} depth="far" />
      <Stroke x1={56} y1={78} x2={28} y2={86} width={9} />
      <Stroke x1={28} y1={86} x2={36} y2={122} width={7} />
      <Foot cx={30} cy={126} />
    </svg>
  );
}

// --- HINGE: tall stand -> hip hinge, weight swings back (pendulum arc) ---
function HingeStart({ size, equipment }: Required<IlloProps>) {
  return (
    <svg viewBox="0 0 100 145" width={size} height={size * 1.45} fill="none">
      <Head cx={30} cy={18} />
      <Stroke x1={30} y1={25} x2={40} y2={64} width={11} />
      <Stroke x1={35} y1={38} x2={26} y2={56} width={7} depth="far" />
      <Stroke x1={37} y1={40} x2={30} y2={100} width={2} depth="far" />
      <Stroke x1={38} y1={44} x2={34} y2={92} width={7} />
      <Cap36 />
      <Stroke x1={40} y1={64} x2={34} y2={100} width={9} depth="far" />
      <Foot cx={36} cy={128} depth="far" />
      <Stroke x1={34} y1={100} x2={36} y2={126} width={7} depth="far" />
      <Stroke x1={40} y1={64} x2={46} y2={100} width={9} />
      <Stroke x1={46} y1={100} x2={44} y2={126} width={7} />
      <Foot cx={44} cy={128} />
      {equipment !== 'bodyweight' && <IllustratedEquipment equipment={equipment} x={26} y={102} scale={0.85} rotation={-15} />}
    </svg>
  );
}
// small helper kept separate to avoid confusion with hand cap circle
function Cap36() {
  return <circle cx={29} cy={102} r={3} fill={BRAND.limbNear} />;
}
function HingeEnd({ size, equipment }: Required<IlloProps>) {
  return (
    <svg viewBox="0 0 100 145" width={size} height={size * 1.45} fill="none" className="illo-pose-end">
      <Head cx={48} cy={18} />
      <Stroke x1={48} y1={25} x2={48} y2={66} width={11} />
      <Stroke x1={53} y1={34} x2={70} y2={30} width={7} />
      <Stroke x1={70} y1={30} x2={78} y2={29} width={4} />
      <circle cx={78} cy={29} r={3} fill={BRAND.limbNear} />
      <Stroke x1={44} y1={35} x2={36} y2={58} width={5} depth="far" />
      <Stroke x1={46} y1={66} x2={40} y2={100} width={9} depth="far" />
      <Stroke x1={40} y1={100} x2={44} y2={130} width={7} depth="far" />
      <Foot cx={46} cy={132} depth="far" />
      <Stroke x1={50} y1={66} x2={56} y2={100} width={9} />
      <Stroke x1={56} y1={100} x2={52} y2={130} width={7} />
      <Foot cx={50} cy={132} />
      {equipment !== 'bodyweight' && <IllustratedEquipment equipment={equipment} x={80} y={30} scale={0.95} rotation={5} />}
    </svg>
  );
}

// --- PUSH: arm extended -> pressed toward body, chest-level lean ---
function PushStart({ size, equipment }: Required<IlloProps>) {
  return (
    <svg viewBox="0 0 100 130" width={size} height={size * 1.3} fill="none">
      <Head cx={70} cy={44} depth="far" />
      <Stroke x1={64} y1={50} x2={40} y2={60} width={11} />
      <Stroke x1={54} y1={58} x2={68} y2={74} width={9} depth="far" />
      <Stroke x1={68} y1={74} x2={86} y2={94} width={6} depth="far" />
      <Foot cx={88} cy={98} depth="far" />
      <Stroke x1={40} y1={60} x2={20} y2={70} width={9} />
      <Foot cx={16} cy={74} />
      <Stroke x1={44} y1={54} x2={16} y2={56} width={7} />
      {equipment !== 'bodyweight' && <IllustratedEquipment equipment={equipment} x={14} y={58} scale={0.85} rotation={equipment === 'dumbbell' ? -20 : 0} />}
    </svg>
  );
}
function PushEnd({ size, equipment }: Required<IlloProps>) {
  return (
    <svg viewBox="0 0 100 130" width={size} height={size * 1.3} fill="none" className="illo-pose-end">
      <Head cx={54} cy={50} depth="far" />
      <Stroke x1={48} y1={56} x2={40} y2={60} width={11} />
      <Stroke x1={54} y1={58} x2={68} y2={74} width={9} depth="far" />
      <Stroke x1={68} y1={74} x2={86} y2={94} width={6} depth="far" />
      <Foot cx={88} cy={98} depth="far" />
      <Stroke x1={40} y1={60} x2={20} y2={70} width={9} />
      <Foot cx={16} cy={74} />
      <Stroke x1={44} y1={54} x2={32} y2={58} width={7} />
      {equipment !== 'bodyweight' && <IllustratedEquipment equipment={equipment} x={30} y={60} scale={0.85} rotation={equipment === 'dumbbell' ? -20 : 0} />}
    </svg>
  );
}

// --- PULL: arm extended forward -> pulled to ribs ---
function PullStart({ size, equipment }: Required<IlloProps>) {
  return (
    <svg viewBox="0 0 100 130" width={size} height={size * 1.3} fill="none">
      <Head cx={24} cy={24} depth="far" />
      <Stroke x1={30} y1={30} x2={40} y2={62} width={11} />
      <Stroke x1={36} y1={40} x2={20} y2={70} width={5} depth="far" />
      <Stroke x1={40} y1={62} x2={50} y2={96} width={9} depth="far" />
      <Foot cx={52} cy={100} depth="far" />
      <Stroke x1={40} y1={62} x2={32} y2={96} width={9} />
      <Foot cx={26} cy={100} />
      <Stroke x1={32} y1={40} x2={70} y2={40} width={7} />
      {equipment !== 'bodyweight' && <IllustratedEquipment equipment={equipment} x={72} y={40} scale={0.85} rotation={equipment === 'dumbbell' ? 15 : 0} />}
    </svg>
  );
}
function PullEnd({ size, equipment }: Required<IlloProps>) {
  return (
    <svg viewBox="0 0 100 130" width={size} height={size * 1.3} fill="none" className="illo-pose-end">
      <Head cx={24} cy={24} depth="far" />
      <Stroke x1={30} y1={30} x2={40} y2={62} width={11} />
      <Stroke x1={36} y1={40} x2={20} y2={70} width={5} depth="far" />
      <Stroke x1={40} y1={62} x2={50} y2={96} width={9} depth="far" />
      <Foot cx={52} cy={100} depth="far" />
      <Stroke x1={40} y1={62} x2={32} y2={96} width={9} />
      <Foot cx={26} cy={100} />
      <Stroke x1={32} y1={40} x2={46} y2={44} width={7} />
      {equipment !== 'bodyweight' && <IllustratedEquipment equipment={equipment} x={48} y={44} scale={0.85} rotation={equipment === 'dumbbell' ? 15 : 0} />}
    </svg>
  );
}

// --- CARRY: walking, weight held rigidly at the side ---
function CarryPose({ size, equipment, legForward }: Required<IlloProps> & { legForward: 'left' | 'right' }) {
  const frontX = legForward === 'left' ? 28 : 52;
  const backX = legForward === 'left' ? 52 : 28;
  return (
    <svg viewBox="0 0 100 130" width={size} height={size * 1.3} fill="none" className={legForward === 'right' ? 'illo-pose-end' : ''}>
      <Head cx={40} cy={18} />
      <Stroke x1={40} y1={25} x2={40} y2={58} width={11} />
      <Stroke x1={40} y1={36} x2={24} y2={44} width={7} depth="far" />
      <Stroke x1={40} y1={36} x2={56} y2={48} width={7} />
      {equipment !== 'bodyweight' && <IllustratedEquipment equipment={equipment} x={56} y={52} scale={0.85} rotation={equipment === 'dumbbell' ? 90 : 0} />}
      <Stroke x1={38} y1={58} x2={backX} y2={90} width={9} depth="far" />
      <Foot cx={backX + (legForward === 'left' ? 4 : -4)} cy={94} depth="far" />
      <Stroke x1={42} y1={58} x2={frontX} y2={92} width={9} />
      <Foot cx={frontX + (legForward === 'left' ? -4 : 4)} cy={96} />
    </svg>
  );
}

// --- CORE: plank with leg lift (isometric, single pose + hold glow) ---
function CoreHold({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 130 90" width={size * 1.4} height={size * 0.95} fill="none">
      <Head cx={20} cy={44} depth="far" />
      <Stroke x1={28} y1={48} x2={68} y2={50} width={11} />
      <Stroke x1={30} y1={50} x2={24} y2={70} width={7} />
      <Foot cx={22} cy={74} />
      <Stroke x1={68} y1={50} x2={92} y2={70} width={7} depth="far" />
      <Foot cx={94} cy={74} depth="far" />
      <g className="illo-hold-glow">
        <Stroke x1={68} y1={50} x2={100} y2={30} width={9} color={BRAND.xp} />
        <Foot cx={102} cy={26} depth="near" />
      </g>
    </svg>
  );
}

// --- MOBILITY: deep lunge + overhead reach (isometric hold) ---
function MobilityHold({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 100 130" width={size} height={size * 1.3} fill="none">
      <path d="M18 100 Q50 20 82 100" stroke={BRAND.mobility} strokeWidth="1.5" strokeDasharray="3 5" fill="none" opacity="0.4" />
      <Head cx={48} cy={28} />
      <Stroke x1={48} y1={35} x2={44} y2={76} width={11} />
      <g className="illo-hold-glow">
        <Stroke x1={50} y1={44} x2={78} y2={18} width={7} color={BRAND.mobility} />
      </g>
      <Stroke x1={44} y1={48} x2={26} y2={68} width={6} depth="far" />
      <Stroke x1={44} y1={76} x2={22} y2={92} width={9} depth="far" />
      <Stroke x1={22} y1={92} x2={24} y2={110} width={7} depth="far" />
      <Foot cx={26} cy={112} depth="far" />
      <Stroke x1={44} y1={76} x2={68} y2={88} width={9} />
      <Stroke x1={68} y1={88} x2={64} y2={112} width={7} />
      <Foot cx={62} cy={116} />
    </svg>
  );
}

// --- CONDITIONING: squat -> explosive jump ---
function ConditioningStart({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 100 130" width={size} height={size * 1.3} fill="none">
      <Head cx={48} cy={46} />
      <Stroke x1={48} y1={53} x2={48} y2={68} width={11} />
      <Stroke x1={48} y1={58} x2={30} y2={64} width={7} />
      <Stroke x1={48} y1={58} x2={66} y2={62} width={7} depth="far" />
      <Stroke x1={44} y1={68} x2={32} y2={82} width={9} />
      <Stroke x1={32} y1={82} x2={36} y2={110} width={7} />
      <Foot cx={34} cy={114} />
      <Stroke x1={52} y1={68} x2={64} y2={82} width={9} depth="far" />
      <Stroke x1={64} y1={82} x2={60} y2={110} width={7} depth="far" />
      <Foot cx={62} cy={114} depth="far" />
    </svg>
  );
}
function ConditioningEnd({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 100 130" width={size} height={size * 1.3} fill="none" className="illo-pose-end">
      <Head cx={48} cy={30} />
      <Stroke x1={48} y1={37} x2={48} y2={52} width={11} />
      <Stroke x1={48} y1={38} x2={22} y2={10} width={7} color={BRAND.conditioning} />
      <Stroke x1={48} y1={38} x2={72} y2={10} width={7} color={BRAND.conditioning} />
      <Stroke x1={44} y1={52} x2={34} y2={82} width={9} />
      <Foot cx={32} cy={88} />
      <Stroke x1={52} y1={52} x2={62} y2={82} width={9} depth="far" />
      <Foot cx={64} cy={88} depth="far" />
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
  size?: number;
}

export function ExerciseIllustration({ category, equipment, size = 90 }: ExerciseIllustrationProps) {
  const gap = size * 0.35;

  if (category === 'core') {
    return (
      <div className="relative">
        <CoreHold size={size} />
        <span className="absolute -bottom-1 right-2 text-[10px] font-bold tracking-wider" style={{ color: BRAND.xp, fontFamily: "'Oswald', sans-serif" }}>HOLD</span>
      </div>
    );
  }
  if (category === 'mobility') {
    return (
      <div className="relative">
        <MobilityHold size={size} />
        <span className="absolute bottom-0 right-4 text-[10px] font-bold tracking-wider" style={{ color: BRAND.mobility, fontFamily: "'Oswald', sans-serif" }}>HOLD & BREATHE</span>
      </div>
    );
  }
  if (category === 'carry') {
    return (
      <div className="flex items-center gap-1">
        <CarryPose size={size * 0.85} equipment={equipment} legForward="left" />
        <svg width={gap} height={size * 0.4} viewBox={`0 0 ${gap} 40`}>
          <ArrowMarkers />
          <line className="illo-arrow" x1="4" y1="20" x2={gap - 8} y2="20" stroke={BRAND.mobility} strokeWidth="3" strokeLinecap="round" markerEnd="url(#illo-arrow-pull-head)" />
        </svg>
        <CarryPose size={size * 0.85} equipment={equipment} legForward="right" />
      </div>
    );
  }
  if (category === 'conditioning') {
    const unit = size / 100;
    const arrowX = size + gap / 2;
    return (
      <div className="relative" style={{ width: size * 2 + gap, height: size * 1.3 }}>
        <div className="absolute left-0 top-0"><ConditioningStart size={size} /></div>
        <div className="absolute" style={{ left: size + gap, top: 0 }}><ConditioningEnd size={size} /></div>
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
        <PullStart size={size * 0.9} equipment={equipment} />
        <svg width={gap} height={size * 0.5} viewBox={`0 0 ${gap} 50`}>
          <ArrowMarkers />
          <line className="illo-arrow" x1={gap - 4} y1="20" x2="6" y2="20" stroke={BRAND.mobility} strokeWidth="3" strokeLinecap="round" markerEnd="url(#illo-arrow-pull-head)" />
        </svg>
        <PullEnd size={size * 0.9} equipment={equipment} />
      </div>
    );
  }
  if (category === 'squat') {
    const unit = size / 100;
    const arrowX = size + gap / 2;
    return (
      <div className="relative" style={{ width: size * 2 + gap, height: size * 1.45 }}>
        <div className="absolute left-0 top-0"><SquatStart size={size} equipment={equipment} /></div>
        <div className="absolute" style={{ left: size + gap, top: 0 }}><SquatEnd size={size} equipment={equipment} /></div>
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
        <div className="absolute left-0 top-0"><PushStart size={size} equipment={equipment} /></div>
        <div className="absolute" style={{ left: size + gap, top: 0 }}><PushEnd size={size} equipment={equipment} /></div>
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
        <HingeStart size={size} equipment={equipment} />
      </div>
      <div className="absolute" style={{ left: size * 0.95, top: 0 }}>
        <HingeEnd size={size} equipment={equipment} />
      </div>
      <svg className="absolute" width={size * 2.3} height={size * 1.45} viewBox={`0 0 ${size * 2.3} ${size * 1.45}`} style={{ left: 0, top: 0 }}>
        <ArrowMarkers />
        <path className="illo-arrow" d={`M ${26 * unit * 0.82} ${104 * unit * 0.82} Q ${size * 1.1} ${size * 0.9} ${size * 0.95 + 70 * unit} ${32 * unit}`}
          fill="none" stroke={BRAND.mobility} strokeWidth="3" strokeLinecap="round" markerEnd="url(#illo-arrow-pull-head)" />
      </svg>
    </div>
  );
}
