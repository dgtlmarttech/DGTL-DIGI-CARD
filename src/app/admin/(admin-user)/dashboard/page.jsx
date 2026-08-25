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
  Loader2,
  Calendar,
  Filter,
  Info,
  ChevronDown
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
    paidUsers: '0',
    activeAffiliates: '0',
    totalEmailsSent: '0',
    activeAds: 'Manual Banner'
  });
  const [recentActivities, setRecentActivities] = useState([]);

  // Filter States
  const [dateFilter, setDateFilter] = useState('all'); // 'all', '24h', '1m', '1y', 'custom'
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false);
  const [rawData, setRawData] = useState({ users: [], affiliates: [], emailLogs: [], activeAdsValue: 'Manual Banner' });

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        // 1. Fetch Users
        const usersSnap = await getDocs(collection(db, 'users'));
        const fetchedUsers = [];
        
        usersSnap.forEach(doc => {
          const u = doc.data();
          fetchedUsers.push({
            id: doc.id,
            ...u,
            parsedDate: parseDate(u.createdAt),
            planStartDateParsed: parseDate(u.planStartDate || u.createdAt) // For accurate revenue timeline
          });
        });

        // 2. Fetch Affiliates
        const affiliatesSnap = await getDocs(collection(db, 'affiliates'));
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
        try {
          const emailLogsSnap = await getDocs(collection(db, 'emailLogs'));
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
              activeAdsValue = doc.data().type === 'google' ? 'Google AdSense' : 'Manual Banner';
            }
          });
        } catch (err) {
          console.warn('Error loading settings:', err);
        }

        setRawData({
          users: fetchedUsers,
          affiliates: fetchedAffiliates,
          emailLogs: fetchedEmailLogs,
          activeAdsValue
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Filtering Logic Effect
  useEffect(() => {
    if (!rawData.users.length && !rawData.affiliates.length && !rawData.emailLogs.length) return;

    const today = new Date();
    let startDate = new Date(0); // Default to all time
    let endDate = new Date();

    if (dateFilter === '24h') {
      startDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    } else if (dateFilter === '1m') {
      startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (dateFilter === '1y') {
      startDate = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
    } else if (dateFilter === 'custom' && customDateRange.start && customDateRange.end) {
      startDate = new Date(customDateRange.start);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customDateRange.end);
      endDate.setHours(23, 59, 59, 999);
    }

    let activeUsersCount = 0;
    let paidCount = 0;
    let totalRevenueAmount = 0;

    // Process Users
    rawData.users.forEach(u => {
      // User registered in this period
      if (u.parsedDate >= startDate && u.parsedDate <= endDate) {
        activeUsersCount++;
      }

      // Check if user is a paid subscriber and started in this period
      const hasPaidPlan = u.planType === 'monthly' || u.planType === 'yearly';
      const isBlocked = u.blocked === true || u.blocked === 'true';
      const hasExpired = u.expireDate && new Date(u.expireDate) <= today;

      if (hasPaidPlan && !isBlocked && !hasExpired && u.paymentData) {
        if (u.planStartDateParsed >= startDate && u.planStartDateParsed <= endDate) {
          paidCount++;
          totalRevenueAmount += (u.planType === 'yearly' ? 999 : 99);
        }
      }
    });

    // Process Affiliates
    let affiliatesCount = 0;
    rawData.affiliates.forEach(aff => {
      if (aff.parsedDate >= startDate && aff.parsedDate <= endDate) {
        affiliatesCount++;
      }
    });

    // Process Email Logs
    let emailsSentCount = 0;
    rawData.emailLogs.forEach(log => {
      if (log.parsedDate >= startDate && log.parsedDate <= endDate) {
        emailsSentCount++;
      }
    });

    setStats({
      totalRevenue: `₹${totalRevenueAmount.toLocaleString()}`,
      activeUsers: activeUsersCount.toLocaleString(),
      paidUsers: paidCount.toLocaleString(),
      activeAffiliates: affiliatesCount.toLocaleString(),
      totalEmailsSent: emailsSentCount.toLocaleString(),
      activeAds: rawData.activeAdsValue
    });

    // Rebuild Recent Activities timeline based on filter
    const activities = [];
    
    rawData.users.forEach(u => {
      if (u.parsedDate >= startDate && u.parsedDate <= endDate) {
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

    rawData.affiliates.forEach(aff => {
      if (aff.parsedDate >= startDate && aff.parsedDate <= endDate) {
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

    rawData.emailLogs.forEach(log => {
      if (log.parsedDate >= startDate && log.parsedDate <= endDate) {
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
      }
    });

    activities.sort((a, b) => b.date.getTime() - a.date.getTime());
    setRecentActivities(activities.slice(0, 6));

  }, [dateFilter, customDateRange, rawData]);

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
      title: stats.activeAds,
      subtitle: 'Currently running',
      stats: { label: 'Active Ads', value: stats.activeAds },
      bgColor: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      borderColor: 'border-indigo-200',
      buttonText: 'Manage Ads'
    },
    {
      id: 'user-management',
      href: '/admin/user-info',
      icon: Users,
      title: stats.activeUsers,
      subtitle: 'Across all time',
      stats: { label: 'Total Users', value: stats.activeUsers },
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
      buttonText: 'View Users'
    },
    {
      id: 'email-center',
      href: '/admin/mailer',
      icon: Mail,
      title: stats.totalEmailsSent,
      subtitle: 'Total campaigns',
      stats: { label: 'Emails Sent', value: stats.totalEmailsSent },
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200',
      buttonText: 'Manage Emails'
    },
    {
      id: 'affiliate-program',
      href: '/admin/affiliate',
      icon: Link2,
      title: stats.activeAffAffiliates || stats.activeAffiliates,
      subtitle: 'Total affiliates',
      stats: { label: 'Active Affiliates', value: stats.activeAffAffiliates || stats.activeAffiliates },
      bgColor: 'bg-amber-100',
      iconColor: 'text-amber-600',
      borderColor: 'border-amber-200',
      buttonText: 'View Affiliates'
    }
  ];

  const quickStats = [
    {
      title: 'Total Revenue',
      value: stats.totalRevenue,
      change: 'Calculated live',
      icon: DollarSign,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      change: 'Registered in system',
      icon: Users,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      title: 'Paid Subscribers',
      value: stats.paidUsers,
      change: 'Active monthly/yearly',
      icon: TrendingUp,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Affiliates',
      value: stats.activeAffiliates,
      change: 'Partners onboard',
      icon: Link2,
      bgColor: 'bg-amber-100',
      iconColor: 'text-amber-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">
            Dashboard Overview
          </h1>
          <p className="text-base text-slate-500 max-w-2xl">
            Manage your website efficiently with these powerful administration tools and real-time insights
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 px-2">
            <Calendar className="w-5 h-5 text-slate-700" />
            <span className="font-bold text-slate-800">Filter By Date</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 relative">
            {['all', '24h', '1m', '1y'].map((f) => (
              <button
                key={f}
                onClick={() => { setDateFilter(f); setIsCustomRangeOpen(false); }}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${dateFilter === f ? 'bg-indigo-500 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                {f === 'all' && 'All Time'}
                {f === '24h' && 'Last 24 Hours'}
                {f === '1m' && 'Last 1 Month'}
                {f === '1y' && 'Last 1 Year'}
              </button>
            ))}
            
            {/* Custom Range Popover */}
            <div className="relative">
              <button
                onClick={() => setIsCustomRangeOpen(!isCustomRangeOpen)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all ${dateFilter === 'custom' || isCustomRangeOpen ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                <Calendar className="w-4 h-4" />
                Custom Range
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {isCustomRangeOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-5 z-50">
                  <h4 className="text-sm font-bold text-slate-800 mb-4">Select Date Range</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">Start Date</label>
                      <input 
                        type="date" 
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={customDateRange.start}
                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">End Date</label>
                      <input 
                        type="date" 
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={customDateRange.end}
                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                      />
                    </div>
                    <button 
                      onClick={() => { setDateFilter('custom'); setIsCustomRangeOpen(false); }}
                      className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-start gap-4">
                <div className={`w-14 h-14 ${stat.bgColor} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-7 h-7 ${stat.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-sm font-semibold text-slate-500 leading-tight mb-1">{stat.title}</p>
                  <p className="text-2xl font-black text-slate-900 leading-none">
                    {loading ? (
                      <span className="inline-block w-16 h-6 bg-slate-100 rounded animate-pulse"></span>
                    ) : (
                      stat.value
                    )}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <p className="text-xs text-slate-400 font-medium leading-tight">
                      {stat.change}
                    </p>
                    <Info className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {featureCards.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6"
              >
                <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-4 sm:gap-6 w-full">
                  <div className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-8 h-8 ${feature.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-500">{feature.stats.label}</p>
                    <h2 className="text-2xl font-black text-slate-900 mt-0.5 mb-1">
                      {loading && feature.id !== 'banner-ad' ? (
                        <span className="inline-block w-16 h-6 bg-slate-100 rounded animate-pulse"></span>
                      ) : (
                        feature.title
                      )}
                    </h2>
                    <p className="text-sm text-slate-500 font-medium">
                      {feature.subtitle}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => handleCardClick(feature.href)}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold border ${feature.iconColor} ${feature.borderColor} bg-white hover:${feature.bgColor} transition-colors whitespace-nowrap`}
                >
                  {feature.buttonText}
                </button>
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
