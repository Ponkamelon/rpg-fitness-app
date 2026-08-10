'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const colors = {
  bg: '#15171C', surface: '#1F232B', border: '#323844',
  textPrimary: '#EDEFF2', textSecondary: '#8B92A3',
  xp: '#7CFF6B', error: '#FF6B5C',
};

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Auto sign-in after signup (no email confirmation needed in dev)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError('Account created! Please log in.');
      router.push('/login');
      return;
    }

    router.push('/');
    router.refresh();
  };

  return (
    <div
      className="flex min-h-screen w-full flex-col items-center justify-center px-6"
      style={{ backgroundColor: colors.bg, color: colors.textPrimary, fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Start your quest
          </h1>
          <p className="mt-2 text-sm" style={{ color: colors.textSecondary }}>
            Create an account and begin levelling up.
          </p>
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          {[
            { label: 'Username', value: username, set: setUsername, type: 'text', placeholder: 'YourHeroName' },
            { label: 'Email', value: email, set: setEmail, type: 'email', placeholder: 'you@example.com' },
            { label: 'Password', value: password, set: setPassword, type: 'password', placeholder: '••••••••' },
          ].map(({ label, value, set, type, placeholder }) => (
            <div key={label}>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider" style={{ color: colors.textSecondary }}>
                {label}
              </label>
              <input
                type={type}
                required
                value={value}
                onChange={(e) => set(e.target.value)}
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
                style={{ borderColor: colors.border, backgroundColor: colors.surface, color: colors.textPrimary }}
                placeholder={placeholder}
              />
            </div>
          ))}

          {error && <p className="text-sm" style={{ color: colors.error }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-2xl py-4 text-lg font-bold transition-transform active:scale-[0.98] disabled:opacity-60"
            style={{ backgroundColor: colors.xp, color: '#0E150C', fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: colors.textSecondary }}>
          Already have an account?{' '}
          <a href="/login" className="font-semibold" style={{ color: colors.xp }}>Log in</a>
        </p>
      </div>
    </div>
  );
}
