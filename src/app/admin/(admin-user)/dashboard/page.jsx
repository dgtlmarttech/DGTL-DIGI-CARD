'use client';
import React, { useEffect } from 'react';
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
  DollarSign
} from 'lucide-react';

// Import feature data matching sidebar navigation
const featureCards = [
  {
    id: 'banner-ad',
    href: '/admin/ad-control',
    icon: Megaphone,
    title: 'Banner Ad Control',
    description: 'Control banner ads with two options: manually upload an image and link or use Google AdSense for automated advertising.',
    stats: { label: 'Active Ads', value: '12' },
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
    stats: { label: 'Total Users', value: '2,847' },
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
    stats: { label: 'Emails Sent', value: '15,432' },
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
    stats: { label: 'Active Affiliates', value: '186' },
    color: 'from-amber-500 to-amber-600',
    bgColor: 'bg-amber-50',
    iconColor: 'text-amber-600',
    borderColor: 'border-amber-200',
    hoverColor: 'hover:border-amber-300'
  }
];

// Quick stats for dashboard overview
const quickStats = [
  {
    title: 'Total Revenue',
    value: '$45,231',
    change: '+20.1%',
    icon: DollarSign,
    trend: 'up'
  },
  {
    title: 'Active Users',
    value: '2,847',
    change: '+15.3%',
    icon: Activity,
    trend: 'up'
  },
  {
    title: 'Conversions',
    value: '12.5%',
    change: '+2.4%',
    icon: TrendingUp,
    trend: 'up'
  },
  {
    title: 'Performance',
    value: '98.2%',
    change: '+0.8%',
    icon: BarChart3,
    trend: 'up'
  }
];

const Home = () => {
  const router = useRouter();

  useEffect(() => {
    // Add any initialization logic here
    console.log('Admin Dashboard initialized');
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
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                    <p className="text-sm text-green-600 font-medium mt-1">
                      {stat.change} from last month
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
                      <p className="text-2xl font-bold text-slate-900">{feature.stats.value}</p>
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
            <div className="flex items-center p-4 bg-blue-50 rounded-xl">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4 flex-1">
                <p className="font-medium text-slate-900">New user registration</p>
                <p className="text-sm text-slate-600">5 new users joined in the last hour</p>
              </div>
              <span className="text-sm text-slate-500">2 min ago</span>
            </div>

            <div className="flex items-center p-4 bg-green-50 rounded-xl">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-4 flex-1">
                <p className="font-medium text-slate-900">Affiliate payment processed</p>
                <p className="text-sm text-slate-600">$2,450 paid to 12 affiliates</p>
              </div>
              <span className="text-sm text-slate-500">15 min ago</span>
            </div>

            <div className="flex items-center p-4 bg-purple-50 rounded-xl">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-4 flex-1">
                <p className="font-medium text-slate-900">Email campaign sent</p>
                <p className="text-sm text-slate-600">Newsletter delivered to 2,847 subscribers</p>
              </div>
              <span className="text-sm text-slate-500">1 hour ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
