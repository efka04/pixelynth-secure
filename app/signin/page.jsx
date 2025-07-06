'use client'
import SignIn from '@/app/components/SignIn'
import React, { useEffect } from 'react';

export default function SignInPage() {
    
    useEffect(() => {
        document.title = 'Sign-in - Pixelynth';
    }, []);

    return (
          <SessionProvider>
            <SignIn />
            </SessionProvider>
    )
}
