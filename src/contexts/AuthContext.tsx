import React, { createContext, useContext, useState, useEffect } from 'react';

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

// Mock users for demo
const mockUsers: Record<string, User & { password: string }> = {
  'superadmin@uptimehost.com': {
    id: '1',
    email: 'superadmin@uptimehost.com',
    password: 'admin123',
    name: 'John Super',
    role: 'super_admin',
    organizationId: 'org-1',
    organizationName: 'UptimeHost Inc.',
    createdAt: '2024-01-15',
  },
  'admin@uptimehost.com': {
    id: '2',
    email: 'admin@uptimehost.com',
    password: 'admin123',
    name: 'Jane Admin',
    role: 'admin',
    organizationId: 'org-1',
    organizationName: 'UptimeHost Inc.',
    createdAt: '2024-02-10',
  },
  'viewer@uptimehost.com': {
    id: '3',
    email: 'viewer@uptimehost.com',
    password: 'viewer123',
    name: 'Bob Viewer',
    role: 'viewer',
    organizationId: 'org-1',
    organizationName: 'UptimeHost Inc.',
    createdAt: '2024-03-05',
  },
};

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
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('uptimehost_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockUser = mockUsers[email.toLowerCase()];
    
    if (!mockUser || mockUser.password !== password) {
      setIsLoading(false);
      throw new Error('Invalid email or password');
    }

    const { password: _, ...userWithoutPassword } = mockUser;
    setUser(userWithoutPassword);
    localStorage.setItem('uptimehost_user', JSON.stringify(userWithoutPassword));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
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
