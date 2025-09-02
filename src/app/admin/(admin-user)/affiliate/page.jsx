'use client'
import React, { useState, useEffect } from "react";
import { getAllAffiliates, getReferredUsers, updateAffiliate } from "../../../../services/affiliateService";
import { 
  Users, 
  Eye, 
  Edit3, 
  Save, 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard,
  Building,
  Hash,
  User,
  Loader2,
  Search,
  Crown,
  Link,
  Copy,
  CheckCircle2,
  ExternalLink,
  TrendingUp
} from 'lucide-react';

const AffiliateListPage = () => {
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [referredUsers, setReferredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const fetchAffiliates = async () => {
    setLoading(true);
    try {
      const data = await getAllAffiliates();
      const verifiedAffiliates = data.filter((affiliate) => affiliate.isVerified);
      
      const affiliatesWithCounts = await Promise.all(
        verifiedAffiliates.map(async (affiliate) => {
          const users = await getReferredUsers(affiliate.referralCode);
          return { ...affiliate, referredUserCount: users.length };
        })
      );
      setAffiliates(affiliatesWithCounts);
    } catch (error) {
      console.error("Error fetching affiliates:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const handleViewAffiliate = async (affiliate) => {
    setSelectedAffiliate(affiliate);
    setIsEditing(false);
    setEditFormData(affiliate);
    setLoadingUsers(true);
    
    try {
      const users = await getReferredUsers(affiliate.referralCode);
      setReferredUsers(users);
    } catch (error) {
      console.error("Error fetching referred users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      await updateAffiliate(selectedAffiliate.id, editFormData);
      setSelectedAffiliate(editFormData);
      setAffiliates((prev) =>
        prev.map((aff) =>
          aff.id === selectedAffiliate.id ? { ...aff, ...editFormData } : aff
        )
      );
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating affiliate:", error);
    }
  };

  const filteredAffiliates = affiliates.filter((affiliate) => {
    const term = searchTerm.toLowerCase();
    return (
      affiliate.full_name?.toLowerCase().includes(term) ||
      (affiliate.referralCode && affiliate.referralCode.toLowerCase().includes(term))
    );
  });

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const FormField = ({ label, name, value, type = "text", placeholder, rows }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      {type === 'textarea' ? (
        <textarea
          name={name}
          value={value || ''}
          onChange={handleEditChange}
          rows={rows || 3}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value || ''}
          onChange={handleEditChange}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
      )}
    </div>
  );

  const InfoRow = ({ label, value, icon: Icon, copyable = false }) => (
    <div className="flex items-start space-x-3 py-3 border-b border-gray-100 last:border-b-0">
      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-blue-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <div className="flex items-center space-x-2 mt-1">
          <p className="text-gray-900">{value || 'N/A'}</p>
          {copyable && value && (
            <button
              onClick={() => copyToClipboard(value)}
              className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
              title="Copy to clipboard"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Affiliates</h2>
            <p className="text-gray-600">Fetching verified affiliates and their performance data...</p>
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
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Verified Affiliates</h1>
                <p className="text-gray-600">Manage active affiliate partners and their performance</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">{affiliates.length}</p>
              <p className="text-sm text-gray-500">Active Affiliates</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Affiliates</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{affiliates.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {affiliates.reduce((sum, aff) => sum + (aff.referredUserCount || 0), 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. per Affiliate</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {affiliates.length > 0 
                    ? Math.round(affiliates.reduce((sum, aff) => sum + (aff.referredUserCount || 0), 0) / affiliates.length)
                    : 0
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Top Performer</p>
                <p className="text-lg font-bold text-orange-600 mt-1">
                  {Math.max(...affiliates.map(aff => aff.referredUserCount || 0))} refs
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Crown className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search affiliates by name or referral code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
            />
          </div>
        </div>

        {/* Affiliates Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {filteredAffiliates.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No affiliates found</h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? `No affiliates match your search "${searchTerm}"` 
                  : "No verified affiliates available."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Affiliate Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Referral Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAffiliates.map((affiliate) => (
                    <tr key={affiliate.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-lg">
                              {affiliate.full_name?.charAt(0) || 'A'}
                            </span>
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-gray-900">
                              {affiliate.full_name || 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-500">{affiliate.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {affiliate.referralCode}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="text-2xl font-bold text-green-600">
                            {affiliate.referredUserCount || 0}
                          </span>
                          <span className="text-sm text-gray-500">referrals</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewAffiliate(affiliate)}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Profile</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {selectedAffiliate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {selectedAffiliate.full_name?.charAt(0) || 'A'}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {isEditing ? 'Edit Profile' : selectedAffiliate.full_name}
                      </h2>
                      <p className="text-gray-600">
                        {isEditing ? 'Update affiliate information' : 'Affiliate Details & Performance'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedAffiliate(null);
                      setIsEditing(false);
                    }}
                    className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors duration-200"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-8">
                {isEditing ? (
                  <div className="space-y-8">
                    {/* Personal Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Full Name" name="full_name" value={editFormData.full_name} />
                        <FormField label="Email" name="email" value={editFormData.email} type="email" />
                        <FormField label="Phone" name="phone" value={editFormData.phone} type="tel" />
                        <div className="md:col-span-2">
                          <FormField 
                            label="Address" 
                            name="address" 
                            value={editFormData.address} 
                            type="textarea"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bank Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Banking Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Account Number" name="account_number" value={editFormData.account_number} />
                        <FormField label="IFSC Code" name="ifsc" value={editFormData.ifsc} />
                        <FormField label="Account Holder" name="account_holder" value={editFormData.account_holder} />
                        <FormField label="Bank Name" name="bank_name" value={editFormData.bank_name} />
                        <div className="md:col-span-2">
                          <FormField label="Branch Name" name="branch_name" value={editFormData.branch_name} />
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Performance Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-green-600">{selectedAffiliate.referredUserCount || 0}</p>
                        <p className="text-sm text-gray-600">Total Referrals</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <Hash className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-lg font-bold text-blue-600">{selectedAffiliate.referralCode}</p>
                        <p className="text-sm text-gray-600">Referral Code</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4 text-center">
                        <Link className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <p className="text-sm font-bold text-purple-600">Active</p>
                        <p className="text-sm text-gray-600">Status</p>
                      </div>
                    </div>

                    {/* Referral Link */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">Referral Link</h4>
                        {copySuccess && (
                          <span className="text-green-600 text-sm flex items-center space-x-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Copied!</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 bg-white rounded-lg p-3 border">
                        <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <code className="flex-1 text-sm text-gray-700 break-all">
                          {`https://my.dgtldigicard.com/signup?ref=${selectedAffiliate.referralCode}`}
                        </code>
                        <button
                          onClick={() => copyToClipboard(`https://my.dgtldigicard.com/signup?ref=${selectedAffiliate.referralCode}`)}
                          className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors duration-200"
                        >
                          <Copy className="w-3 h-3" />
                          <span className="text-xs">Copy</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Personal Information */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-0">
                          <InfoRow icon={User} label="Full Name" value={selectedAffiliate.full_name} />
                          <InfoRow icon={Mail} label="Email" value={selectedAffiliate.email} copyable />
                          <InfoRow icon={Phone} label="Phone" value={selectedAffiliate.phone} copyable />
                          <InfoRow icon={MapPin} label="Address" value={selectedAffiliate.address} />
                        </div>
                      </div>

                      {/* Banking Information */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Banking Information</h3>
                        <div className="bg-green-50 rounded-lg p-4 space-y-0">
                          <InfoRow icon={Hash} label="Account Number" value={selectedAffiliate.account_number} copyable />
                          <InfoRow icon={Building} label="IFSC Code" value={selectedAffiliate.ifsc} copyable />
                          <InfoRow icon={User} label="Account Holder" value={selectedAffiliate.account_holder} />
                          <InfoRow icon={Building} label="Bank Name" value={selectedAffiliate.bank_name} />
                          <InfoRow icon={MapPin} label="Branch Name" value={selectedAffiliate.branch_name} />
                        </div>
                      </div>
                    </div>

                    {/* Referred Users */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Referred Users</h3>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          {referredUsers.length} users
                        </span>
                      </div>
                      
                      {loadingUsers ? (
                        <div className="text-center py-8">
                          <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
                          <p className="text-gray-600">Loading referred users...</p>
                        </div>
                      ) : referredUsers.length > 0 ? (
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {referredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {user.firstName} {user.lastName}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                      user.isPremium 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {user.isPremium ? (
                                        <>
                                          <Crown className="w-3 h-3 mr-1" />
                                          Premium
                                        </>
                                      ) : (
                                        'Free'
                                      )}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600">No referred users found for this affiliate.</p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center space-x-2 px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit Profile</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AffiliateListPage;
