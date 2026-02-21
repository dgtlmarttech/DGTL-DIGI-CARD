'use client'
import React, { useState, useEffect } from "react";
import { getAllAffiliates, updateAffiliate } from "../../../../../services/affiliateService";
import { 
  UserCheck, 
  Eye, 
  CheckCircle2, 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard,
  Building,
  Hash,
  User,
  Loader2,
  AlertCircle,
  Clock,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';

const AffiliateApprovalPage = () => {
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState({});
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAffiliates = async () => {
    setLoading(true);
    try {
      const data = await getAllAffiliates();
      setAffiliates(data);
    } catch (error) {
      console.error("Error fetching affiliates:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const handleApprove = async (affiliateId) => {
    setApproving((prev) => ({ ...prev, [affiliateId]: true }));
    try {
      await updateAffiliate(affiliateId, { isVerified: true });
      await fetchAffiliates();
    } catch (error) {
      console.error("Error approving affiliate:", error);
    }
    setApproving((prev) => ({ ...prev, [affiliateId]: false }));
  };

  // Filter for pending (not yet verified) affiliates
  const pendingAffiliates = affiliates.filter((a) => !a.isVerified);

  // Filter by search term
  const filteredAffiliates = pendingAffiliates.filter((affiliate) => {
    const term = searchTerm.toLowerCase();
    return (
      affiliate.full_name?.toLowerCase().includes(term) ||
      affiliate.email?.toLowerCase().includes(term) ||
      affiliate.phone?.toLowerCase().includes(term) ||
      affiliate.referralCode?.toLowerCase().includes(term)
    );
  });

  const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="flex items-start space-x-3 py-3 border-b border-gray-100 last:border-b-0">
      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-blue-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="text-gray-900 mt-1">{value || 'N/A'}</p>
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
            <p className="text-gray-600">Fetching pending approvals...</p>
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
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Affiliate Approval</h1>
                <p className="text-gray-600">Review and approve pending affiliate applications</p>
              </div>
            </div>
            <button
              onClick={fetchAffiliates}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Affiliates</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{affiliates.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{pendingAffiliates.length}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {affiliates.filter(a => a.isVerified).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, email, phone, or referral code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">Pending Only</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {filteredAffiliates.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {pendingAffiliates.length === 0 
                  ? "All caught up!" 
                  : "No matches found"
                }
              </h3>
              <p className="text-gray-600">
                {pendingAffiliates.length === 0 
                  ? "There are no pending affiliate applications to review." 
                  : `No affiliates match your search "${searchTerm}"`
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
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Referral Code
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
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {affiliate.full_name?.charAt(0) || 'A'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {affiliate.full_name || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500">Pending Approval</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Mail className="w-3 h-3" />
                            <span>{affiliate.email}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Phone className="w-3 h-3" />
                            <span>{affiliate.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {affiliate.referralCode}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleApprove(affiliate.id)}
                            disabled={approving[affiliate.id]}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                          >
                            {approving[affiliate.id] ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Approving...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Approve</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setSelectedAffiliate(affiliate)}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </button>
                        </div>
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
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
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
                        {selectedAffiliate.full_name || 'Unknown Affiliate'}
                      </h2>
                      <p className="text-gray-600">Affiliate Application Details</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedAffiliate(null)}
                    className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors duration-200"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-8 space-y-8">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <span>Personal Information</span>
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-0">
                    <InfoRow 
                      icon={User} 
                      label="Full Name" 
                      value={selectedAffiliate.full_name} 
                    />
                    <InfoRow 
                      icon={Mail} 
                      label="Email Address" 
                      value={selectedAffiliate.email} 
                    />
                    <InfoRow 
                      icon={Phone} 
                      label="Phone Number" 
                      value={selectedAffiliate.phone} 
                    />
                    <InfoRow 
                      icon={MapPin} 
                      label="Address" 
                      value={selectedAffiliate.address} 
                    />
                    <InfoRow 
                      icon={Hash} 
                      label="Referral Code" 
                      value={selectedAffiliate.referralCode} 
                    />
                  </div>
                </div>

                {/* Bank Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    <span>Banking Information</span>
                  </h3>
                  <div className="bg-green-50 rounded-lg p-4 space-y-0">
                    <InfoRow 
                      icon={Hash} 
                      label="Account Number" 
                      value={selectedAffiliate.account_number} 
                    />
                    <InfoRow 
                      icon={Building} 
                      label="IFSC Code" 
                      value={selectedAffiliate.ifsc} 
                    />
                    <InfoRow 
                      icon={User} 
                      label="Account Holder Name" 
                      value={selectedAffiliate.account_holder} 
                    />
                    <InfoRow 
                      icon={Building} 
                      label="Bank Name" 
                      value={selectedAffiliate.bank_name} 
                    />
                    <InfoRow 
                      icon={MapPin} 
                      label="Branch Name" 
                      value={selectedAffiliate.branch_name} 
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedAffiliate(null)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleApprove(selectedAffiliate.id);
                      setSelectedAffiliate(null);
                    }}
                    disabled={approving[selectedAffiliate.id]}
                    className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {approving[selectedAffiliate.id] ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Approving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve Affiliate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AffiliateApprovalPage;
