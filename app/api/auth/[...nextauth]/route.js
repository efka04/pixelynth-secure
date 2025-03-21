import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app, db } from "@/app/db/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const auth = getAuth(app);
          const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          );
          const user = userCredential.user;
          
          // Vérifier si l'email de l'utilisateur est vérifié
          if (!user.emailVerified) {
            console.log("Tentative de connexion avec un email non vérifié:", user.email);
            throw new Error("email-not-verified");
          }

          return {
            id: user.uid,
            email: user.email,
            name: user.displayName || user.email,
          };
        } catch (error) {
          console.error("Firebase auth error:", error);
          // Si l'erreur est due à un email non vérifié, on peut la gérer spécifiquement
          if (error.message === "email-not-verified") {
            throw new Error("email-not-verified");
          }
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.email);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            token.username = userData.username || null;
            token.id = userData.uid || user.id; // Utiliser l'ID Firestore si dispo
          } else if (account?.provider === "google") {
            // Si l'utilisateur Google n'existe pas dans Firestore, le créer
            const newUser = {
              uid: user.id,
              email: user.email,
              username: user.name || user.email.split("@")[0],
              profileImage: user.image || "",
            };
            await setDoc(userDocRef, newUser);
            token.username = newUser.username;
            token.id = newUser.uid;
          }

          token.email = user.email;
          console.log("JWT token updated:", token);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.username = token.username || null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
