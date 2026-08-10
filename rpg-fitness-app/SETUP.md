# RPG Fitness — Setup Guide

## Prerequisites
- Node.js 18+ installed
- Supabase project created at https://supabase.com
- Vercel account (for deploy later)

---

## Step 1: Run database migrations in Supabase

Go to your Supabase project → **SQL Editor** → run each of these files IN ORDER:

1. `db/schema.sql` — creates all tables
2. `db/seed_levels.sql` — seeds XP level thresholds
3. `db/auth_trigger.sql` — auto-creates user rows on signup
4. `db/functions.sql` — creates `award_xp` RPC function

Paste each file's contents into the SQL Editor and click **Run**.

---

## Step 2: Seed exercises

In the Supabase SQL Editor, run this to insert the first 20 exercises:

```sql
INSERT INTO exercises (name, category, difficulty, equipment, focus_area, primary_attribute, unlock_level, xp_value, default_sets, default_reps, default_weight_kg)
VALUES
  ('Kettlebell Swing', 'hinge', 'beginner', ARRAY['kettlebell'], 'Posterior chain', 'conditioning', 1, 10, 5, 15, 16),
  ('Goblet Squat', 'squat', 'beginner', ARRAY['kettlebell', 'dumbbell'], 'Quads, Glutes', 'strength', 1, 10, 3, 12, 12),
  ('Push-Up', 'push', 'beginner', ARRAY['bodyweight'], 'Chest, Triceps', 'strength', 1, 8, 3, 15, 0),
  ('Farmer''s Carry', 'carry', 'beginner', ARRAY['kettlebell', 'dumbbell'], 'Grip, Core', 'strength', 1, 10, 3, 1, 16),
  ('Dumbbell Bent-Over Row', 'pull', 'beginner', ARRAY['dumbbell'], 'Back, Biceps', 'strength', 1, 10, 3, 12, 10),
  ('Plank', 'core', 'beginner', ARRAY['bodyweight'], 'Core stability', 'strength', 1, 8, 3, 1, 0),
  ('Cat-Cow Stretch', 'mobility', 'beginner', ARRAY['bodyweight'], 'Spine mobility', 'mobility', 1, 6, 1, 10, 0),
  ('Jumping Jacks', 'conditioning', 'beginner', ARRAY['bodyweight'], 'Cardio', 'conditioning', 1, 8, 3, 30, 0),
  ('Dumbbell Romanian Deadlift', 'hinge', 'intermediate', ARRAY['dumbbell'], 'Hamstrings', 'strength', 5, 12, 3, 10, 12),
  ('Kettlebell Single-Arm Row', 'pull', 'beginner', ARRAY['kettlebell'], 'Back, Biceps', 'strength', 2, 10, 3, 12, 16),
  ('Dumbbell Shoulder Press', 'push', 'beginner', ARRAY['dumbbell'], 'Shoulders', 'strength', 2, 10, 3, 10, 8),
  ('Russian Twist', 'core', 'beginner', ARRAY['kettlebell', 'dumbbell', 'bodyweight'], 'Obliques', 'strength', 2, 9, 3, 20, 6),
  ('World''s Greatest Stretch', 'mobility', 'beginner', ARRAY['bodyweight'], 'Hips, Thoracic', 'mobility', 1, 8, 2, 6, 0),
  ('Burpees', 'conditioning', 'intermediate', ARRAY['bodyweight'], 'Full body', 'conditioning', 5, 14, 3, 10, 0),
  ('Kettlebell Deadlift', 'hinge', 'beginner', ARRAY['kettlebell'], 'Hamstrings, Glutes', 'strength', 1, 10, 3, 12, 16),
  ('Dumbbell Floor Press', 'push', 'beginner', ARRAY['dumbbell'], 'Chest, Triceps', 'strength', 1, 10, 3, 12, 10),
  ('Kettlebell Halo', 'core', 'intermediate', ARRAY['kettlebell'], 'Shoulders, Core', 'mobility', 5, 10, 3, 10, 8),
  ('Mountain Climbers', 'conditioning', 'beginner', ARRAY['bodyweight'], 'Core, Cardio', 'conditioning', 1, 10, 3, 20, 0),
  ('Dead Bug', 'core', 'beginner', ARRAY['bodyweight'], 'Core control', 'mobility', 1, 8, 3, 12, 0),
  ('Hip Flexor Stretch', 'mobility', 'beginner', ARRAY['bodyweight'], 'Hip flexors', 'mobility', 1, 6, 2, 1, 0);
```

---

## Step 3: Install and run locally

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/rpg-fitness-app.git
cd rpg-fitness-app

# Install dependencies
npm install

# Create environment file (already done for you - just verify it's there)
cat .env.local
# Should show:
# NEXT_PUBLIC_SUPABASE_URL=https://ncbexoofwjnjfmtoeedg.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_sWJgP4g9HxH6UzjcfW4sTw_BtxOBgti

# Run dev server
npm run dev
```

Open http://localhost:3000 — you'll be redirected to /login.

---

## Step 4: Deploy to Vercel

```bash
npm install -g vercel
vercel
```

When prompted:
- Link to existing project? No → create new
- Project name: `rpg-fitness`
- Framework: Next.js (auto-detected)

Then add environment variables in Vercel dashboard → Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key

---

## Step 5: Test the flow

1. Go to `/signup` → create a test account
2. Log in → you should see the home screen with Level 1 attributes
3. Generate a workout → complete exercises → save
4. Check Stats screen — XP and streak should update
5. Check Supabase Table Editor → `workout_sessions` should have a new row
