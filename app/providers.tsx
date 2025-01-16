'use client';

import { NextUIProvider } from '@nextui-org/react';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { auth } from './firebase/config';

interface UserContextType {
  currentUser: string | null;
  logout: () => void;
  setCurrentUser: (user: string) => void;
}

const UserContext = createContext<UserContextType>({
  currentUser: null,
  logout: () => {},
  setCurrentUser: () => {},
});

export const useUser = () => useContext(UserContext);

export function Providers({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user && pathname !== '/login') {
        router.push('/login');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname]);

  const logout = () => {
    setCurrentUser(null);
    router.push('/login');
  };

  if (isLoading) {
    return null;
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