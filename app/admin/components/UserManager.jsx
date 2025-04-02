// /app/admin/components/UserManager.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/app/db/firebaseConfig';

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'username', direction: 'ascending' });

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // Récupérer tous les utilisateurs
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const usersData = usersSnapshot.docs.map(doc => ({
          email: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);
      } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Fonction de recherche
  const filteredUsers = users.filter(user => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      (user.username && user.username.toLowerCase().includes(searchTermLower)) ||
      (user.email && user.email.toLowerCase().includes(searchTermLower)) ||
      (user.firstName && user.firstName.toLowerCase().includes(searchTermLower)) ||
      (user.lastName && user.lastName.toLowerCase().includes(searchTermLower))
    );
  });

  // Fonction de tri
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!a[sortConfig.key] && !b[sortConfig.key]) return 0;
    if (!a[sortConfig.key]) return 1;
    if (!b[sortConfig.key]) return -1;
    
    const aValue = typeof a[sortConfig.key] === 'string' ? a[sortConfig.key].toLowerCase() : a[sortConfig.key];
    const bValue = typeof b[sortConfig.key] === 'string' ? b[sortConfig.key].toLowerCase() : b[sortConfig.key];
    
    if (aValue < bValue) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  // Fonction pour changer le tri
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(sortedUsers.length / usersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Rendu de la pagination
  const renderPagination = () => {
    const pageNumbers = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pageNumbers.push(1, 2, 3, 4, 'ellipsis1', totalPages);
      } else if (currentPage > totalPages - 3) {
        pageNumbers.push(1, 'ellipsis2', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pageNumbers.push(1, 'ellipsis3', currentPage - 1, currentPage, currentPage + 1, 'ellipsis4', totalPages);
      }
    }
    
    return pageNumbers.map((number, index) =>
      typeof number === 'string' ? (
        <span key={number} className="mx-2">...</span>
      ) : (
        <button
          key={number}
          onClick={() => paginate(number)}
          className={`px-3 py-1 mx-1 rounded ${
            currentPage === number 
              ? 'bg-black text-white' 
              : 'bg-white text-black border border-black hover:bg-gray-100'
          }`}
        >
          {number}
        </button>
      )
    );
  };

  if (loading) {
    return <div className="text-center py-4">Chargement des utilisateurs...</div>;
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">Gestion des Utilisateurs</h2>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="Rechercher un utilisateur..."
          className="w-full p-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border cursor-pointer" onClick={() => requestSort('username')}>
                Nom d'utilisateur {sortConfig.key === 'username' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
              </th>
              <th className="py-2 px-4 border cursor-pointer" onClick={() => requestSort('email')}>
                Email {sortConfig.key === 'email' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
              </th>
              <th className="py-2 px-4 border cursor-pointer" onClick={() => requestSort('firstName')}>
                Prénom {sortConfig.key === 'firstName' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
              </th>
              <th className="py-2 px-4 border cursor-pointer" onClick={() => requestSort('lastName')}>
                Nom {sortConfig.key === 'lastName' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
              </th>
              <th className="py-2 px-4 border cursor-pointer" onClick={() => requestSort('photoCount')}>
                Nombre de photos {sortConfig.key === 'photoCount' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
              </th>
              <th className="py-2 px-4 border cursor-pointer" onClick={() => requestSort('createdAt')}>
                Date d'inscription {sortConfig.key === 'createdAt' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
              </th>
              <th className="py-2 px-4 border">Photo de profil</th>
              <th className="py-2 px-4 border">Détails</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map(user => (
              <tr key={user.email} className="hover:bg-gray-50">
                <td className="py-2 px-4 border">{user.username || '-'}</td>
                <td className="py-2 px-4 border">{user.email || '-'}</td>
                <td className="py-2 px-4 border">{user.firstName || '-'}</td>
                <td className="py-2 px-4 border">{user.lastName || '-'}</td>
                <td className="py-2 px-4 border">{user.photoCount || 0}</td>
                <td className="py-2 px-4 border">
                  {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : '-'}
                </td>
                <td className="py-2 px-4 border">
                  {user.profileImage ? (
                    <img 
                      src={user.profileImage} 
                      alt={user.username || user.email} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    '-'
                  )}
                </td>
                <td className="py-2 px-4 border">
                  <button 
                    className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                    onClick={() => {
                      // Afficher les détails de l'utilisateur dans une modal ou rediriger vers une page de détails
                      alert(`Détails de l'utilisateur ${user.username || user.email}:\n\n${JSON.stringify(user, null, 2)}`);
                    }}
                  >
                    Voir détails
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {sortedUsers.length === 0 && (
        <p className="text-center text-gray-500 mt-4">Aucun utilisateur trouvé.</p>
      )}
      
      {sortedUsers.length > 0 && (
        <div className="flex justify-center gap-2 mt-6">
          {renderPagination()}
        </div>
      )}
    </div>
  );
}
