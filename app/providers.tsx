'use client';

import { NextUIProvider } from '@nextui-org/react';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { auth } from './firebase/config';
import { User } from 'firebase/auth';

interface UserContextType {
  currentUser: User | null;
  logout: () => Promise<void>;
  setCurrentUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType>({
  currentUser: null,
  logout: async () => {},
  setCurrentUser: () => {},
});

export const useUser = () => useContext(UserContext);

export function Providers({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setIsLoading(false);
      
      if (!user && !pathname.includes('/login')) {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router, pathname]);

  const logout = async () => {
    try {
      await auth.signOut();
      setCurrentUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <NextThemesProvider attribute="class" defaultTheme="light">
      <UserContext.Provider value={{ currentUser, logout, setCurrentUser }}>
        <NextUIProvider>
          {children}
        </NextUIProvider>
      </UserContext.Provider>
    </NextThemesProvider>
  );
} 