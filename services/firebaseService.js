import { db, auth } from '@/app/db/firebaseConfig';
import { collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const formatImageUrl = (url) => {
  if (!url) return null;
  // Ensure we're using the correct Firebase Storage URL
  if (url.includes('firebaseapp.com/__/auth/iframe')) {
    // Extract the filename from the original URL and reconstruct the proper storage URL
    const filename = url.split('/').pop();
    return `https://firebasestorage.googleapis.com/v0/b/pixelynth-c41ea.firebasestorage.app/o/blog-images/${filename}`;
  }
  return url;
};

async function isSlugUnique(slug) {
  if (!slug) return true; // Si le slug est undefined, on considère qu'il est unique
  
  const articlesRef = collection(db, 'articles');
  const q = query(articlesRef, where('slug', '==', slug));
  const snapshot = await getDocs(q);
  return snapshot.empty;
}

async function generateUniqueSlug(title) {
  if (!title) return ''; // Retourner une chaîne vide si le titre est undefined
  
  let slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
  
  let isUnique = await isSlugUnique(slug);
  let counter = 1;
  
  while (!isUnique) {
    const newSlug = `${slug}-${counter}`;
    isUnique = await isSlugUnique(newSlug);
    if (isUnique) {
      slug = newSlug;
    }
    counter++;
  }
  
  return slug;
}

export async function getArticles() {
  try {
    if (!db) throw new Error('Firestore is not initialized');
    
    const articlesRef = collection(db, 'articles');
    const articlesQuery = query(articlesRef);
    const querySnapshot = await getDocs(articlesQuery);
    
    const articles = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();      
      articles.push({
        id: doc.id,
        ...data,
        slug: data.slug || doc.id, // Fallback to ID if no slug exists
        coverImage: formatImageUrl(data.coverImage),
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      });
    });
    
    return articles;
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
}

export async function getArticleBySlug(slug) {
  try {
    if (!db) throw new Error('Firestore is not initialized');
    if (!slug) throw new Error('Slug is required');
    
    const articlesRef = collection(db, 'articles');
    const q = query(articlesRef, where('slug', '==', slug));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return null;

    const doc = querySnapshot.docs[0];
    const data = doc.data();
    
    // Detailed logging
    console.log('Document ID:', doc.id);
    console.log('Full document data:', data);
    console.log('Cover image direct access:', data.coverImage);

    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
    };
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
}

export async function createArticle(articleData) {
  try {
    const { title } = articleData;
    
    if (!title) throw new Error('Title is required');
    
    // Vérifier si le titre existe déjà
    const titleQuery = query(collection(db, 'articles'), where('title', '==', title));
    const titleSnapshot = await getDocs(titleQuery);
    
    if (!titleSnapshot.empty) {
      throw new Error('Un article avec ce titre existe déjà');
    }
    
    // Générer un slug unique
    const uniqueSlug = await generateUniqueSlug(title);
    
    const finalArticleData = {
      ...articleData,
      slug: uniqueSlug,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, 'articles'), finalArticleData);
    return { id: docRef.id, ...finalArticleData };
  } catch (error) {
    console.error('Error creating article:', error);
    throw error;
  }
}

export const isAdmin = async () => {
  const user = auth.currentUser;
  return user?.email === 'contact@pixelynth.com';
};

export const checkAdminStatus = (callback) => {
  if (!auth) {
    console.error('Auth is not initialized');
    callback(false);
    return () => {};
  }

  const unsubscribe = onAuthStateChanged(auth, (user) => {
    const isAdmin = user?.email === 'contact@pixelynth.com';
    callback(isAdmin);
  }, (error) => {
    console.error('Auth state change error:', error);
    callback(false);
  });

  return unsubscribe;
};

export async function getArticleById(id) {
  try {
    if (!id) throw new Error('Article ID is required');
    
    const docRef = doc(db, 'articles', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Article not found');
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
    };
  } catch (error) {
    console.error('Error fetching article by ID:', error);
    throw error;
  }
}

export async function updateArticle(id, data) {
  try {
    if (!id) throw new Error('Article ID is required');
    
    const docRef = doc(db, 'articles', id);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error('Error updating article:', error);
    throw error;
  }
}

export async function deleteArticle(id) {
  try {
    if (!id) throw new Error('Article ID is required');
    
    const docRef = doc(db, 'articles', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting article:', error);
    throw error;
  }
}

export async function getPostBySlug(slug) {
  try {
    if (!db) throw new Error('Firestore is not initialized');
    if (!slug) throw new Error('Slug is required');
    
    const postsRef = collection(db, 'post'); // ou 'images' ou autre collection appropriée
    const q = query(postsRef, where('slug', '==', slug));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return null;

    const doc = querySnapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
      tags: data.tags || [], // S'assurer que tags est toujours un tableau
    };
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}
