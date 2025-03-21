// /app/api/top-contributors/route.js
import { NextResponse } from 'next/server';
import { db } from '@/app/db/firebaseConfig';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

export async function GET() {
  try {
    // Vérifier d'abord s'il y a des contributeurs sélectionnés par l'admin
    const selectedContributorsRef = collection(db, 'selectedContributors');
    const selectedContributorsSnapshot = await getDocs(selectedContributorsRef);
    
    if (!selectedContributorsSnapshot.empty) {
      // Si des contributeurs ont été sélectionnés par l'admin, les utiliser
      const selectedContributors = selectedContributorsSnapshot.docs.map(doc => doc.data());
      return NextResponse.json(selectedContributors);
    } else {
      // Sinon, récupérer les utilisateurs avec le plus grand nombre de photos
      const usersRef = collection(db, 'users');
      const usersQuery = query(usersRef, orderBy('photoCount', 'desc'), limit(5));
      const usersSnapshot = await getDocs(usersQuery);
      
      const topContributors = usersSnapshot.docs
        .filter(doc => doc.data().photoCount > 0)
        .map(doc => ({
          email: doc.id,
          username: doc.data().username || '',
          firstName: doc.data().firstName || '',
          lastName: doc.data().lastName || '',
          profileImage: doc.data().profileImage || '',
          photoCount: doc.data().photoCount || 0
        }));
      
      return NextResponse.json(topContributors);
    }
  } catch (error) {
    console.error('Error fetching top contributors:', error);
    return NextResponse.json({ error: 'Failed to fetch top contributors' }, { status: 500 });
  }
}
