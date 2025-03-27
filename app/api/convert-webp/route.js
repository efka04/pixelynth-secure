import { NextResponse } from 'next/server';
import { getStorage } from 'firebase-admin/storage';
import { cert, initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

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
    storageBucket: 'pixelynth-c41ea.firebasestorage.app'
  });
}

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: 'pixelynth-c41ea.appspot.com'
  });
}

const bucket = getStorage().bucket();

// Fonction de validation du format base64
function isValidBase64Image(base64String) {
  // Vérifier le format de base64 pour les images
  const regex = /^data:image\/(jpeg|png|webp|gif);base64,([A-Za-z0-9+/=])+$/;
  return regex.test(base64String);
}

// Fonction pour vérifier l'authentification
async function verifyAuth(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.split(' ')[1];
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}
export async function POST(request) {
  try {
    // Vérifier l'authentification
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { file, filename } = await request.json();
    
    // Valider le format base64
    if (!file || !filename || !isValidBase64Image(file)) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
    }
    
    // Limiter la taille du fichier (approximativement 5MB en base64)
    if (file.length > 7000000) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }
    
    // Convertir base64 en buffer
    const buffer = Buffer.from(file.split(',')[1], 'base64');
    
    // Générer un nom de fichier sécurisé
    const safeFilename = filename.replace(/[^a-zA-Z0-9_-]/g, '_');
    const webpPath = `webp/${user.uid}_${Date.now()}_${safeFilename}.webp`;
    const webpFile = bucket.file(webpPath);
    
    await webpFile.save(buffer, {
      metadata: {
        contentType: 'image/webp',
      }
    });
    
    // Définir des règles d'accès au lieu de rendre le fichier public
    // Remplacer makePublic() par une URL signée avec expiration
    const [url] = await webpFile.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 1 semaine
    });
    
    return NextResponse.json({ url });
  } catch (error) {
    console.error('WebP conversion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}