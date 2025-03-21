'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Tab } from '@headlessui/react'
import Photos from './components/Photos'
import Favorites from './components/Favorites'
import Downloaded from './components/Downloaded'
import Settings from './components/Settings'
import UserStats from './components/UserStats'
import { getUserPhotoCount, getUserFavoritesCount } from '@/app/utils/statsUtils'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function UserAccount() {
  const params = useParams()
  const { data: session, status } = useSession()
  const [userEmail, setUserEmail] = useState('')
  const [isCurrentUser, setIsCurrentUser] = useState(false)
  const [photoCount, setPhotoCount] = useState(0)
  const [favoritesCount, setFavoritesCount] = useState(0)
  
  useEffect(() => {
    if (status === 'authenticated' && params.userName) {
      // Déterminer si l'utilisateur actuel est le propriétaire du profil
      const currentUserName = session.user.name || session.user.email.split('@')[0]
      setIsCurrentUser(currentUserName === params.userName)
      
      if (isCurrentUser && session.user.email) {
        setUserEmail(session.user.email)
        
        // Charger les statistiques de l'utilisateur
        const loadUserStats = async () => {
          const photos = await getUserPhotoCount(session.user.email)
          const favorites = await getUserFavoritesCount(session.user.email)
          
          setPhotoCount(photos)
          setFavoritesCount(favorites)
        }
        
        loadUserStats()
      }
    }
  }, [params.userName, session, status, isCurrentUser])

  if (status === 'loading') {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!isCurrentUser) {
    return <div className="text-center py-12">You don't have access to this page</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome, {params.userName}</h1>
        
        {/* Intégration du composant UserStats */}
        <UserStats 
          userEmail={userEmail} 
          photoCount={photoCount} 
          favoritesCount={favoritesCount} 
        />
      </div>

      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1">
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white shadow text-black'
                  : 'text-gray-600 hover:bg-white/[0.12] hover:text-black'
              )
            }
          >
            My Photos ({photoCount})
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white shadow text-black'
                  : 'text-gray-600 hover:bg-white/[0.12] hover:text-black'
              )
            }
          >
            Favorites ({favoritesCount})
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white shadow text-black'
                  : 'text-gray-600 hover:bg-white/[0.12] hover:text-black'
              )
            }
          >
            Downloaded
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white shadow text-black'
                  : 'text-gray-600 hover:bg-white/[0.12] hover:text-black'
              )
            }
          >
            Settings
          </Tab>
        </Tab.List>
        <Tab.Panels className="mt-2">
          <Tab.Panel
            className={classNames(
              'rounded-xl bg-white p-3',
              'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
            )}
          >
            <Photos userEmail={userEmail} />
          </Tab.Panel>
          <Tab.Panel
            className={classNames(
              'rounded-xl bg-white p-3',
              'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
            )}
          >
            <Favorites userEmail={userEmail} />
          </Tab.Panel>
          <Tab.Panel
            className={classNames(
              'rounded-xl bg-white p-3',
              'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
            )}
          >
            <Downloaded userEmail={userEmail} />
          </Tab.Panel>
          <Tab.Panel
            className={classNames(
              'rounded-xl bg-white p-3',
              'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
            )}
          >
            <Settings userEmail={userEmail} />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  )
}
