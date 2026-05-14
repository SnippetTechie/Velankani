'use client';

import dynamic from 'next/dynamic';

const SignUp = dynamic(
  () => import('@clerk/nextjs').then((module) => module.SignUp),
  { ssr: false },
);

export default function SignUpPage() {
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
      
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        afterSignUpUrl="/dashboard"
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
    </div>
  );
}
