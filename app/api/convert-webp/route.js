import { NextResponse } from 'next/server';
import { getStorage } from 'firebase-admin/storage';
import { cert, initializeApp, getApps } from 'firebase-admin/app';

const serviceAccount = {
    "type": "service_account",
    "project_id": process.env.FIREBASE_PROJECT_ID,
    "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
    "private_key": process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    "client_id": process.env.FIREBASE_CLIENT_ID,
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": process.env.FIREBASE_CLIENT_X509_CERT_URL
  };
  
// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: 'pixelynth-c41ea.appspot.com'
  });
}

const bucket = getStorage().bucket();

export async function POST(request) {
    try {
        const { file, filename } = await request.json();

        // Convert base64 to buffer
        const buffer = Buffer.from(file.split(',')[1], 'base64');
        
        // Upload to Firebase Storage
        const webpPath = `webp/${filename}.webp`;
        const webpFile = bucket.file(webpPath);
        
        await webpFile.save(buffer, {
            metadata: {
                contentType: 'image/webp',
            }
        });

        await webpFile.makePublic();
        const webpUrl = await webpFile.publicUrl();

        return NextResponse.json({ url: webpUrl });
    } catch (error) {
        console.error('WebP conversion error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
