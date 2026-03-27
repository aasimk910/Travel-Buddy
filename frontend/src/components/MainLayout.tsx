import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TopNav from './homepage/TopNav';
import Footer from './SiteFooter';
import { useAuth } from '../context/AuthContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [scrollY, setScrollY] = useState(0);
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

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Parallax floating orbs that drift opposite to scroll */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        style={{ transform: `translateY(${scrollY * 0.08}px)` }}
      >
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 rounded-full bg-purple-500/5 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full bg-emerald-500/5 blur-3xl" />
      </div>
      <TopNav />
      <main className="flex-1 relative z-10">{children}</main>
      <Footer />
    </div>
  );
};

export default MainLayout;
