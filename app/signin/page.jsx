'use client'
import SignIn from '@/app/components/SignIn'
import React, { useEffect } from 'react';
import { SessionProvider } from "next-auth/react";

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
