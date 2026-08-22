'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion, useMotionValue, animate } from 'motion/react';
import {
  Flame, ChevronRight, Search, Lock, Trophy, Swords, Plus, Crown,
  TrendingUp, Award, Sparkles, Target, Clock, Gauge,
  Minus, Check, ArrowLeft,
} from 'lucide-react';
import {
  CATEGORY_ICONS, CATEGORY_LABELS, EQUIPMENT_LABELS, EQUIPMENT_COLORS,
  pickPrimaryEquipment, NEON, neonIconStyles, type ExerciseCategory, type Equipment,
} from './MovementIcons';
import { ExerciseIllustration, illustrationStyles } from './ExerciseIllustrations';

// ─── Types ───────────────────────────────────────────────────────────────────
interface User { id: string; email: string; username: string; }
interface UserStats {
  level: number; xp_total: number;
  xp_strength: number; xp_mobility: number; xp_conditioning: number;
  level_strength: number; level_mobility: number; level_conditioning: number;
  current_streak: number; longest_streak: number; streak_freeze_count: number;
}
interface Exercise {
  id: string; name: string; category: ExerciseCategory; difficulty: string;
  equipment: string[]; primary_attribute: string; unlock_level: number;
  xp_value: number; default_sets: number; default_reps: number;
  default_weight_kg: number; illustration_url?: string; instructions?: string;
}
interface BossExercise { exercise_name: string; reps?: number; duration_seconds?: number; }
interface LevelChallenge {
  level: number; name: string; description: string; exercise_name: string | null;
  target_reps: number | null; target_duration_seconds: number | null;
  structure: BossExercise[] | null; time_cap_seconds: number | null;
  equipment: string[]; scaled_description: string | null; xp_reward: number;
}
interface BossBattle {
  level: number; name: string; description: string; rounds: number;
  structure: BossExercise[]; scaled_structure: BossExercise[] | null;
  time_cap_seconds: number | null; medal_silver_seconds: number | null; medal_gold_seconds: number | null;
  xp_reward: number;
}
interface AllTimeStats { totalWorkouts: number; totalKg: number; totalSeconds: number; }
interface ClassicWod {
  slot: number; name: string; unlock_level: number; description: string | null;
  structure: BossExercise[] | null; time_cap_seconds: number | null;
  wod_type: string | null; difficulty_tier: string | null;
  scoring_type: 'time' | 'rounds' | 'points'; format_label: string | null;
  amrap_duration_seconds: number | null;
  medal_bronze_value: number | null; medal_silver_value: number | null; medal_gold_value: number | null;
  is_ready: boolean;
}
interface WodSummary { completed: number; gold: number; silver: number; bronze: number; }
interface Props {
  user: User; stats: UserStats; exercises: Exercise[]; allTimeStats: AllTimeStats;
  levelChallenges: LevelChallenge[]; bossBattles: BossBattle[]; totalExerciseCount: number;
  classicWods: ClassicWod[]; wodSummary: WodSummary; wodMedals: Record<number, string>;
}

// ─── Design tokens (neon-on-dark) ─────────────────────────────────────────────
const C = {
  bg: NEON.bg, surface: NEON.surface, raised: NEON.surfaceRaised, border: NEON.border,
  text: NEON.textPrimary, muted: NEON.textSecondary, xp: NEON.xp, boss: NEON.boss,
  strength: NEON.xp, mobility: NEON.mobility, conditioning: NEON.conditioning,
  kettlebell: NEON.kettlebell, dumbbell: NEON.dumbbell, bodyweight: NEON.bodyweight,
};

// ─── XP helpers ──────────────────────────────────────────────────────────────
function xpForLevel(level: number) { return Math.round(60 * Math.pow(level, 2.1)); }
function progressToNext(xp: number, level: number) {
  const current = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { progress: Math.min(1, (xp - current) / (next - current)), xpLeft: next - xp };
}
function xpDerivedLevel(xpTotal: number): number {
  let lvl = 1;
  for (let i = 1; i <= 50; i++) if (xpTotal >= xpForLevel(i)) lvl = i;
  return lvl;
}

/** Computes the current Level Challenge / Boss Battle gating state.
 *  `level` (cleared level) only advances via completing a challenge or
 *  boss — see clear_level_challenge / attempt_boss_battle in the DB. */
function getLevelProgress(stats: UserStats, levelChallenges: LevelChallenge[], bossBattles: BossBattle[]) {
  const pendingLevel = stats.level + 1;
  const isBossPending = pendingLevel % 5 === 0;
  const isComplete = pendingLevel > 50;
  const derivedLevel = xpDerivedLevel(stats.xp_total);
  const isUnlocked = !isComplete && derivedLevel >= pendingLevel;
  const isXpFrozen = isUnlocked && isBossPending; // matches award_xp's freeze logic
  const challenge = !isComplete && !isBossPending ? levelChallenges.find((c) => c.level === pendingLevel) ?? null : null;
  const boss = !isComplete && isBossPending ? bossBattles.find((b) => b.level === pendingLevel) ?? null : null;
  return { pendingLevel, isBossPending, isComplete, isUnlocked, isXpFrozen, challenge, boss };
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
const SG = { fontFamily: "'Oswald', sans-serif" };
const MO = { fontFamily: "'JetBrains Mono', monospace" };

/**
 * Wraps a screen's content with a soft fade + slide-up entrance whenever it
 * mounts. This is a first, low-risk pass at "page transitions" — it doesn't
 * yet animate the OUTGOING screen (that needs AnimatePresence around a
 * single conditional render point, which is a bigger structural change to
 * revisit in the broader animation pass).
 */
/**
 * Direction-aware page slide, per the Motion & Visual Design spec section 11:
 * forward navigation slides in from the right (x: 16 -> 0), back navigation
 * slides in from the left (x: -16 -> 0). Direction is inferred from a simple
 * depth ranking per screen — deeper screens are "forward", shallower ones
 * (like returning to the tab bar) are "back" — so call sites don't each need
 * to declare direction explicitly.
 */
function PageTransition({ children, screenKey }: { children: React.ReactNode; screenKey: string }) {
  const prevDepthRef = React.useRef(0);
  const depth = SCREEN_DEPTH[screenKey] ?? 0;
  const direction = depth >= prevDepthRef.current ? 1 : -1;
  prevDepthRef.current = depth;

  return (
    <motion.div
      key={screenKey}
      initial={{ opacity: 0, x: 16 * direction }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Animates a numeric value smoothly counting from its previous value to the
 * new one, per spec section 14/17 ("NumberRoll rather than instant
 * replacement"). Used for XP, attribute levels, stats, and workout counters.
 */
function NumberRoll({ value, className, style, duration = 0.6 }: {
  value: number; className?: string; style?: React.CSSProperties; duration?: number;
}) {
  const motionValue = useMotionValue(value);
  const [display, setDisplay] = useState(value);
  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      motionValue.set(value);
      setDisplay(value);
      return;
    }
    const controls = animate(motionValue, value, { duration, ease: 'easeOut' });
    const unsubscribe = motionValue.on('change', (v) => setDisplay(Math.round(v)));
    return () => { controls.stop(); unsubscribe(); };
  }, [value]);

  return <span className={className} style={style}>{display}</span>;
}

/**
 * Shared press/release feedback for interactive buttons, per spec section 9:
 * scale 1 -> 0.96 on press, spring release back to 1 (stiffness 450,
 * damping 28). The static Lime glow on primary CTAs is already handled via
 * `boxShadow` in each button's own style — an animated "glow pulse on
 * release" is a nice P1/P2 polish item to revisit once this base motion is
 * confirmed feeling right, rather than risk an unreliable first pass.
 */

/**
 * TEST — one LED-streak border effect, applied to a single flagship button
 * first so it can be evaluated before rolling out to every CTA.
 *
 * On press: a short (~13% of the perimeter) light streak travels once
 * around the rounded border. The streak's OWN color continuously cycles
 * Lime -> Orange -> Blue -> Lime as it moves (not three separate dots) —
 * done by rotating a repeating gradient underneath a moving dashed stroke,
 * so the visible dash samples a different point in the color cycle every
 * frame. A blur filter behind the stroke gives the glow/trail. Runs once
 * per press (~700ms), then unmounts itself; button scale (1 -> 0.97 -> 1)
 * is the standard tap spring, layered underneath.
 *
 * `radius` should match the button's actual Tailwind rounding in px
 * (rounded-2xl = 16, rounded-xl = 12, etc.) so the streak traces the real
 * corners rather than cutting across them.
 */
function LedBorderButton({ children, onClick, className, style, disabled, radius = 16 }: {
  children: React.ReactNode; onClick?: () => void; className?: string; style?: React.CSSProperties;
  disabled?: boolean; radius?: number;
}) {
  const [playing, setPlaying] = useState(false);
  const reactId = React.useId().replace(/[:]/g, '');

  // The whole point of this effect is to be SEEN before anything else
  // happens — for CTAs that navigate or change screens on click (Generate
  // Workout, Finish & Save, etc.), calling onClick immediately would unmount
  // this button mid-animation, so the streak never gets a chance to render.
  // Delaying the actual action by the animation's own duration guarantees
  // it plays out first, on every button this is used on.
  const ANIMATION_MS = 560;
  const handleClick = () => {
    if (disabled) return;
    setPlaying(true);
    window.setTimeout(() => {
      setPlaying(false);
      onClick?.();
    }, ANIMATION_MS);
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      className={className}
      style={{ position: 'relative', ...style }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 450, damping: 28 }}
    >
      {children}
      {playing && (
        <svg className="pointer-events-none absolute inset-0" width="100%" height="100%" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <defs>
            {/* Each stop cycles through the WODXP colors on its own, phase-
                offset from the others — this makes the color flow smoothly
                across the gradient over time, independent of the button's
                exact geometry (much more robust than rotating/translating
                the gradient shape to try to track a rect's stroke path). */}
            <linearGradient id={`led-grad-${reactId}`} gradientUnits="objectBoundingBox" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#A8FF00">
                <animate attributeName="stop-color" values="#A8FF00;#FF6A00;#007BFF;#A8FF00" dur="0.525s" repeatCount="1" fill="freeze" />
              </stop>
              <stop offset="50%" stopColor="#FF6A00">
                <animate attributeName="stop-color" values="#FF6A00;#007BFF;#A8FF00;#FF6A00" dur="0.525s" repeatCount="1" fill="freeze" />
              </stop>
              <stop offset="100%" stopColor="#007BFF">
                <animate attributeName="stop-color" values="#007BFF;#A8FF00;#FF6A00;#007BFF" dur="0.525s" repeatCount="1" fill="freeze" />
              </stop>
            </linearGradient>
            <filter id={`led-glow-${reactId}`} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect
            x="0" y="0"
            width="100%" height="100%"
            rx={radius} ry={radius}
            fill="none"
            stroke={`url(#led-grad-${reactId})`}
            strokeWidth={2.9}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="13 87"
            filter={`url(#led-glow-${reactId})`}
          >
            <animate attributeName="stroke-dashoffset" from="0" to="-100" dur="0.525s" repeatCount="1" fill="freeze" />
          </rect>
        </svg>
      )}
    </motion.button>
  );
}

/**
 * Shared modal shell for centered-card modals, per spec section 12: backdrop
 * fades to 65% opacity, card springs in with a slight scale + rise. Used for
 * Quit Workout and future reward modals (Level Up, Boss Unlock, Medal, PR).
 */
function ModalTransition({ children, onBackdropClick }: { children: React.ReactNode; onBackdropClick?: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      initial={{ backgroundColor: 'rgba(0,0,0,0)' }}
      animate={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      transition={{ duration: 0.2 }}
      onClick={onBackdropClick}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/**
 * Keeps the screen from sleeping/dimming while `active` is true, using the
 * standard Screen Wake Lock API. Used during running timers (Boss Battles,
 * Classic WODs, timed Level Challenges) so the phone doesn't lock mid-set.
 * Fails silently on browsers without support — the timer itself still
 * works fine, the screen just might dim on its own timeout there.
 */
function useWakeLock(active: boolean) {
  const wakeLockRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (!active) {
      wakeLockRef.current?.release?.().catch(() => {});
      wakeLockRef.current = null;
      return;
    }

    let cancelled = false;
    const requestLock = async () => {
      try {
        if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
          const lock = await (navigator as any).wakeLock.request('screen');
          if (cancelled) {
            lock.release().catch(() => {});
          } else {
            wakeLockRef.current = lock;
          }
        }
      } catch {
        // Wake Lock not available/permitted here — ignore, timer still works.
      }
    };
    requestLock();

    // The OS releases the lock automatically when the tab is backgrounded
    // (e.g. switching apps) — re-acquire it once the page is visible again.
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !wakeLockRef.current) requestLock();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      wakeLockRef.current?.release?.().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [active]);
}

/**
 * Real illustrated exercise images (from the WODXP Exercise Image Production
 * Pack). Only a first batch (22 of 798 planned) exist so far — this table
 * only lists what's actually been generated and integrated; everything else
 * still falls back to the programmatic pose illustration. Keyed by
 * "Exercise Name|equipment" to disambiguate exercises available in more than
 * one equipment version.
 */
const EXERCISE_ILLUSTRATION_IMAGES: Record<string, string> = {
  'Alternating Curl|dumbbell': '/exercise-images/dumbbell/alternating_curl.png',
  'Forward Lunge|dumbbell': '/exercise-images/dumbbell/forward_lunge__dumbbell.png',
  'Alternating Swing|kettlebell': '/exercise-images/kettlebell/alternating_swing.png',
  'Arnold Press|dumbbell': '/exercise-images/dumbbell/arnold_press.png',
  'Bear Crawl|bodyweight': '/exercise-images/bodyweight/bear_crawl.png',
  'Bulgarian Split Squat|kettlebell': '/exercise-images/kettlebell/bulgarian_split_squat__kettlebell.png',
  'Burpee|bodyweight': '/exercise-images/bodyweight/burpee.png',
  'Dumbbell Chest Press|dumbbell': '/exercise-images/dumbbell/dumbbell_chest_press.png',
  'Clean|kettlebell': '/exercise-images/kettlebell/clean.png',
  'Kettlebell Deadlift|kettlebell': '/exercise-images/kettlebell/kettlebell_deadlift.png',
  'Decline Push-Up|bodyweight': '/exercise-images/bodyweight/decline_push_up.png',
  'Diamond Push-Up|bodyweight': '/exercise-images/bodyweight/diamond_push_up.png',
  'Farmer Carry|kettlebell': '/exercise-images/kettlebell/farmer_carry.png',
  'Hammer Curl|dumbbell': '/exercise-images/dumbbell/hammer_curl.png',
  'Goblet Squat|kettlebell': '/exercise-images/kettlebell/goblet_squat__kettlebell.png',
  'Hip Thrust|bodyweight': '/exercise-images/bodyweight/hip_thrust__bodyweight.png',
  'Incline Dumbbell Press|dumbbell': '/exercise-images/dumbbell/incline_dumbbell_press.png',
  'Inchworm|bodyweight': '/exercise-images/bodyweight/inchworm.png',
  'Snatch|kettlebell': '/exercise-images/kettlebell/snatch.png',
  'Lateral Raise|dumbbell': '/exercise-images/dumbbell/lateral_raise.png',
  'Mountain Climber|bodyweight': '/exercise-images/bodyweight/mountain_climber.png',
  'Romanian Deadlift|kettlebell': '/exercise-images/kettlebell/romanian_deadlift__kettlebell.png',
  // Batch 2 + 3 additions:
  'Reverse Lunge|bodyweight': '/exercise-images/bodyweight/reverse_lunge__bodyweight.png',
  'Bent-Over Row|dumbbell': '/exercise-images/dumbbell/bent_over_row.png',
  'Plank|bodyweight': '/exercise-images/bodyweight/plank.png',
  'Side Plank|bodyweight': '/exercise-images/bodyweight/side_plank.png',
  'Upright Row|dumbbell': '/exercise-images/dumbbell/upright_row__dumbbell.png',
  'High Pull|kettlebell': '/exercise-images/kettlebell/high_pull.png',
  'Triceps Extension|dumbbell': '/exercise-images/dumbbell/triceps_extension__dumbbell.png',
  'Bodyweight Squat|bodyweight': '/exercise-images/bodyweight/bodyweight_squat.png',
  'Dumbbell Bench Press|dumbbell': '/exercise-images/dumbbell/dumbbell_bench_press.png',
  'V-Up|bodyweight': '/exercise-images/bodyweight/v_up.png',
  'Lateral Lunge|dumbbell': '/exercise-images/dumbbell/lateral_lunge__dumbbell.png',
  'Thruster|kettlebell': '/exercise-images/kettlebell/thruster__kettlebell.png',
  'Jumping Jacks|bodyweight': '/exercise-images/bodyweight/jumping_jacks.png',
  'Renegade Row|dumbbell': '/exercise-images/dumbbell/renegade_row__dumbbell.png',
  'Sumo Deadlift|kettlebell': '/exercise-images/kettlebell/sumo_deadlift.png',
  'Dumbbell Seated Shoulder Press|dumbbell': '/exercise-images/dumbbell/dumbbell_seated_shoulder_press.png',
  'Glute Bridge|bodyweight': '/exercise-images/bodyweight/glute_bridge__bodyweight.png',
  'Step-Up|dumbbell': '/exercise-images/dumbbell/step_up__dumbbell.png',
  'Kettlebell Halo|kettlebell': '/exercise-images/kettlebell/kettlebell_halo.png',
  'Plank Shoulder Tap|bodyweight': '/exercise-images/bodyweight/plank_shoulder_tap.png',
  'KB Clean and Press|kettlebell': '/exercise-images/kettlebell/kb_clean_and_press.png',
  'Biceps Curl|dumbbell': '/exercise-images/dumbbell/biceps_curl__dumbbell.png',
  'Dumbbell Romanian Deadlift|dumbbell': '/exercise-images/dumbbell/dumbbell_romanian_deadlift.png',
  'Donkey Kick|bodyweight': '/exercise-images/bodyweight/donkey_kick.png',
  'Kettlebell Swing|kettlebell': '/exercise-images/kettlebell/kettlebell_swing.png',
  'Forearm Plank|bodyweight': '/exercise-images/bodyweight/forearm_plank.png',
  'Windmill|kettlebell': '/exercise-images/kettlebell/windmill.png',
};

/** The three fixed equipment-type logos — NOT exercise-specific, just one
 *  of three icons chosen by which equipment the exercise uses. */
const EQUIPMENT_ICON_IMAGES: Record<'kettlebell' | 'dumbbell' | 'bodyweight', string> = {
  kettlebell: '/equipment-icons/kettlebell.png',
  dumbbell: '/equipment-icons/dumbbell.png',
  bodyweight: '/equipment-icons/bodyweight.png',
};

/** Renders the real illustrated image for an exercise when one exists in the
 *  production batch, falling back to the programmatic pose SVG otherwise. */
function ExerciseVisual({ exercise, size = 90 }: { exercise: Exercise; size?: number }) {
  const equipment = pickPrimaryEquipment(exercise.equipment);
  const imageSrc = EXERCISE_ILLUSTRATION_IMAGES[`${exercise.name}|${equipment}`];
  if (imageSrc) {
    return (
      <img
        src={imageSrc}
        alt={exercise.name}
        className="w-full max-w-xs rounded-2xl"
        style={{ boxShadow: `0 0 24px ${EQUIPMENT_COLORS[equipment]}33` }}
      />
    );
  }
  return <ExerciseIllustration category={exercise.category} equipment={equipment} name={exercise.name} size={size} />;
}

/** Renders the exercise's equipment-type icon (kettlebell/dumbbell/
 *  bodyweight) — NOT a per-exercise illustration, just one of three fixed
 *  logos, shown next to each exercise in a generated workout. */
function ExerciseIcon({ exercise, size = 40 }: { exercise: Exercise; size?: number }) {
  const equipment = pickPrimaryEquipment(exercise.equipment);
  return (
    <img
      src={EQUIPMENT_ICON_IMAGES[equipment]}
      alt={equipment}
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  );
}

function AttributeRing({ label, level, xp, color }: { label: string; level: number; xp: number; color: string }) {
  const { progress } = progressToNext(xp, level);
  const size = 88; const stroke = 6;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size, filter: `drop-shadow(0 0 6px ${color}66)` }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={C.raised} strokeWidth={stroke} />
          <motion.circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circ} strokeLinecap="round"
            initial={false}
            animate={{ strokeDashoffset: circ * (1 - progress) }}
            transition={{ duration: 0.6, ease: 'easeOut' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <NumberRoll value={level} className="text-2xl font-bold" style={{ color: C.text, ...MO }} />
          <span className="text-[9px] uppercase tracking-wider" style={{ color: C.muted, ...MO }}>LV</span>
        </div>
      </div>
      <span className="text-xs font-medium uppercase tracking-wide" style={{ color: C.muted, ...SG }}>{label}</span>
    </div>
  );
}

function Stepper({ label, value, onChange, step = 1, unit, min = 0 }: { label: string; value: number; onChange: (v: number) => void; step?: number; unit?: string; min?: number }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5">
      <span className="truncate text-[10px] font-medium uppercase tracking-wider" style={{ color: C.muted, ...SG }}>{label}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(Math.max(min, value - step))} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border" style={{ borderColor: C.border, color: C.text }}><Minus size={12} /></button>
        <div className="flex flex-col items-center" style={{ minWidth: 26 }}>
          <span className="text-lg font-bold leading-none" style={{ color: C.text, ...MO }}>{value}</span>
          {unit && <span className="mt-0.5 text-[9px] leading-none" style={{ color: C.muted, ...MO }}>{unit}</span>}
        </div>
        <button onClick={() => onChange(value + step)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border" style={{ borderColor: C.border, color: C.text }}><Plus size={12} /></button>
      </div>
    </div>
  );
}

// ─── Screens ─────────────────────────────────────────────────────────────────

function HomeScreen({ user, stats, onGenerate, onChallenge, onBoss, levelChallenges, bossBattles, unlockedCount, totalCount }: {
  user: User; stats: UserStats; onGenerate: () => void; onChallenge: () => void; onBoss: () => void;
  levelChallenges: LevelChallenge[]; bossBattles: BossBattle[]; unlockedCount: number; totalCount: number;
}) {
  const progress = getLevelProgress(stats, levelChallenges, bossBattles);

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: C.bg }}>
      <header className="flex items-center justify-between px-5 pt-6 pb-2">
        <div>
          <p className="text-xs uppercase tracking-wider" style={{ color: C.muted }}>Welcome back</p>
          <h1 className="text-xl font-bold" style={SG}>{user.username}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full border px-3 py-1.5" style={{ borderColor: C.border, backgroundColor: C.surface }}>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.xp }}>Quest Lv</span>
            <span className="text-sm font-semibold" style={MO}>{stats.level}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border px-3 py-1.5" style={{ borderColor: C.border, backgroundColor: C.surface }}>
            <Flame size={16} color="#FF9D4D" fill="#FF9D4D" style={{ filter: 'drop-shadow(0 0 4px #FF9D4D)' }} />
            <span className="text-sm font-semibold" style={MO}>{stats.current_streak}</span>
          </div>
        </div>
      </header>

      <section className="px-5 pt-4">
        <div className="flex items-center justify-around rounded-2xl border px-4 py-5" style={{ borderColor: C.border, backgroundColor: C.surface }}>
          <AttributeRing label="Strength" level={stats.level_strength} xp={stats.xp_strength} color={C.strength} />
          <AttributeRing label="Mobility" level={stats.level_mobility} xp={stats.xp_mobility} color={C.mobility} />
          <AttributeRing label="Conditioning" level={stats.level_conditioning} xp={stats.xp_conditioning} color={C.conditioning} />
        </div>
        <div className="mt-2 flex items-center justify-center gap-1.5 text-xs" style={{ color: C.muted }}>
          <Sparkles size={12} style={{ color: C.mobility }} />
          <span style={MO}>{unlockedCount}</span> of <span style={MO}>{totalCount}</span> movements unlocked
        </div>
      </section>

      <section className="px-5 pt-5">
        <LedBorderButton onClick={onGenerate} className="flex w-full items-center justify-between rounded-2xl px-5 py-4"
          style={{ backgroundColor: C.xp, color: '#04140A', boxShadow: `0 0 20px ${C.xp}55` }} radius={16}>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider opacity-70">Ready to train?</p>
            <p className="text-lg font-bold" style={SG}>Generate Workout</p>
          </div>
          <ChevronRight size={22} strokeWidth={2.5} />
        </LedBorderButton>
      </section>

      <section className="px-5 pt-4">
        {progress.isComplete ? (
          <div className="rounded-2xl border px-4 py-3.5 text-center" style={{ borderColor: C.xp, backgroundColor: `${C.xp}15` }}>
            <p className="text-sm font-bold" style={{ color: C.xp, ...SG }}>🏆 WODXP Legend — Level 50 Complete!</p>
          </div>
        ) : !progress.isUnlocked ? (
          <div className="rounded-2xl border px-4 py-3.5" style={{ borderColor: C.border, backgroundColor: C.surface }}>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: C.muted }}>
              {progress.isBossPending ? `🔒 Boss Locked — Level ${progress.pendingLevel}` : `Next: Level ${progress.pendingLevel} Challenge`}
            </p>
            <p className="mt-1 text-sm" style={{ color: C.text }}>Keep training to unlock it.</p>
          </div>
        ) : progress.isBossPending && progress.boss ? (
          <button onClick={onBoss} className="flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left" style={{ borderColor: `${C.boss}55`, backgroundColor: `${C.boss}0F` }}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${C.boss}22` }}>
              <Swords size={22} color={C.boss} style={{ filter: `drop-shadow(0 0 5px ${C.boss})` }} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: C.boss }}>Boss Battle — {progress.boss.name}</p>
              <p className="text-sm" style={{ color: C.text }}>Defeat this to unlock Level {progress.pendingLevel}</p>
              {progress.isXpFrozen && <p className="mt-0.5 text-[11px]" style={{ color: C.boss }}>⏸ XP is paused until you defeat this boss</p>}
            </div>
            <ChevronRight size={18} style={{ color: C.muted }} />
          </button>
        ) : progress.challenge ? (
          <button onClick={onChallenge} className="flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left" style={{ borderColor: `${C.xp}55`, backgroundColor: `${C.xp}0F` }}>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${C.xp}22` }}>
              <Trophy size={22} color={C.xp} style={{ filter: `drop-shadow(0 0 5px ${C.xp})` }} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: C.xp }}>Level Challenge — {progress.challenge.name}</p>
              <p className="text-sm" style={{ color: C.text }}>Complete this to unlock Level {progress.pendingLevel}</p>
            </div>
            <ChevronRight size={18} style={{ color: C.muted }} />
          </button>
        ) : null}
      </section>

      <section className="px-5 pt-6">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide" style={SG}>Your Progress</h2>
        <div className="rounded-2xl border p-4" style={{ borderColor: C.border, backgroundColor: C.surface }}>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: C.muted }}>Total XP</span>
            <span className="font-bold" style={{ color: C.xp, ...MO }}>{stats.xp_total.toLocaleString()}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm" style={{ color: C.muted }}>Longest streak</span>
            <span className="font-bold" style={{ color: C.text, ...MO }}>{stats.longest_streak} days</span>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Picks a varied set of exercises for a generated workout, cycling through
 * distinct categories (squat, push, pull, hinge, carry, core, mobility,
 * conditioning) before ever repeating one — so a generated session doesn't
 * end up as e.g. three squat variants back to back just because they all
 * matched the equipment filter.
 */
function pickVariedExercises(pool: Exercise[], count: number): Exercise[] {
  if (pool.length <= count) return [...pool].sort(() => Math.random() - 0.5);

  const byCategory = new Map<string, Exercise[]>();
  for (const ex of pool) {
    if (!byCategory.has(ex.category)) byCategory.set(ex.category, []);
    byCategory.get(ex.category)!.push(ex);
  }
  // Shuffle within each category so repeated generations still vary
  for (const group of byCategory.values()) {
    group.sort(() => Math.random() - 0.5);
  }

  // Shuffle the category order itself each time too
  const categories = [...byCategory.keys()].sort(() => Math.random() - 0.5);

  const selected: Exercise[] = [];
  const usedIds = new Set<string>();
  let round = 0;

  // Round-robin across categories: take one from each category per round
  // before allowing any category to contribute a second exercise.
  while (selected.length < count && round < 10) {
    let addedThisRound = false;
    for (const cat of categories) {
      if (selected.length >= count) break;
      const group = byCategory.get(cat)!;
      const next = group[round];
      if (next && !usedIds.has(next.id)) {
        selected.push(next);
        usedIds.add(next.id);
        addedThisRound = true;
      }
    }
    if (!addedThisRound) break; // pool exhausted
    round++;
  }

  return selected;
}

/** Finds the full Exercise record matching a boss/challenge's exercise_name,
 *  so its illustration + step-by-step instructions can be shown on demand. */
function findExerciseByName(exercises: Exercise[], name: string | null | undefined): Exercise | null {
  if (!name) return null;
  return exercises.find((e) => e.name === name) ?? null;
}

function LevelChallengeScreen({ challenge, exercises, userId, onBack, onComplete, onFail }: {
  challenge: LevelChallenge; exercises: Exercise[]; userId: string; onBack: () => void;
  onComplete: (xpReward: number) => void; onFail: () => void;
}) {
  const [usedScaled, setUsedScaled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewing, setViewing] = useState<Exercise | null>(null);

  // Countdown timer: used for timed holds (target_duration_seconds, e.g. a
  // Plank) or as a "finish within" reference clock (time_cap_seconds) for
  // rep-based or combo challenges.
  const countdownFrom = challenge.target_duration_seconds ?? challenge.time_cap_seconds ?? null;
  const [timeLeft, setTimeLeft] = useState(countdownFrom ?? 0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  useWakeLock(timerRunning);

  React.useEffect(() => {
    if (!timerRunning || timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [timerRunning, timeLeft]);

  const isCombo = challenge.structure != null && challenge.structure.length > 0;
  const linkedExercise = !isCombo ? findExerciseByName(exercises, challenge.exercise_name) : null;

  const handlePass = async () => {
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.rpc('clear_level_challenge', {
      p_user_id: userId, p_level: challenge.level, p_used_scaled: usedScaled,
    });
    setSubmitting(false);
    if (!error) onComplete(challenge.xp_reward);
  };

  return (
    <div className="flex min-h-screen flex-col px-5 pb-8 pt-6" style={{ backgroundColor: C.bg }}>
      <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full border" style={{ borderColor: C.border, backgroundColor: C.surface }}>
        <ArrowLeft size={16} style={{ color: C.text }} />
      </button>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: `${C.xp}1A`, border: `2px solid ${C.xp}` }}>
          <Trophy size={28} style={{ color: C.xp }} />
        </div>
        <p className="mt-4 text-xs font-medium uppercase tracking-wider" style={{ color: C.xp }}>Level {challenge.level} Challenge</p>
        <h1 className="mt-1 text-2xl font-bold" style={SG}>{challenge.name}</h1>
        <p className="mt-3 max-w-sm text-base leading-relaxed" style={{ color: C.text }}>{challenge.description}</p>

        {isCombo && (
          <div className="mt-4 w-full max-w-sm rounded-2xl border p-4 text-left" style={{ borderColor: C.border, backgroundColor: C.surface }}>
            <ul className="flex flex-col gap-1.5">
              {challenge.structure!.map((ex, i) => {
                const linked = findExerciseByName(exercises, ex.exercise_name);
                return (
                  <li key={i}>
                    <button onClick={() => linked && setViewing(linked)} disabled={!linked}
                      className="flex w-full items-center justify-between text-left text-sm" style={{ color: C.text }}>
                      <span>{formatBossExercise(ex)}</span>
                      {linked && <ChevronRight size={14} style={{ color: C.mobility }} />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {linkedExercise && (
          <button onClick={() => setViewing(linkedExercise)} className="mt-3 flex items-center gap-1.5 text-sm font-semibold" style={{ color: C.mobility }}>
            <ChevronRight size={14} /> How do I do this?
          </button>
        )}

        {countdownFrom != null && (
          <div className="mt-6 flex flex-col items-center">
            <p className="text-5xl font-bold" style={{ color: timeLeft === 0 && timerStarted ? C.boss : C.text, ...MO }}>{formatTimer(timeLeft)}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>
              {challenge.target_duration_seconds != null ? 'Hold time' : 'Time cap'}
            </p>
            {!timerStarted ? (
              <button onClick={() => { setTimerStarted(true); setTimerRunning(true); }}
                className="mt-3 rounded-full px-6 py-2 text-sm font-bold" style={{ backgroundColor: C.xp, color: '#04140A', ...SG }}>
                Start Exercise
              </button>
            ) : (
              <button onClick={() => setTimerRunning((r) => !r)} className="mt-3 rounded-full border px-6 py-2 text-sm font-bold" style={{ borderColor: C.border, color: C.text, ...SG }}>
                {timerRunning ? 'Pause' : 'Resume'}
              </button>
            )}
          </div>
        )}

        {challenge.scaled_description && (
          <label className="mt-6 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm" style={{ borderColor: C.border, backgroundColor: C.surface, color: C.text }}>
            <input type="checkbox" checked={usedScaled} onChange={(e) => setUsedScaled(e.target.checked)} className="h-4 w-4 rounded" style={{ accentColor: C.xp }} />
            Use scaled version: {challenge.scaled_description}
          </label>
        )}

        <p className="mt-4 text-xs" style={{ color: C.muted }}>Reward: <span style={{ color: C.xp, ...MO }}>+{challenge.xp_reward} XP</span></p>
      </div>

      <div className="flex flex-col gap-2">
        <LedBorderButton onClick={handlePass} disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold disabled:opacity-60"
          style={{ backgroundColor: C.xp, color: '#04140A', ...SG }}>
          {submitting ? 'Saving…' : 'Pass'}
        </LedBorderButton>
        <button onClick={onFail} disabled={submitting} className="w-full rounded-2xl border py-3 text-sm font-bold disabled:opacity-60" style={{ borderColor: C.border, color: C.muted, ...SG }}>
          Fail — Try Again Later
        </button>
      </div>
      {viewing && <ExerciseDetailModal exercise={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

function formatTimer(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Formats one line of a combo/boss structure, whichever unit it uses. */
function formatBossExercise(ex: BossExercise): string {
  if (ex.reps != null) return `${ex.reps} ${ex.exercise_name}`;
  if (ex.duration_seconds != null) return `${ex.duration_seconds} sec ${ex.exercise_name}`;
  return ex.exercise_name;
}

function BossBattleScreen({ boss, exercises, userId, onBack, onComplete }: {
  boss: BossBattle; exercises: Exercise[]; userId: string; onBack: () => void; onComplete: (result: { passed: boolean; medal: string | null; xpReward: number }) => void;
}) {
  const [phase, setPhase] = useState<'ready' | 'active' | 'submitting'>('ready');
  const [usedScaled, setUsedScaled] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [roundsDone, setRoundsDone] = useState(0);
  const [viewing, setViewing] = useState<Exercise | null>(null);
  useWakeLock(running);

  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const structure = usedScaled && boss.scaled_structure ? boss.scaled_structure : boss.structure;

  const submitAttempt = async (passed: boolean) => {
    setRunning(false);
    setPhase('submitting');
    const supabase = createClient();
    const { data: medal } = await supabase.rpc('attempt_boss_battle', {
      p_user_id: userId, p_level: boss.level, p_passed: passed,
      p_duration_seconds: passed ? elapsed : null, p_used_scaled: usedScaled,
    });
    onComplete({ passed, medal: medal ?? null, xpReward: passed ? boss.xp_reward : 0 });
  };

  if (phase === 'ready') {
    return (
      <div className="flex min-h-screen flex-col px-5 pb-8 pt-6" style={{ backgroundColor: C.bg }}>
        <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full border" style={{ borderColor: C.border, backgroundColor: C.surface }}>
          <ArrowLeft size={16} style={{ color: C.text }} />
        </button>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <Swords size={40} color={C.boss} style={{ filter: `drop-shadow(0 0 8px ${C.boss})` }} />
          <p className="mt-3 text-xs font-medium uppercase tracking-wider" style={{ color: C.boss }}>Level {boss.level} Boss</p>
          <h1 className="mt-1 text-3xl font-bold" style={SG}>{boss.name}</h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed" style={{ color: C.text }}>{boss.description}</p>

          <div className="mt-6 w-full max-w-sm rounded-2xl border p-4 text-left" style={{ borderColor: C.border, backgroundColor: C.surface }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: C.muted }}>{boss.rounds} Rounds</p>
            <ul className="mt-2 flex flex-col gap-1">
              {structure.map((ex, i) => {
                const linked = findExerciseByName(exercises, ex.exercise_name);
                return (
                  <li key={i}>
                    <button
                      onClick={() => linked && setViewing(linked)}
                      disabled={!linked}
                      className="flex w-full items-center justify-between text-left text-sm"
                      style={{ color: C.text }}
                    >
                      <span>{formatBossExercise(ex)}</span>
                      {linked && <ChevronRight size={14} style={{ color: C.mobility }} />}
                    </button>
                  </li>
                );
              })}
            </ul>
            {boss.time_cap_seconds && (
              <p className="mt-2 text-xs" style={{ color: C.muted }}>Recommended time cap: {formatTimer(boss.time_cap_seconds)}</p>
            )}
          </div>

          {boss.scaled_structure && (
            <label className="mt-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm" style={{ borderColor: C.border, backgroundColor: C.surface, color: C.text }}>
              <input type="checkbox" checked={usedScaled} onChange={(e) => setUsedScaled(e.target.checked)} className="h-4 w-4 rounded" style={{ accentColor: C.xp }} />
              Use scaled movements
            </label>
          )}

          <div className="mt-6 w-full max-w-sm rounded-2xl border p-4" style={{ borderColor: C.boss, backgroundColor: `${C.boss}0F` }}>
            <p className="text-sm font-bold" style={{ color: C.boss, ...SG }}>BOSS READY?</p>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: C.text }}>
              Train smart. Listen to your body and choose movements and weights that feel right for you. Good form beats speed.
            </p>
          </div>
        </div>
        <LedBorderButton onClick={() => { setPhase('active'); setRunning(true); }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold"
          style={{ backgroundColor: C.boss, color: '#1A0E0C', ...SG }}>
          <Swords size={20} /> Start Boss
        </LedBorderButton>
        {viewing && <ExerciseDetailModal exercise={viewing} onClose={() => setViewing(null)} />}
      </div>
    );
  }

  if (phase === 'submitting') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-5" style={{ backgroundColor: C.bg }}>
        <p className="text-sm" style={{ color: C.muted }}>Saving your result…</p>
      </div>
    );
  }

  // phase === 'active'
  return (
    <div className="flex min-h-screen flex-col px-5 pb-8 pt-6" style={{ backgroundColor: C.bg }}>
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full border" style={{ borderColor: C.border, backgroundColor: C.surface }}>
          <ArrowLeft size={16} style={{ color: C.text }} />
        </button>
        <p className="text-sm font-bold" style={{ color: C.boss, ...SG }}>{boss.name}</p>
        <div style={{ width: 36 }} />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-6xl font-bold" style={{ color: C.text, ...MO }}>{formatTimer(elapsed)}</p>
        <p className="mt-1 text-xs uppercase tracking-wider" style={{ color: C.muted }}>
          {running ? 'Running' : 'Paused'}{boss.time_cap_seconds ? ` · cap ${formatTimer(boss.time_cap_seconds)}` : ''}
        </p>

        <div className="mt-6 w-full max-w-sm rounded-2xl border p-4" style={{ borderColor: C.border, backgroundColor: C.surface }}>
          <ul className="flex flex-col gap-1 text-left">
            {structure.map((ex, i) => {
              const linked = findExerciseByName(exercises, ex.exercise_name);
              return (
                <li key={i}>
                  <button
                    onClick={() => linked && setViewing(linked)}
                    disabled={!linked}
                    className="flex w-full items-center justify-between text-left text-sm"
                    style={{ color: C.text }}
                  >
                    <span>{formatBossExercise(ex)}</span>
                    {linked && <ChevronRight size={14} style={{ color: C.mobility }} />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button onClick={() => setRoundsDone((r) => Math.max(0, r - 1))} className="flex h-10 w-10 items-center justify-center rounded-full border" style={{ borderColor: C.border, color: C.text }}><Minus size={16} /></button>
          <div className="text-center">
            <p className="text-3xl font-bold" style={{ color: C.xp, ...MO }}>{roundsDone} / {boss.rounds}</p>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>Rounds</p>
          </div>
          <button onClick={() => setRoundsDone((r) => Math.min(boss.rounds, r + 1))} className="flex h-10 w-10 items-center justify-center rounded-full border" style={{ borderColor: C.border, color: C.text }}><Plus size={16} /></button>
        </div>

        <button onClick={() => setRunning((r) => !r)} className="mt-4 rounded-full border px-6 py-2 text-sm font-bold" style={{ borderColor: C.border, color: C.text, ...SG }}>
          {running ? 'Pause' : 'Resume'}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <button onClick={() => submitAttempt(true)} disabled={roundsDone < boss.rounds}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold disabled:opacity-40"
          style={{ backgroundColor: C.xp, color: '#04140A', ...SG }}>
          <Check size={20} strokeWidth={3} /> Boss Defeated
        </button>
        <button onClick={() => submitAttempt(false)} className="w-full rounded-2xl border py-3 text-sm font-bold" style={{ borderColor: C.border, color: C.muted, ...SG }}>
          Stop — Try Again Later
        </button>
      </div>
      {viewing && <ExerciseDetailModal exercise={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

function ChallengeResultScreen({ xpEarned, onHome }: { xpEarned: number; onHome: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 text-center" style={{ backgroundColor: C.bg }}>
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full" style={{ backgroundColor: `${C.xp}1F`, border: `2px solid ${C.xp}`, boxShadow: `0 0 24px ${C.xp}66` }}>
        <Trophy size={44} style={{ color: C.xp }} />
      </div>
      <h1 className="text-3xl font-bold" style={SG}>Challenge Complete!</h1>
      <p className="mt-2" style={{ color: C.muted }}>Level unlocked.</p>
      <div className="mt-8 w-full rounded-2xl border p-5" style={{ borderColor: C.border, backgroundColor: C.surface }}>
        <p className="text-sm" style={{ color: C.muted }}>XP earned</p>
        <p className="mt-1 text-4xl font-bold" style={{ color: C.xp, ...MO }}>+<NumberRoll value={xpEarned} duration={0.8} /></p>
      </div>
      <button onClick={onHome} className="mt-8 w-full rounded-2xl py-4 text-lg font-bold" style={{ backgroundColor: C.xp, color: '#04140A', ...SG }}>
        Back to Home
      </button>
    </div>
  );
}

/**
 * Wraps content that should reveal `delayMs` after the parent screen
 * mounts — the building block behind every staged reward sequence
 * (Boss Defeated, Level Up, etc.), per spec section 21's shared
 * "RewardReveal" architecture. Each stage fades + rises into place.
 */
function RevealStage({ children, delayMs, className }: { children: React.ReactNode; delayMs: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delayMs / 1000, duration: 0.4, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

function BossResultScreen({ result, bossName, onHome }: {
  result: { passed: boolean; medal: string | null; xpReward: number }; bossName: string; onHome: () => void;
}) {
  const medalEmoji = result.medal === 'gold' ? '🥇' : result.medal === 'silver' ? '🥈' : result.medal === 'bronze' ? '🥉' : null;

  if (!result.passed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-5 text-center" style={{ backgroundColor: C.bg }}>
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full" style={{ backgroundColor: `${C.border}66`, border: `2px solid ${C.border}` }}>
          <Swords size={44} style={{ color: C.muted }} />
        </div>
        <h1 className="text-3xl font-bold" style={SG}>Boss Survived</h1>
        <p className="mt-2" style={{ color: C.muted }}>{bossName}</p>
        <p className="mt-8 max-w-sm text-sm leading-relaxed" style={{ color: C.text }}>
          No XP lost, no progress removed. You'll get it next time — try again whenever you're ready.
        </p>
        <button onClick={onHome} className="mt-8 w-full rounded-2xl py-4 text-lg font-bold" style={{ backgroundColor: C.xp, color: '#04140A', ...SG }}>
          Back to Home
        </button>
      </div>
    );
  }

  // Boss Defeated — WODXP's flagship reward moment, staged per spec
  // section 23: icon -> "BOSS" -> "DEFEATED" scale-pop -> medal rotateY
  // reveal -> XP count-up -> CTA. ~1.5s total, darker backdrop throughout.
  return (
    <motion.div
      className="flex min-h-screen flex-col items-center justify-center px-5 text-center"
      initial={{ backgroundColor: '#0D0D0D' }}
      animate={{ backgroundColor: '#050505' }}
      transition={{ duration: 0.3 }}
    >
      <RevealStage delayMs={0}>
        <div className="flex h-24 w-24 items-center justify-center rounded-full" style={{ backgroundColor: `${C.boss}1F`, border: `2px solid ${C.boss}`, boxShadow: `0 0 24px ${C.boss}66` }}>
          <Swords size={44} style={{ color: C.boss }} />
        </div>
      </RevealStage>

      <RevealStage delayMs={150}>
        <p className="mt-6 text-sm font-bold uppercase tracking-[0.3em]" style={{ color: C.boss }}>{bossName}</p>
      </RevealStage>

      <motion.h1
        className="mt-1 text-4xl font-bold"
        style={{ ...SG, color: C.text }}
        initial={{ scale: 0.75, opacity: 0 }}
        animate={{ scale: [0.75, 1.06, 1], opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
      >
        DEFEATED
      </motion.h1>

      {medalEmoji && (
        <motion.div
          className="mt-6 text-6xl"
          initial={{ rotateY: -90, scale: 0.6, opacity: 0 }}
          animate={{ rotateY: 0, scale: 1, opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.5, ease: 'easeOut' }}
          style={{ perspective: 400 }}
        >
          {medalEmoji}
        </motion.div>
      )}

      <RevealStage delayMs={800}>
        <div className="mt-6 w-full rounded-2xl border p-5" style={{ borderColor: C.border, backgroundColor: C.surface }}>
          <p className="text-sm" style={{ color: C.muted }}>XP earned</p>
          <p className="mt-1 text-4xl font-bold" style={{ color: C.xp, ...MO }}>+<NumberRoll value={result.xpReward} duration={0.8} /></p>
          <p className="mt-2 text-sm font-bold" style={{ color: C.xp, ...SG }}>LEVEL UNLOCKED</p>
        </div>
      </RevealStage>

      <RevealStage delayMs={1100} className="mt-8 w-full">
        <LedBorderButton onClick={onHome} className="w-full rounded-2xl py-4 text-lg font-bold" style={{ backgroundColor: C.xp, color: '#04140A', ...SG }}>
          Continue
        </LedBorderButton>
      </RevealStage>
    </motion.div>
  );
}

/**
 * WOD XP tab — 15 classic CrossFit benchmark WODs as an optional side
 * track, separate from the main Level/Boss progression. Locked slots
 * (overall level hasn't reached their unlock_level yet) render dimmed
 * with a dark overlay; unlocked ones render clearly and are tappable.
 */
function WodXpScreen({ stats, classicWods, summary, wodMedals, onOpenWod }: {
  stats: UserStats; classicWods: ClassicWod[]; summary: { completed: number; gold: number; silver: number; bronze: number };
  wodMedals: Record<number, string>; onOpenWod: (wod: ClassicWod) => void;
}) {
  // Title tiers by gold-medal count — "WOD Master" and "Legend of the Box"
  // are the two named tiers from the spec; the ones in between are a
  // reasonable interpolation to fill the gap.
  const title =
    summary.gold >= 15 ? 'Legend of the Box' :
    summary.gold >= 10 ? 'Elite Athlete' :
    summary.gold >= 5 ? 'WOD Master' :
    summary.gold >= 1 ? 'Challenger' : null;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: C.bg }}>
      <header className="px-5 pt-6 pb-4">
        <p className="text-xs uppercase tracking-wider" style={{ color: C.conditioning }}>Side Track</p>
        <h1 className="text-2xl font-bold" style={SG}>WOD XP</h1>
        <p className="mt-1 text-sm" style={{ color: C.muted }}>
          15 classic benchmark workouts. Optional — clearing these never blocks your main progression.
        </p>
      </header>

      <div className="px-5">
        <div className="rounded-2xl border p-4" style={{ borderColor: `${C.conditioning}55`, backgroundColor: `${C.conditioning}0F` }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider" style={{ color: C.muted }}>Completed</p>
              <p className="text-lg font-bold" style={{ color: C.text, ...MO }}>{summary.completed} / 15</p>
            </div>
            <div className="flex gap-3 text-center">
              <div><p className="text-lg font-bold" style={{ color: '#FFD700', ...MO }}>{summary.gold}</p><p className="text-[9px] uppercase" style={{ color: C.muted }}>Gold</p></div>
              <div><p className="text-lg font-bold" style={{ color: '#C0C0C0', ...MO }}>{summary.silver}</p><p className="text-[9px] uppercase" style={{ color: C.muted }}>Silver</p></div>
              <div><p className="text-lg font-bold" style={{ color: '#CD7F32', ...MO }}>{summary.bronze}</p><p className="text-[9px] uppercase" style={{ color: C.muted }}>Bronze</p></div>
            </div>
          </div>
          {title && (
            <p className="mt-3 border-t pt-3 text-center text-sm font-bold" style={{ borderColor: `${C.conditioning}33`, color: C.conditioning, ...SG }}>
              🏆 {title}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 px-5">
        {classicWods.map((wod) => {
          const isUnlocked = stats.level >= wod.unlock_level;
          const medal = wodMedals[wod.slot]; // 'gold' | 'silver' | 'bronze' | undefined
          const medalColor = medal === 'gold' ? '#FFD700' : medal === 'silver' ? '#C0C0C0' : medal === 'bronze' ? '#CD7F32' : null;
          const medalEmoji = medal === 'gold' ? '🥇' : medal === 'silver' ? '🥈' : medal === 'bronze' ? '🥉' : null;
          return (
            <motion.button
              key={wod.slot}
              onClick={() => isUnlocked && wod.is_ready && onOpenWod(wod)}
              disabled={!isUnlocked || !wod.is_ready}
              className="relative flex items-center gap-3 overflow-hidden rounded-2xl border p-4 text-left"
              style={{
                borderColor: medalColor ? `${medalColor}66` : isUnlocked ? `${C.conditioning}55` : C.border,
                backgroundColor: medalColor ? `${medalColor}12` : isUnlocked ? `${C.conditioning}0F` : C.surface,
              }}
              animate={{ y: isUnlocked ? 0 : 0, scale: 1 }}
              whileTap={isUnlocked && wod.is_ready ? { scale: 0.98 } : undefined}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <motion.div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: medalColor ? `${medalColor}22` : isUnlocked ? `${C.conditioning}22` : C.raised }}
                animate={{ rotate: isUnlocked ? 0 : 0 }}>
                {medalEmoji ? (
                  <motion.span key="medal" className="text-2xl" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                    {medalEmoji}
                  </motion.span>
                ) : isUnlocked ? (
                  <motion.span key="unlocked" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                    <Award size={22} color={C.conditioning} style={{ filter: `drop-shadow(0 0 5px ${C.conditioning})` }} />
                  </motion.span>
                ) : (
                  <Lock size={20} style={{ color: C.muted }} />
                )}
              </motion.div>
              <div className="flex-1">
                <p className="font-bold" style={{ color: isUnlocked ? C.text : C.muted, ...SG }}>
                  {isUnlocked ? wod.name : `Unlocks at Lv ${wod.unlock_level}`}
                </p>
                <p className="text-xs" style={{ color: C.muted }}>
                  {isUnlocked
                    ? (wod.is_ready
                        ? (medal ? `${medal.charAt(0).toUpperCase() + medal.slice(1)} medal earned` : (wod.format_label ?? 'Tap to view'))
                        : 'Coming soon')
                    : `Reach Quest Lv ${wod.unlock_level} to unlock`}
                </p>
              </div>
              {isUnlocked && wod.is_ready && <ChevronRight size={18} style={{ color: C.muted }} />}

              {/* Dim overlay for locked slots — retracts/fades on unlock
                  instead of just disappearing, per spec section 26. */}
              <motion.div
                className="pointer-events-none absolute inset-0"
                initial={false}
                animate={{ opacity: isUnlocked ? 0 : 1 }}
                transition={{ duration: 0.5 }}
                style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function formatScoreLabel(scoringType: 'time' | 'rounds' | 'points'): string {
  return scoringType === 'time' ? 'Time' : scoringType === 'rounds' ? 'Rounds' : 'Points';
}

function WodDetailScreen({ wod, exercises, userId, onBack, onComplete }: {
  wod: ClassicWod; exercises: Exercise[]; userId: string; onBack: () => void;
  onComplete: (result: { medal: string | null; scoreValue: number }) => void;
}) {
  const [phase, setPhase] = useState<'ready' | 'active' | 'submitting'>('ready');
  const [viewing, setViewing] = useState<Exercise | null>(null);

  // Time-scored: count UP (lower final time = better medal).
  // Rounds/points-scored: count DOWN from the fixed work window.
  const isCountUp = wod.scoring_type === 'time';
  const startValue = isCountUp ? 0 : (wod.amrap_duration_seconds ?? 0);
  const [elapsed, setElapsed] = useState(startValue);
  const [running, setRunning] = useState(false);
  const [scoreCount, setScoreCount] = useState(0); // rounds or points, manually tracked
  const [showAbortConfirm, setShowAbortConfirm] = useState(false);
  useWakeLock(running);

  // Backing out mid-WOD needs a courtesy check — unlike the regular workout
  // flow, there's no XP at stake here (WODs are medal-only), so the message
  // is about losing this attempt's chance at a medal, not XP.
  const handleWodBackPress = () => {
    if (phase === 'active') {
      setRunning(false);
      setShowAbortConfirm(true);
    } else {
      onBack();
    }
  };

  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setElapsed((t) => (isCountUp ? t + 1 : Math.max(0, t - 1)));
    }, 1000);
    return () => clearInterval(id);
  }, [running, isCountUp]);

  const submitAttempt = async (finalScore: number) => {
    setRunning(false);
    setPhase('submitting');
    const supabase = createClient();
    const { data: medal } = await supabase.rpc('attempt_classic_wod', {
      p_user_id: userId, p_slot: wod.slot, p_score_value: finalScore,
    });
    onComplete({ medal: medal ?? null, scoreValue: finalScore });
  };

  const medalColor = { gold: '#FFD700', silver: '#C0C0C0', bronze: '#CD7F32' };
  const typeColor = wod.wod_type === 'Hero' ? C.boss : wod.wod_type === 'Benchmark' ? C.mobility : C.conditioning;

  if (phase === 'ready') {
    return (
      <div className="flex min-h-screen flex-col px-5 pb-8 pt-6" style={{ backgroundColor: C.bg }}>
        <button onClick={handleWodBackPress} className="flex h-9 w-9 items-center justify-center rounded-full border" style={{ borderColor: C.border, backgroundColor: C.surface }}>
          <ArrowLeft size={16} style={{ color: C.text }} />
        </button>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <Award size={40} color={C.conditioning} style={{ filter: `drop-shadow(0 0 8px ${C.conditioning})` }} />
          <div className="mt-3 flex items-center gap-2">
            {wod.wod_type && <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: `${typeColor}22`, color: typeColor }}>{wod.wod_type}</span>}
            {wod.difficulty_tier && <span className="text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>{wod.difficulty_tier}</span>}
          </div>
          <h1 className="mt-1 text-3xl font-bold" style={SG}>{wod.name}</h1>
          <p className="mt-1 text-sm font-semibold" style={{ color: C.conditioning }}>{wod.format_label}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed" style={{ color: C.text }}>{wod.description}</p>

          <div className="mt-6 w-full max-w-sm rounded-2xl border p-4 text-left" style={{ borderColor: C.border, backgroundColor: C.surface }}>
            <ul className="flex flex-col gap-1.5">
              {(wod.structure ?? []).map((ex, i) => {
                const linked = findExerciseByName(exercises, ex.exercise_name);
                return (
                  <li key={i}>
                    <button onClick={() => linked && setViewing(linked)} disabled={!linked}
                      className="flex w-full items-center justify-between text-left text-sm" style={{ color: C.text }}>
                      <span>{formatBossExercise(ex)}</span>
                      {linked && <ChevronRight size={14} style={{ color: C.mobility }} />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-4 w-full max-w-sm rounded-2xl border p-4" style={{ borderColor: C.border, backgroundColor: C.surface }}>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: C.muted }}>Medals</p>
            <div className="mt-2 flex justify-around text-center text-xs">
              <div><p style={{ color: medalColor.gold }}>🥇 Gold</p><p style={{ color: C.muted, ...MO }}>{wod.scoring_type === 'time' ? `< ${formatTimer(wod.medal_gold_value ?? 0)}` : `${wod.medal_gold_value}+`}</p></div>
              <div><p style={{ color: medalColor.silver }}>🥈 Silver</p><p style={{ color: C.muted, ...MO }}>{wod.scoring_type === 'time' ? `< ${formatTimer(wod.medal_silver_value ?? 0)}` : `${wod.medal_silver_value}+`}</p></div>
              <div><p style={{ color: medalColor.bronze }}>🥉 Bronze</p><p style={{ color: C.muted, ...MO }}>{wod.scoring_type === 'time' ? `< ${formatTimer(wod.medal_bronze_value ?? 0)}` : `${wod.medal_bronze_value}+`}</p></div>
            </div>
          </div>

          <div className="mt-4 w-full max-w-sm rounded-2xl border p-4" style={{ borderColor: C.conditioning, backgroundColor: `${C.conditioning}0F` }}>
            <p className="text-sm font-bold" style={{ color: C.conditioning, ...SG }}>Optional & harder than Boss Challenges</p>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: C.text }}>Train smart. Scale movements or weight as needed — earning any medal is a real achievement.</p>
          </div>
        </div>
        <LedBorderButton onClick={() => { setPhase('active'); setRunning(true); }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold"
          style={{ backgroundColor: C.conditioning, color: '#1A0E0C', ...SG }}>
          <Award size={20} /> Start {wod.name}
        </LedBorderButton>
        {viewing && <ExerciseDetailModal exercise={viewing} onClose={() => setViewing(null)} />}
      </div>
    );
  }

  if (phase === 'submitting') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-5" style={{ backgroundColor: C.bg }}>
        <p className="text-sm" style={{ color: C.muted }}>Saving your result…</p>
      </div>
    );
  }

  // phase === 'active'
  return (
    <div className="flex min-h-screen flex-col px-5 pb-8 pt-6" style={{ backgroundColor: C.bg }}>
      <div className="flex items-center justify-between">
        <button onClick={handleWodBackPress} className="flex h-9 w-9 items-center justify-center rounded-full border" style={{ borderColor: C.border, backgroundColor: C.surface }}>
          <ArrowLeft size={16} style={{ color: C.text }} />
        </button>
        <p className="text-sm font-bold" style={{ color: C.conditioning, ...SG }}>{wod.name}</p>
        <div style={{ width: 36 }} />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-6xl font-bold" style={{ color: C.text, ...MO }}>{formatTimer(elapsed)}</p>
        <p className="mt-1 text-xs uppercase tracking-wider" style={{ color: C.muted }}>
          {isCountUp ? 'Elapsed' : 'Time remaining'}
        </p>

        {!isCountUp && (
          <div className="mt-6 flex items-center gap-4">
            <button onClick={() => setScoreCount((r) => Math.max(0, r - 1))} className="flex h-10 w-10 items-center justify-center rounded-full border" style={{ borderColor: C.border, color: C.text }}><Minus size={16} /></button>
            <div className="text-center">
              <p className="text-3xl font-bold" style={{ color: C.conditioning, ...MO }}>{scoreCount}</p>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>{formatScoreLabel(wod.scoring_type)}</p>
            </div>
            <button onClick={() => setScoreCount((r) => r + 1)} className="flex h-10 w-10 items-center justify-center rounded-full border" style={{ borderColor: C.border, color: C.text }}><Plus size={16} /></button>
          </div>
        )}

        <button onClick={() => setRunning((r) => !r)} className="mt-4 rounded-full border px-6 py-2 text-sm font-bold" style={{ borderColor: C.border, color: C.text, ...SG }}>
          {running ? 'Pause' : 'Resume'}
        </button>
      </div>

      <button onClick={() => submitAttempt(isCountUp ? elapsed : scoreCount)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold"
        style={{ backgroundColor: C.conditioning, color: '#1A0E0C', ...SG }}>
        <Check size={20} strokeWidth={3} /> Finish & Submit
      </button>
      {showAbortConfirm && (
        <SafeModalShell>
          <div className="w-full max-w-sm rounded-3xl border p-6 text-center" style={{ borderColor: C.border, backgroundColor: C.surface }}>
            <img src="/icon-512.png" alt="WODXP" className="mx-auto h-16 w-16 rounded-2xl" />
            <h2 className="mt-4 text-lg font-bold" style={SG}>Give up already?</h2>
            <p className="mt-1 text-sm" style={{ color: C.muted }}>
              You're mid-WOD — leaving now means no medal for this attempt. Your best time stays whatever you've already earned.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <LedBorderButton onClick={() => { setShowAbortConfirm(false); setRunning(true); }}
                className="rounded-2xl py-3.5 text-sm font-bold" style={{ backgroundColor: C.conditioning, color: '#1A0E0C', ...SG }}>
                Keep Going
              </LedBorderButton>
              <button onClick={onBack} className="rounded-2xl border py-3.5 text-sm font-bold" style={{ borderColor: C.border, color: C.muted, ...SG }}>
                I&apos;m tired, maybe next time
              </button>
            </div>
          </div>
        </SafeModalShell>
      )}
    </div>
  );
}

function WodResultScreen({ result, wod, onHome }: {
  result: { medal: string | null; scoreValue: number }; wod: ClassicWod; onHome: () => void;
}) {
  const medalEmoji = result.medal === 'gold' ? '🥇' : result.medal === 'silver' ? '🥈' : result.medal === 'bronze' ? '🥉' : null;
  const scoreDisplay = wod.scoring_type === 'time' ? formatTimer(result.scoreValue) : `${result.scoreValue} ${formatScoreLabel(wod.scoring_type).toLowerCase()}`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 text-center" style={{ backgroundColor: C.bg }}>
      <motion.div
        className="mb-6 flex h-24 w-24 items-center justify-center rounded-full"
        style={{ backgroundColor: result.medal ? `${C.conditioning}1F` : `${C.border}66`, border: `2px solid ${result.medal ? C.conditioning : C.border}`, perspective: 400 }}
        initial={{ rotateY: medalEmoji ? -90 : 0, scale: medalEmoji ? 0.6 : 1, opacity: 0 }}
        animate={{ rotateY: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {medalEmoji ? <span className="text-5xl">{medalEmoji}</span> : <Award size={44} style={{ color: C.muted }} />}
      </motion.div>
      <h1 className="text-3xl font-bold" style={SG}>{result.medal ? `${wod.name} Complete!` : `${wod.name} Logged`}</h1>
      <p className="mt-2" style={{ color: C.muted }}>Your score: <span style={MO}>{scoreDisplay}</span></p>

      {!result.medal && (
        <p className="mt-4 max-w-sm text-sm leading-relaxed" style={{ color: C.text }}>
          No medal this time — but your attempt is saved. Come back and try to beat it whenever you're ready.
        </p>
      )}

      <button onClick={onHome} className="mt-8 w-full rounded-2xl py-4 text-lg font-bold" style={{ backgroundColor: C.conditioning, color: '#1A0E0C', ...SG }}>
        Back to WOD XP
      </button>
    </div>
  );
}

function GeneratorScreen({ exercises, totalExerciseCount, onBack, onStart }: { exercises: Exercise[]; totalExerciseCount: number; onBack: () => void; onStart: (exs: Exercise[], durationMinutes: number) => void }) {
  const [equipment, setEquipment] = useState<Set<'kettlebell' | 'dumbbell' | 'bodyweight'>>(
    new Set(['kettlebell', 'dumbbell', 'bodyweight'])
  );
  const [goal, setGoal] = useState<'strength' | 'conditioning' | 'mobility' | 'mixed'>('mixed');
  const [duration, setDuration] = useState<10 | 20 | 30 | 45>(20);
  const [building, setBuilding] = useState(false);

  const toggleEquipment = (eq: 'kettlebell' | 'dumbbell' | 'bodyweight') => {
    setEquipment((prev) => {
      const next = new Set(prev);
      if (next.has(eq)) {
        if (next.size > 1) next.delete(eq); // always keep at least one selected
      } else {
        next.add(eq);
      }
      return next;
    });
  };

  const handleGenerate = () => {
    // Brief "BUILDING YOUR WOD..." beat per spec section 13 — the pool is
    // computed immediately, but onStart is deferred ~750ms so the pulse
    // sequence has time to play instead of instantly jumping to Safety.
    setBuilding(true);
    const equipmentPool = exercises.filter((ex) => ex.equipment.some((e) => equipment.has(e as 'kettlebell' | 'dumbbell' | 'bodyweight')));
    const pool = goal === 'mixed' ? equipmentPool : equipmentPool.filter((ex) => ex.primary_attribute === goal);
    const count = duration <= 10 ? 3 : duration <= 20 ? 4 : duration <= 30 ? 5 : 6;
    const picked = pickVariedExercises(pool.length > 0 ? pool : equipmentPool, count);
    setTimeout(() => onStart(picked, duration), 750);
  };

  const Opt = <T extends string | number>({ label, val, cur, set }: { label: string; val: T; cur: T; set: (v: T) => void }) => (
    <button onClick={() => set(val)} className="flex-1 rounded-xl border py-3 text-sm font-semibold"
      style={{ borderColor: cur === val ? C.xp : C.border, backgroundColor: cur === val ? `${C.xp}1A` : C.surface, color: cur === val ? C.xp : C.text, ...SG }}>
      {label}
    </button>
  );

  const ToggleOpt = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button onClick={onClick} className="flex-1 rounded-xl border py-3 text-sm font-semibold"
      style={{ borderColor: active ? C.xp : C.border, backgroundColor: active ? `${C.xp}1A` : C.surface, color: active ? C.xp : C.text, ...SG }}>
      {label}
    </button>
  );

  return (
    <div className="min-h-screen px-5 pb-28 pt-6" style={{ backgroundColor: C.bg }}>
      <div className="mb-6 flex items-center gap-3">
        <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full border" style={{ borderColor: C.border, backgroundColor: C.surface }}><ArrowLeft size={16} style={{ color: C.text }} /></button>
        <div>
          <h1 className="text-2xl font-bold" style={SG}>Generate Workout</h1>
          <p className="flex items-center gap-1.5 text-xs" style={{ color: C.muted }}>
            <Sparkles size={11} style={{ color: C.mobility }} />
            <span style={MO}>{exercises.length}</span> of <span style={MO}>{totalExerciseCount}</span> movements unlocked
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider" style={{ color: C.muted }}>
            <span style={{ color: C.kettlebell }}>●</span> Equipment <span className="normal-case" style={{ color: C.muted }}>(tap to select any combination)</span>
          </p>
          <div className="flex gap-2">
            <ToggleOpt label="Kettlebell" active={equipment.has('kettlebell')} onClick={() => toggleEquipment('kettlebell')} />
            <ToggleOpt label="Dumbbell" active={equipment.has('dumbbell')} onClick={() => toggleEquipment('dumbbell')} />
            <ToggleOpt label="Bodyweight" active={equipment.has('bodyweight')} onClick={() => toggleEquipment('bodyweight')} />
          </div>
        </div>
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider" style={{ color: C.muted }}><Target size={14} /> Goal</p>
          <div className="flex gap-2">
            <Opt label="Strength" val="strength" cur={goal} set={setGoal} />
            <Opt label="Endurance" val="conditioning" cur={goal} set={setGoal} />
            <Opt label="Mobility" val="mobility" cur={goal} set={setGoal} />
            <Opt label="Mixed" val="mixed" cur={goal} set={setGoal} />
          </div>
        </div>
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider" style={{ color: C.muted }}><Clock size={14} /> Duration</p>
          <div className="flex gap-2">
            <Opt label="10 min" val={10} cur={duration} set={setDuration} />
            <Opt label="20 min" val={20} cur={duration} set={setDuration} />
            <Opt label="30 min" val={30} cur={duration} set={setDuration} />
            <Opt label="45 min" val={45} cur={duration} set={setDuration} />
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 border-t px-5 py-4" style={{ backgroundColor: C.bg, borderColor: C.border }}>
        <LedBorderButton onClick={handleGenerate} disabled={building} className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold"
          style={{ backgroundColor: C.xp, color: '#04140A', ...SG, boxShadow: `0 0 20px ${C.xp}55` }}>
          <Sparkles size={20} /> Generate
        </LedBorderButton>
      </div>
      {building && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ backgroundColor: 'rgba(13,13,13,0.92)' }}>
          <motion.p className="text-sm font-bold uppercase tracking-[0.3em]" style={{ color: C.text, ...SG }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            Building your WOD...
          </motion.p>
          <div className="mt-6 flex gap-3">
            {[{ label: 'Strength', color: C.strength }, { label: 'Mobility', color: C.mobility }, { label: 'Conditioning', color: C.conditioning }].map((a, i) => (
              <motion.span
                key={a.label}
                className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider"
                style={{ backgroundColor: `${a.color}22`, color: a.color }}
                initial={{ opacity: 0.3, scale: 0.9 }}
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.06, 0.9] }}
                transition={{ duration: 0.75, delay: i * 0.2, repeat: Infinity, repeatDelay: 0.15 }}
              >
                {a.label}
              </motion.span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SafetyNoticeScreen({ onBack, onContinue }: { onBack: () => void; onContinue: () => void }) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleContinue = () => {
    if (dontShowAgain && typeof window !== 'undefined') {
      window.localStorage.setItem('wodxp_skip_safety_notice', '1');
    }
    onContinue();
  };

  return (
    <div className="flex min-h-screen flex-col px-5 pb-8 pt-6" style={{ backgroundColor: C.bg }}>
      <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full border" style={{ borderColor: C.border, backgroundColor: C.surface }}>
        <ArrowLeft size={16} style={{ color: C.text }} />
      </button>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: `${C.xp}1A`, border: `2px solid ${C.xp}` }}>
          <span style={{ color: C.xp, fontSize: 28, fontWeight: 700 }}>!</span>
        </div>
        <h1 className="mt-6 text-2xl font-bold" style={SG}>Before you start</h1>
        <p className="mt-4 max-w-sm text-base leading-relaxed" style={{ color: C.text }}>
          Listen to your body. Choose weights and movements that feel right for you. Focus on good form,
          stay in control, and adjust or stop an exercise if you feel pain or discomfort.
        </p>
        <p className="mt-4 text-lg font-bold" style={{ color: C.xp, ...SG }}>
          Your workout. Your pace.
        </p>
      </div>

      <label className="mb-4 flex items-center justify-center gap-2 text-sm" style={{ color: C.muted }}>
        <input
          type="checkbox"
          checked={dontShowAgain}
          onChange={(e) => setDontShowAgain(e.target.checked)}
          className="h-4 w-4 rounded"
          style={{ accentColor: C.xp }}
        />
        Don&apos;t show this again
      </label>

      <LedBorderButton
        onClick={handleContinue}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold"
        style={{ backgroundColor: C.xp, color: '#04140A', ...SG }}
      >
        Got it — Let&apos;s train
      </LedBorderButton>
    </div>
  );
}

/**
 * Per-exercise XP for a logged set of weight/reps/sets, compared against
 * the exercise's defaults. Lowering ANY of the three from default costs
 * -2 XP (once, not per-parameter, to discourage picking an easier version
 * for full credit). Raising ANY of them earns +1 XP (also once — raising
 * all three isn't +3). Unchanged from default = no adjustment. There is
 * no other scaling with reps/sets/weight — that uncapped bonus is exactly
 * what let XP be farmed by just cranking the sets stepper.
 */
function computeExerciseXp(ex: Exercise, log: { weight: number; reps: number; sets: number }): number {
  const loweredAny = log.weight < ex.default_weight_kg || log.reps < ex.default_reps || log.sets < ex.default_sets;
  const raisedAny = log.weight > ex.default_weight_kg || log.reps > ex.default_reps || log.sets > ex.default_sets;
  const adjustment = loweredAny ? -2 : raisedAny ? 1 : 0;
  return Math.max(0, ex.xp_value + adjustment);
}

function WorkoutScreen({ exercises, userId, durationMinutes, onBack, onFinish }: { exercises: Exercise[]; userId: string; durationMinutes: number; onBack: () => void; onFinish: (requestedXp: number, grantedXp: number) => void }) {
  // Captured once, when the workout screen first mounts — i.e. when the
  // user actually starts training. Without this, the session row would
  // only get a started_at/completed_at pair at save time (both ~identical),
  // making "time trained" always compute to ~0 seconds.
  const [startedAt] = useState(() => new Date().toISOString());
  const [logs, setLogs] = useState<Record<string, { weight: number; reps: number; sets: number }>>(
    Object.fromEntries(exercises.map((ex) => [ex.id, { weight: ex.default_weight_kg, reps: ex.default_reps, sets: ex.default_sets }]))
  );
  const [done, setDone] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState<Exercise | null>(null);
  const allDone = done.size === exercises.length;

  // Live elapsed-time tracking, used only to detect an early quit (leaving
  // before 30% of the selected workout duration has passed) — separate
  // from `startedAt`, which is the fixed timestamp saved to the database.
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [quitConfirmIndex, setQuitConfirmIndex] = useState<number | null>(null);
  React.useEffect(() => {
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const earlyQuitThreshold = durationMinutes * 60 * 0.3;

  // The back arrow always leaves immediately — nothing is saved, so there's
  // no XP to gate here. The confirmation instead belongs on the action that
  // actually CLAIMS a reward: pressing Finish & Save suspiciously fast is
  // the real "gaming the system" signal, not simply backing out.
  const handleBackPress = () => onBack();

  const handleFinish = async () => {
    setSaving(true);
    const supabase = createClient();

    const { data: session } = await supabase
      .from('workout_sessions')
      .insert({ user_id: userId, format: 'circuit', status: 'completed', started_at: startedAt, completed_at: new Date().toISOString(), duration_minutes: durationMinutes })
      .select()
      .single();

    if (session) {
      const rows = exercises.map((ex, i) => ({
        session_id: session.id,
        exercise_id: ex.id,
        order_index: i,
        weight: logs[ex.id].weight,
        reps: logs[ex.id].reps,
        sets: logs[ex.id].sets,
        completed: done.has(ex.id),
      }));
      await supabase.from('workout_exercises').insert(rows);

      // Per-exercise XP adjustment: see computeExerciseXp() above.
      const totalXP = exercises.reduce((sum, ex) => {
        if (!done.has(ex.id)) return sum;
        return sum + computeExerciseXp(ex, logs[ex.id]);
      }, 0);

      const { data: grantedXp } = await supabase.rpc('award_xp', { p_user_id: userId, p_xp: totalXP });

      onFinish(totalXP, grantedXp ?? totalXP);
    }
    setSaving(false);
  };

  // Pressing Finish & Save with less than 30% of the selected duration
  // elapsed shows the confirmation instead of saving immediately — this is
  // the moment someone is actually claiming the XP reward, so it's the
  // right place to check, not the back button.
  const handleFinishClick = () => {
    if (elapsedSeconds < earlyQuitThreshold) {
      setQuitConfirmIndex(Math.floor(Math.random() * QUIT_CONFIRM_PAIRS.length));
    } else {
      handleFinish();
    }
  };

  return (
    <div className="min-h-screen px-5 pb-28 pt-6" style={{ backgroundColor: C.bg }}>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={handleBackPress} className="flex h-9 w-9 items-center justify-center rounded-full border" style={{ borderColor: C.border, backgroundColor: C.surface }}><ArrowLeft size={16} style={{ color: C.text }} /></button>
        <div>
          <p className="text-xs uppercase tracking-wider" style={{ color: C.muted }}>Workout</p>
          <h1 className="text-2xl font-bold" style={SG}><NumberRoll value={done.size} duration={0.3} /> / {exercises.length}</h1>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {exercises.map((ex, exIndex) => {
          const log = logs[ex.id];
          const isDone = done.has(ex.id);
          const equipment = pickPrimaryEquipment(ex.equipment);
          return (
            <motion.div key={ex.id} className="rounded-2xl border p-4" style={{ backgroundColor: C.surface, borderColor: isDone ? `${C.xp}66` : C.border }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0, scale: isDone ? [1, 1.015, 1] : 1 }}
              transition={{ delay: exIndex * 0.06, duration: 0.3, ease: 'easeOut' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <button onClick={() => setViewing(ex)} className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl transition-transform active:scale-95" style={{ backgroundColor: C.raised }}>
                  <ExerciseIcon exercise={ex} size={40} />
                </button>
                <div>
                  <p className="font-bold" style={{ color: C.text, ...SG }}>{ex.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs capitalize" style={{ color: C.muted }}>{CATEGORY_LABELS[ex.category]}</span>
                    <span className="text-xs" style={{ color: C.muted }}>·</span>
                    <span className="text-xs font-medium" style={{ color: EQUIPMENT_COLORS[equipment] }}>{EQUIPMENT_LABELS[equipment]}</span>
                    <span className="text-xs" style={{ color: C.muted }}>· +{computeExerciseXp(ex, log)} XP</span>
                  </div>
                  <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>Tap the icon to see how it's done</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 rounded-xl border px-1 py-3" style={{ borderColor: C.border }}>
                <Stepper label="Weight" value={log.weight} onChange={(v) => setLogs((p) => ({ ...p, [ex.id]: { ...p[ex.id], weight: v } }))} step={1} unit="kg" />
                <Stepper label="Reps" value={log.reps} onChange={(v) => setLogs((p) => ({ ...p, [ex.id]: { ...p[ex.id], reps: v } }))} step={1} unit="reps" min={1} />
                <Stepper label="Sets" value={log.sets} onChange={(v) => setLogs((p) => ({ ...p, [ex.id]: { ...p[ex.id], sets: v } }))} step={1} unit="sets" min={1} />
              </div>
              <LedBorderButton onClick={() => setDone((p) => new Set(p).add(ex.id))} disabled={isDone} radius={12}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold"
                style={{ backgroundColor: isDone ? C.raised : C.xp, color: isDone ? C.xp : '#04140A', ...SG }}>
                {isDone ? (<><Check size={18} strokeWidth={3} /> Done</>) : 'Mark Complete'}
              </LedBorderButton>
            </motion.div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t px-5 py-4" style={{ backgroundColor: C.bg, borderColor: C.border }}>
        <LedBorderButton onClick={handleFinishClick} disabled={!allDone || saving}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold disabled:opacity-50"
          style={{ backgroundColor: allDone ? C.xp : C.raised, color: allDone ? '#04140A' : C.muted, ...SG }}>
          {saving ? 'Saving…' : allDone ? 'Finish & Save' : (
            <>Complete all (<NumberRoll value={done.size} duration={0.3} />/{exercises.length})</>
          )}
        </LedBorderButton>
      </div>
      {viewing && <ExerciseDetailModal exercise={viewing} onClose={() => setViewing(null)} />}
      {quitConfirmIndex !== null && (
        <QuitConfirmModal
          pair={QUIT_CONFIRM_PAIRS[quitConfirmIndex]}
          onKeepTraining={() => setQuitConfirmIndex(null)}
          onQuit={onBack}
        />
      )}
    </div>
  );
}

/** Shown when the user tries to leave a workout before 30% of the selected
 *  duration has passed. Quitting from here abandons the session entirely —
 *  nothing is saved, matching "End Workout, No XP". */
/**
 * Plain-CSS modal shell (no Motion dependency) for functionally-critical
 * dialogs like the quit-workout confirmation — this MUST reliably appear
 * and be dismissible even if the Motion library has a runtime issue, since
 * its job (stopping an accidental early quit) matters more than how it
 * looks. Uses a mount-triggered class toggle for a simple fade + scale-in.
 */
function SafeModalShell({ children, onBackdropClick }: { children: React.ReactNode; onBackdropClick?: () => void }) {
  const [visible, setVisible] = useState(false);
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5 transition-colors duration-200"
      style={{ backgroundColor: visible ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0)' }}
      onClick={onBackdropClick}
    >
      <div
        className="w-full max-w-sm transition-all duration-200 ease-out"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'scale(1) translateY(0)' : 'scale(0.94) translateY(12px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function QuitConfirmModal({ pair, onKeepTraining, onQuit }: {
  pair: { keepTraining: string; quit: string }; onKeepTraining: () => void; onQuit: () => void;
}) {
  return (
    <SafeModalShell>
      <div className="w-full max-w-sm rounded-3xl border p-6 text-center" style={{ borderColor: C.border, backgroundColor: C.surface }}>
        <img src="/icon-512.png" alt="WODXP" className="mx-auto h-16 w-16 rounded-2xl" />
        <h2 className="mt-4 text-lg font-bold" style={SG}>Leaving already?</h2>
        <p className="mt-1 text-sm" style={{ color: C.muted }}>
          You're not far into this one yet — quitting now means no XP for the session.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button onClick={onKeepTraining} className="rounded-2xl py-3.5 text-sm font-bold transition-transform active:scale-[0.96]" style={{ backgroundColor: C.xp, color: '#04140A', ...SG }}>
            {pair.keepTraining}
          </button>
          {/* Deliberately plain per spec: "The End Workout button must not use attention-seeking animation." */}
          <button onClick={onQuit} className="rounded-2xl border py-3.5 text-sm font-bold" style={{ borderColor: C.border, color: C.muted, ...SG }}>
            {pair.quit}
          </button>
        </div>
      </div>
    </SafeModalShell>
  );
}

// ─── Streak & Level-up messages ────────────────────────────────────────────────
const STREAK_MESSAGES: Record<3 | 5 | 7, string[]> = {
  3: [
    'Great streak! Remember to fuel your body well.',
    'Stay strong. Eat well, sleep well, train smart.',
    'Keep moving — but listen to your body.',
  ],
  5: [
    'Five days strong! Recovery is part of training.',
    "Don't forget to rest. That's when you get stronger.",
    'Train hard. Recover harder.',
  ],
  7: [
    "7-day streak! You've earned a recovery day.",
    'Take a break. Come back stronger.',
    "Rest isn't quitting. It's part of the plan.",
    'Great work! Hydrate, refuel and recharge.',
  ],
};

const LEVEL_UP_MESSAGES: string[] = [
  'LEVEL UP! Great work — you earned it!',
  'New level unlocked! Keep it going!',
  "You did it! Another level conquered.",
  'Stronger. Better. Level up!',
  'Great job! Your hard work is paying off.',
  'Boom! New level reached!',
  "Nice work! You're getting stronger.",
  'Progress unlocked! Keep pushing!',
  'Another level down. Great job!',
  'You showed up. You trained. You leveled up!',
  "Well earned! Welcome to the next level.",
  'That effort paid off. LEVEL UP!',
  "You're on fire! New level unlocked.",
  'Hard work = progress. Great job!',
  "Level complete. You're stronger than yesterday!",
];

// Paired continue/quit button texts for the early-quit confirmation dialog —
// kept as matched pairs (not independently randomized) so the joke/tone in
// each row lands correctly (e.g. "The family is watching" <-> "Family, forgive me").
const QUIT_CONFIRM_PAIRS: { keepTraining: string; quit: string }[] = [
  { keepTraining: 'No way, José — keep going!', quit: 'Not my day — end workout.' },
  { keepTraining: 'Back in the box — keep training!', quit: "I need more rest — I'm done." },
  { keepTraining: "The XP is waiting — continue!", quit: 'No XP today — end workout.' },
  { keepTraining: 'Not finished yet — keep going!', quit: "I'm calling it — finish now." },
  { keepTraining: "One more round — let's go!", quit: "Save it for tomorrow — I'm done." },
  { keepTraining: 'Back to work — continue workout!', quit: 'My battery is empty — end workout.' },
  { keepTraining: 'You almost escaped — get back in!', quit: "I'm out — no XP for me." },
  { keepTraining: 'The family is watching — keep going!', quit: 'Family, forgive me — I\'m done!' },
  { keepTraining: "XP isn't free — earn it!", quit: 'Rest mode activated — finish workout.' },
  { keepTraining: 'Get back in there — finish strong!', quit: 'Okay body, you win — end workout.' },
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Compares stats before/after a workout and returns any popups earned this session. */
function detectSessionPopups(prev: UserStats, next: UserStats): { levelUps: { attribute: string; level: number }[]; streakMessage: string | null } {
  const levelUps: { attribute: string; level: number }[] = [];
  const attrs: { key: keyof UserStats; label: string }[] = [
    { key: 'level_strength', label: 'Strength' },
    { key: 'level_mobility', label: 'Mobility' },
    { key: 'level_conditioning', label: 'Conditioning' },
  ];
  for (const { key, label } of attrs) {
    if ((next[key] as number) > (prev[key] as number)) {
      levelUps.push({ attribute: label, level: next[key] as number });
    }
  }

  let streakMessage: string | null = null;
  if ([3, 5, 7].includes(next.current_streak) && next.current_streak !== prev.current_streak) {
    streakMessage = randomFrom(STREAK_MESSAGES[next.current_streak as 3 | 5 | 7]);
  }

  return { levelUps, streakMessage };
}

function CompleteScreen({ xpEarned, levelUps, streakMessage, newlyUnlocked, unlockedChallenge, xpCapped, onHome }: {
  xpEarned: number;
  levelUps: { attribute: string; level: number }[];
  streakMessage: string | null;
  newlyUnlocked: number;
  unlockedChallenge: { name: string; isBoss: boolean } | null;
  xpCapped: boolean;
  onHome: () => void;
}) {
  const levelUpMessage = levelUps.length > 0 ? randomFrom(LEVEL_UP_MESSAGES) : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 text-center" style={{ backgroundColor: C.bg }}>
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full" style={{ backgroundColor: `${C.xp}1F`, border: `2px solid ${C.xp}`, boxShadow: `0 0 24px ${C.xp}66` }}>
        <Check size={48} strokeWidth={3} style={{ color: C.xp }} />
      </div>
      <h1 className="text-3xl font-bold" style={SG}>Workout Saved!</h1>
      <p className="mt-2" style={{ color: C.muted }}>Your progress has been recorded.</p>

      {levelUpMessage && (
        <motion.div
          className="mt-6 w-full rounded-2xl border p-5"
          style={{ borderColor: C.xp, backgroundColor: `${C.xp}15`, boxShadow: `0 0 20px ${C.xp}33` }}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: [0.85, 1.04, 1], opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <p className="text-lg font-bold" style={{ color: C.xp, ...SG }}>{levelUpMessage}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {levelUps.map((lu, i) => (
              <motion.span key={lu.attribute} className="rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: `${C.xp}22`, color: C.xp, ...MO }}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}>
                {lu.attribute} → Lv <NumberRoll value={lu.level} duration={0.5} />
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      {newlyUnlocked > 0 && (
        <div className="mt-4 w-full rounded-2xl border p-5" style={{ borderColor: C.mobility, backgroundColor: `${C.mobility}15`, boxShadow: `0 0 20px ${C.mobility}33` }}>
          <p className="flex items-center justify-center gap-2 text-lg font-bold" style={{ color: C.mobility, ...SG }}>
            <Sparkles size={20} /> You unlocked new movements!
          </p>
          <p className="mt-1 text-sm" style={{ color: C.text }}>
            {newlyUnlocked} new {newlyUnlocked === 1 ? 'exercise is' : 'exercises are'} now available to train.
          </p>
        </div>
      )}

      {unlockedChallenge && (
        <div className="mt-4 w-full rounded-2xl border p-5" style={{ borderColor: unlockedChallenge.isBoss ? C.boss : C.xp, backgroundColor: `${unlockedChallenge.isBoss ? C.boss : C.xp}15`, boxShadow: `0 0 20px ${unlockedChallenge.isBoss ? C.boss : C.xp}33` }}>
          <p className="flex items-center justify-center gap-2 text-lg font-bold" style={{ color: unlockedChallenge.isBoss ? C.boss : C.xp, ...SG }}>
            {unlockedChallenge.isBoss ? <Swords size={20} /> : <Trophy size={20} />}
            {unlockedChallenge.isBoss ? 'Boss Battle unlocked!' : 'Level Challenge unlocked!'}
          </p>
          <p className="mt-1 text-sm" style={{ color: C.text }}>{unlockedChallenge.name} is now available on Home.</p>
        </div>
      )}

      {streakMessage && (
        <div className="mt-4 w-full rounded-2xl border p-4" style={{ borderColor: C.border, backgroundColor: C.surface }}>
          <p className="flex items-center justify-center gap-2 text-sm font-medium" style={{ color: C.text }}>
            <Flame size={16} color="#FF9D4D" fill="#FF9D4D" /> {streakMessage}
          </p>
        </div>
      )}

      <div className="mt-6 w-full rounded-2xl border p-5" style={{ borderColor: C.border, backgroundColor: C.surface }}>
        <p className="text-sm" style={{ color: C.muted }}>XP earned this session</p>
        <p className="mt-1 text-4xl font-bold" style={{ color: C.xp, ...MO }}>+<NumberRoll value={xpEarned} duration={0.8} /></p>
      </div>
      {xpCapped && (
        <p className="mt-3 text-xs leading-relaxed" style={{ color: C.muted }}>
          You've hit today's XP limit (2 workouts/day) — this session was still saved, but XP resumes tomorrow.
        </p>
      )}
      <button onClick={onHome} className="mt-8 w-full rounded-2xl py-4 text-lg font-bold" style={{ backgroundColor: C.xp, color: '#04140A', ...SG }}>
        Back to Home
      </button>
    </div>
  );
}

/** Full-screen overlay showing the two-pose illustration + movement info for one exercise. */
/** Splits a flowing instruction paragraph into beginner-friendly numbered steps. */
function splitIntoSteps(text?: string): string[] {
  if (!text) return [];
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function ExerciseDetailModal({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
  const equipment = pickPrimaryEquipment(exercise.equipment);
  const steps = splitIntoSteps(exercise.instructions);

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-auto" style={{ backgroundColor: C.bg }}>
      <div className="flex items-center px-5 pt-6 pb-2">
        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border" style={{ borderColor: C.border, backgroundColor: C.surface }}>
          <ArrowLeft size={16} style={{ color: C.text }} />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center px-5 py-4">
        <div className="flex items-center justify-center" style={{ minHeight: 200 }}>
          <ExerciseVisual exercise={exercise} size={90} />
        </div>

        <div className="mt-6 w-full max-w-sm">
          <h1 className="text-2xl font-bold text-center" style={SG}>{exercise.name}</h1>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider rounded-full px-2.5 py-1" style={{ border: `1px solid ${C.border}`, color: C.muted }}>
              {CATEGORY_LABELS[exercise.category]}
            </span>
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: EQUIPMENT_COLORS[equipment] }}>
              {EQUIPMENT_LABELS[equipment]}
            </span>
            <span className="text-xs font-medium uppercase tracking-wider capitalize" style={{ color: C.muted }}>
              {exercise.difficulty}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            <div className="rounded-xl border p-3 text-center" style={{ borderColor: C.border, backgroundColor: C.surface }}>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>Unlocks at</p>
              <p className="mt-1 font-bold" style={{ color: C.text, ...MO }}>Lv {exercise.unlock_level}</p>
            </div>
            <div className="rounded-xl border p-3 text-center" style={{ borderColor: C.border, backgroundColor: C.surface }}>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>Base XP</p>
              <p className="mt-1 font-bold" style={{ color: C.xp, ...MO }}>+{exercise.xp_value}</p>
            </div>
            <div className="rounded-xl border p-3 text-center" style={{ borderColor: C.border, backgroundColor: C.surface }}>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>Default</p>
              <p className="mt-1 font-bold" style={{ color: C.text, ...MO }}>{exercise.default_sets}×{exercise.default_reps}</p>
            </div>
          </div>

          {steps.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-bold uppercase tracking-wide" style={SG}>How to do it</h2>
              <ol className="mt-3 flex flex-col gap-3">
                {steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{ backgroundColor: `${C.xp}22`, color: C.xp, ...MO }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm leading-relaxed pt-0.5" style={{ color: C.text }}>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          </div>
        </div>
      </div>
  );
}

function ExercisesScreen({ exercises }: { exercises: Exercise[] }) {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');
  const [equipFilter, setEquipFilter] = useState<'all' | Equipment>('all');
  const [selected, setSelected] = useState<Exercise | null>(null);
  const cats = ['all', ...Array.from(new Set(exercises.map((e) => e.category)))];
  const filtered = exercises.filter((e) => {
    const matchesCat = cat === 'all' || e.category === cat;
    const matchesEquip = equipFilter === 'all' || e.equipment.includes(equipFilter);
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesEquip && matchesSearch;
  });

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: C.bg }}>
      <header className="px-5 pt-6 pb-3">
        <p className="text-xs uppercase tracking-wider" style={{ color: C.muted }}>Exercise Library</p>
        <h1 className="text-2xl font-bold" style={SG}>{exercises.length} Movements</h1>
        <div className="mt-2 flex items-center gap-4">
          {(['kettlebell', 'dumbbell', 'bodyweight'] as Equipment[]).map((eq) => (
            <button key={eq} onClick={() => setEquipFilter(equipFilter === eq ? 'all' : eq)}
              className="flex items-center gap-1.5 text-xs font-medium"
              style={{ color: equipFilter === eq ? EQUIPMENT_COLORS[eq] : C.muted }}>
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: EQUIPMENT_COLORS[eq], boxShadow: equipFilter === eq ? `0 0 6px ${EQUIPMENT_COLORS[eq]}` : 'none' }} />
              {EQUIPMENT_LABELS[eq]}
            </button>
          ))}
        </div>
      </header>

      <div className="px-5">
        <div className="flex items-center gap-2 rounded-xl border px-3 py-2.5" style={{ borderColor: C.border, backgroundColor: C.surface }}>
          <Search size={16} style={{ color: C.muted }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search exercises"
            className="w-full bg-transparent text-sm outline-none" style={{ color: C.text }} />
        </div>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto px-5 pb-1" style={{ scrollbarWidth: 'none' }}>
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)} className="shrink-0 rounded-full border px-4 py-2 text-xs font-semibold capitalize"
            style={{ borderColor: cat === c ? C.xp : C.border, backgroundColor: cat === c ? `${C.xp}1A` : 'transparent', color: cat === c ? C.xp : C.muted, ...SG }}>
            {c === 'all' ? 'All' : CATEGORY_LABELS[c as ExerciseCategory]}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-col gap-2 px-5">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm" style={{ color: C.muted }}>No exercises found.</p>
        ) : (
          filtered.map((ex) => {
            return (
              <button key={ex.id} onClick={() => setSelected(ex)}
                className="flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors active:bg-white/5"
                style={{ borderColor: C.border, backgroundColor: C.surface }}>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate" style={{ color: C.text, ...SG }}>{ex.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[10px] font-medium uppercase tracking-wider rounded-full px-2 py-0.5" style={{ color: C.muted, border: `1px solid ${C.border}` }}>
                      {CATEGORY_LABELS[ex.category]}
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wider capitalize" style={{ color: C.muted }}>{ex.difficulty}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    {ex.equipment.map((eq) => (
                      <span key={eq} className="flex items-center gap-1 text-[11px] font-medium capitalize" style={{ color: EQUIPMENT_COLORS[eq as Equipment] }}>
                        <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: EQUIPMENT_COLORS[eq as Equipment] }} />
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="font-mono text-xs shrink-0" style={{ color: C.xp }}>+{ex.xp_value}</span>
              </button>
            );
          })
        )}
      </div>
      {selected && <ExerciseDetailModal exercise={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function StatsScreen({ stats }: { stats: UserStats }) {
  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: C.bg }}>
      <header className="px-5 pt-6 pb-4">
        <p className="text-xs uppercase tracking-wider" style={{ color: C.muted }}>Your Progress</p>
        <h1 className="text-2xl font-bold" style={SG}>Stats</h1>
      </header>
      <div className="grid grid-cols-3 gap-2 px-5">
        {[
          { label: 'Total XP', value: stats.xp_total.toLocaleString(), color: C.xp },
          { label: 'Streak', value: `${stats.current_streak}d`, color: '#FF9D4D' },
          { label: 'Best Streak', value: `${stats.longest_streak}d`, color: C.text },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border p-4" style={{ borderColor: C.border, backgroundColor: C.surface }}>
            <p className="text-[11px] uppercase tracking-wider" style={{ color: C.muted }}>{label}</p>
            <p className="mt-1 text-2xl font-bold" style={{ color, ...MO }}>{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 px-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide" style={SG}>Attributes</h2>
        <div className="flex flex-col gap-4 rounded-2xl border p-4" style={{ borderColor: C.border, backgroundColor: C.surface }}>
          {[
            { label: 'Strength', level: stats.level_strength, xp: stats.xp_strength, color: C.strength },
            { label: 'Mobility', level: stats.level_mobility, xp: stats.xp_mobility, color: C.mobility },
            { label: 'Conditioning', level: stats.level_conditioning, xp: stats.xp_conditioning, color: C.conditioning },
          ].map(({ label, level, xp, color }) => {
            const { progress, xpLeft } = progressToNext(xp, level);
            return (
              <div key={label}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm font-bold" style={{ ...SG, color: C.text }}>{label}</span>
                  <span className="text-xs" style={{ color, ...MO }}>Lv {level} · {xpLeft.toLocaleString()} XP to next</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: C.raised }}>
                  <div className="h-full rounded-full" style={{ width: `${progress * 100}%`, backgroundColor: color, transition: 'width 0.5s ease', boxShadow: `0 0 8px ${color}` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Formats total seconds trained as "Xh Ym" for the all-time stats card. */
function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function AllTimeStatsCard({ stats }: { stats: AllTimeStats }) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide" style={SG}>All-Time Stats</h2>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border p-3 text-center" style={{ borderColor: C.border, backgroundColor: C.surface }}>
          <p className="text-lg font-bold" style={{ color: C.xp, ...MO }}>{formatDuration(stats.totalSeconds)}</p>
          <p className="mt-1 text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>Time Trained</p>
        </div>
        <div className="rounded-2xl border p-3 text-center" style={{ borderColor: C.border, backgroundColor: C.surface }}>
          <NumberRoll value={stats.totalWorkouts} className="text-lg font-bold" style={{ color: C.xp, ...MO }} />
          <p className="mt-1 text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>Workouts</p>
        </div>
        <div className="rounded-2xl border p-3 text-center" style={{ borderColor: C.border, backgroundColor: C.surface }}>
          <NumberRoll value={Math.round(stats.totalKg)} className="text-lg font-bold" style={{ color: C.xp, ...MO }} />
          <p className="mt-1 text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>kg Lifted</p>
        </div>
      </div>
    </div>
  );
}

/** BMI categories per WHO standard. */
function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: C.mobility };
  if (bmi < 25) return { label: 'Normal range', color: C.xp };
  if (bmi < 30) return { label: 'Overweight', color: C.conditioning };
  return { label: 'Obese', color: C.boss };
}

/**
 * Average BMI by age group and gender, from CDC/NHANES 2015-2016
 * (National Health Statistics Reports No. 122, Table 7 — public domain).
 * Used only as a population reference point, never as an individual
 * target or diagnostic claim.
 */
const AVERAGE_BMI_BY_AGE_GENDER: Record<'male' | 'female', Record<'20-39' | '40-59' | '60+', number>> = {
  male: { '20-39': 28.7, '40-59': 29.4, '60+': 29.2 },
  female: { '20-39': 28.7, '40-59': 30.4, '60+': 29.8 },
};

function ageToBracket(age: number): '20-39' | '40-59' | '60+' {
  if (age < 40) return '20-39';
  if (age < 60) return '40-59';
  return '60+';
}

/** Looks up the reference average BMI for a given age + gender.
 *  For "other", averages the male and female figures for that bracket. */
function getAverageBmi(age: number, gender: 'male' | 'female' | 'other'): number {
  const bracket = ageToBracket(age);
  if (gender === 'other') {
    return (AVERAGE_BMI_BY_AGE_GENDER.male[bracket] + AVERAGE_BMI_BY_AGE_GENDER.female[bracket]) / 2;
  }
  return AVERAGE_BMI_BY_AGE_GENDER[gender][bracket];
}

/**
 * BMI calculator — entirely client-side. Age, gender, height and weight are
 * kept only in local component state and are NEVER sent to Supabase or any
 * server, per GDPR: nothing here is persisted or logged anywhere.
 */
function BMICalculator() {
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'female' | 'male' | 'other'>('female');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');

  const h = parseFloat(heightCm);
  const w = parseFloat(weightKg);
  const a = parseFloat(age);
  const bmi = h > 0 && w > 0 ? w / ((h / 100) * (h / 100)) : null;
  const category = bmi ? bmiCategory(bmi) : null;
  const averageBmi = a > 0 ? getAverageBmi(a, gender) : null;

  return (
    <div>
      <h2 className="mb-1 text-sm font-bold uppercase tracking-wide" style={SG}>BMI Calculator</h2>
      <p className="mb-3 text-xs" style={{ color: C.muted }}>
        Not saved anywhere — calculated on your device only.
      </p>
      <div className="rounded-2xl border p-4" style={{ borderColor: C.border, backgroundColor: C.surface }}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>Age</label>
            <input type="number" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)}
              placeholder="30" className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ borderColor: C.border, backgroundColor: C.raised, color: C.text }} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>Gender</label>
            <select value={gender} onChange={(e) => setGender(e.target.value as any)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ borderColor: C.border, backgroundColor: C.raised, color: C.text }}>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>Height (cm)</label>
            <input type="number" inputMode="numeric" value={heightCm} onChange={(e) => setHeightCm(e.target.value)}
              placeholder="175" className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ borderColor: C.border, backgroundColor: C.raised, color: C.text }} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>Weight (kg)</label>
            <input type="number" inputMode="numeric" value={weightKg} onChange={(e) => setWeightKg(e.target.value)}
              placeholder="75" className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ borderColor: C.border, backgroundColor: C.raised, color: C.text }} />
          </div>
        </div>

        {bmi !== null && category && (
          <div className="mt-4 rounded-xl border px-4 py-3 text-center" style={{ borderColor: category.color, backgroundColor: `${category.color}15` }}>
            <p className="text-2xl font-bold" style={{ color: category.color, ...MO }}>{bmi.toFixed(1)}</p>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: category.color }}>{category.label}</p>
            <p className="mt-1 text-[11px]" style={{ color: C.muted }}>WHO healthy range is 18.5–24.9</p>
          </div>
        )}

        {bmi !== null && averageBmi !== null && (
          <div className="mt-3 flex items-center justify-between rounded-xl border px-4 py-3" style={{ borderColor: C.border, backgroundColor: C.raised }}>
            <div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>
                Avg. for {gender === 'other' ? 'adults' : gender === 'male' ? 'men' : 'women'} {ageToBracket(a)}
              </p>
              <p className="text-lg font-bold" style={{ color: C.text, ...MO }}>{averageBmi.toFixed(1)}</p>
            </div>
            <p className="max-w-[45%] text-right text-[11px]" style={{ color: C.muted }}>
              {bmi < averageBmi ? 'Below' : bmi > averageBmi ? 'Above' : 'Right at'} this population average
            </p>
          </div>
        )}

        <p className="mt-3 text-[11px] leading-relaxed" style={{ color: C.muted }}>
          BMI is a rough screening tool and doesn&apos;t account for muscle mass — strength athletes
          often score &quot;overweight&quot; despite being lean and fit. Use it as a general reference, not a verdict.
          Age/gender averages sourced from CDC/NHANES 2015–2016 population data.
        </p>
      </div>
    </div>
  );
}

function ProfileMenu({ username, onLogout, onPrivacy, allTimeStats }: { username: string; onLogout: () => void; onPrivacy: () => void; allTimeStats: AllTimeStats }) {
  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: C.bg }}>
      <header className="px-5 pt-6 pb-4">
        <p className="text-xs uppercase tracking-wider" style={{ color: C.muted }}>Account</p>
        <h1 className="text-2xl font-bold" style={SG}>{username}</h1>
      </header>

      <div className="px-5">
        <AllTimeStatsCard stats={allTimeStats} />
      </div>

      <div className="px-5 pt-6">
        <BMICalculator />
      </div>

      <div className="px-5 pt-6 flex flex-col gap-3">
        <button onClick={onPrivacy} className="flex w-full items-center justify-between rounded-2xl border py-4 px-5 text-sm font-bold" style={{ borderColor: C.border, color: C.text, backgroundColor: C.surface, ...SG }}>
          Privacy Policy
          <ChevronRight size={16} style={{ color: C.muted }} />
        </button>
        <button onClick={onLogout} className="w-full rounded-2xl border py-4 text-sm font-bold" style={{ borderColor: C.border, color: C.boss, backgroundColor: C.surface, ...SG }}>
          Log Out
        </button>
      </div>
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
type Tab = 'home' | 'exercises' | 'wodxp' | 'stats' | 'profile';
type Screen = 'tab' | 'generator' | 'safety' | 'workout' | 'complete' | 'challenge' | 'boss' | 'challenge-result' | 'boss-result' | 'wod-detail' | 'wod-result';

/** Depth ranking per screen, used by PageTransition to infer forward vs
 *  back navigation direction without touching every setScreen() call site. */
const SCREEN_DEPTH: Record<string, number> = {
  tab: 0,
  generator: 1, challenge: 1, boss: 1, 'wod-detail': 1,
  safety: 2, 'challenge-result': 2, 'boss-result': 2, 'wod-result': 2,
  workout: 3,
  complete: 4,
};

export default function AppClient({ user, stats: initialStats, exercises: initialExercises, allTimeStats: initialAllTimeStats, levelChallenges, bossBattles, totalExerciseCount, classicWods, wodSummary: initialWodSummary, wodMedals }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('home');
  const [screen, setScreen] = useState<Screen>('tab');
  const [sessionExercises, setSessionExercises] = useState<Exercise[]>([]);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(20);
  const [lastXP, setLastXP] = useState(0);
  const [sessionLevelUps, setSessionLevelUps] = useState<{ attribute: string; level: number }[]>([]);
  const [sessionStreakMessage, setSessionStreakMessage] = useState<string | null>(null);
  const [sessionNewlyUnlocked, setSessionNewlyUnlocked] = useState(0);
  const [sessionUnlockedChallenge, setSessionUnlockedChallenge] = useState<{ name: string; isBoss: boolean } | null>(null);
  const [xpCapped, setXpCapped] = useState(false);
  const [challengeXpEarned, setChallengeXpEarned] = useState(0);
  const [bossResult, setBossResult] = useState<{ passed: boolean; medal: string | null; xpReward: number } | null>(null);
  const [stats, setStats] = useState(initialStats);
  const [allTimeStats, setAllTimeStats] = useState(initialAllTimeStats);
  const [exercises, setExercises] = useState(initialExercises);
  const [wodSummary, setWodSummary] = useState(initialWodSummary);
  const [wodMedalsState, setWodMedalsState] = useState(wodMedals);
  const [selectedWod, setSelectedWod] = useState<ClassicWod | null>(null);
  const [wodResult, setWodResult] = useState<{ medal: string | null; scoreValue: number } | null>(null);

  const refreshWodSummary = async () => {
    const supabase = createClient();
    const { data } = await supabase.rpc('get_wod_summary', { p_user_id: user.id });
    const row = data?.[0];
    if (row) setWodSummary({ completed: row.completed ?? 0, gold: row.gold ?? 0, silver: row.silver ?? 0, bronze: row.bronze ?? 0 });

    const { data: medalRows } = await supabase.rpc('get_user_wod_medals', { p_user_id: user.id });
    if (medalRows) {
      setWodMedalsState(Object.fromEntries(medalRows.map((r: { wod_slot: number; medal: string }) => [r.wod_slot, r.medal])));
    }
  };

  const refreshStats = async () => {
    const supabase = createClient();
    const { data } = await supabase.from('user_stats').select('*').eq('user_id', user.id).single();
    if (data) setStats(data);
    return data;
  };

  // Movements unlocked (the `exercises` list) are filtered server-side by
  // attribute level at page load — like All-Time Stats, they'd stay frozen
  // after a workout unless explicitly refetched. Returns how many NEW
  // exercises became available compared to the current list, so the caller
  // can show a "you unlocked new movements" popup when it's > 0.
  const refreshExercises = async (newMaxLevel: number) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .lte('unlock_level', newMaxLevel)
      .order('unlock_level', { ascending: true });
    const newCount = data ? data.length - exercises.length : 0;
    if (data) setExercises(data);
    return Math.max(0, newCount);
  };

  // All-Time Stats (time trained, kg lifted, workouts completed) are only
  // fetched server-side on initial page load — without this, they'd stay
  // frozen at whatever they were when the page loaded, even after
  // finishing a new workout in the same session.
  const refreshAllTimeStats = async () => {
    const supabase = createClient();
    const { data } = await supabase.rpc('get_alltime_stats', { p_user_id: user.id });
    const row = data?.[0];
    if (row) {
      setAllTimeStats({
        totalWorkouts: row.total_workouts ?? 0,
        totalKg: row.total_kg ?? 0,
        totalSeconds: row.total_seconds ?? 0,
      });
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleFinish = async (requestedXp: number, grantedXp: number) => {
    setLastXP(grantedXp);
    setXpCapped(grantedXp < requestedXp);
    const supabase = createClient();
    const previousStats = stats;
    const { data } = await supabase.from('user_stats').select('*').eq('user_id', user.id).single();
    if (data) {
      setStats(data);
      const popups = detectSessionPopups(previousStats, data);
      setSessionLevelUps(popups.levelUps);
      setSessionStreakMessage(popups.streakMessage);

      // Detect a Level Challenge / Boss Battle transitioning from locked to
      // unlocked as a result of this workout's XP (separate from the
      // "new exercises unlocked" check below — this is about the Quest Lv
      // gated content, not the attribute-based exercise library).
      const previousProgress = getLevelProgress(previousStats, levelChallenges, bossBattles);
      const newProgress = getLevelProgress(data, levelChallenges, bossBattles);
      if (!previousProgress.isUnlocked && newProgress.isUnlocked) {
        if (newProgress.isBossPending && newProgress.boss) {
          setSessionUnlockedChallenge({ name: newProgress.boss.name, isBoss: true });
        } else if (newProgress.challenge) {
          setSessionUnlockedChallenge({ name: newProgress.challenge.name, isBoss: false });
        } else {
          setSessionUnlockedChallenge(null);
        }
      } else {
        setSessionUnlockedChallenge(null);
      }

      const newMaxLevel = Math.max(data.level_strength, data.level_mobility, data.level_conditioning);
      const newlyUnlocked = await refreshExercises(newMaxLevel);
      setSessionNewlyUnlocked(newlyUnlocked);
    } else {
      setSessionLevelUps([]);
      setSessionStreakMessage(null);
      setSessionNewlyUnlocked(0);
      setSessionUnlockedChallenge(null);
    }
    await refreshAllTimeStats();
    setScreen('complete');
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'home', label: 'Home' },
    { key: 'exercises', label: 'Exercises' },
    { key: 'wodxp', label: 'WOD XP' },
    { key: 'stats', label: 'Stats' },
    { key: 'profile', label: 'Profile' },
  ];

  const GlobalStyle = () => <style>{neonIconStyles}{illustrationStyles}</style>;

  if (screen === 'challenge') {
    const progress = getLevelProgress(stats, levelChallenges, bossBattles);
    if (!progress.challenge) { setScreen('tab'); return null; }
    return (
      <>
        <GlobalStyle />
        <PageTransition screenKey={screen}>
          <LevelChallengeScreen challenge={progress.challenge} exercises={exercises} userId={user.id} onBack={() => setScreen('tab')}
            onComplete={async (xp) => { setChallengeXpEarned(xp); await refreshStats(); setScreen('challenge-result'); }}
            onFail={() => setScreen('tab')} />
        </PageTransition>
      </>
    );
  }
  if (screen === 'challenge-result') return (
    <>
      <GlobalStyle />
      <PageTransition screenKey={screen}>
        <ChallengeResultScreen xpEarned={challengeXpEarned} onHome={() => { setScreen('tab'); setTab('home'); }} />
      </PageTransition>
    </>
  );
  if (screen === 'boss') {
    const progress = getLevelProgress(stats, levelChallenges, bossBattles);
    if (!progress.boss) { setScreen('tab'); return null; }
    return (
      <>
        <GlobalStyle />
        <PageTransition screenKey={screen}>
          <BossBattleScreen boss={progress.boss} exercises={exercises} userId={user.id} onBack={() => setScreen('tab')}
            onComplete={async (result) => { setBossResult(result); await refreshStats(); setScreen('boss-result'); }} />
        </PageTransition>
      </>
    );
  }
  if (screen === 'boss-result' && bossResult) {
    const progress = getLevelProgress(stats, levelChallenges, bossBattles);
    return (
      <>
        <GlobalStyle />
        <PageTransition screenKey={screen}>
          <BossResultScreen result={bossResult} bossName={progress.boss?.name ?? bossBattles.find((b) => b.level === stats.level)?.name ?? 'Boss'} onHome={() => { setScreen('tab'); setTab('home'); }} />
        </PageTransition>
      </>
    );
  }
  if (screen === 'wod-detail' && selectedWod) return (
    <>
      <GlobalStyle />
      <PageTransition screenKey={screen}>
        <WodDetailScreen wod={selectedWod} exercises={exercises} userId={user.id} onBack={() => setScreen('tab')}
          onComplete={async (result) => { setWodResult(result); await refreshWodSummary(); setScreen('wod-result'); }} />
      </PageTransition>
    </>
  );
  if (screen === 'wod-result' && wodResult && selectedWod) return (
    <>
      <GlobalStyle />
      <PageTransition screenKey={screen}>
        <WodResultScreen result={wodResult} wod={selectedWod} onHome={() => { setScreen('tab'); setTab('wodxp'); }} />
      </PageTransition>
    </>
  );
  if (screen === 'generator') return (
    <>
      <GlobalStyle />
      <PageTransition screenKey={screen}>
        <GeneratorScreen exercises={exercises} totalExerciseCount={totalExerciseCount} onBack={() => setScreen('tab')}
          onStart={(exs, durationMinutes) => {
            setSessionExercises(exs);
            setSessionDurationMinutes(durationMinutes);
            const skip = typeof window !== 'undefined' && window.localStorage.getItem('wodxp_skip_safety_notice') === '1';
            setScreen(skip ? 'workout' : 'safety');
          }} />
      </PageTransition>
    </>
  );
  if (screen === 'safety') return (
    <>
      <GlobalStyle />
      <PageTransition screenKey={screen}>
        <SafetyNoticeScreen onBack={() => setScreen('generator')} onContinue={() => setScreen('workout')} />
      </PageTransition>
    </>
  );
  if (screen === 'workout') return (
    <>
      <GlobalStyle />
      <PageTransition screenKey={screen}>
        <WorkoutScreen exercises={sessionExercises} userId={user.id} durationMinutes={sessionDurationMinutes}
          onBack={() => setScreen('tab')} onFinish={handleFinish} />
      </PageTransition>
    </>
  );
  if (screen === 'complete') return (
    <>
      <GlobalStyle />
      <PageTransition screenKey={screen}>
        <CompleteScreen xpEarned={lastXP} levelUps={sessionLevelUps} streakMessage={sessionStreakMessage} newlyUnlocked={sessionNewlyUnlocked} unlockedChallenge={sessionUnlockedChallenge} xpCapped={xpCapped} onHome={() => { setScreen('tab'); setTab('home'); }} />
      </PageTransition>
    </>
  );

  let content: React.ReactNode = null;
  if (tab === 'home') content = (
    <HomeScreen
      user={user} stats={stats} onGenerate={() => setScreen('generator')}
      onChallenge={() => setScreen('challenge')} onBoss={() => setScreen('boss')}
      levelChallenges={levelChallenges} bossBattles={bossBattles}
      unlockedCount={exercises.length} totalCount={totalExerciseCount}
    />
  );
  else if (tab === 'wodxp') content = <WodXpScreen stats={stats} classicWods={classicWods} summary={wodSummary} wodMedals={wodMedalsState} onOpenWod={(wod) => { setSelectedWod(wod); setScreen('wod-detail'); }} />;
  else if (tab === 'exercises') content = <ExercisesScreen exercises={exercises} />;
  else if (tab === 'stats') content = <StatsScreen stats={stats} />;
  else if (tab === 'profile') content = <ProfileMenu username={user.username} onLogout={handleLogout} onPrivacy={() => router.push('/privacy')} allTimeStats={allTimeStats} />;

  return (
    <div style={{ backgroundColor: C.bg }}>
      <GlobalStyle />
      <PageTransition screenKey={tab}>
        {content}
      </PageTransition>
      <nav className="fixed bottom-0 left-0 right-0 flex items-center justify-around border-t px-2 py-3" style={{ backgroundColor: C.surface, borderColor: C.border }}>
        {tabs.map((t) => {
          const activeColor = t.key === 'wodxp' ? C.conditioning : C.xp;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} className="flex flex-col items-center gap-1 px-3 py-1" style={{ color: tab === t.key ? activeColor : C.muted }}>
              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tab === t.key ? activeColor : 'transparent', boxShadow: tab === t.key ? `0 0 6px ${activeColor}` : 'none' }} />
              <span className="text-[10px] font-medium uppercase tracking-wide">{t.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
