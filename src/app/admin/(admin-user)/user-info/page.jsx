'use client'
import React, { useState, useEffect } from 'react';
import { blockUser, unblockUser, getAllUsers } from '../../../../services/firebaseAuthService';
import { 
  Users, 
  Crown, 
  Clock, 
  Ban, 
  Search, 
  Shield, 
  CheckCircle2,
  XCircle,
  Calendar,
  Phone,
  Mail,
  User,
  Filter,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  Download
} from 'lucide-react';

const UserInfo = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("normal");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all users using the getAllUsers function from firebaseAuthService
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersData = await getAllUsers();
      // Sort users by createdAt descending (newest first)
      const sortedUsers = usersData.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setUsers(sortedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users by search term
  const filteredBySearch = users.filter((user) => {
    const term = searchTerm.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(term) ||
      user.lastName.toLowerCase().includes(term) ||
      user.mobile.toLowerCase().includes(term)
    );
  });

  const today = new Date();

  // Filter users by selected category
  const categoryUsers = filteredBySearch.filter((user) => {
    if (selectedCategory === "normal") {
      return !user.isPremium && !user.blocked;
    } else if (selectedCategory === "premium") {
      return user.isPremium && !user.blocked && (!user.expireDate || new Date(user.expireDate) > today);
    } else if (selectedCategory === "expired") {
      return user.isPremium && !user.blocked && user.expireDate && new Date(user.expireDate) <= today;
    } else if (selectedCategory === "blocked") {
      return user.blocked;
    }
    return false;
  });

  // Button click handlers to block/unblock user and refresh the list
  const handleBlock = async (userId) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await blockUser(userId);
      await fetchUsers();
    } catch (error) {
      console.error('Error blocking user:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleUnblock = async (userId) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await unblockUser(userId);
      await fetchUsers();
    } catch (error) {
      console.error('Error unblocking user:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Category configuration
  const categories = [
    {
      key: "normal",
      label: "Standard Users",
      icon: Users,
      color: "blue",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-700"
    },
    {
      key: "premium",
      label: "Premium",
      icon: Crown,
      color: "purple",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-700"
    },
    {
      key: "expired",
      label: "Expired",
      icon: Clock,
      color: "amber",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      textColor: "text-amber-700"
    },
    {
      key: "blocked",
      label: "Blocked",
      icon: Ban,
      color: "red",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-700"
    }
  ];

  const currentCategory = categories.find(cat => cat.key === selectedCategory);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const exportToCSV = () => {
    if (users.length === 0) return;

    // Define CSV Headers
    const headers = [
      'Document ID / UID',
      'First Name',
      'Last Name',
      'Email',
      'Mobile',
      'Business Name',
      'Custom URL Path',
      'Status / Plan',
      'Amount Paid',
      'Is Blocked',
      'Creation Date'
    ];

    // Build the CSV content
    const csvRows = [headers.join(',')];

    users.forEach(user => {
      // Determine status string
      let status = 'Standard';
      if (user.blocked) {
        status = 'Blocked';
      } else if (user.isPremium) {
        const isExpired = user.expireDate && new Date(user.expireDate) <= today;
        status = isExpired ? 'Premium (Expired)' : 'Premium (Active)';
      }

      // Determine amount paid: only if premium and has paymentData
      let amountPaid = '₹0';
      if (user.isPremium && user.paymentData) {
        amountPaid = '₹99';
      }

      // Escape quotes and double-quotes in fields to prevent invalid CSV format
      const escape = (val) => {
        if (val === null || val === undefined) return '';
        const stringVal = String(val);
        if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
          return `"${stringVal.replace(/"/g, '""')}"`;
        }
        return stringVal;
      };

      const row = [
        escape(user.id || user.uid),
        escape(user.firstName),
        escape(user.lastName),
        escape(user.email),
        escape(user.mobile),
        escape(user.businessName || ''),
        escape(user.customUID || ''),
        escape(status),
        escape(amountPaid),
        escape(user.blocked ? 'Yes' : 'No'),
        escape(user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A')
      ];

      csvRows.push(row.join(','));
    });

    // Create a data blob and download it
    const csvContent = "\uFEFF" + csvRows.join('\n'); // Add UTF-8 BOM to display special characters correctly in Excel
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `dgtl_digicard_users_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getUserStats = () => {
    const stats = {
      normal: users.filter(user => !user.isPremium && !user.blocked).length,
      premium: users.filter(user => user.isPremium && !user.blocked && (!user.expireDate || new Date(user.expireDate) > today)).length,
      expired: users.filter(user => user.isPremium && !user.blocked && user.expireDate && new Date(user.expireDate) <= today).length,
      blocked: users.filter(user => user.blocked).length
    };
    return stats;
  };

  const stats = getUserStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Users</h2>
            <p className="text-gray-600">Fetching user data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600">Manage and monitor all registered users</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={exportToCSV}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 transform"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 active:scale-95 transform"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {categories.map((category) => (
            <div key={category.key} className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{category.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats[category.key]}</p>
                </div>
                <div className={`w-12 h-12 ${category.bgColor} rounded-lg flex items-center justify-center`}>
                  <category.icon className={`w-6 h-6 ${category.textColor}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Category Selector */}
            <div className="flex items-center space-x-3">
              <Filter className="w-5 h-5 text-gray-500" />
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isActive = selectedCategory === category.key;
                  return (
                    <button
                      key={category.key}
                      onClick={() => setSelectedCategory(category.key)}
                      className={`
                        flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                        ${isActive 
                          ? `bg-${category.color}-600 text-white shadow-md` 
                          : `bg-gray-100 text-gray-700 hover:bg-${category.color}-50 hover:text-${category.color}-700`
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{category.label}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        isActive ? 'bg-white/20' : `bg-${category.color}-100 text-${category.color}-700`
                      }`}>
                        {stats[category.key]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Box */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name or mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full lg:w-80 pl-10 pr-4 py-2 border text-gray-900 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* User List */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <currentCategory.icon className={`w-6 h-6 ${currentCategory.textColor}`} />
            <h2 className="text-2xl font-bold text-gray-900">
              {currentCategory.label} Users ({categoryUsers.length})
            </h2>
          </div>

          {categoryUsers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryUsers.map((user) => (
                <div
                  key={user.id}
                  className={`
                    bg-white border-2 rounded-xl p-6 hover:shadow-lg transition-all duration-300
                    ${currentCategory.borderColor} hover:shadow-${currentCategory.color}-100
                  `}
                >
                  <div className="flex items-start space-x-4">
                    {/* User Avatar */}
                    <div className="relative flex-shrink-0">
                      {(user.imgUrl || user.profilePicture) ? (
                        <img
                          src={user.imgUrl || user.profilePicture}
                          alt={`${user.firstName || ''} ${user.lastName || ''}`}
                          className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const fallback = e.target.nextSibling;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-16 h-16 rounded-full border-2 border-gray-200 flex items-center justify-center font-bold text-white text-lg bg-gradient-to-br ${
                          currentCategory.key === 'premium' ? 'from-purple-500 to-indigo-700' :
                          currentCategory.key === 'expired' ? 'from-amber-500 to-orange-600' :
                          currentCategory.key === 'blocked' ? 'from-red-500 to-rose-700' :
                          'from-blue-500 to-indigo-600'
                        } shadow-sm`}
                        style={{ display: (user.imgUrl || user.profilePicture) ? 'none' : 'flex' }}
                      >
                        {user.firstName || user.lastName ? (
                          ((user.firstName?.charAt(0) || '').toUpperCase() + (user.lastName?.charAt(0) || '').toUpperCase())
                        ) : (
                          <User className="w-6 h-6" />
                        )}
                      </div>
                      {user.isPremium && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                          <Crown className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    {/* User Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {user.firstName} {user.lastName}
                      </h3>
                      
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{user.mobile}</span>
                        </div>
                        
                        {user.email && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{user.email}</span>
                          </div>
                        )}

                        {user.expireDate && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>Expires: {formatDate(user.expireDate)}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="mt-4">
                        {selectedCategory !== "blocked" ? (
                          <button
                            onClick={() => handleBlock(user.id)}
                            disabled={actionLoading[user.id]}
                            className="flex items-center space-x-2 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading[user.id] ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Blocking...</span>
                              </>
                            ) : (
                              <>
                                <Ban className="w-4 h-4" />
                                <span>Block User</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnblock(user.id)}
                            disabled={actionLoading[user.id]}
                            className="flex items-center space-x-2 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading[user.id] ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Unblocking...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Unblock User</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className={`inline-flex items-center justify-center w-16 h-16 ${currentCategory.bgColor} rounded-full mb-4`}>
                <currentCategory.icon className={`w-8 h-8 ${currentCategory.textColor}`} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {currentCategory.label.toLowerCase()} users found
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? `No users match your search "${searchTerm}"` 
                  : `There are currently no ${currentCategory.label.toLowerCase()} users.`
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserInfo;
