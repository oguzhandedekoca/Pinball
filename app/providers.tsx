'use client';

import { NextUIProvider } from '@nextui-org/react';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme as useNextTheme } from 'next-themes';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const logout = () => {
    setCurrentUser(null);
    router.push('/login');
  };

  if (!mounted) return null;

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