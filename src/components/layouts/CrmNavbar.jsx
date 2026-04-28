// components/layouts/DashboardLayout.js
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '../../context/userContext';
import { auth } from '../../firebase/firebase';

const CrmNavbar = ({ children, pageTitle }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userInfo, isAuthenticated, loading, isStandalone } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [mobileMenuOpen]);

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
    { name: 'CRM Dashboard', href: '/crm', icon: '🏠', color: 'from-blue-500 to-blue-600' },
    { name: 'Contacts', href: '/crm/contacts', icon: '👥', color: 'from-emerald-500 to-emerald-600' },
    { name: 'Scan QR', href: '/crm/scan-qr', icon: '📸', color: 'from-purple-500 to-purple-600' },
    { name: 'Import', href: '/crm/import', icon: '📥', color: 'from-orange-500 to-orange-600' },
  ];

  const handleNavigation = (href) => {
    setMobileMenuOpen(false);
    router.push(href);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-slate-200 border-t-blue-600 shadow-xl mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-20 w-20 border-4 border-transparent border-r-indigo-400 animate-pulse"></div>
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Loading CRM</h3>
          <div className="w-48 h-2 bg-slate-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[9998] md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
        {/* Enhanced Navbar */}
        <nav className={`sticky top-0 z-[9999] transition-all duration-300 ${scrolled
            ? 'bg-white shadow-xl shadow-slate-200/40 border-b border-slate-200/60'
            : 'bg-white shadow-lg shadow-slate-200/20 border-b border-slate-200/40'
          }`}>
          <div className="mx-auto max-w-7xl px-4 lg:px-6">
            <div className="flex justify-between h-16">
              {/* Left: Enhanced Brand */}
              <div className="flex items-center">
                <div
                  className="flex-shrink-0 flex items-center cursor-pointer group"
                  onClick={() => handleNavigation('/crm')}
                >
                  <div className="relative h-10 w-10 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                    <span className="drop-shadow-sm">CRM</span>
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <h1 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors duration-200">
                      CRM Suite
                    </h1>
                    <p className="text-xs text-slate-500 -mt-1">Manage & Connect</p>
                  </div>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden lg:ml-8 lg:flex lg:space-x-1">
                  {navItems.map((item) => {
                    const active = pathname === item.href;
                    return (
                      <button
                        key={item.name}
                        onClick={() => handleNavigation(item.href)}
                        className={`relative px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center transition-all duration-300 group ${active
                            ? `bg-gradient-to-r ${item.color} text-white shadow-lg transform scale-105`
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800 hover:shadow-md hover:scale-105'
                          }`}
                      >
                        <span className="mr-2.5 text-base group-hover:scale-110 transition-transform duration-200">
                          {item.icon}
                        </span>
                        <span className="hidden xl:inline">{item.name}</span>
                        <span className="xl:hidden">{item.name.split(' ')[0]}</span>
                        {active && (
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow-lg"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: Enhanced Profile */}
              <div className="flex items-center space-x-3">
                {/* Desktop Profile Section */}
                <div className="hidden md:flex items-center space-x-3">
                  <div className="flex items-center space-x-3 bg-slate-50 rounded-xl px-4 py-2 border border-slate-200 shadow-sm">
                    {userInfo?.imgUrl ? (
                      <img
                        src={userInfo.imgUrl}
                        alt="Profile"
                        className="h-8 w-8 rounded-lg object-cover ring-2 ring-blue-200 shadow-sm"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {userInfo?.firstName?.[0] || user?.email?.[0] || '?'}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800 leading-tight">
                        {userInfo?.firstName || user?.displayName || 'User'}
                      </span>
                      <span className="text-xs text-slate-500 leading-tight">
                        {userInfo?.isPremium ? '👑 Premium' : '⚡ Basic Plan'}
                      </span>
                    </div>
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
                    className="px-4 py-2 text-sm font-semibold text-red-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 rounded-xl transition-all duration-200 hover:shadow-lg border border-red-200 hover:border-transparent"
                  >
                    <span className="hidden lg:inline">Logout</span>
                    <span className="lg:hidden">🚪</span>
                  </button>
                </div>

                {/* Mobile Menu Toggle */}
                <div className="flex md:hidden">
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-3 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all duration-200 border border-slate-200 touch-manipulation"
                    aria-label="Toggle mobile menu"
                  >
                    <div className="relative w-6 h-6 flex flex-col justify-center items-center">
                      <span className={`block h-0.5 w-6 bg-current transform transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-0.5' : '-translate-y-1'}`}></span>
                      <span className={`block h-0.5 w-6 bg-current transform transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                      <span className={`block h-0.5 w-6 bg-current transform transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-0.5' : 'translate-y-1'}`}></span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Enhanced Mobile Menu */}
        <div className={`fixed top-16 left-0 right-0 bg-white shadow-2xl border-b border-slate-200 z-[9999] md:hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'translate-y-0 opacity-100 visible' : '-translate-y-full opacity-0 invisible'
          }`}>
          <div className="max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="py-4 space-y-2 px-4">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href)}
                    className={`flex items-center w-full text-left px-4 py-4 text-sm font-semibold rounded-xl transition-all duration-300 touch-manipulation ${active
                        ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800 hover:shadow-md'
                      }`}
                  >
                    <span className="mr-4 text-lg">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </button>
                );
              })}

              {!isStandalone && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push('/install-app');
                  }}
                  className="flex items-center w-full text-left px-4 py-4 text-sm font-semibold rounded-xl text-blue-600 hover:bg-blue-50 transition-all duration-300 touch-manipulation"
                >
                  <span className="mr-4 text-lg">📱</span>
                  <span className="font-medium">Install App</span>
                </button>
              )}

              <div className="border-t border-slate-200 mt-4 pt-4">
                <div className="flex items-center px-4 space-x-3 mb-4 py-2">
                  {userInfo?.imgUrl ? (
                    <img
                      src={userInfo.imgUrl}
                      alt="Profile"
                      className="h-12 w-12 rounded-xl object-cover ring-2 ring-blue-200 shadow-md"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg">
                      {userInfo?.firstName?.[0] || user?.email?.[0] || '?'}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800">
                      {userInfo?.firstName || user?.displayName || 'User'}
                    </span>
                    <span className="text-xs text-slate-500">
                      {userInfo?.email || user?.email}
                    </span>
                    <span className="text-xs text-blue-600 font-medium">
                      {userInfo?.isPremium ? '👑 Premium Member' : '⚡ Basic Plan'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center w-full text-left px-4 py-4 text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all duration-300 border border-red-200 hover:border-red-300 touch-manipulation"
                >
                  <span className="mr-4 text-lg">🚪</span>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 relative">
          <div className="mx-auto">
            {children}
          </div>
        </main>
      </div>
    </>
  );
};

export default CrmNavbar;
