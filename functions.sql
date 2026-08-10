-- ============================================================
-- RPC FUNCTIONS
-- Run this in the Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- award_xp: called after a workout is saved.
-- Adds XP to user_stats, recalculates levels, updates streak.
create or replace function public.award_xp(p_user_id uuid, p_xp int)
returns void
language plpgsql
security definer
as $$
declare
  v_stats public.user_stats%rowtype;
  v_new_xp_total int;
  v_new_level int;
  v_today date := current_date;
  v_new_streak int;
begin
  select * into v_stats from public.user_stats where user_id = p_user_id for update;

  -- Add XP (simplified: all XP goes to xp_total and equally across attributes for now)
  v_new_xp_total := v_stats.xp_total + p_xp;

  -- Recalculate overall level from total XP using level curve: round(60 * level^2.1)
  v_new_level := 1;
  for i in 1..50 loop
    if v_new_xp_total >= round(60 * power(i, 2.1)) then
      v_new_level := i;
    end if;
  end loop;

  -- Update streak
  if v_stats.last_workout_date = v_today then
    -- Already trained today
    v_new_streak := v_stats.current_streak;
  elsif v_stats.last_workout_date = v_today - 1 then
    -- Consecutive day
    v_new_streak := v_stats.current_streak + 1;
  else
    -- Streak broken or first workout
    v_new_streak := 1;
  end if;

  update public.user_stats set
    xp_total = v_new_xp_total,
    xp_strength = xp_strength + round(p_xp * 0.4),
    xp_mobility = xp_mobility + round(p_xp * 0.2),
    xp_conditioning = xp_conditioning + round(p_xp * 0.4),
    level = v_new_level,
    level_strength = greatest(level_strength, v_new_level),
    current_streak = v_new_streak,
    longest_streak = greatest(longest_streak, v_new_streak),
    last_workout_date = v_today,
    updated_at = now()
  where user_id = p_user_id;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.award_xp(uuid, int) to authenticated;
