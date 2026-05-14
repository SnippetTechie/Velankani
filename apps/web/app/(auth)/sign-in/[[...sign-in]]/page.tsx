'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

const SignIn = dynamic(
  () => import('@clerk/nextjs').then((module) => module.SignIn),
  { ssr: false },
);

export default function SignInPage() {
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const hasValidClerkKey = clerkKey && clerkKey.startsWith('pk_') && clerkKey.length > 20;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 800,
          height: 800,
          background:
            'radial-gradient(circle, rgba(109,95,255,0.15) 0%, transparent 60%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />
      
      {hasValidClerkKey ? (
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          afterSignInUrl="/dashboard"
          appearance={{
            variables: {
              colorPrimary: '#7C3AED',
              colorBackground: '#111111',
              colorText: '#F5F5F5',
              colorInputBackground: '#161616',
              colorInputText: '#F5F5F5',
              borderRadius: '8px',
            },
          }}
        />
      ) : (
        <div 
          className="vel-glass" 
          style={{ 
            padding: '48px 40px', 
            borderRadius: 24, 
            textAlign: 'center', 
            maxWidth: 420,
            position: 'relative',
            zIndex: 10,
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)'
          }}
        >
          <div style={{ width: 48, height: 48, background: '#6D5FFF', borderRadius: 12, margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: 24 }}>✧</span>
          </div>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 600, marginBottom: 12, color: '#FFF' }}>
            Welcome Back
          </h2>
          <p style={{ color: '#888', fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
            Running in local preview mode. Authentication is currently bypassed.
          </p>
          <Link 
            href="/dashboard" 
            style={{ 
              display: 'block', 
              textDecoration: 'none',
              background: '#FFF',
              color: '#000',
              padding: '14px 24px',
              borderRadius: 12,
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 600,
              fontSize: 15,
              transition: 'transform 0.2s, opacity 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Enter Dashboard →
          </Link>
          
          <div style={{ marginTop: 24, fontSize: 12, color: '#555' }}>
            Configure Clerk keys in .env.local to enable auth.
          </div>
        </div>
      )}
    </div>
  );
}
