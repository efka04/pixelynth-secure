'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/app/db/firebaseConfig'
import Image from 'next/image'
import Link from 'next/link'
import LoadingSpinner from '@/app/components/ArticleList/LoadingSpinner'
import TabContent from './components/TabContent'
import { useSession } from 'next-auth/react'

export default function AccountPage() {
  const { data: session, status } = useSession({
    required: false,
    onUnauthenticated() {
      // This runs when unauthenticated but isn't mandatory for the fix
      console.log("User is not authenticated")
    },
  })
  const router = useRouter()
  const params = useParams()

  const [userData, setUserData] = useState(null)
  const [activeTab, setActiveTab] = useState('photos')
  const [loading, setLoading] = useState(true)
  const [ownerLoading, setOwnerLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)

  // This effect will run whenever params.userName changes
  useEffect(() => {
    if (!params?.userName) {
      setLoading(false)
      return
    }

    const fetchUserData = async () => {
      setLoading(true)
      try {
        const usersRef = collection(db, 'users')
        const q = query(usersRef, where('username', '==', params.userName))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const docRef = querySnapshot.docs[0].ref
          const docData = querySnapshot.docs[0].data()
          const userEmail = querySnapshot.docs[0].id

          let photoCount = docData.photoCount ?? null

          if (photoCount === null) {
            const photosRef = collection(db, 'users', userEmail, 'MyImages')
            const photosSnapshot = await getDocs(photosRef)
            photoCount = photosSnapshot.size

            await updateDoc(docRef, { photoCount })
          }

          setUserData({ ...docData, email: userEmail, photoCount })
        } else {
          setUserData(null)
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [params?.userName])

  // This effect will only run after we have confirmed the session is loaded
  useEffect(() => {
    // Only proceed if session is fully loaded (not in 'loading' state)
    if (status === 'loading' || !params?.userName) {
      return
    }
    
    const fetchOwnerStatus = async () => {
      setOwnerLoading(true)
      try {
        // If there's no session, we know it's not the owner
        if (status === 'unauthenticated' || !session?.user?.email) {
          setIsOwner(false)
          setOwnerLoading(false)
          return
        }
        
        const userRef = doc(db, 'users', session.user.email)
        const userSnap = await getDoc(userRef)
        setIsOwner(
          userSnap.exists() &&
          userSnap.data().username.trim().toLowerCase() === params.userName.trim().toLowerCase()
        )
      } catch (error) {
        console.error('Error fetching owner status:', error)
        setIsOwner(false)
      } finally {
        setOwnerLoading(false)
      }
    }

    fetchOwnerStatus()
  }, [status, session?.user?.email, params?.userName])

  if (loading) {
    return <LoadingSpinner />
  }

  if (!userData) {
    return <div className="text-center text-gray-600">User not found</div>
  }

  return (
    <div className='max-w-4xl mx-auto p-6'>
      <div className='flex items-center gap-8 mb-12'>
        <div className='relative w-32 h-32 ring-1 ring-gray-200 rounded-full'>
          <Image
            src={userData.profileImage || '/placeholder.jpg'}
            alt={userData.username}
            fill
            className='rounded-full object-cover'
          />
        </div>
        <div>
          <h1 className='text-3xl font-bold mb-2'>{userData.username}</h1>
          <p className='text-gray-600 mb-4'>{userData.bio}</p>
          <div className='flex flex-col gap-2'>
            {userData.instagram && (
              <Link
                href={`https://instagram.com/${userData.instagram}`}
                target='_blank'
                className='text-blue-500 hover:underline'
              >
                @{userData.instagram}
              </Link>
            )}
            <span className='text-gray-600'>
              <strong>{userData.photoCount}</strong> photos
            </span>
          </div>
        </div>
      </div>

      <div className='flex border-b border-gray-200 mb-4'>
        {[
          { id: 'photos', label: 'Photos' },
          { id: 'collections', label: 'Collections' },
          ...(isOwner || ownerLoading
            ? [
                { id: 'favorites', label: 'Favorites' },
                { id: 'downloaded', label: 'Downloaded' },
                { id: 'settings', label: 'Settings' },
              ]
            : []),
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 ${
              activeTab === tab.id
                ? 'border-b-2 border-black text-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <TabContent
        key={activeTab}
        activeTab={activeTab}
        userName={params.userName}
        userEmail={userData.email}
        isOwner={isOwner}
      />
    </div>
  )
}