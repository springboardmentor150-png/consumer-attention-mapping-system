import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardPathForRole } from '../utils/roleUtils';

export default function RoleDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const nextRoute = getDashboardPathForRole(user.role);
    navigate(nextRoute, { replace: true });
  }, [user, navigate]);

  return null;
}

