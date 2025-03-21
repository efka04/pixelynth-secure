import { NextResponse } from 'next/server';
import { getStorage } from 'firebase-admin/storage';
import { cert, initializeApp, getApps } from 'firebase-admin/app';
import serviceAccount from '../../../pixelynth-c41ea-firebase-adminsdk-as8n5-d5bc520bb9.json';

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
