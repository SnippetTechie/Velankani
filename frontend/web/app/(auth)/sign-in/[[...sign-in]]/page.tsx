'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/auth-client';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    await signIn.email(
      {
        email,
        password,
      },
      {
        onSuccess: () => {
          router.push('/dashboard');
        },
        onError: (ctx) => {
          setError(ctx.error.message || 'Sign in failed');
          setLoading(false);
        },
      },
    );

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Background glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 800,
          height: 800,
          background:
            'radial-gradient(circle, rgba(109,95,255,0.15) 0%, transparent 60%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      <div
        className="relative z-10 w-full max-w-[420px] mx-4 text-center"
        style={{
          padding: '48px 40px',
          borderRadius: 24,
          background: 'rgba(17, 17, 17, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}
      >
        {/* Logo */}
        <div className="w-14 h-14 mx-auto mb-6 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.avif" alt="VEL AI" width={56} height={56} className="rounded-lg" />
        </div>

        <h2 className="text-2xl font-semibold text-white mb-2">Welcome Back</h2>
        <p className="text-sm text-[#888] mb-8">
          Sign in to your VEL AI workspace
        </p>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-lg text-sm text-red-400 bg-red-500/10 border border-red-500/30">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-lg text-white text-[15px] outline-none focus:border-violet-500/50 transition placeholder:text-[#555]"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-lg text-white text-[15px] outline-none focus:border-violet-500/50 transition placeholder:text-[#555]"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 bg-[#6D5FFF] hover:bg-[#5B4FE6] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-[15px] rounded-xl transition"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-sm text-[#666]">
          Don&apos;t have an account?{' '}
          <Link
            href="/sign-up"
            className="text-[#6D5FFF] hover:text-[#8B7AFF] font-medium no-underline transition"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
