'use client'
import { useState, useEffect } from 'react'
import { FaImage, FaHeart, FaDownload, FaUser } from 'react-icons/fa'
import { getUserPhotoCount, getUserFavoritesCount } from '@/app/utils/statsUtils'
import { getFromCache, saveToCache } from '@/app/utils/cacheUtils'

export default function UserStats({ userEmail, photoCount = 0, favoritesCount = 0 }) {
  const [stats, setStats] = useState({
    photos: photoCount,
    favorites: favoritesCount,
    downloads: 0,
    views: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!userEmail) return
      
      setLoading(true)
      
      // Vérifier le cache d'abord
      const cacheKey = `user_stats_${userEmail}`
      const cachedStats = getFromCache(cacheKey)
      
      if (cachedStats) {
        setStats(cachedStats)
        setLoading(false)
        
        // Rafraîchir en arrière-plan
        setTimeout(() => refreshStatsInBackground(cacheKey), 100)
        return
      }
      
      try {
        // Si pas de cache, charger depuis Firebase
        const photos = await getUserPhotoCount(userEmail)
        const favorites = await getUserFavoritesCount(userEmail)
        
        // Pour les téléchargements et vues, vous pourriez avoir d'autres fonctions similaires
        // ou les calculer différemment selon votre modèle de données
        
        const newStats = {
          photos,
          favorites,
          downloads: 0, // À remplacer par la vraie valeur si disponible
          views: 0      // À remplacer par la vraie valeur si disponible
        }
        
        setStats(newStats)
        
        // Sauvegarder dans le cache
        saveToCache(cacheKey, newStats)
      } catch (error) {
        console.error('Error fetching user stats:', error)
      } finally {
        setLoading(false)
      }
    }
    
    // Utiliser les props si disponibles, sinon charger depuis Firebase
    if (photoCount > 0 || favoritesCount > 0) {
      setStats(prev => ({
        ...prev,
        photos: photoCount,
        favorites: favoritesCount
      }))
      setLoading(false)
    } else {
      fetchStats()
    }
  }, [userEmail, photoCount, favoritesCount])
  
  // Fonction pour rafraîchir les statistiques en arrière-plan
  const refreshStatsInBackground = async (cacheKey) => {
    try {
      const photos = await getUserPhotoCount(userEmail)
      const favorites = await getUserFavoritesCount(userEmail)
      
      const newStats = {
        photos,
        favorites,
        downloads: stats.downloads, // Conserver les valeurs existantes
        views: stats.views          // ou les mettre à jour si nécessaire
      }
      
      // Mettre à jour le cache
      saveToCache(cacheKey, newStats)
      
      // Mettre à jour l'interface si les données ont changé
      if (newStats.photos !== stats.photos || newStats.favorites !== stats.favorites) {
        setStats(newStats)
      }
    } catch (error) {
      console.error('Error refreshing stats in background:', error)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h2 className="text-xl font-semibold mb-4">User Statistics</h2>
      
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
            <FaImage className="text-blue-500 text-xl mb-2" />
            <span className="text-2xl font-bold">{stats.photos}</span>
            <span className="text-sm text-gray-600">Photos</span>
          </div>
          
          <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
            <FaHeart className="text-red-500 text-xl mb-2" />
            <span className="text-2xl font-bold">{stats.favorites}</span>
            <span className="text-sm text-gray-600">Favorites</span>
          </div>
          
          <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
            <FaDownload className="text-green-500 text-xl mb-2" />
            <span className="text-2xl font-bold">{stats.downloads}</span>
            <span className="text-sm text-gray-600">Downloads</span>
          </div>
          
          <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
            <FaUser className="text-purple-500 text-xl mb-2" />
            <span className="text-2xl font-bold">{stats.views}</span>
            <span className="text-sm text-gray-600">Profile Views</span>
          </div>
        </div>
      )}
    </div>
  )
}
