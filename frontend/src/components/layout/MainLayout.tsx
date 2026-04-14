// src/components/MainLayout.tsx
// Shared page layout wrapper that includes the top navigation bar and site footer.
// #region Imports
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TopNav from '../homepage/TopNav';
import Footer from './SiteFooter';
import { useAuth } from '../../context/AuthContext';

// #endregion Imports

// #region Types
interface MainLayoutProps {
  children: React.ReactNode;
}
// #endregion Types

// #region Component
const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isAdmin, user } = useAuth();

  useEffect(() => {
    if (
      isAuthenticated &&
      !isAdmin &&
      !user?.onboardingCompleted &&
      location.pathname !== '/onboarding'
    ) {
      navigate('/onboarding', {
        replace: true,
        state: { from: location.pathname + location.search },
      });
    }
  }, [isAuthenticated, isAdmin, user?.onboardingCompleted, location.pathname, location.search, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F0C]">
      <TopNav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

// #endregion Component

// #region Exports
export default MainLayout;
// #endregion Exports
