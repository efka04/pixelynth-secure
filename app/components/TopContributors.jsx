// Composant serveur pour récupérer les données des top contributors
import React from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/app/db/firebaseConfig';
import ClientTopContributors from './ClientTopContributors';

// Fonction pour récupérer les données côté serveur
async function getTopContributors() {
  try {
    // Récupération des données depuis Firestore
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('photoCount', 'desc'), limit(3));
    const querySnapshot = await getDocs(q);
    
    const contributors = [];
    querySnapshot.forEach((doc) => {
      contributors.push({
        email: doc.id,
        username: doc.data().username,
        photoCount: doc.data().photoCount || 0,
        profileImage: doc.data().profileImage || null
      });
    });
    
    return contributors;
  } catch (error) {
    console.error("Error fetching top contributors:", error);
    return [];
  }
}

export default async function TopContributors() {
  // Récupérer les données côté serveur
  const contributors = await getTopContributors();
  
  return (
    <div className="h-full">
      <ClientTopContributors initialContributors={contributors} />
    </div>
  );
}
