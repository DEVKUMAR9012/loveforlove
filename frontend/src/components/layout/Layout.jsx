import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import WelcomeBanner from '../WelcomeBanner';
import NotificationBell from './NotificationBell';
import { RibbonLogoLoader } from '../RibbonLogoLoader';

function Layout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <RibbonLogoLoader subText="Opening your private world..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-blush-50 via-white to-sky-50 overflow-hidden">
      <WelcomeBanner user={user} />
      <NotificationBell />
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
