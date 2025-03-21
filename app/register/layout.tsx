// app/register/layout.tsx
import React from 'react';

export const metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
