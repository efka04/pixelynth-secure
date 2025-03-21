// app/signin/layout.tsx
import React from 'react';

export const metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default function SigninLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
