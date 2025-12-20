import { createContext, useContext, type ReactNode } from 'react';
import { useSession, signIn, signUp, signOut } from '../lib/auth-client';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending: isLoading } = useSession();

  const user: User | null = session?.user ? {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    username: (session.user as unknown as { username: string }).username,
    role: (session.user as unknown as { role: 'user' | 'admin' }).role,
  } : null;

  const login = async (email: string, password: string) => {
    const result = await signIn.email({
      email,
      password,
    });
    if (result.error) {
      throw new Error(result.error.message || 'Login failed');
    }
  };

  const register = async (email: string, username: string, password: string) => {
    const result = await signUp.email({
      email,
      password,
      name: username, // Use username as the display name
      username, // Custom field
    } as Parameters<typeof signUp.email>[0]);
    if (result.error) {
      throw new Error(result.error.message || 'Registration failed');
    }
  };

  const logout = async () => {
    await signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
