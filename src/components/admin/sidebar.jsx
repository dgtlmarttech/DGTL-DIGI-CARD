'use client';
import { LayoutDashboard, Megaphone, Users, Mail, Link2, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

// Define the navigation items in a single array
const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/ad-control', icon: Megaphone, label: 'Ad Control' },
  { href: '/admin/user-info', icon: Users, label: 'User Info' },
  { href: '/admin/mailer', icon: Mail, label: 'Mailer Page' },
  { href: '/admin/affiliate/approval', icon: Link2, label: 'Affiliate Approval' },
  { href: '/admin/affiliate', icon: Link2, label: 'Affiliate List' },
  { href: '/admin/affiliate/payment', icon: Link2, label: 'Affiliate Payment' },
];

const Sidebar = ({ onLogout }) => {
  const router = useRouter();
  const pathname = usePathname(); // Get the current URL path

  // Helper function to check if a link is active
  const isActive = (href) => {
    // If the href is the root of an affiliate section, check for a partial match
    if (href === '/admin/affiliate') {
      return pathname.startsWith(href);
    }
    // Otherwise, check for an exact match
    return pathname === href;
  };

  return (
    <aside className="w-64 bg-gray-800 text-white h-screen shadow-lg flex flex-col p-4 fixed left-0 top-0">
      <h2 className="text-2xl font-bold mb-6 text-center">Admin Panel</h2>
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon; // Get the icon component from the nav item
          return (
            <button
              key={item.href}
              className={`flex items-center w-full px-4 py-2 rounded-lg transition-colors duration-200 
                ${isActive(item.href) ? 'bg-gray-700 text-white' : 'hover:bg-gray-700 hover:text-white'}`}
              onClick={() => router.push(item.href)}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <button
        className="mt-4 flex items-center w-full px-4 py-2 rounded-lg text-red-400 font-semibold transition-colors duration-200 hover:bg-red-600 hover:text-white"
        onClick={onLogout}
      >
        <LogOut className="w-5 h-5 mr-3" />
        Logout
      </button>
    </aside>
  );
};

export default Sidebar;