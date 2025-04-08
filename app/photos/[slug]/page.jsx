// Fichier: /app/photos/[slug]/page.jsx
import React from 'react';
import { db } from '@/app/db/firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import PhotosContent from '@/app/photos/components/PhotosContent';
import SimilarPosts from '@/app/photos/components/SimilarPosts';
import { notFound } from 'next/navigation';
import ClientInteractivity from '@/app/photos/components/ClientInteractivity';

// Fonction utilitaire pour sérialiser les timestamps ou objets complexes
function serializeTimestamp(ts) {
  if (ts && typeof ts === 'object' && 'seconds' in ts && 'nanoseconds' in ts) {
    return {
      seconds: ts.seconds,
      nanoseconds: ts.nanoseconds
    };
  }
  return ts;
}

// Fonction pour sérialiser les objets complexes
function serializeData(obj) {
  if (!obj) return null;
  
  // Créer une copie de l'objet
  const serialized = { ...obj };
  
  // Sérialiser les champs de type timestamp ou objets complexes
  if (serialized.timestamp) {
    serialized.timestamp = serializeTimestamp(serialized.timestamp);
  }
  if (serialized.createdAt) {
    serialized.createdAt = serializeTimestamp(serialized.createdAt);
  }
  if (serialized.updatedAt) {
    serialized.updatedAt = serializeTimestamp(serialized.updatedAt);
  }
  if (serialized.statsLastUpdated) {
    serialized.statsLastUpdated = serializeTimestamp(serialized.statsLastUpdated);
  }
  
  return serialized;
}

// Fonction pour générer les métadonnées dynamiques
export async function generateMetadata({ params }) {
  const { slug } = params;
  const photoId = slug.split('-').pop();
  
  try {
    const docRef = doc(db, 'post', photoId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return {
        title: 'Photo not found - Pixelynth',
        description: 'The requested photo could not be found.'
      };
    }
    
    const data = docSnap.data();
    const title = data.title || 'Photo';
    const tags = data.tags?.join(', ') || '';
    const description = data.description || `View this ${tags} photo on Pixelynth`;
    
    return {
      title: `${title} - Pixelynth`,
      description: description,
      openGraph: {
        title: `${title} - Pixelynth`,
        description: description,
        images: [{ url: data.webpURL || data.image }]
      }
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Photo - Pixelynth',
      description: 'View this photo on Pixelynth'
    };
  }
}

// Composant principal de la page (côté serveur)
export default async function ArticlePage({ params }) {
  const { slug } = params;
  const photoId = slug.split('-').pop();
  
  try {
    // 1. Récupérer les détails de l'article
    const docRef = doc(db, 'post', photoId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      notFound();
    }
    
    // Sérialiser les données de l'article
    const articleDetails = serializeData({ id: docSnap.id, ...docSnap.data() });
    
    // 2. Récupérer les données de l'auteur
    let authorData = null;
    if (articleDetails.userEmail) {
      const userRef = doc(db, 'users', articleDetails.userEmail);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        authorData = serializeData(userSnap.data());
        articleDetails.userName = authorData.username;
      }
    }
    
    // 3. Récupérer les articles similaires
    const morePosts = await fetchSimilarPosts(articleDetails);
    
    // Sérialiser les articles similaires
    const serializedPosts = morePosts.map(post => serializeData(post));
    
    return (
      <div className="bg-white min-h-screen mt-8 max-w-7xl mx-auto px-4">
        <ClientInteractivity articleId={articleDetails.id}>
          <PhotosContent
            articleDetails={articleDetails}
            authorData={authorData}
          />
        </ClientInteractivity>
        <SimilarPosts morePosts={serializedPosts} loadingMorePosts={false} />
      </div>
    );
  } catch (error) {
    console.error('Error fetching article:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Error loading article</p>
      </div>
    );
  }
}

// Fonction pour récupérer les articles similaires
async function fetchSimilarPosts(articleDetails) {
  try {
    const { category, tags, id, title } = articleDetails;
    const postsSet = new Map();
    const postsRef = collection(db, 'post');
    
    // Récupérer les articles de la même catégorie
    if (category) {
      const qCategory = query(postsRef, where('category', '==', category), limit(50));
      const querySnapshotCategory = await getDocs(qCategory);
      querySnapshotCategory.forEach((doc) => {
        if (doc.id !== id) {
          postsSet.set(doc.id, { id: doc.id, ...doc.data() });
        }
      });
    }
    
    // Récupérer les articles avec des tags similaires
    if (tags && Array.isArray(tags) && tags.length > 0) {
      const tagsForQuery = tags.slice(0, 10);
      const qTags = query(postsRef, where('tags', 'array-contains-any', tagsForQuery), limit(50));
      const querySnapshotTags = await getDocs(qTags);
      querySnapshotTags.forEach((doc) => {
        if (doc.id !== id) {
          postsSet.set(doc.id, { id: doc.id, ...doc.data() });
        }
      });
    }
    
    // Calculer les scores de similarité et trier les résultats
    let posts = Array.from(postsSet.values());
    posts = posts.map(post => {
      let score = 0;
      if (post.category === category) score += 1;
      if (post.tags && Array.isArray(post.tags)) {
        const matchingTags = post.tags.filter(tag => tags.includes(tag));
        score += matchingTags.length * 2;
      }
      if (post.title && title) {
        const articleTitleWords = new Set(title.toLowerCase().split(/\s+/));
        const postTitleWords = new Set(post.title.toLowerCase().split(/\s+/));
        const matchingTitleWords = [...postTitleWords].filter(word => articleTitleWords.has(word));
        score += matchingTitleWords.length;
      }
      return { ...post, score };
    });
    
    posts = posts.filter(post => post.score >= 4);
    posts.sort((a, b) => b.score - a.score);
    
    return posts;
  } catch (error) {
    console.error('Error fetching similar posts:', error);
    return [];
  }
}
