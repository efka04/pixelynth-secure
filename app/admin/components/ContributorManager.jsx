// /app/admin/components/ContributorManager.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/app/db/firebaseConfig';

export default function ContributorManager() {
  const [users, setUsers] = useState([]);
  const [selectedContributors, setSelectedContributors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Récupérer tous les utilisateurs
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const usersData = usersSnapshot.docs.map(doc => ({
          email: doc.id,
          ...doc.data()
        })).filter(user => user.photoCount > 0);

        // Récupérer les contributeurs sélectionnés
        const selectedContributorsRef = collection(db, 'selectedContributors');
        const selectedContributorsSnapshot = await getDocs(selectedContributorsRef);
        const selectedContributorsData = selectedContributorsSnapshot.docs.map(doc => doc.data().email);

        setUsers(usersData);
        setSelectedContributors(selectedContributorsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleToggleContributor = async (email) => {
    try {
      if (selectedContributors.includes(email)) {
        // Supprimer le contributeur
        await deleteDoc(doc(db, 'selectedContributors', email));
        setSelectedContributors(prev => prev.filter(e => e !== email));
      } else {
        // Ajouter le contributeur
        const userData = users.find(user => user.email === email);
        await setDoc(doc(db, 'selectedContributors', email), {
          email,
          username: userData.username || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          profileImage: userData.profileImage || '',
          photoCount: userData.photoCount || 0
        });
        setSelectedContributors(prev => [...prev, email]);
      }
    } catch (error) {
      console.error('Error updating contributors:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Chargement des utilisateurs...</div>;
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">Gestion des Contributeurs</h2>
      <p className="mb-4">Sélectionnez les contributeurs à afficher sur la page d'accueil:</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(user => (
          <div 
            key={user.email} 
            className={`border p-4 rounded-lg cursor-pointer ${
              selectedContributors.includes(user.email) 
                ? 'bg-green-100 border-green-500' 
                : 'bg-white'
            }`}
            onClick={() => handleToggleContributor(user.email)}
          >
            <div className="flex items-center gap-3">
              {user.profileImage && (
                <img 
                  src={user.profileImage} 
                  alt={user.username || user.email} 
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div>
                <p className="font-medium">
                  {user.username || `${user.firstName || ''} ${user.lastName || ''}`}
                </p>
                <p className="text-sm text-gray-500">{user.email}</p>
                <p className="text-sm">Photos: {user.photoCount}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {users.length === 0 && (
        <p className="text-center text-gray-500">Aucun utilisateur avec des photos n'a été trouvé.</p>
      )}
    </div>
  );
}
