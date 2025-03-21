'use client';
import Photos from './Photos';
import Favorites from './Favorites';
import Downloaded from './Downloaded';
import Settings from './Settings';
import Collections from './Collections';

export default function TabContent({ activeTab, userEmail, isOwner }) {
  // On affiche le contenu en fonction de l'onglet actif
  switch (activeTab) {
    case 'photos':
      return <Photos userEmail={userEmail} />;
    case 'collections':
      return <Collections userEmail={userEmail} isOwner={isOwner} />;
    case 'favorites':
      return isOwner ? <Favorites userEmail={userEmail} /> : <div>Accès refusé</div>;
    case 'downloaded':
      return isOwner ? <Downloaded userEmail={userEmail} /> : <div>Accès refusé</div>;
    case 'settings':
      return isOwner ? <Settings /> : <div>Accès refusé</div>;
    default:
      return <Photos userEmail={userEmail} />;
  }
}
