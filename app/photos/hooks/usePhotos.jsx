import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/app/db/firebaseConfig';
import { toggleFavorite } from '@/app/components/favoriteUtils';

export default function usePhotos() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();

  const [articleDetails, setArticleDetails] = useState(null);
  const [authorData, setAuthorData] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [morePosts, setMorePosts] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);

  // Fetch article details based on slug
  useEffect(() => {
    if (params.slug) {
      const [docId] = params.slug.split('-').slice(-1);
      if (docId) {
        getPostDetails(docId);
      }
    }
  }, [params.slug]);

  // Check favorite status when article and session data are available
  useEffect(() => {
    if (articleDetails?.id && session?.user?.email) {
      checkIfFavorite(articleDetails.id);
    }
  }, [articleDetails, session?.user?.email]);

  // Fetch similar posts after article details are loaded
  useEffect(() => {
    if (articleDetails) {
      fetchMorePosts();
    }
  }, [articleDetails]);

  // Fetch author data
  useEffect(() => {
    const fetchAuthorData = async () => {
      if (articleDetails?.userEmail) {
        try {
          const userRef = doc(db, 'users', articleDetails.userEmail);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setAuthorData(userData);
            setArticleDetails(prev => ({ ...prev, userName: userData.username }));
          }
        } catch (error) {
          console.error('Error fetching author data:', error);
        }
      }
    };
    fetchAuthorData();
  }, [articleDetails?.userEmail]);

  // Fetch the article details from Firebase
  const getPostDetails = async (docId) => {
    try {
      setIsLoading(true);
      const docRef = doc(db, 'post', docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setArticleDetails({ id: docSnap.id, ...docSnap.data() });
      } else {
        setArticleDetails(null);
      }
    } catch (error) {
      setArticleDetails(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if the article is in the user’s favorites
  const checkIfFavorite = async (articleId) => {
    try {
      if (!session?.user?.email) return;
      const favoritesRef = collection(db, 'users', session.user.email, 'favorites');
      const favQuery = query(favoritesRef, where('articleId', '==', articleId));
      const querySnapshot = await getDocs(favQuery);
      setIsFavorite(!querySnapshot.empty);
    } catch (error) {
      console.error('Error checking favorites:', error);
    }
  };

  // Fetch similar posts logic
  const fetchMorePosts = async () => {
    try {
      setLoadingMorePosts(true);
      const { category, tags, id, title } = articleDetails;
      const postsSet = new Map();
      const postsRef = collection(db, 'post');

      if (category) {
        const qCategory = query(postsRef, where('category', '==', category), limit(50));
        const querySnapshotCategory = await getDocs(qCategory);
        querySnapshotCategory.forEach((doc) => {
          if (doc.id !== id) {
            postsSet.set(doc.id, { id: doc.id, ...doc.data() });
          }
        });
      }
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
      setMorePosts(posts);
    } catch (error) {
      console.error('Error fetching similar posts:', error);
      setMorePosts([]);
    } finally {
      setLoadingMorePosts(false);
    }
  };

  const handleEdit = () => {
    router.push(`/photos/${params.slug}/edit`);
  };

  const handleAddFavorite = async (e) => {
    e?.stopPropagation();
    if (!session?.user?.email) {
      router.push('/signin');
      return;
    }
    if (!articleDetails?.id) {
      console.error('Missing article ID');
      return;
    }
    try {
      // Utiliser la fonction toggleFavorite de favoriteUtils.jsx
      const articleData = {
        title: articleDetails.title,
        image: articleDetails.image || articleDetails.webpURL,
        userName: articleDetails.userName,
        userImage: articleDetails.userImage,
      };
      
      const newFavoriteStatus = await toggleFavorite(session.user.email, articleDetails.id, articleData);
      setIsFavorite(newFavoriteStatus);
    } catch (error) {
      console.error('Error updating favorites:', error);
    }
  };

  return {
    isLoading,
    articleDetails,
    authorData,
    isFavorite,
    morePosts,
    loadingMorePosts,
    handleEdit,
    handleAddFavorite,
  };
}