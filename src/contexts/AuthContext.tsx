import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User, signInAnonymously, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthReady: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAuthReady: false,
  signInWithGoogle: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  useEffect(() => {
    // Mock Developer User for immediate access without Firebase Auth
    setUser({
      uid: 'dev-user-123',
      email: 'dgithinji331@gmail.com',
      displayName: 'Mwalimu Developer',
    } as any);
    
    setProfile({
      uid: 'dev-user-123',
      email: 'dgithinji331@gmail.com',
      displayName: 'Mwalimu Developer',
      role: 'headteacher',
      createdAt: new Date().toISOString(),
    });
    
    setLoading(false);
    setIsAuthReady(true);
  }, []);

  // Removed Firebase Auth listeners and profile syncing for now

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAuthReady, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
