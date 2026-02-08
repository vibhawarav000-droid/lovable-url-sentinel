import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user } = useAuth();
  
  // Redirect viewers to monitors page, others to dashboard
  if (user?.role === 'viewer') {
    return <Navigate to="/monitors" replace />;
  }
  
  return <Navigate to="/dashboard" replace />;
};

export default Index;
