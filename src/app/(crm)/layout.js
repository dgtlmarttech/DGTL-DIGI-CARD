'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '../../context/userContext';
import { usePathname, useRouter } from 'next/navigation';
import CrmNavbar from '../../components/layouts/CrmNavbar'

const CrmLayout = ({ children }) => {
  const { user, loading, initializing, isAuthenticated } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect while still initializing or loading
    if (initializing || loading) return;

    // If not authenticated after initialization, redirect to signin
    if (!isAuthenticated) {
      router.push('/signin');
    }
  }, [user, loading, initializing, isAuthenticated, router]);

  // Show loading while initializing or loading user data
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

  if (isAuthenticated) {
    return (
      <CrmNavbar
        pageTitle={getPageTitleFromPath(pathname)}
        currentPath={pathname}
      >
        <div className='text-gray-800'>
 {children}
        </div>
      </CrmNavbar>
    );
  }
  return null;
};

// Utility to derive a human-readable page title from URL path
function getPageTitleFromPath(pathname) {
  if (!pathname) return 'CRM';

  if (pathname.startsWith('/crm/scan-qr')) return 'Scan QR Code';
  if (pathname.startsWith('/crm/import')) return 'Import';
  if (pathname.startsWith('/crm/contacts')) return 'Contacts';
  if (pathname.startsWith('/crm')) return 'CRM';

  return 'CRM';
}

export default CrmLayout;


