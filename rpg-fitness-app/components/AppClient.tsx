'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Flame, ChevronRight, Search, Lock, Trophy, Swords, Plus, Crown,
  TrendingUp, Award, Sparkles, Dumbbell, Target, Clock, Gauge,
  Minus, Check, ArrowLeft,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface User { id: string; email: string; username: string; }
interface UserStats {
  level: number; xp_total: number;
  xp_strength: number; xp_mobility: number; xp_conditioning: number;
  level_strength: number; level_mobility: number; level_conditioning: number;
  current_streak: number; longest_streak: number; streak_freeze_count: number;
}
interface Exercise {
  id: string; name: string; category: string; difficulty: string;
  equipment: string[]; primary_attribute: string; unlock_level: number;
  xp_value: number; default_sets: number; default_reps: number;
  default_weight_kg: number; illustration_url?: string;
}
interface Props { user: User; stats: UserStats; exercises: Exercise[]; }

// ─── Design tokens ───────────────────────────────────────────────────────────
const C = {
  bg: '#15171C', surface: '#1F232B', raised: '#2A2F3A', border: '#323844',
  text: '#EDEFF2', muted: '#8B92A3', xp: '#7CFF6B', boss: '#FF6B5C',
  strength: '#7CFF6B', mobility: '#6BD4FF', conditioning: '#FFC56B',
  kettlebell: '#FFC56B', dumbbell: '#6BD4FF',
};

// ─── XP helpers ──────────────────────────────────────────────────────────────
function xpForLevel(level: number) { return Math.round(60 * Math.pow(level, 2.1)); }
function progressToNext(xp: number, level: number) {
  const current = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { progress: Math.min(1, (xp - current) / (next - current)), xpLeft: next - xp };
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
const SG = { fontFamily: "'Space Grotesk', sans-serif" };
const MO = { fontFamily: "'JetBrains Mono', monospace" };

function AttributeRing({ label, level, xp, color }: { label: string; level: number; xp: number; color: string }) {
  const { progress } = progressToNext(xp, level);
  const size = 88; const stroke = 6;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={C.raised} strokeWidth={stroke} />
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color: C.text, ...MO }}>{level}</span>
          <span className="text-[9px] uppercase tracking-wider" style={{ color: C.muted, ...MO }}>LV</span>
        </div>
      </div>
      <span className="text-xs font-medium uppercase tracking-wide" style={{ color: C.muted, ...SG }}>{label}</span>
    </div>
  );
}

function Stepper({ label, value, onChange, step = 1, unit, min = 0 }: { label: string; value: number; onChange: (v: number) => void; step?: number; unit?: string; min?: number }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: C.muted, ...SG }}>{label}</span>
      <div className="flex items-center gap-2">
        <button onClick={() => onChange(Math.max(min, value - step))} className="flex h-10 w-10 items-center justify-center rounded-full border" style={{ borderColor: C.border, color: C.text }}><Minus size={16} /></button>
        <div className="flex min-w-[64px] flex-col items-center">
          <span className="text-2xl font-bold" style={{ color: C.text, ...MO }}>{value}</span>
          {unit && <span className="text-[10px]" style={{ color: C.muted, ...MO }}>{unit}</span>}
        </div>
        <button onClick={() => onChange(value + step)} className="flex h-10 w-10 items-center justify-center rounded-full border" style={{ borderColor: C.border, color: C.text }}><Plus size={16} /></button>
      </div>
    </div>
  );
}

// ─── Screens ─────────────────────────────────────────────────────────────────

function HomeScreen({ user, stats, onGenerate, onBoss }: { user: User; stats: UserStats; onGenerate: () => void; onBoss: () => void }) {
  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: C.bg }}>
      <header className="flex items-center justify-between px-5 pt-6 pb-2">
        <div>
          <p className="text-xs uppercase tracking-wider" style={{ color: C.muted }}>Welcome back</p>
          <h1 className="text-xl font-bold" style={SG}>{user.username}</h1>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border px-3 py-1.5" style={{ borderColor: C.border, backgroundColor: C.surface }}>
          <Flame size={16} color="#FF9D4D" fill="#FF9D4D" />
          <span className="text-sm font-semibold" style={MO}>{stats.current_streak}</span>
        </div>
      </header>

      <section className="px-5 pt-4">
        <div className="flex items-center justify-around rounded-2xl border px-4 py-5" style={{ borderColor: C.border, backgroundColor: C.surface }}>
          <AttributeRing label="Strength" level={stats.level_strength} xp={stats.xp_strength} color={C.strength} />
          <AttributeRing label="Mobility" level={stats.level_mobility} xp={stats.xp_mobility} color={C.mobility} />
          <AttributeRing label="Conditioning" level={stats.level_conditioning} xp={stats.xp_conditioning} color={C.conditioning} />
        </div>
      </section>

      <section className="px-5 pt-5">
        <button onClick={onGenerate} className="flex w-full items-center justify-between rounded-2xl px-5 py-4 transition-transform active:scale-[0.98]" style={{ backgroundColor: C.xp, color: '#0E150C' }}>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider opacity-70">Ready to train?</p>
            <p className="text-lg font-bold" style={SG}>Generate Workout</p>
          </div>
          <ChevronRight size={22} strokeWidth={2.5} />
        </button>
      </section>

      <section className="px-5 pt-4">
        <button onClick={onBoss} className="flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left" style={{ borderColor: 'rgba(255,107,92,0.35)', backgroundColor: 'rgba(255,107,92,0.06)' }}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(255,107,92,0.15)' }}>
            <Swords size={22} color={C.boss} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: C.boss }}>Boss Challenge</p>
            <p className="text-sm" style={{ color: C.text }}>Clear this to advance your level</p>
          </div>
          <ChevronRight size={18} style={{ color: C.muted }} />
        </button>
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

function GeneratorScreen({ exercises, onBack, onStart }: { exercises: Exercise[]; onBack: () => void; onStart: (exs: Exercise[]) => void }) {
  const [equipment, setEquipment] = useState<'kettlebell' | 'dumbbell' | 'both'>('both');
  const [goal, setGoal] = useState<'strength' | 'conditioning' | 'mixed'>('mixed');
  const [duration, setDuration] = useState<10 | 20 | 30 | 45>(20);

  const handleGenerate = () => {
    const pool = exercises.filter((ex) => {
      if (equipment === 'both') return true;
      return ex.equipment.includes(equipment) || ex.equipment.includes('bodyweight');
    });
    const count = duration <= 10 ? 3 : duration <= 20 ? 4 : duration <= 30 ? 5 : 6;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    onStart(shuffled.slice(0, Math.min(count, shuffled.length)));
  };

  const Opt = <T extends string | number>({ label, val, cur, set }: { label: string; val: T; cur: T; set: (v: T) => void }) => (
    <button onClick={() => set(val)} className="flex-1 rounded-xl border py-3 text-sm font-semibold"
      style={{ borderColor: cur === val ? C.xp : C.border, backgroundColor: cur === val ? 'rgba(124,255,107,0.1)' : C.surface, color: cur === val ? C.xp : C.text, ...SG }}>
      {label}
    </button>
  );

  return (
    <div className="min-h-screen px-5 pb-28 pt-6" style={{ backgroundColor: C.bg }}>
      <div className="mb-6 flex items-center gap-3">
        <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full border" style={{ borderColor: C.border, backgroundColor: C.surface }}><ArrowLeft size={16} style={{ color: C.text }} /></button>
        <h1 className="text-2xl font-bold" style={SG}>Generate Workout</h1>
      </div>
      <div className="flex flex-col gap-6">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider" style={{ color: C.muted }}><Dumbbell size={14} /> Equipment</p>
          <div className="flex gap-2">
            <Opt label="Kettlebell" val="kettlebell" cur={equipment} set={setEquipment} />
            <Opt label="Dumbbell" val="dumbbell" cur={equipment} set={setEquipment} />
            <Opt label="Both" val="both" cur={equipment} set={setEquipment} />
          </div>
        </div>
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider" style={{ color: C.muted }}><Target size={14} /> Goal</p>
          <div className="flex gap-2">
            <Opt label="Strength" val="strength" cur={goal} set={setGoal} />
            <Opt label="Conditioning" val="conditioning" cur={goal} set={setGoal} />
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
        <button onClick={handleGenerate} className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold" style={{ backgroundColor: C.xp, color: '#0E150C', ...SG }}>
          <Sparkles size={20} /> Generate
        </button>
      </div>
    </div>
  );
}

function WorkoutScreen({ exercises, userId, onBack, onFinish }: { exercises: Exercise[]; userId: string; onBack: () => void; onFinish: (xp: number) => void }) {
  const [logs, setLogs] = useState<Record<string, { weight: number; reps: number; sets: number }>>(
    Object.fromEntries(exercises.map((ex) => [ex.id, { weight: ex.default_weight_kg, reps: ex.default_reps, sets: ex.default_sets }]))
  );
  const [done, setDone] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const allDone = done.size === exercises.length;

  const handleFinish = async () => {
    setSaving(true);
    const supabase = createClient();

    // Create workout session
    const { data: session } = await supabase
      .from('workout_sessions')
      .insert({ user_id: userId, format: 'circuit', status: 'completed', completed_at: new Date().toISOString() })
      .select()
      .single();

    if (session) {
      // Log each exercise
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

      // Calculate and award XP
      const totalXP = exercises.reduce((sum, ex) => done.has(ex.id) ? sum + ex.xp_value + logs[ex.id].sets * 5 : sum, 0);
      await supabase.rpc('award_xp', { p_user_id: userId, p_xp: totalXP });

      onFinish(totalXP);
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen px-5 pb-28 pt-6" style={{ backgroundColor: C.bg }}>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full border" style={{ borderColor: C.border, backgroundColor: C.surface }}><ArrowLeft size={16} style={{ color: C.text }} /></button>
        <div>
          <p className="text-xs uppercase tracking-wider" style={{ color: C.muted }}>Workout</p>
          <h1 className="text-2xl font-bold" style={SG}>{done.size} / {exercises.length}</h1>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {exercises.map((ex) => {
          const log = logs[ex.id];
          const isDone = done.has(ex.id);
          return (
            <div key={ex.id} className="rounded-2xl border p-4" style={{ backgroundColor: C.surface, borderColor: isDone ? 'rgba(124,255,107,0.4)' : C.border }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: C.raised }}>
                  <Dumbbell size={28} style={{ color: C.xp }} />
                </div>
                <div>
                  <p className="font-bold" style={{ color: C.text, ...SG }}>{ex.name}</p>
                  <p className="text-xs" style={{ color: C.muted }}>{ex.category} · +{ex.xp_value + log.sets * 5} XP</p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border px-3 py-3" style={{ borderColor: C.border }}>
                <Stepper label="Weight" value={log.weight} onChange={(v) => setLogs((p) => ({ ...p, [ex.id]: { ...p[ex.id], weight: v } }))} step={1} unit="kg" />
                <div className="h-10 w-px" style={{ backgroundColor: C.border }} />
                <Stepper label="Reps" value={log.reps} onChange={(v) => setLogs((p) => ({ ...p, [ex.id]: { ...p[ex.id], reps: v } }))} step={1} unit="reps" min={1} />
                <div className="h-10 w-px" style={{ backgroundColor: C.border }} />
                <Stepper label="Sets" value={log.sets} onChange={(v) => setLogs((p) => ({ ...p, [ex.id]: { ...p[ex.id], sets: v } }))} step={1} unit="sets" min={1} />
              </div>
              <button onClick={() => setDone((p) => new Set(p).add(ex.id))} disabled={isDone}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold"
                style={{ backgroundColor: isDone ? C.raised : C.xp, color: isDone ? C.xp : '#0E150C', ...SG }}>
                {isDone ? <><Check size={18} strokeWidth={3} /> Done</> : 'Mark Complete'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t px-5 py-4" style={{ backgroundColor: C.bg, borderColor: C.border }}>
        <button onClick={handleFinish} disabled={!allDone || saving}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold disabled:opacity-50"
          style={{ backgroundColor: allDone ? C.xp : C.raised, color: allDone ? '#0E150C' : C.muted, ...SG }}>
          {saving ? 'Saving…' : allDone ? 'Finish & Save' : `Complete all (${done.size}/${exercises.length})`}
        </button>
      </div>
    </div>
  );
}

function CompleteScreen({ xpEarned, onHome }: { xpEarned: number; onHome: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 text-center" style={{ backgroundColor: C.bg }}>
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(124,255,107,0.12)', border: `2px solid ${C.xp}` }}>
        <Check size={48} strokeWidth={3} style={{ color: C.xp }} />
      </div>
      <h1 className="text-3xl font-bold" style={SG}>Workout Saved!</h1>
      <p className="mt-2" style={{ color: C.muted }}>Your progress has been recorded.</p>
      <div className="mt-8 w-full rounded-2xl border p-5" style={{ borderColor: C.border, backgroundColor: C.surface }}>
        <p className="text-sm" style={{ color: C.muted }}>XP earned this session</p>
        <p className="mt-1 text-4xl font-bold" style={{ color: C.xp, ...MO }}>+{xpEarned}</p>
      </div>
      <button onClick={onHome} className="mt-8 w-full rounded-2xl py-4 text-lg font-bold" style={{ backgroundColor: C.xp, color: '#0E150C', ...SG }}>
        Back to Home
      </button>
    </div>
  );
}

function ExercisesScreen({ exercises }: { exercises: Exercise[] }) {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');
  const cats = ['all', ...Array.from(new Set(exercises.map((e) => e.category)))];
  const filtered = exercises.filter((e) =>
    (cat === 'all' || e.category === cat) &&
    e.name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: C.bg }}>
      <header className="px-5 pt-6 pb-3">
        <p className="text-xs uppercase tracking-wider" style={{ color: C.muted }}>Exercise Library</p>
        <h1 className="text-2xl font-bold" style={SG}>{exercises.length} Movements</h1>
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
            style={{ borderColor: cat === c ? C.xp : C.border, backgroundColor: cat === c ? 'rgba(124,255,107,0.1)' : 'transparent', color: cat === c ? C.xp : C.muted, ...SG }}>
            {c}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-col gap-2 px-5">
        {filtered.map((ex) => (
          <div key={ex.id} className="flex items-center gap-3 rounded-2xl border p-3" style={{ borderColor: C.border, backgroundColor: C.surface }}>
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: C.raised }}>
              <Dumbbell size={32} style={{ color: C.xp }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate" style={{ color: C.text, ...SG }}>{ex.name}</p>
              <p className="text-xs mt-0.5 capitalize" style={{ color: C.muted }}>{ex.category} · {ex.difficulty}</p>
              <div className="mt-1 flex gap-1.5">
                {ex.equipment.map((eq) => (
                  <span key={eq} className="text-[10px] font-medium capitalize" style={{ color: eq === 'kettlebell' ? C.kettlebell : eq === 'dumbbell' ? C.dumbbell : C.muted }}>
                    {eq}
                  </span>
                ))}
              </div>
            </div>
            <span className="font-mono text-xs shrink-0" style={{ color: C.xp }}>+{ex.xp_value}</span>
          </div>
        ))}
      </div>
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
                  <div className="h-full rounded-full" style={{ width: `${progress * 100}%`, backgroundColor: color, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ProfileMenu({ username, onLogout }: { username: string; onLogout: () => void }) {
  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: C.bg }}>
      <header className="px-5 pt-6 pb-4">
        <p className="text-xs uppercase tracking-wider" style={{ color: C.muted }}>Account</p>
        <h1 className="text-2xl font-bold" style={SG}>{username}</h1>
      </header>
      <div className="px-5 flex flex-col gap-3">
        <button onClick={onLogout} className="w-full rounded-2xl border py-4 text-sm font-bold" style={{ borderColor: C.border, color: C.boss, backgroundColor: C.surface, ...SG }}>
          Log Out
        </button>
      </div>
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
type Tab = 'home' | 'train' | 'exercises' | 'stats' | 'profile';
type Screen = 'tab' | 'generator' | 'workout' | 'complete';

export default function AppClient({ user, stats: initialStats, exercises }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('home');
  const [screen, setScreen] = useState<Screen>('tab');
  const [sessionExercises, setSessionExercises] = useState<Exercise[]>([]);
  const [lastXP, setLastXP] = useState(0);
  const [stats, setStats] = useState(initialStats);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleFinish = async (xp: number) => {
    setLastXP(xp);
    // Refresh stats from server
    const supabase = createClient();
    const { data } = await supabase.from('user_stats').select('*').eq('user_id', user.id).single();
    if (data) setStats(data);
    setScreen('complete');
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'home', label: 'Home' },
    { key: 'train', label: 'Train' },
    { key: 'exercises', label: 'Exercises' },
    { key: 'stats', label: 'Stats' },
    { key: 'profile', label: 'Profile' },
  ];

  // Full-screen flows (no bottom nav)
  if (screen === 'generator') return (
    <GeneratorScreen exercises={exercises} onBack={() => setScreen('tab')}
      onStart={(exs) => { setSessionExercises(exs); setScreen('workout'); }} />
  );
  if (screen === 'workout') return (
    <WorkoutScreen exercises={sessionExercises} userId={user.id}
      onBack={() => setScreen('tab')} onFinish={handleFinish} />
  );
  if (screen === 'complete') return (
    <CompleteScreen xpEarned={lastXP} onHome={() => { setScreen('tab'); setTab('home'); }} />
  );

  // Tab views
  let content: React.ReactNode = null;
  if (tab === 'home') content = <HomeScreen user={user} stats={stats} onGenerate={() => setScreen('generator')} onBoss={() => {}} />;
  else if (tab === 'train') content = (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 text-center" style={{ backgroundColor: C.bg }}>
      <Sparkles size={40} style={{ color: C.xp }} />
      <h1 className="mt-4 text-2xl font-bold" style={SG}>Ready to train?</h1>
      <button onClick={() => setScreen('generator')} className="mt-6 flex items-center gap-2 rounded-2xl px-6 py-4 text-lg font-bold" style={{ backgroundColor: C.xp, color: '#0E150C', ...SG }}>
        <Sparkles size={20} /> Generate Workout
      </button>
    </div>
  );
  else if (tab === 'exercises') content = <ExercisesScreen exercises={exercises} />;
  else if (tab === 'stats') content = <StatsScreen stats={stats} />;
  else if (tab === 'profile') content = <ProfileMenu username={user.username} onLogout={handleLogout} />;

  return (
    <div style={{ backgroundColor: C.bg }}>
      {content}
      <nav className="fixed bottom-0 left-0 right-0 flex items-center justify-around border-t px-2 py-3" style={{ backgroundColor: C.surface, borderColor: C.border }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className="flex flex-col items-center gap-1 px-3 py-1" style={{ color: tab === t.key ? C.xp : C.muted }}>
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tab === t.key ? C.xp : 'transparent' }} />
            <span className="text-[10px] font-medium uppercase tracking-wide">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
