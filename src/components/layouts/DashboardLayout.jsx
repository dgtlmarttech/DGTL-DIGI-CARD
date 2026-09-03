// components/layouts/DashboardLayout.jsx
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '../../context/userContext';
import { auth } from '../../firebase/firebase';
import { toast } from 'react-toastify';
import { 
  Home, 
  User, 
  Palette, 
  Link as LinkIcon, 
  Crown, 
  Eye, 
  BarChart2, 
  DollarSign, 
  Smartphone, 
  MoreVertical, 
  Bell, 
  Menu, 
  HeadphonesIcon,
  ChevronLeft
} from 'lucide-react';
import { useTaskReminder } from '../../hooks/useTaskReminder';

const DashboardLayout = ({ children, pageTitle }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userInfo, isAuthenticated, loading, isStandalone } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const { pendingTasks, hasPendingReminder, dismiss } = useTaskReminder(user);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [loading, isAuthenticated, router]);

  // Enforce Paywall: Redirect to payment if no active plan
  // Exception: /dashboard/refer-and-earn is always accessible regardless of subscription status
  useEffect(() => {
    const isAllowedWithoutAccess =
      pathname?.startsWith('/payment') ||
      pathname?.startsWith('/dashboard/refer-and-earn');
    if (!loading && isAuthenticated && userInfo !== undefined && pathname && !isAllowedWithoutAccess) {
      if (userInfo === null || !userInfo?.hasAccess) {
        router.push('/payment');
      }
    }
  }, [loading, isAuthenticated, userInfo, pathname, router]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/signin');
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: <Home className="w-[18px] h-[18px]" /> },
    { name: 'Card Styles', href: '/dashboard/appearance', icon: <Palette className="w-[18px] h-[18px]" /> },
    { name: 'Vanity URL', href: '/dashboard/vanity-url', icon: <LinkIcon className="w-[18px] h-[18px]" /> },
    {
      name: userInfo?.hasAccess ? 'Manage Subscription' : 'Upgrade',
      href: '/payment',
      icon: <Crown className="w-[18px] h-[18px]" />,
    },
    { name: 'View Card', href: '/dashboard/view-card', icon: <Eye className="w-[18px] h-[18px]" /> },
    { name: 'CRM', href: '/crm', icon: <BarChart2 className="w-[18px] h-[18px]" /> },
    { name: 'Refer & Earn', href: '/dashboard/refer-and-earn', icon: <DollarSign className="w-[18px] h-[18px]" /> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F9FC]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-indigo-600 shadow-lg"></div>
        </div>
      </div>
    );
  }

  // Determine page title for top header
  const activeNavItem = navItems.find(item => item.href === pathname);
  const currentTitle = pageTitle || activeNavItem?.name || 'Dashboard';

  return (
    <div className="flex h-screen bg-[#F8F9FC] overflow-hidden">
      
      {/* Desktop Sidebar */}
      <aside 
        className={`transition-all duration-300 bg-white border-r border-slate-200/60 z-40 hidden md:flex flex-col shadow-sm ${
          sidebarCollapsed ? 'w-20' : 'w-[260px]'
        }`}
      >
        {/* Brand */}
        <div className="h-[72px] flex items-center justify-between px-5 border-b border-slate-100 flex-shrink-0">
          <div 
            className={`flex items-center cursor-pointer group overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'w-10' : 'w-full'}`}
            onClick={() => router.push('/dashboard')}
          >
            <div className="flex-shrink-0 h-9 w-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              D
            </div>
            {!sidebarCollapsed && (
              <span className="ml-3 font-bold text-[19px] text-slate-900 whitespace-nowrap">
                DigiCard
              </span>
            )}
          </div>
        </div>
        
        {/* Nav Items */}
        <div className="flex-1 overflow-y-auto py-6 space-y-1.5 px-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <button
                key={item.name}
                onClick={() => {
                  const isAllowed =
                    item.href.startsWith('/payment') ||
                    item.href.startsWith('/dashboard/refer-and-earn');
                  if (!userInfo?.hasAccess && !isAllowed) {
                    toast.error('Please subscribe to a plan to access this feature.');
                    return;
                  }
                  router.push(item.href);
                }}
                className={`w-full flex items-center py-2.5 px-3 rounded-lg transition-all duration-200 group relative ${
                  active
                    ? 'bg-indigo-50/60 text-indigo-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
                title={sidebarCollapsed ? item.name : ''}
              >
                {active && !sidebarCollapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-md"></div>
                )}
                <span className={`flex-shrink-0 flex items-center justify-center ${sidebarCollapsed ? 'mx-auto' : 'ml-2 mr-3'} ${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                  {item.icon}
                </span>
                
                {!sidebarCollapsed && (
                  <span className={`text-[15px] ${active ? 'font-medium' : 'font-normal'} whitespace-nowrap overflow-hidden text-ellipsis`}>
                    {item.name}
                  </span>
                )}
              </button>
            );
          })}

          {/* App Download Link */}
          {!isStandalone && (
             <button
               onClick={() => window.open('https://play.google.com/store/apps/details?id=com.dgtldigicard.app', '_blank')}
               className={`w-full flex items-center py-2.5 px-3 rounded-lg transition-all duration-200 group relative text-slate-500 hover:bg-slate-50 hover:text-slate-800 mt-1`}
               title={sidebarCollapsed ? 'Get our App' : ''}
             >
               <span className={`flex-shrink-0 flex items-center justify-center ${sidebarCollapsed ? 'mx-auto' : 'ml-2 mr-3'} text-slate-400 group-hover:text-slate-600`}>
                 <Smartphone className="w-[18px] h-[18px]" />
               </span>
               {!sidebarCollapsed && (
                 <span className="text-[15px] font-normal whitespace-nowrap overflow-hidden text-ellipsis">
                   Get our App
                 </span>
               )}
             </button>
          )}

          {/* Need Help Box */}
          {!sidebarCollapsed && (
            <div className="pt-6 px-2">
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4">
                <h4 className="text-indigo-950 font-semibold text-sm mb-1">Need Help?</h4>
                <p className="text-slate-500 text-[11px] mb-3 leading-relaxed">Our support team is here to help you.</p>
                <a href="mailto:contact@dgtlmart.com" className="flex items-center justify-center w-full gap-2 py-2 px-3 bg-white border border-indigo-200 text-indigo-700 rounded-xl text-[13px] font-medium hover:bg-indigo-50 transition-colors shadow-sm cursor-pointer">
                  <HeadphonesIcon className="w-[14px] h-[14px]" />
                  Contact Support
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer Profile Box */}
        <div className="p-4 border-t border-slate-100 flex-shrink-0">
          {sidebarCollapsed ? (
             <div className="flex flex-col items-center gap-4">
               <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-600 rounded-lg">
                 <MoreVertical className="w-5 h-5" />
               </button>
             </div>
          ) : (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="flex-shrink-0">
                  {userInfo?.imgUrl ? (
                    <img
                      src={userInfo.imgUrl}
                      alt="Profile"
                      className="h-[38px] w-[38px] rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="h-[38px] w-[38px] rounded-full bg-slate-700 flex items-center justify-center text-white font-medium text-sm">
                      {userInfo?.firstName?.[0] || user?.email?.[0] || 'U'}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col min-w-0 flex-1 overflow-hidden pr-1">
                  <span className="text-[13px] font-semibold text-slate-800 truncate">
                    {userInfo?.firstName || user?.displayName || 'User'}
                  </span>
                  <span className="text-[11px] text-slate-500 truncate">
                    {user?.email}
                  </span>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors flex-shrink-0"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar (Off-canvas) */}
      <aside className={`md:hidden fixed top-0 left-0 h-screen w-[280px] bg-white z-50 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-[72px] flex items-center justify-between px-5 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center">
            <div className="h-9 w-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">D</div>
            <span className="ml-3 font-bold text-[19px] text-slate-900">DigiCard</span>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg">
             <Menu className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 space-y-1.5 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <button
                key={item.name}
                onClick={() => {
                  const isAllowed =
                    item.href.startsWith('/payment') ||
                    item.href.startsWith('/dashboard/refer-and-earn');
                  if (!userInfo?.hasAccess && !isAllowed) {
                    toast.error('Please subscribe to a plan to access this feature.');
                    setMobileMenuOpen(false);
                    return;
                  }
                  router.push(item.href);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center py-3 px-3 rounded-lg transition-all duration-200 relative ${
                  active
                    ? 'bg-indigo-50/60 text-indigo-700'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-md"></div>}
                <span className={`ml-2 mr-3 flex-shrink-0 ${active ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
                <span className={`text-[15px] ${active ? 'font-medium' : 'font-normal'}`}>
                  {item.name}
                </span>
              </button>
            );
          })}

          {!isStandalone && (
            <button
               onClick={() => { window.open('https://play.google.com/store/apps/details?id=com.dgtldigicard.app', '_blank'); setMobileMenuOpen(false); }}
               className={`w-full flex items-center py-3 px-3 rounded-lg transition-all duration-200 relative text-slate-500 hover:bg-slate-50 mt-1`}
             >
               <span className={`ml-2 mr-3 flex-shrink-0 text-slate-400`}>
                 <Smartphone className="w-[18px] h-[18px]" />
               </span>
               <span className="text-[15px] font-normal">
                 Get our App
               </span>
             </button>
          )}

          <div className="pt-6 px-1">
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4">
                <h4 className="text-indigo-950 font-semibold text-sm mb-1">Need Help?</h4>
                <p className="text-slate-500 text-[11px] mb-3 leading-relaxed">Our support team is here to help you.</p>
                <a href="mailto:contact@dgtlmart.com" className="flex items-center justify-center w-full gap-2 py-2 px-3 bg-white border border-indigo-200 text-indigo-700 rounded-xl text-[13px] font-medium hover:bg-indigo-50 transition-colors shadow-sm cursor-pointer">
                  <HeadphonesIcon className="w-[14px] h-[14px]" />
                  Contact Support
                </a>
              </div>
            </div>
        </div>

        <div className="p-4 border-t border-slate-100">
           <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center space-x-3 overflow-hidden">
                {userInfo?.imgUrl ? (
                  <img src={userInfo.imgUrl} alt="Profile" className="h-[38px] w-[38px] rounded-full object-cover border border-slate-200" />
                ) : (
                  <div className="h-[38px] w-[38px] rounded-full bg-slate-700 flex items-center justify-center text-white font-medium text-sm">
                    {userInfo?.firstName?.[0] || user?.email?.[0] || 'U'}
                  </div>
                )}
                <div className="flex flex-col min-w-0 pr-1">
                  <span className="text-[13px] font-semibold text-slate-800 truncate">{userInfo?.firstName || 'User'}</span>
                  <span className="text-[11px] text-slate-500 truncate">{user?.email}</span>
                </div>
              </div>
              
              <button
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-[72px] bg-[#F8F9FC] border-b border-slate-200/60 flex items-center justify-between px-6 z-20 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (window.innerWidth < 768) {
                  setMobileMenuOpen(true);
                } else {
                  setSidebarCollapsed(!sidebarCollapsed);
                }
              }}
              className="p-1.5 text-slate-500 hover:bg-slate-200/50 rounded-lg transition-colors flex items-center justify-center"
            >
              <Menu className="w-[22px] h-[22px] md:hidden" />
              {sidebarCollapsed ? (
                <Menu className="w-[22px] h-[22px] hidden md:block" />
              ) : (
                <ChevronLeft className="w-[22px] h-[22px] hidden md:block" />
              )}
            </button>
            <h1 className="text-xl font-bold text-slate-900 hidden sm:block">
              {currentTitle}
            </h1>
          </div>
          
          <div className="flex items-center relative">
             <button 
               onClick={() => setIsNotificationOpen(!isNotificationOpen)}
               className="relative p-2 text-slate-500 hover:bg-slate-200/50 rounded-full transition-colors"
             >
               <Bell className="w-[22px] h-[22px]" />
               {pendingTasks?.length > 0 && (
                 <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-bold text-white ring-2 ring-white">
                   {pendingTasks.length}
                 </span>
               )}
             </button>

             {/* Notification Dropdown */}
              {isNotificationOpen && (
                <React.Fragment>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotificationOpen(false)}></div>
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                      <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
                      {pendingTasks?.length > 0 && (
                        <button onClick={dismiss} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Mark all read</button>
                      )}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {pendingTasks?.length > 0 ? (
                      <div className="py-2">
                        {pendingTasks.map(task => {
                          const taskDate = task.createdAt?.toDate ? task.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : (task.date || '');
                          return (
                            <div key={task.id} className="px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 cursor-pointer flex justify-between items-start">
                              <div className="pr-2">
                                <p className="text-sm text-slate-800 font-medium mb-1 line-clamp-1">{task.title}</p>
                                <p className="text-xs text-slate-500">Pending Task</p>
                              </div>
                              {taskDate && <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap pt-0.5">{taskDate}</span>}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="px-4 py-8 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 mb-3 text-slate-400">
                          <Bell className="w-6 h-6" />
                        </div>
                        <p className="text-sm text-slate-500">No new notifications</p>
                      </div>
                    )}
                  </div>
                  {pendingTasks?.length > 0 && (
                    <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50">
                      <button onClick={() => { setIsNotificationOpen(false); router.push('/dashboard/notifications'); }} className="w-full text-center text-xs font-medium text-slate-600 hover:text-slate-900 py-1">
                        View all tasks
                      </button>
                    </div>
                  )}
                  </div>
                </React.Fragment>
              )}
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;