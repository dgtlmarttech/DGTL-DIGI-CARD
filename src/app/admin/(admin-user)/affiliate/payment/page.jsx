'use client'
import React, { useState, useEffect } from "react";
import { getAllAffiliates, getReferredUsers, recordAffiliatePayment } from "../../../../../services/affiliateService";
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  Filter, 
  User, 
  Phone, 
  Mail, 
  Building, 
  Hash, 
  MapPin,
  X, 
  Send,
  Loader2,
  TrendingUp,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Calculator,
  Clock,
  FileText
} from 'lucide-react';

const AffiliatePaymentPage = () => {
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [amountToPay, setAmountToPay] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [periodEarnings, setPeriodEarnings] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const calculateOverallEarnings = async (aff) => {
    const referred = await getReferredUsers(aff.referralCode);
    const premiumCount = referred.filter(user => user.isPremium).length;
    return premiumCount * 100;
  };

  const fetchAffiliates = async () => {
    setLoading(true);
    try {
      const data = await getAllAffiliates();
      const affiliatesWithPending = await Promise.all(
        data.map(async (aff) => {
          const overallEarning = await calculateOverallEarnings(aff);
          const amountAlreadyPaid = aff.amountPaid || 0;
          const pending = overallEarning - amountAlreadyPaid;
          return { ...aff, overallEarning, pending };
        })
      );
      const toBePaid = affiliatesWithPending.filter(aff => aff.pending > 0);
      setAffiliates(toBePaid);
    } catch (error) {
      console.error("Error fetching affiliates:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const getEffectiveDate = (expireDateStr) => {
    const effDate = new Date(expireDateStr);
    effDate.setFullYear(effDate.getFullYear() - 1);
    return effDate;
  };

  const applyDateFilter = async (affiliate) => {
    try {
      const referred = await getReferredUsers(affiliate.referralCode);
      const filtered = referred.filter(user => {
        if (!filterStartDate && !filterEndDate) return true;
        const effectiveDate = getEffectiveDate(user.expireDate);
        if (filterStartDate) {
          const sDate = new Date(filterStartDate);
          sDate.setHours(0, 0, 0, 0);
          if (effectiveDate < sDate) return false;
        }
        if (filterEndDate) {
          const eDate = new Date(filterEndDate);
          eDate.setHours(23, 59, 59, 999);
          if (effectiveDate > eDate) return false;
        }
        return true;
      });
      const count = filtered.filter(user => user.isPremium).length;
      const earned = count * 100;
      setPeriodEarnings(earned);
    } catch (error) {
      console.error("Error filtering referred users:", error);
      setPeriodEarnings(null);
    }
  };

  const handlePayClick = async (affiliate) => {
    setSelectedAffiliate(affiliate);
    setAmountToPay("");
    setFilterStartDate("");
    setFilterEndDate("");
    setPeriodEarnings(null);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedAffiliate) return;
    const amount = parseFloat(amountToPay);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }
    const maxAllowed = periodEarnings !== null ? periodEarnings : selectedAffiliate.pending;
    if (amount > maxAllowed) {
      alert(`Amount exceeds the allowed payment of ₹${maxAllowed}.`);
      return;
    }
    setProcessingPayment(true);
    try {
      await recordAffiliatePayment(selectedAffiliate.id, { 
        amountPaid: (selectedAffiliate.amountPaid || 0) + amount 
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setSelectedAffiliate(null);
      setAmountToPay("");
      fetchAffiliates();
    } catch (error) {
      alert("Error processing payment.");
      console.error("Payment error:", error);
    }
    setProcessingPayment(false);
  };

  const formatCurrency = (amount) => `₹${amount.toLocaleString('en-IN')}`;

  const InfoCard = ({ icon: Icon, title, value, color = "blue" }) => (
    <div className={`bg-${color}-50 rounded-lg p-4 border border-${color}-200`}>
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center`}>
          <Icon className={`w-5 h-5 text-${color}-600`} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-xl font-bold text-${color}-600`}>{value}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Payments</h2>
            <p className="text-gray-600">Calculating affiliate earnings and pending payments...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalPending = affiliates.reduce((sum, aff) => sum + aff.pending, 0);
  const totalEarned = affiliates.reduce((sum, aff) => sum + aff.overallEarning, 0);
  const totalPaid = affiliates.reduce((sum, aff) => sum + (aff.amountPaid || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Affiliate Payments</h1>
                <p className="text-gray-600">Process pending payments and manage affiliate earnings</p>
              </div>
            </div>
            {showSuccess && (
              <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
                <span>Payment processed successfully!</span>
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <InfoCard 
            icon={User} 
            title="Affiliates Due" 
            value={affiliates.length} 
            color="blue" 
          />
          <InfoCard 
            icon={TrendingUp} 
            title="Total Earned" 
            value={formatCurrency(totalEarned)} 
            color="purple" 
          />
          <InfoCard 
            icon={CheckCircle2} 
            title="Total Paid" 
            value={formatCurrency(totalPaid)} 
            color="green" 
          />
          <InfoCard 
            icon={Clock} 
            title="Total Pending" 
            value={formatCurrency(totalPending)} 
            color="orange" 
          />
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Pending Payments</h2>
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                {affiliates.length} affiliates
              </span>
            </div>
          </div>

          {affiliates.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">All payments processed!</h3>
              <p className="text-gray-600">There are no pending affiliate payments at this time.</p>
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
                      Earnings Summary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {affiliates.map((affiliate) => (
                    <tr key={affiliate.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-lg">
                              {affiliate.full_name?.charAt(0) || 'A'}
                            </span>
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-gray-900">
                              {affiliate.full_name || 'Unknown'}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center space-x-1">
                                <Mail className="w-3 h-3" />
                                <span>{affiliate.email}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Phone className="w-3 h-3" />
                                <span>{affiliate.phone}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {affiliate.referralCode}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Earned:</span>
                            <span className="font-semibold text-purple-600">
                              {formatCurrency(affiliate.overallEarning)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Already Paid:</span>
                            <span className="font-semibold text-green-600">
                              {formatCurrency(affiliate.amountPaid || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm border-t pt-2">
                            <span className="text-gray-900 font-medium">Pending:</span>
                            <span className="font-bold text-orange-600">
                              {formatCurrency(affiliate.pending)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handlePayClick(affiliate)}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors duration-200"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Process Payment</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payment Modal */}
        {selectedAffiliate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {selectedAffiliate.full_name?.charAt(0) || 'A'}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Process Payment</h2>
                      <p className="text-gray-600">{selectedAffiliate.full_name}</p>
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
                {/* Contact & Bank Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <User className="w-5 h-5 text-blue-600" />
                      <span>Contact Information</span>
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-700">{selectedAffiliate.email}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-700">{selectedAffiliate.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <Building className="w-5 h-5 text-green-600" />
                      <span>Bank Details</span>
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div><strong>Account:</strong> {selectedAffiliate.account_number || 'N/A'}</div>
                      <div><strong>Holder:</strong> {selectedAffiliate.account_holder || 'N/A'}</div>
                      <div><strong>Bank:</strong> {selectedAffiliate.bank_name || 'N/A'}</div>
                      <div><strong>Branch:</strong> {selectedAffiliate.branch_name || 'N/A'}</div>
                      <div><strong>IFSC:</strong> {selectedAffiliate.ifsc || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Earnings Summary */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Calculator className="w-5 h-5 text-purple-600" />
                    <span>Earnings Summary</span>
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {formatCurrency(selectedAffiliate.overallEarning)}
                      </p>
                      <p className="text-sm text-gray-600">Total Earned</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(selectedAffiliate.amountPaid || 0)}
                      </p>
                      <p className="text-sm text-gray-600">Already Paid</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {formatCurrency(selectedAffiliate.pending)}
                      </p>
                      <p className="text-sm text-gray-600">Pending</p>
                    </div>
                  </div>
                </div>

                {/* Date Filter */}
                <div className="bg-amber-50 rounded-lg p-6 border border-amber-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Filter className="w-5 h-5 text-amber-600" />
                    <span>Filter by Date Range (Optional)</span>
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Filter earnings for a specific period to process partial payments
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                      <input
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => applyDateFilter(selectedAffiliate)}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors duration-200"
                      >
                        <Filter className="w-4 h-4" />
                        <span>Apply Filter</span>
                      </button>
                    </div>
                  </div>
                  {periodEarnings !== null && (
                    <div className="mt-4 p-4 bg-white rounded-lg border border-amber-300">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">Filtered Period Earnings:</span>
                        <span className="text-2xl font-bold text-amber-600">
                          {formatCurrency(periodEarnings)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Input */}
                <div className="bg-white border-2 border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Banknote className="w-5 h-5 text-green-600" />
                    <span>Payment Amount</span>
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount to Pay (₹)
                      </label>
                      <input
                        type="number"
                        value={amountToPay}
                        onChange={(e) => setAmountToPay(e.target.value)}
                        placeholder="Enter amount"
                        min="0"
                        max={periodEarnings !== null ? periodEarnings : selectedAffiliate.pending}
                        className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <AlertCircle className="w-4 h-4" />
                      <span>
                        Maximum allowed: {formatCurrency(periodEarnings !== null ? periodEarnings : selectedAffiliate.pending)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedAffiliate(null)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePaymentSubmit}
                    disabled={processingPayment || !amountToPay}
                    className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {processingPayment ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Process Payment</span>
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

export default AffiliatePaymentPage;
