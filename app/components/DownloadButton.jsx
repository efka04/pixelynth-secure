'use client';
import React from 'react';
import { MdOutlineFileDownload } from 'react-icons/md';
import { db } from '@/app/db/firebaseConfig';
import { doc, updateDoc, increment, addDoc, collection, getDoc, setDoc } from 'firebase/firestore';
import { useSession } from 'next-auth/react';

const DownloadButton = ({ item, variant }) => {
  const { data: session } = useSession();

  const handleDownload = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      // Récupération de l'URL de l'image depuis l'item
      const imageUrl = item.imageURL;

      if (!imageUrl) {
        alert("L'image semble indisponible. Vérifiez votre connexion ou réessayez plus tard.");
        return;
      }

      // 1. Télécharger l'image directement sans vérification HEAD préalable
      const response = await fetch(imageUrl);
      console.log('📥 Statut de la réponse fetch:', response.status);

      if (!response.ok) {
        alert("L'image semble inaccessible ou a été supprimée. Réessayez plus tard.");
        return;
      }

      // 2. Convertir la réponse en Blob pour le téléchargement
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      // 3. Créer un nom de fichier unique
      const fileName = `Pixelynth_${item.title ? item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'image'}.jpg`;

      // 4. Créer un lien de téléchargement et déclencher le téléchargement
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(link);

      // 5. Incrémenter le compteur de téléchargements dans Firestore
      if (item?.id) {
        const postRef = doc(db, 'post', item.originalId || item.id);
        const postDoc = await getDoc(postRef);
        if (postDoc.exists()) {
          await updateDoc(postRef, { downloadCount: increment(1) });
          console.log('🔼 Compteur de téléchargement mis à jour');
        }
      }

      // 6. Enregistrer dans l'historique de téléchargement si utilisateur authentifié
      if (session?.user?.email) {
        console.log('Utilisateur authentifié:', session.user.email);
        const userDocRef = doc(db, 'users', session.user.email);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          await setDoc(userDocRef, { email: session.user.email, createdAt: new Date() });
          console.log("Document utilisateur créé pour", session.user.email);
        }
        const downloadHistoryRef = collection(db, 'users', session.user.email, 'downloadHistory');
        await addDoc(downloadHistoryRef, {
          ...item,
          originalId: item.id,
          downloadedAt: new Date(),
          imageURL: imageUrl,
        });
        console.log('✅ Action de téléchargement enregistrée dans l’historique');
      } else {
        console.log('Utilisateur non authentifié, historique non mis à jour');
      }

    } catch (error) {
    }
  };

  return (
    <button
      onClick={handleDownload}
      className={`flex items-center justify-center ${variant === 'text' ? 'w-full bg-black text-white px-3 py-2 rounded-md hover:bg-black/85 transition-colors' : 'bg-black/30 backdrop-blur-sm rounded-xl p-2 hover:bg-black/80 transition-colors'}`}
    >
      {variant === 'text' ? 'Download' : <MdOutlineFileDownload className="w-5 h-5 text-white" />}
    </button>
  );
};

export default React.memo(DownloadButton);