'use client'
import { SessionProvider } from 'next-auth/react'
import RegisterForm from '@/app/components/RegisterForm'
import React, { useEffect } from 'react';

export default function RegisterPage() {
    useEffect(() => {
        document.title = 'Register';
    }, []); // Empty dependency array - only runs once
    
    return (
        <SessionProvider>
            <RegisterForm />
        </SessionProvider>
    )
}