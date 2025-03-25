import { NextResponse } from 'next/server';

export function middleware(request) {
  const response = NextResponse.next();
  
  // Définir une politique CSP stricte
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://platform.twitter.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https://*.twimg.com https://*.twitter.com https://firebasestorage.googleapis.com;
    font-src 'self';
    connect-src 'self' https://*.firebaseio.com https://*.googleapis.com;
    frame-src 'self' https://platform.twitter.com;
    object-src 'none';
  `.replace(/\s{2,}/g, ' ') .trim();
  
  // Ajouter les en-têtes de sécurité
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

// Appliquer le middleware à toutes les routes
export const config = {
  matcher: '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
};
