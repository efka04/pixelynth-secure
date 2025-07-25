// app/api/views/increment.js
import { db } from '@/app/db/firebaseConfig';
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';

export async function POST(request) {
  const data = await request.json();
  const photoId = data.photoId;
  // ⚠️ Validation : on vérifie que photoId existe et est une chaîne non vide pour éviter les entrées malveillantes
  if (!photoId || typeof photoId !== 'string') {
    return new Response(JSON.stringify({ success: false, error: 'photoId must be a non-empty string' }), { status: 400 });
  }
  try {
    const photoRef = doc(db, 'post', photoId);
    const photoDoc = await getDoc(photoRef);
    
    if (photoDoc.exists()) {
      await updateDoc(photoRef, { viewCount: increment(1) });
      
      const userData = photoDoc.data();
      if (userData.userEmail) {
        const myImagesRef = doc(db, 'users', userData.userEmail, 'MyImages', photoId);
        const myImagesDoc = await getDoc(myImagesRef);
        if (myImagesDoc.exists()) {
          await updateDoc(myImagesRef, { viewCount: increment(1) });
        }
      }
      
      return Response.json({ success: true });
    }
    
    return Response.json({ success: false, error: 'Photo not found' }, { status: 404 });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// app/api/views/increment.js
import { db } from '@/app/db/firebaseConfig';
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';

export async function POST(request) {
  const { photoId } = await request.json();
  
  if (!photoId) {
    return Response.json({ success: false, error: 'Photo ID is required' }, { status: 400 });
  }
  
  try {
    const photoRef = doc(db, 'post', photoId);
    const photoDoc = await getDoc(photoRef);
    
    if (photoDoc.exists()) {
      await updateDoc(photoRef, { viewCount: increment(1) });
      
      const userData = photoDoc.data();
      if (userData.userEmail) {
        const myImagesRef = doc(db, 'users', userData.userEmail, 'MyImages', photoId);
        const myImagesDoc = await getDoc(myImagesRef);
        if (myImagesDoc.exists()) {
          await updateDoc(myImagesRef, { viewCount: increment(1) });
        }
      }
      
      return Response.json({ success: true });
    }
    
    return Response.json({ success: false, error: 'Photo not found' }, { status: 404 });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
