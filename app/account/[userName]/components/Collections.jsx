'use client';
import Collections from '@/app/components/collections/CollectionsList';
import { useSession } from 'next-auth/react';

export default function CollectionsTab({ userEmail, isOwner }) {
  const { data: session } = useSession();
  
  return (
    <div className="w-full">
      <Collections userEmail={userEmail} isOwner={isOwner} />
    </div>
  );
}
