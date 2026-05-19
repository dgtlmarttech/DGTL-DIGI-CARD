'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Megaphone, 
  Users, 
  Mail, 
  Link2, 
  ArrowRight,
  TrendingUp,
  Activity,
  BarChart3,
  DollarSign,
  Loader2
} from 'lucide-react';
import { db } from '../../../../firebase/firebase';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';

// Helper to format date relatively
const getRelativeTime = (date) => {
  if (!date) return 'N/A';
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  if (diffInMs < 0) return 'Just now';
  
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  if (diffInMins < 1) return 'Just now';
  if (diffInMins < 60) return `${diffInMins} min${diffInMins > 1 ? 's' : ''} ago`;
  
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

// Safe date parsing helper
const parseDate = (val) => {
  if (!val) return new Date(0);
  if (val.toDate && typeof val.toDate === 'function') return val.toDate();
  if (val.seconds) return new Date(val.seconds * 1000);
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? new Date(0) : parsed;
};

const Home = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: '₹0',
    activeUsers: '0',
    premiumUsers: '0',
    activeAffiliates: '0',
    totalEmailsSent: '0',
    activeAds: 'Manual Banner'
  });
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const today = new Date();

        // 1. Fetch Users
        const usersSnap = await getDocs(collection(db, 'users'));
        const totalUsers = usersSnap.size;
        
        let premiumCount = 0;
        let paidPremiumCount = 0;
        const fetchedUsers = [];
        
        usersSnap.forEach(doc => {
          const u = doc.data();
          const isPremium = u.isPremium === true || u.isPremium === 'true';
          const isBlocked = u.blocked === true || u.blocked === 'true';
          const hasExpired = u.expireDate && new Date(u.expireDate) <= today;

          // Match the exact premium filter rule from UserInfo.jsx:
          // user.isPremium && !user.blocked && (!user.expireDate || new Date(user.expireDate) > today)
          if (isPremium && !isBlocked && !hasExpired) {
            premiumCount++;
            if (u.paymentData) {
              paidPremiumCount++;
            }
          }

          fetchedUsers.push({
            id: doc.id,
            ...u,
            parsedDate: parseDate(u.createdAt)
          });
        });

        // 2. Fetch Affiliates
        const affiliatesSnap = await getDocs(collection(db, 'affiliates'));
        const totalAffiliates = affiliatesSnap.size;
        
        const fetchedAffiliates = [];
        affiliatesSnap.forEach(doc => {
          const aff = doc.data();
          fetchedAffiliates.push({
            id: doc.id,
            ...aff,
            parsedDate: parseDate(aff.createdAt)
          });
        });

        // 3. Fetch Email Logs safely
        const fetchedEmailLogs = [];
        let totalEmailsSent = 0;
        try {
          const emailLogsSnap = await getDocs(collection(db, 'emailLogs'));
          totalEmailsSent = emailLogsSnap.size;
          emailLogsSnap.forEach(doc => {
            const log = doc.data();
            fetchedEmailLogs.push({
              id: doc.id,
              ...log,
              parsedDate: parseDate(log.timestamp)
            });
          });
        } catch (err) {
          console.warn('Error loading emailLogs:', err);
        }

        // 4. Fetch Ad Settings safely
        let activeAdsValue = 'Manual Banner';
        try {
          const settingsSnap = await getDocs(collection(db, 'settings'));
          settingsSnap.forEach(doc => {
            if (doc.id === 'adBannerSettings') {
              const data = doc.data();
              activeAdsValue = data.type === 'google' ? 'Google AdSense' : 'Manual Banner';
            }
          });
        } catch (err) {
          console.warn('Error loading settings:', err);
        }

        // Set Live Stats
        setStats({
          totalRevenue: `₹${(paidPremiumCount * 99).toLocaleString()}`,
          activeUsers: totalUsers.toLocaleString(),
          premiumUsers: premiumCount.toLocaleString(),
          activeAffiliates: totalAffiliates.toLocaleString(),
          totalEmailsSent: totalEmailsSent.toLocaleString(),
          activeAds: activeAdsValue
        });

        // 5. Combine and Sort Activities
        const activities = [];

        // Add user signups to activities
        fetchedUsers.forEach(u => {
          if (u.createdAt) {
            activities.push({
              id: `user-${u.id}`,
              type: 'user',
              title: 'New user registration',
              description: `${u.firstName || 'A new user'} ${u.lastName || ''} (${u.email || u.mobile || 'No Email'}) joined the platform`,
              date: u.parsedDate,
              icon: Users,
              bgColor: 'bg-blue-50',
              iconColor: 'text-blue-600'
            });
          }
        });

        // Add affiliate signups to activities
        fetchedAffiliates.forEach(aff => {
          if (aff.createdAt) {
            activities.push({
              id: `aff-${aff.id}`,
              type: 'affiliate',
              title: 'New affiliate registered',
              description: `${aff.full_name || 'An affiliate'} registered (Code: ${aff.referralCode || 'Pending'})`,
              date: aff.parsedDate,
              icon: Link2,
              bgColor: 'bg-amber-50',
              iconColor: 'text-amber-600'
            });
          }
        });

        // Add email logs to activities
        fetchedEmailLogs.forEach(log => {
          activities.push({
            id: `email-${log.id}`,
            type: 'email',
            title: log.subject ? `Email sent: ${log.subject}` : 'Email campaign sent',
            description: `Delivered to ${log.userName || log.to || 'user'} (${log.to})`,
            date: log.parsedDate,
            icon: Mail,
            bgColor: 'bg-purple-50',
            iconColor: 'text-purple-600'
          });
        });

        // Sort combined list descending
        activities.sort((a, b) => b.date.getTime() - a.date.getTime());

        // Keep top 6 items
        setRecentActivities(activities.slice(0, 6));

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const handleCardClick = (href) => {
    router.push(href);
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'view-users':
        router.push('/admin/user-info');
        break;
      case 'send-email':
        router.push('/admin/mailer');
        break;
      case 'manage-ads':
        router.push('/admin/ad-control');
        break;
      case 'affiliate-stats':
        router.push('/admin/affiliate');
        break;
      default:
        break;
    }
  };

  // Dynamic config for cards
  const featureCards = [
    {
      id: 'banner-ad',
      href: '/admin/ad-control',
      icon: Megaphone,
      title: 'Banner Ad Control',
      description: 'Control banner ads with two options: manually upload an image and link or use Google AdSense for automated advertising.',
      stats: { label: 'Active Ads', value: stats.activeAds },
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      hoverColor: 'hover:border-blue-300'
    },
    {
      id: 'user-management',
      href: '/admin/user-info',
      icon: Users,
      title: 'User Management',
      description: 'Comprehensive user management with four categories: Standard-tier, Premium, Expired Premium, and Blocked users.',
      stats: { label: 'Total Users', value: stats.activeUsers },
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
      hoverColor: 'hover:border-green-300'
    },
    {
      id: 'email-center',
      href: '/admin/mailer',
      icon: Mail,
      title: 'Email Center',
      description: 'Advanced email management system with customizable templates, automated campaigns, and detailed analytics.',
      stats: { label: 'Emails Sent', value: stats.totalEmailsSent },
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200',
      hoverColor: 'hover:border-purple-300'
    },
    {
      id: 'affiliate-program',
      href: '/admin/affiliate',
      icon: Link2,
      title: 'Affiliate Program',
      description: 'Complete affiliate management with performance tracking, commission calculations, and automated payments.',
      stats: { label: 'Active Affiliates', value: stats.activeAffAffiliates || stats.activeAffiliates },
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      borderColor: 'border-amber-200',
      hoverColor: 'hover:border-amber-300'
    }
  ];

  const quickStats = [
    {
      title: 'Total Revenue',
      value: stats.totalRevenue,
      change: 'Calculated live',
      icon: DollarSign,
      trend: 'up'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      change: 'Registered in system',
      icon: Users,
      trend: 'up'
    },
    {
      title: 'Premium Users',
      value: stats.premiumUsers,
      change: 'Paid subscription',
      icon: TrendingUp,
      trend: 'up'
    },
    {
      title: 'Affiliates',
      value: stats.activeAffiliates,
      change: 'Partners onboard',
      icon: Link2,
      trend: 'up'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
            Admin Dashboard Overview
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Manage your website efficiently with these powerful administration tools and real-time insights
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {loading ? (
                        <span className="inline-block w-16 h-6 bg-slate-100 rounded animate-pulse"></span>
                      ) : (
                        stat.value
                      )}
                    </p>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      {stat.change}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {featureCards.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                className={`
                  group relative bg-white rounded-3xl p-8 shadow-lg border-2 
                  ${feature.borderColor} ${feature.hoverColor} 
                  hover:shadow-2xl transition-all duration-300 cursor-pointer
                  transform hover:-translate-y-1
                `}
                onClick={() => handleCardClick(feature.href)}
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-5 rounded-3xl`}></div>
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center`}>
                      <Icon className={`w-8 h-8 ${feature.iconColor}`} />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-600">{feature.stats.label}</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {loading ? (
                          <span className="inline-block w-12 h-6 bg-slate-100 rounded animate-pulse"></span>
                        ) : (
                          feature.stats.value
                        )}
                      </p>
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-slate-900 mb-3">
                    {feature.title}
                  </h2>
                  
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    {feature.description}
                  </p>

                  <div className="flex items-center text-slate-700 group-hover:text-blue-600 transition-colors duration-200">
                    <span className="font-medium">Manage Now</span>
                    <ArrowRight className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-200">
          <h3 className="text-2xl font-bold text-slate-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => handleQuickAction('view-users')}
              className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-200 text-left group"
            >
              <Users className="w-6 h-6 text-blue-600 mb-2" />
              <p className="font-semibold text-slate-900">View All Users</p>
              <p className="text-sm text-slate-600">User management</p>
            </button>

            <button
              onClick={() => handleQuickAction('send-email')}
              className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all duration-200 text-left group"
            >
              <Mail className="w-6 h-6 text-purple-600 mb-2" />
              <p className="font-semibold text-slate-900">Send Email</p>
              <p className="text-sm text-slate-600">Email campaigns</p>
            </button>

            <button
              onClick={() => handleQuickAction('manage-ads')}
              className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all duration-200 text-left group"
            >
              <Megaphone className="w-6 h-6 text-green-600 mb-2" />
              <p className="font-semibold text-slate-900">Manage Ads</p>
              <p className="text-sm text-slate-600">Advertisement control</p>
            </button>

            <button
              onClick={() => handleQuickAction('affiliate-stats')}
              className="p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl hover:from-amber-100 hover:to-amber-200 transition-all duration-200 text-left group"
            >
              <Link2 className="w-6 h-6 text-amber-600 mb-2" />
              <p className="font-semibold text-slate-900">Affiliate Stats</p>
              <p className="text-sm text-slate-600">Performance tracking</p>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-200">
          <h3 className="text-2xl font-bold text-slate-900 mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                <p className="text-sm font-medium">Loading recent activities...</p>
              </div>
            ) : recentActivities.length > 0 ? (
              recentActivities.map((act) => {
                const Icon = act.icon;
                return (
                  <div key={act.id} className={`flex items-center p-4 ${act.bgColor} rounded-xl border border-transparent hover:border-slate-100 transition-all duration-200`}>
                    <div className={`w-10 h-10 ${act.bgColor} border border-slate-200/50 rounded-full flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${act.iconColor}`} />
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{act.title}</p>
                      <p className="text-sm text-slate-600 break-words mt-0.5">{act.description}</p>
                    </div>
                    <span className="text-xs text-slate-500 ml-4 flex-shrink-0">
                      {getRelativeTime(act.date)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-slate-500">
                <p className="text-sm font-medium">No recent activities found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
