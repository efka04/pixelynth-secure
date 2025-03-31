'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { doc, getDoc, deleteDoc, updateDoc, increment } from 'firebase/firestore'
import { db } from '@/app/db/firebaseConfig'
import FormAdd from '@/app/account/[userName]/upload/components/FormAdd' // Mise à jour du chemin d'importation
import { getStorage, ref, deleteObject } from 'firebase/storage'

export default function EditArticle() {
    const router = useRouter()
    const params = useParams()
    const [articleDetails, setArticleDetails] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchArticleDetails = async () => {
            const docId = params.slug.split('-').pop()
            const docRef = doc(db, 'post', docId)
            const docSnap = await getDoc(docRef)
            if (docSnap.exists()) {
                setArticleDetails({ id: docSnap.id, ...docSnap.data() })
            } else {
                console.error('No such document!')
            }
            setLoading(false)
        }

        fetchArticleDetails()
    }, [params.slug])

    const handleDelete = async () => {
        if (!articleDetails) {
            console.error("Article introuvable !");
            return;
        }
    
        const docId = params.slug.split('-').pop();
        const docRef = doc(db, 'post', docId);
        const userDocRef = doc(db, 'users', articleDetails.userEmail);
        const imageDocRef = doc(db, 'users', articleDetails.userEmail, 'MyImages', docId);
        const storage = getStorage();
    
        try {
            // Vérifie que l'image existe et n'est pas une URL complète
            if (articleDetails.image) {
                const imagePath = articleDetails.image.startsWith("http") 
                    ? null 
                    : articleDetails.image; // Ne pas supprimer les images avec des URLs complètes
    
                if (imagePath) {
                    const imageRef = ref(storage, imagePath);
                    await deleteObject(imageRef);
                }
            }
    
            // Supprimer le document de la collection MyImages
            await deleteDoc(imageDocRef);

            // Décrémenter le compteur de photos de l'utilisateur
            await updateDoc(userDocRef, {
                photoCount: increment(-1)
            });

            // Supprimer le document de la collection post
            await deleteDoc(docRef);

            router.push('/');
        } catch (error) {
            console.error('Erreur lors de la suppression du document :', error);
        }
    };

    if (loading) {
        return <div>Loading...</div>
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Edit Article</h1>
            {articleDetails && (
                <FormAdd
                    image={articleDetails.image}
                    id={articleDetails.id}
                    userEmail={articleDetails.userEmail}
                    existingData={articleDetails}
                    isEditing={true}
                />
            )}
            <button
                onClick={handleDelete}
                className="mt-4 bg-red-500 text-white py-2 px-4 rounded"
            >
                Delete Article
            </button>
        </div>
    )
}