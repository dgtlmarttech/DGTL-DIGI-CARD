// components/layouts/DashboardLayout.js
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '../../context/userContext';
import { auth } from '../../firebase/firebase';

const CrmNavbar = ({ children, pageTitle }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userInfo, isAuthenticated, loading } = useUser();
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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
      {/* Enhanced Navbar */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/90 backdrop-blur-xl shadow-xl shadow-slate-200/40 border-b border-slate-200/60' 
          : 'bg-white/80 backdrop-blur-lg shadow-lg shadow-slate-200/20 border-b border-slate-200/40'
      }`}>
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="flex justify-between h-16">
            {/* Left: Enhanced Brand */}
            <div className="flex items-center">
              <div
                className="flex-shrink-0 flex items-center cursor-pointer group"
                onClick={() => router.push('/dashboard')}
              >
                <div className="relative h-11 w-11 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <span className="drop-shadow-sm">CRM</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-2xl animate-pulse group-hover:animate-none"></div>
                </div>
                <div className="ml-3 hidden sm:block">
                  <h1 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors duration-200">
                    CRM Suite
                  </h1>
                  <p className="text-xs text-slate-500 -mt-1">Manage & Connect</p>
                </div>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden lg:ml-10 lg:flex lg:space-x-1">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <button
                      key={item.name}
                      onClick={() => router.push(item.href)}
                      className={`relative px-4 py-2.5 rounded-2xl text-sm font-semibold flex items-center transition-all duration-300 group ${
                        active
                          ? `bg-gradient-to-r ${item.color} text-white shadow-lg transform scale-105`
                          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-800 hover:shadow-md hover:scale-105'
                      }`}
                    >
                      <span className="mr-2.5 text-lg group-hover:scale-110 transition-transform duration-200">
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
              {/* Notification Bell */}
              <button className="relative p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100/70 rounded-xl transition-all duration-200 hover:shadow-md hidden md:flex">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5-5M10 17H5l5-5" />
                </svg>
                <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              </button>

              {/* Profile Section (Desktop) */}
              <div className="hidden md:flex items-center space-x-3">
                <div className="flex items-center space-x-3 bg-gradient-to-r from-slate-50/80 to-white/80 rounded-2xl px-4 py-2.5 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200">
                  {userInfo?.imgUrl ? (
                    <img
                      src={userInfo.imgUrl}
                      alt="Profile"
                      className="h-9 w-9 rounded-xl object-cover ring-2 ring-blue-200/60 shadow-sm"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {userInfo?.firstName?.[0] || user?.email?.[0] || '?'}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800 leading-tight">
                      {userInfo?.firstName || user?.displayName || 'User'}
                    </span>
                    <span className="text-xs text-slate-500 leading-tight">
                      {userInfo?.isPremium ? '👑 Premium' : '🆓 Free Plan'}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="px-4 py-2.5 text-sm font-semibold text-red-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105 border border-red-200/60 hover:border-transparent"
                >
                  <span className="hidden lg:inline">Logout</span>
                  <span className="lg:hidden">🚪</span>
                </button>
              </div>

              {/* Mobile Menu Toggle */}
              <div className="flex md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100/80 hover:text-slate-800 transition-all duration-200 hover:shadow-md border border-slate-200/60"
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

        {/* Enhanced Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
          mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="bg-gradient-to-br from-white/95 to-slate-50/95 backdrop-blur-xl shadow-2xl border-t border-slate-200/60 mx-4 mb-4 rounded-2xl">
            <div className="pt-4 pb-4 space-y-2 px-4">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      router.push(item.href);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center w-full text-left px-4 py-3.5 text-sm font-semibold rounded-2xl transition-all duration-300 ${
                      active
                        ? `bg-gradient-to-r ${item.color} text-white shadow-lg transform scale-102`
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-800 hover:shadow-md hover:scale-102'
                    }`}
                  >
                    <span className="mr-4 text-lg">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </button>
                );
              })}
              
              <div className="border-t border-slate-200/60 mt-4 pt-4">
                <div className="flex items-center px-4 space-x-3 mb-3 py-2">
                  {userInfo?.imgUrl ? (
                    <img
                      src={userInfo.imgUrl}
                      alt="Profile"
                      className="h-12 w-12 rounded-2xl object-cover ring-2 ring-blue-200/60 shadow-md"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg">
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
                      {userInfo?.isPremium ? '👑 Premium Member' : '🆓 Free Plan'}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center w-full text-left px-4 py-3.5 text-sm font-semibold text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:text-red-700 rounded-2xl transition-all duration-300 hover:shadow-md border border-red-200/60 hover:border-red-300/80"
                >
                  <span className="mr-4 text-lg">🚪</span>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content with Enhanced Styling */}
      <main className="flex-1 relative">
        <div className="mx-auto">
          {children}
        </div>
      </main>

      {/* Floating Action Button (Mobile) */}
      <div className="fixed bottom-6 right-6 md:hidden z-40">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="h-14 w-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-2xl hover:shadow-3xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
        >
          <span className="text-xl">⚡</span>
        </button>
      </div>
    </div>
  );
};

export default CrmNavbar;
