export const metadata = {
    robots: 'noindex, nofollow'
  };
  
  import { ReactNode } from 'react';

  export default function AdminLayout({ children }: { children: ReactNode }) {
    return <>{children}</>;
  }