import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User, signInAnonymously } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAuthReady: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsAuthReady(true);
      } else {
        // Automatically sign in anonymously for Developer Mode
        try {
          const cred = await signInAnonymously(auth);
          setUser(cred.user);
        } catch (error) {
          console.error("Failed to sign in anonymously:", error);
        }
        setIsAuthReady(true);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), async (snapshot) => {
        if (snapshot.exists()) {
          setProfile(snapshot.data() as UserProfile);
          setLoading(false);
        } else {
          // If no profile exists (common for anonymous users), create a default developer profile
          const devProfile: UserProfile = {
            uid: user.uid,
            email: 'dgithinji331@gmail.com', // Developer email for rule bypass
            displayName: 'Developer',
            role: 'headteacher',
            createdAt: new Date().toISOString(),
          };
          
          try {
            await setDoc(doc(db, 'users', user.uid), devProfile);
            setProfile(devProfile);
          } catch (err) {
            console.error("Error creating dev profile:", err);
          }
          setLoading(false);
        }
      }, (error) => {
        console.error("Error fetching profile:", error);
        setLoading(false);
      });

      return () => unsubscribeProfile();
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
};
