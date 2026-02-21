'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '../../context/userContext';
import DashboardLayout from '../../components/layouts/DashboardLayout';

const UserLayout = ({ children }) => {
  const { user, loading, initializing, isAuthenticated } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect while initializing or loading
    if (initializing || loading) return;

    // Redirect to signin if not authenticated
    if (!isAuthenticated) {
      router.push('/signin');
    }
  }, [initializing, loading, isAuthenticated, router]);

  // Show loading spinner during auth processes
  if (initializing || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Render DashboardLayout wrapping all authenticated pages
  if (isAuthenticated) {
    return (
      <DashboardLayout
        pageTitle={getPageTitleFromPath(pathname)}
        currentPath={pathname}
      >
        {children}
      </DashboardLayout>
    );
  }

  return null;
};

// Utility to derive a human-readable page title from URL path
function getPageTitleFromPath(pathname) {
  if (!pathname) return 'Dashboard';

  if (pathname.startsWith('/dashboard/appearance')) return 'Card Styles';
  if (pathname.startsWith('/dashboard/vanity-url')) return 'Vanity URL';
  if (pathname.startsWith('/dashboard')) return 'Profile';
  if (pathname.startsWith('/payment')) return 'Payment';
  if (pathname.startsWith('/crm')) return 'CRM';

  return 'Dashboard';
}

export default UserLayout;
