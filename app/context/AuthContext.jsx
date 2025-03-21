'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '@/app/db/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { useSession } from 'next-auth/react';

// Création du contexte avec une valeur par défaut
const AuthContext = createContext({
  user: null,
  loading: true,
});

// Hook personnalisé pour accéder au contexte
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

// Fournisseur du contexte d'authentification
export function AuthProvider({ children }) {
  const { data: session } = useSession();
  // On initialise l'état "user" à partir de la session NextAuth, s'il y en a une
  const [user, setUser] = useState(session?.user || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Si NextAuth possède déjà une session, on l'utilise
    if (session?.user) {
      setUser(session.user);
      setLoading(false);
    }

    // Écouter les changements d'état d'authentification via Firebase
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [session]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {/* Vous pouvez aussi afficher un loader ici si vous préférez */}
      {!loading ? children : null}
    </AuthContext.Provider>
  );
}