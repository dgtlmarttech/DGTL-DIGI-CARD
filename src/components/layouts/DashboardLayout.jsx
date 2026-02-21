// components/layouts/DashboardLayout.js
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '../../context/userContext';
import { auth } from '../../firebase/firebase';

const DashboardLayout = ({ children, pageTitle }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userInfo, isAuthenticated, loading, isStandalone } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [loading, isAuthenticated, router]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/signin');
  };

  const navItems = [
    { name: 'Profile', href: '/dashboard', icon: '👤' },
    { name: 'Card Styles', href: '/dashboard/appearance', icon: '🎨' },
    { name: 'Vanity URL', href: '/dashboard/vanity-url', icon: '🔗' },
    {
      name: userInfo?.isPremium ? 'Manage Subscription' : 'Upgrade',
      href: '/payment',
      icon: userInfo?.isPremium ? '👑' : '⭐',
    },
    { name: 'View Card', href: `/${userInfo?.customUID || user?.uid}`, icon: '👁️' },
    { name: 'CRM', href: '/crm', icon: '📊' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-600 shadow-lg"></div>
          <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-blue-400 animate-pulse"></div>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-lg shadow-slate-200/20 sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="flex justify-between h-16">
            {/* Left: Brand + nav toggle (mobile) */}
            <div className="flex items-center">
              {/* Brand */}
              <div
                className="flex-shrink-0 flex items-center cursor-pointer group"
                onClick={() => router.push('/dashboard')}
              >
                <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-xl transition-all duration-200 group-hover:scale-105">
                  D
                </div>
                <span className="ml-3 font-bold text-lg bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Dashboard
                </span>
              </div>

              {/* Desktop menu */}
              <div className="hidden md:ml-8 md:flex md:space-x-2">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <button
                      key={item.name}
                      onClick={() => router.push(item.href)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center transition-all duration-200 ${active
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-200/50 transform scale-105'
                        : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-800 hover:shadow-md hover:scale-105'
                        }`}
                    >
                      <span className="mr-2 text-base">{item.icon}</span>
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Profile */}
            <div className="flex items-center">
              {/* Profile info (desktop) */}
              <div className="hidden md:flex items-center space-x-4">
                <div className="flex items-center space-x-3 bg-slate-50/70 rounded-full px-4 py-2 border border-slate-200/60">
                  {userInfo?.imgUrl ? (
                    <img
                      src={userInfo.imgUrl}
                      alt="Profile"
                      className="h-9 w-9 rounded-full object-cover ring-2 ring-blue-200 shadow-sm"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 flex items-center justify-center text-white font-semibold shadow-md">
                      {userInfo?.firstName?.[0] || user?.email?.[0] || '?'}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-slate-800">
                    {userInfo?.firstName || user?.displayName || 'User'}
                  </span>
                </div>

                {!isStandalone && (
                  <button
                    onClick={() => router.push('/install-app')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-700 transition duration-200 shadow-md transform hover:scale-105"
                  >
                    <span>📱</span>
                    <span>Install App</span>
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 hover:shadow-sm"
                >
                  Logout
                </button>
              </div>

              {/* Mobile Menu Toggle */}
              <div className="flex md:hidden ml-2">
                <button
                  onClick={() => setMobileMenuOpen((prev) => !prev)}
                  className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100/70 hover:text-slate-800 transition-all duration-200 hover:shadow-md"
                >
                  {mobileMenuOpen ? (
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl shadow-2xl border-t border-slate-200/60 animate-in slide-in-from-top-2 duration-200">
            <div className="pt-3 pb-4 space-y-2 px-4">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      router.push(item.href);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center w-full text-left px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${active
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105'
                      : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-800 hover:shadow-md hover:scale-105'
                      }`}
                  >
                    <span className="mr-3 text-base">{item.icon}</span>
                    {item.name}
                  </button>
                );
              })}

              {!isStandalone && (
                <button
                  onClick={() => {
                    router.push('/install-app');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center w-full text-left px-4 py-3 text-sm font-medium rounded-xl text-blue-600 hover:bg-blue-50/70 transition-all duration-200"
                >
                  <span className="mr-3 text-base">📱</span>
                  Install App
                </button>
              )}

              <div className="border-t border-slate-200/60 mt-4 pt-4">
                <div className="flex items-center px-4 space-x-3 mb-3">
                  {userInfo?.imgUrl ? (
                    <img
                      src={userInfo.imgUrl}
                      alt="Profile"
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-blue-200 shadow-sm"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 flex items-center justify-center text-white font-semibold shadow-md">
                      {userInfo?.firstName?.[0] || user?.email?.[0] || '?'}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-slate-800">
                    {userInfo?.firstName || user?.displayName || 'User'}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50/70 hover:text-red-700 rounded-xl transition-all duration-200 hover:shadow-md"
                >
                  <span className="mr-3">🚪</span>
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="flex-1 relative">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;