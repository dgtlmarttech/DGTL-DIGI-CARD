'use client';
import { 
  LayoutDashboard, 
  Megaphone, 
  Users, 
  Mail, 
  Link2, 
  LogOut,
  ChevronLeft,
  Menu
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

// Define navigation items with enhanced structure
const navItems = [
  { 
    href: '/admin/dashboard', 
    icon: LayoutDashboard, 
    label: 'Dashboard',
    description: 'Overview & analytics'
  },
  { 
    href: '/admin/ad-control', 
    icon: Megaphone, 
    label: 'Ad Control',
    description: 'Manage advertisements'
  },
  { 
    href: '/admin/user-info', 
    icon: Users, 
    label: 'User Management',
    description: 'User profiles & data'
  },
  { 
    href: '/admin/mailer', 
    icon: Mail, 
    label: 'Email Center',
    description: 'Send & manage emails'
  },
];

// Affiliate section as a group
const affiliateItems = [
  { 
    href: '/admin/affiliate/approval', 
    icon: Link2, 
    label: 'Approval Queue',
    description: 'Review applications'
  },
  { 
    href: '/admin/affiliate', 
    icon: Link2, 
    label: 'Affiliate List',
    description: 'Manage partners'
  },
  { 
    href: '/admin/affiliate/payment', 
    icon: Link2, 
    label: 'Payments',
    description: 'Process payouts'
  },
];

const Sidebar = ({ onLogout, isCollapsed, setIsCollapsed }) => {
  const router = useRouter();
  const pathname = usePathname();

  // Enhanced active state checking
  const isActive = (href) => {
    if (href === '/admin/affiliate') {
      return pathname.startsWith(href);
    }
    return pathname === href;
  };

  return (
    <aside className={`
      ${isCollapsed ? 'w-20' : 'w-80'} 
      bg-gradient-to-b from-slate-900 to-slate-800 
      text-white h-full shadow-2xl 
      flex flex-col
      transition-all duration-300 ease-in-out
      border-r border-slate-700/50
      relative z-10
    `}>
      {/* Header */}
      <div className={`${isCollapsed ? 'p-4' : 'p-6'} border-b border-slate-700/50`}>
        <div className="flex items-center justify-between">
          {!isCollapsed ? (
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent truncate">
                Admin Panel
              </h2>
              <p className="text-slate-400 text-sm mt-1 truncate">Management Console</p>
            </div>
          ) : (
            <div className="flex-1 flex justify-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg flex items-center justify-center">
                <Menu className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors duration-200 flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-6 overflow-y-auto">
        {/* Main Navigation */}
        <div>
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">
              Main
            </h3>
          )}
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <div key={item.href} className="relative group">
                  <button
                    className={`
                      relative flex items-center w-full p-3 rounded-xl 
                      transition-all duration-200 
                      ${active 
                        ? 'bg-blue-600/20 text-blue-300 shadow-lg shadow-blue-600/10' 
                        : 'hover:bg-slate-700/50 text-slate-300 hover:text-white'
                      }
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                    onClick={() => router.push(item.href)}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-blue-400' : ''}`} />
                    {!isCollapsed && (
                      <div className="ml-3 text-left flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.label}</div>
                        <div className="text-xs text-slate-400 group-hover:text-slate-300 truncate">
                          {item.description}
                        </div>
                      </div>
                    )}
                    {active && (
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-400 rounded-r-full"></div>
                    )}
                  </button>
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 bg-slate-800 text-white px-3 py-2 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-slate-400">{item.description}</div>
                      <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-full border-4 border-transparent border-r-slate-800"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Affiliate Section */}
        <div>
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">
              Affiliate Program
            </h3>
          )}
          <div className="space-y-2">
            {affiliateItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <div key={item.href} className="relative group">
                  <button
                    className={`
                      relative flex items-center w-full p-3 rounded-xl 
                      transition-all duration-200 
                      ${active 
                        ? 'bg-purple-600/20 text-purple-300 shadow-lg shadow-purple-600/10' 
                        : 'hover:bg-slate-700/50 text-slate-300 hover:text-white'
                      }
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                    onClick={() => router.push(item.href)}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-purple-400' : ''}`} />
                    {!isCollapsed && (
                      <div className="ml-3 text-left flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.label}</div>
                        <div className="text-xs text-slate-400 group-hover:text-slate-300 truncate">
                          {item.description}
                        </div>
                      </div>
                    )}
                    {active && (
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-purple-400 rounded-r-full"></div>
                    )}
                  </button>
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 bg-slate-800 text-white px-3 py-2 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-slate-400">{item.description}</div>
                      <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-full border-4 border-transparent border-r-slate-800"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer Actions */}
      <div className={`${isCollapsed ? 'p-3' : 'p-4'} border-t border-slate-700/50`}>
        <div className="relative group">
          <button
            className={`
              flex items-center w-full p-3 rounded-xl font-medium
              text-red-400 hover:bg-red-600/20 hover:text-red-300 
              transition-all duration-200
              ${isCollapsed ? 'justify-center' : ''}
            `}
            onClick={onLogout}
          >
            <LogOut className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
            {!isCollapsed && <span className="ml-3 text-sm">Logout</span>}
          </button>
          
          {/* Tooltip for collapsed logout */}
          {isCollapsed && (
            <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 bg-slate-800 text-white px-3 py-2 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
              <div className="font-medium text-red-400">Logout</div>
              <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-full border-4 border-transparent border-r-slate-800"></div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
