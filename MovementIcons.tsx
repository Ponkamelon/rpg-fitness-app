'use client';

import React from 'react';

// ============================================================
// WODXP BRAND PALETTE
// Energy Lime / Ignite Orange / Performance Blue, per brand board.
// Equipment mapping follows the brand icons directly:
//   Kettlebell -> Strength -> Energy Lime
//   Dumbbell   -> Power    -> Ignite Orange
//   Bodyweight -> Anywhere -> Performance Blue
// ============================================================
export const BRAND = {
  bg: '#0D0D0D',
  surface: '#1A1A1A',
  surfaceRaised: '#2B2B2B',
  border: '#444444',
  textPrimary: '#EDEDED',
  textSecondary: '#9A9A9A',

  // Core brand colors (primary shade of each)
  lime: '#A8FF00',
  orange: '#FF6A00',
  blue: '#007BFF',

  // Tints, darkest/most-saturated to lightest per palette (secondary accents,
  // hover states, or to keep two same-family elements visually distinct)
  limeTints: ['#A8FF00', '#7DDB00', '#C6FF4D', '#E1FF80', '#F0FFD1'],
  orangeTints: ['#FF6A00', '#FFBC1A', '#FFAE3D', '#FFD166', '#FFE9B3'],
  blueTints: ['#007BFF', '#339DFF', '#66B8FF', '#99CEFF', '#CCE6FF'],

  // Semantic aliases used throughout the app
  xp: '#A8FF00',           // Strength / XP / success actions
  mobility: '#007BFF',     // Mobility attribute
  conditioning: '#FF6A00', // Conditioning attribute
  boss: '#FF6A00',         // Boss challenge / urgency (reuses primary orange)
  kettlebell: '#A8FF00',
  dumbbell: '#FFAE3D',     // Orange tint, kept distinct from boss's primary orange
  bodyweight: '#007BFF',

  limbNear: '#EDEDED',
  limbFar: '#5A5A5A',
  ghost: '#3A3A3A',
};

/** @deprecated kept as an alias so any lingering references don't break; use BRAND. */
export const NEON = BRAND;

export type Equipment = 'kettlebell' | 'dumbbell' | 'bodyweight';
export type ExerciseCategory = 'push' | 'pull' | 'squat' | 'hinge' | 'carry' | 'core' | 'mobility' | 'conditioning';

// ============================================================
// Shared glow filter - applied to icon strokes for an energetic pop
// ============================================================
export const neonIconStyles = `
  .neon-icon svg { filter: drop-shadow(0 0 3px currentColor); }
  .neon-glow-kb { filter: drop-shadow(0 0 4px ${BRAND.kettlebell}); }
  .neon-glow-db { filter: drop-shadow(0 0 4px ${BRAND.dumbbell}); }
  .neon-glow-bw { filter: drop-shadow(0 0 4px ${BRAND.bodyweight}); }
`;

// ============================================================
// Body primitives
// ============================================================
function Head({ cx, cy, r = 6 }: { cx: number; cy: number; r?: number }) {
  return <circle cx={cx} cy={cy} r={r} fill={BRAND.limbNear} />;
}

function Limb({ x1, y1, x2, y2, width = 7, depth = 'near' }: {
  x1: number; y1: number; x2: number; y2: number; width?: number; depth?: 'near' | 'far';
}) {
  const stroke = depth === 'far' ? BRAND.limbFar : BRAND.limbNear;
  const strokeWidth = depth === 'far' ? width - 1.5 : width;
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />;
}

function Torso({ cx, topY, bottomY, shoulderWidth, hipWidth, rotation = 0 }: {
  cx: number; topY: number; bottomY: number; shoulderWidth: number; hipWidth: number; rotation?: number;
}) {
  const points = [
    [cx - shoulderWidth / 2, topY],
    [cx + shoulderWidth / 2, topY],
    [cx + hipWidth / 2, bottomY],
    [cx - hipWidth / 2, bottomY],
  ].map((p) => p.join(',')).join(' ');
  return <polygon points={points} fill={BRAND.limbNear} transform={rotation ? `rotate(${rotation} ${cx} ${(topY + bottomY) / 2})` : undefined} />;
}

// ============================================================
// Equipment glyphs - brand colored, glowing
// ============================================================
function KettlebellGlyph({ x = 0, y = 0, scale = 1, rotation = 0 }: { x?: number; y?: number; scale?: number; rotation?: number }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${rotation}) scale(${scale})`} className="neon-glow-kb">
      <path d="M-5 -6 C-5 -12 -2.5 -15 0 -15 C2.5 -15 5 -12 5 -6" stroke={BRAND.kettlebell} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <rect x="-2.5" y="-7" width="5" height="4" rx="1.5" fill={BRAND.kettlebell} />
      <path d="M-9 -1 C-9 6 -7 13 0 13 C7 13 9 6 9 -1 C9 -4 6 -5 0 -5 C-6 -5 -9 -4 -9 -1 Z" fill={BRAND.kettlebell} fillOpacity="0.85" stroke={BRAND.kettlebell} strokeWidth="1" />
    </g>
  );
}

function DumbbellGlyph({ x = 0, y = 0, rotation = 0, scale = 1 }: { x?: number; y?: number; rotation?: number; scale?: number }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${rotation}) scale(${scale})`} className="neon-glow-db">
      <rect x="-7" y="-1.5" width="14" height="3" rx="1.5" fill={BRAND.dumbbell} fillOpacity="0.6" />
      <rect x="-11" y="-5" width="6" height="10" rx="2" fill={BRAND.dumbbell} />
      <rect x="5" y="-5" width="6" height="10" rx="2" fill={BRAND.dumbbell} />
    </g>
  );
}

function BodyweightGlyph({ x = 0, y = 0, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  // Small radiating burst to indicate "your own body is the resistance"
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} className="neon-glow-bw" opacity="0.9">
      <circle cx="0" cy="0" r="4" fill="none" stroke={BRAND.bodyweight} strokeWidth="1.5" />
      <circle cx="0" cy="0" r="1.5" fill={BRAND.bodyweight} />
    </g>
  );
}

function EquipmentGlyph({ equipment, ...props }: { equipment: Equipment } & Record<string, any>) {
  if (equipment === 'kettlebell') return <KettlebellGlyph {...props} />;
  if (equipment === 'dumbbell') return <DumbbellGlyph {...props} />;
  return null; // bodyweight renders no held object
}

// ============================================================
// Category icons - one simple, readable pose per movement pattern.
// Each accepts an `equipment` prop so the same icon works whether
// the exercise uses a kettlebell, dumbbell, or bodyweight only.
// ============================================================
interface IconProps { size?: number; equipment?: Equipment; }
const Ground = () => <line x1="8" y1="58" x2="56" y2="58" stroke={BRAND.border} strokeWidth="2" strokeLinecap="round" />;

export function SquatIcon({ size = 40, equipment = 'kettlebell' }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none">
      <Ground />
      <Limb x1={34} y1={40} x2={42} y2={48} width={7} depth="far" />
      <Limb x1={42} y1={48} x2={40} y2={57} width={7} depth="far" />
      <Head cx={32} cy={12} />
      <Torso cx={32} topY={18} bottomY={40} shoulderWidth={18} hipWidth={15} />
      <Limb x1={26} y1={24} x2={24} y2={34} width={5} depth="far" />
      <Limb x1={38} y1={24} x2={40} y2={34} width={5} />
      {equipment !== 'bodyweight' ? <EquipmentGlyph equipment={equipment} x={32} y={36} scale={0.75} /> : <BodyweightGlyph x={32} y={36} scale={0.7} />}
      <Limb x1={29} y1={40} x2={20} y2={49} width={7} />
      <Limb x1={20} y1={49} x2={24} y2={58} width={7} />
    </svg>
  );
}

export function PushIcon({ size = 40, equipment = 'dumbbell' }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none">
      <Ground />
      <Limb x1={38} y1={32} x2={48} y2={44} width={5} depth="far" />
      <Limb x1={48} y1={44} x2={52} y2={48} width={5} depth="far" />
      <Head cx={46} cy={18} r={5.5} />
      <Torso cx={36} topY={22} bottomY={32} shoulderWidth={22} hipWidth={10} rotation={28} />
      <Limb x1={34} y1={32} x2={42} y2={46} width={6} />
      <Limb x1={42} y1={46} x2={48} y2={50} width={5} />
      <line x1={22} y1={28} x2={10} y2={34} stroke={BRAND.limbNear} strokeWidth="7" strokeLinecap="round" />
      {equipment !== 'bodyweight' ? <EquipmentGlyph equipment={equipment} x={10} y={34} scale={0.7} rotation={equipment === 'dumbbell' ? -25 : 0} /> : <BodyweightGlyph x={10} y={34} scale={0.6} />}
    </svg>
  );
}

export function PullIcon({ size = 40, equipment = 'kettlebell' }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none">
      <Ground />
      <Limb x1={26} y1={44} x2={20} y2={58} width={7} depth="far" />
      <Head cx={20} cy={18} r={5.5} />
      <Torso cx={24} topY={22} bottomY={44} shoulderWidth={16} hipWidth={13} rotation={22} />
      <Limb x1={20} y1={28} x2={14} y2={40} width={5} depth="far" />
      <Limb x1={28} y1={44} x2={30} y2={58} width={7} />
      <line x1={28} y1={30} x2={46} y2={24} stroke={BRAND.limbNear} strokeWidth="7" strokeLinecap="round" />
      {equipment !== 'bodyweight' ? <EquipmentGlyph equipment={equipment} x={46} y={24} scale={0.7} /> : <BodyweightGlyph x={46} y={24} scale={0.6} />}
    </svg>
  );
}

export function HingeIcon({ size = 40, equipment = 'kettlebell' }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none">
      <Ground />
      <Limb x1={30} y1={44} x2={24} y2={58} width={7} depth="far" />
      <Limb x1={30} y1={44} x2={36} y2={58} width={7} />
      <Head cx={30} cy={14} r={5.5} />
      <Torso cx={30} topY={20} bottomY={44} shoulderWidth={17} hipWidth={14} />
      <Limb x1={27} y1={28} x2={22} y2={38} width={5} depth="far" />
      <Limb x1={33} y1={28} x2={38} y2={38} width={5} />
      {equipment !== 'bodyweight' ? <EquipmentGlyph equipment={equipment} x={30} y={40} scale={0.75} rotation={equipment === 'dumbbell' ? 90 : 0} /> : <BodyweightGlyph x={30} y={40} scale={0.65} />}
    </svg>
  );
}

export function CarryIcon({ size = 40, equipment = 'kettlebell' }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none">
      <Ground />
      <Limb x1={28} y1={40} x2={22} y2={58} width={7} depth="far" />
      <Head cx={28} cy={12} r={5.5} />
      <Torso cx={28} topY={18} bottomY={40} shoulderWidth={16} hipWidth={13} />
      <Limb x1={24} y1={24} x2={18} y2={30} width={5} depth="far" />
      <Limb x1={32} y1={24} x2={38} y2={36} width={5} />
      {equipment !== 'bodyweight' ? <EquipmentGlyph equipment={equipment} x={39} y={39} scale={0.7} rotation={equipment === 'dumbbell' ? 90 : 0} /> : <BodyweightGlyph x={39} y={39} scale={0.6} />}
      <Limb x1={28} y1={40} x2={34} y2={58} width={7} />
    </svg>
  );
}

export function CoreIcon({ size = 40 }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none">
      <Ground />
      <Head cx={12} cy={38} r={5.5} />
      <Torso cx={30} topY={34} bottomY={42} shoulderWidth={30} hipWidth={12} />
      <Limb x1={18} y1={40} x2={16} y2={54} width={5} />
      <Limb x1={40} y1={40} x2={46} y2={54} width={7} depth="far" />
      <line x1={40} y1={40} x2={54} y2={32} stroke={BRAND.xp} strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}

export function MobilityIcon({ size = 40 }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none">
      <Ground />
      <path d="M12 46 Q32 10 52 46" stroke={BRAND.mobility} strokeWidth="1.5" strokeDasharray="3 4" fill="none" opacity="0.5" />
      <Limb x1={28} y1={40} x2={14} y2={50} width={6} depth="far" />
      <Head cx={26} cy={14} r={5.5} />
      <Torso cx={26} topY={20} bottomY={40} shoulderWidth={16} hipWidth={13} />
      <Limb x1={32} y1={24} x2={44} y2={12} width={5} />
      <Limb x1={24} y1={40} x2={38} y2={48} width={7} />
      <Limb x1={38} y1={48} x2={36} y2={58} width={6} />
    </svg>
  );
}

export function ConditioningIcon({ size = 40 }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none">
      <Ground />
      <Head cx={32} cy={14} r={5.5} />
      <Torso cx={32} topY={20} bottomY={38} shoulderWidth={16} hipWidth={13} />
      <line x1={32} y1={26} x2={44} y2={20} stroke={BRAND.conditioning} strokeWidth="6" strokeLinecap="round" />
      <line x1={32} y1={26} x2={20} y2={20} stroke={BRAND.conditioning} strokeWidth="6" strokeLinecap="round" />
      <line x1={30} y1={38} x2={38} y2={54} stroke={BRAND.limbNear} strokeWidth="7" strokeLinecap="round" />
      <line x1={30} y1={38} x2={20} y2={54} stroke={BRAND.limbNear} strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}

export const CATEGORY_ICONS: Record<ExerciseCategory, React.ComponentType<IconProps>> = {
  squat: SquatIcon,
  push: PushIcon,
  pull: PullIcon,
  hinge: HingeIcon,
  carry: CarryIcon,
  core: CoreIcon,
  mobility: MobilityIcon,
  conditioning: ConditioningIcon,
};

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  squat: 'Squat', push: 'Push', pull: 'Pull', hinge: 'Hinge',
  carry: 'Carry', core: 'Core', mobility: 'Mobility', conditioning: 'Conditioning',
};

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  kettlebell: 'Kettlebell', dumbbell: 'Dumbbell', bodyweight: 'Bodyweight',
};

export const EQUIPMENT_COLORS: Record<Equipment, string> = {
  kettlebell: BRAND.kettlebell, dumbbell: BRAND.dumbbell, bodyweight: BRAND.bodyweight,
};

/** Picks a single representative equipment value from an exercise's equipment array,
 *  preferring kettlebell/dumbbell over bodyweight so the icon shows the actual tool
 *  used rather than defaulting to bodyweight when multiple options exist. */
export function pickPrimaryEquipment(equipmentList: string[]): Equipment {
  if (equipmentList.includes('kettlebell')) return 'kettlebell';
  if (equipmentList.includes('dumbbell')) return 'dumbbell';
  return 'bodyweight';
}
