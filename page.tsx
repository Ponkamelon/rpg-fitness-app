import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AppClient from '@/components/AppClient';

export default async function HomePage() {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch user profile + stats in parallel
  const [{ data: profile }, { data: stats }] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('user_stats').select('*').eq('user_id', user.id).single(),
  ]);

  // Fetch unlocked exercises for this user's levels
  const maxLevel = Math.max(
    stats?.level_strength ?? 1,
    stats?.level_mobility ?? 1,
    stats?.level_conditioning ?? 1
  );
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .lte('unlock_level', maxLevel)
    .order('unlock_level', { ascending: true });

  return (
    <AppClient
      user={{ id: user.id, email: user.email ?? '', username: profile?.username ?? '' }}
      stats={stats ?? {
        level: 1, xp_total: 0,
        xp_strength: 0, xp_mobility: 0, xp_conditioning: 0,
        level_strength: 1, level_mobility: 1, level_conditioning: 1,
        current_streak: 0, longest_streak: 0, streak_freeze_count: 1,
      }}
      exercises={exercises ?? []}
    />
  );
}
