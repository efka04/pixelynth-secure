'use client'
import { useState, useEffect } from "react";
import { FaUser } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/db/firebaseConfig";

export default function UserProfile({ session }) {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user?.email) {
        const userRef = doc(db, "users", session.user.email);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }
      }
    };
    fetchUserData();
  }, [session?.user?.email]);

  const renderUserImage = () => {
    // Affiche un placeholder tant que les données ne sont pas chargées
    if (!userData) {
      return (
        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
          <FaUser className="text-gray-400 text-xl" />
        </div>
      );
    }

    // Récupère l'image de profil ou utilise l'image par défaut
    const userImage = userData?.profileImage || "/default-avatar.webp";

    return (
      <Image
        width={48}
        height={48}
        className="rounded-full border border-gray-200 object-cover"
        src={userImage}
        alt="User profile"
        priority
        onError={(e) => {
          e.target.src = "/default-avatar.webp";
        }}
      />
    );
  };

  return (
    <Link
      href={`/account/${session.user.username}`}
      className="flex items-center justify-center w-12 h-12"
    >
      {renderUserImage()}
    </Link>
  );
}
