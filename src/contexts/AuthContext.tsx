import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '@/services/apiService';

export type UserRole = 'super_admin' | 'admin' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  organizationId: string;
  organizationName: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (requiredRole: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const roleHierarchy: Record<UserRole, number> = {
  super_admin: 3,
  admin: 2,
  viewer: 1,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('uptimehost_user');
    const token = localStorage.getItem('uptimehost_token');
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
        apiService.setToken(token);
      } catch {
        localStorage.removeItem('uptimehost_user');
        localStorage.removeItem('uptimehost_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const data = await apiService.login(email, password);
      const userData: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        avatar: data.user.avatar,
        organizationId: data.user.organizationId,
        organizationName: data.user.organizationName,
        createdAt: data.user.createdAt,
      };
      setUser(userData);
      localStorage.setItem('uptimehost_user', JSON.stringify(userData));
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    apiService.logout();
    localStorage.removeItem('uptimehost_user');
  };

  const hasPermission = (requiredRole: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const userLevel = roleHierarchy[user.role];
    return roles.some(role => userLevel >= roleHierarchy[role]);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      login, 
      logout, 
      hasPermission 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
