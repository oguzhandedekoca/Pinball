'use client';

import { NextUIProvider } from '@nextui-org/react';
import { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';

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

  const logout = () => {
    setCurrentUser(null);
    router.push('/login');
  };

  return (
    <UserContext.Provider value={{ currentUser, logout, setCurrentUser }}>
      <NextUIProvider>
        {children}
      </NextUIProvider>
    </UserContext.Provider>
  );
} 