'use client'

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { db } from "@/app/db/firebaseConfig"
import { collection, query, where, getDocs, limit, startAfter } from "firebase/firestore"
import ArticleList from "@/app/components/ArticleList"
import { ImSpinner8 } from "react-icons/im"

const PAGE_SIZE = 20

export default function TagPage() {
  const { tag } = useParams()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [lastDoc, setLastDoc] = useState(null)
  const [hasMore, setHasMore] = useState(true)

  // When the tag changes, reset the state
  useEffect(() => {
    setPhotos([])
    setLastDoc(null)
    setHasMore(true)
    setLoading(true)
    setError(null)
    if (tag) {
      fetchPhotos()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tag])

  const fetchPhotos = async () => {
    try {
      console.log("Fetching photos for tag:", tag)
      const postsRef = collection(db, "post")
      let q
      if (lastDoc) {
        // Paginate after the last document fetched
        q = query(
          postsRef,
          where("tags", "array-contains", tag.toLowerCase()),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        )
      } else {
        q = query(
          postsRef,
          where("tags", "array-contains", tag.toLowerCase()),
          limit(PAGE_SIZE)
        )
      }
      const querySnapshot = await getDocs(q)
      const fetchedPhotos = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      // If fewer than PAGE_SIZE docs were returned, there are no more photos
      if (querySnapshot.docs.length < PAGE_SIZE) {
        setHasMore(false)
      }
      if (querySnapshot.docs.length > 0) {
        setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1])
      }
      setPhotos((prev) => [...prev, ...fetchedPhotos])
    } catch (err) {
      console.error("Error fetching photos:", err)
      setError("Failed to load photos")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = () => {
    if (hasMore && !loadingMore) {
      setLoadingMore(true)
      fetchPhotos()
    }
  }

  if (loading && photos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ImSpinner8 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) return <p className="text-red-500">{error}</p>

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Photos tagged with "{tag}"</h1>
      {photos.length > 0 ? (
        <>
          <ArticleList listPosts={photos} />
          {hasMore && (
            <div className="flex justify-center my-4">
              <button
                onClick={loadMore}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      ) : (
        <p>No photos found for "{tag}".</p>
      )}
    </div>
  )
}
