'use client';
import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ImSpinner8 } from "react-icons/im";

export default function TagPage() {
  const { tag } = useParams();
  const router = useRouter();
  
  useEffect(() => {
    if (tag) {
      // Simple redirection vers la page photos
      router.push(`/search/photos/${tag}`);
    }
  }, [tag, router]);

  // Afficher un spinner pendant la redirection
  return (
    <div className="min-h-screen flex items-center justify-center">
      <ImSpinner8 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  );
}
