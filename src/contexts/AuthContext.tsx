import React, { createContext, useContext, useState, useCallback } from 'react';

export type UserRole = 'owner' | 'employee';

interface User {
  username: string;
  role: UserRole;
  displayName: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isOwner: boolean;
}

const USERS: Record<string, { password: string; role: UserRole; displayName: string }> = {
  funcionaria: { password: '1234', role: 'employee', displayName: 'Funcionária' },
  dono: { password: 'admin123', role: 'owner', displayName: 'Dono' },
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>({ username: 'dono', role: 'owner', displayName: 'Dono' });

  const login = useCallback((username: string, password: string): boolean => {
    const entry = USERS[username.toLowerCase()];
    if (entry && entry.password === password) {
      const u: User = { username: username.toLowerCase(), role: entry.role, displayName: entry.displayName };
      setUser(u);
      localStorage.setItem('gestao-pro-user', JSON.stringify(u));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('gestao-pro-user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isOwner: user?.role === 'owner' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
