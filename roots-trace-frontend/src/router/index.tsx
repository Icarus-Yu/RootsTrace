import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Families from '../pages/Families';
import Members from '../pages/Members';
import Queries from '../pages/Queries';
import FamilyTreeView from '../pages/FamilyTreeView';
import { useAuthStore } from '../store/authStore';

// Private Route Wrapper
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((state) => state.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/',
    element: (
      <PrivateRoute>
        <MainLayout />
      </PrivateRoute>
    ),
    children: [
      {
        path: '/',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'families',
        element: <Families />,
      },
      {
        path: 'tree',
        element: <FamilyTreeView />,
      },
      {
        path: 'families/:id/members',
        element: <Members />,
      },
      {
        path: 'queries',
        element: <Queries />,
      },
    ],
  },
]);

export default router;
