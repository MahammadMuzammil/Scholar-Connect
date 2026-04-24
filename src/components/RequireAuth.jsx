import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '../context/AuthContext.jsx';

export default function RequireAuth({ role, children }) {
  const session = useSession();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (role && session.role !== role) {
    return (
      <Navigate
        to={session.role === 'scholar' ? '/dashboard' : '/'}
        replace
      />
    );
  }
  return children;
}
