'use client'
import React, { useState, useEffect } from "react";
import { getAllAffiliates, getReferredUsers, recordAffiliatePayment } from "../../../../../services/affiliateService";
import "./AffiliatePaymentPage.css";

const AffiliatePaymentPage = () => {
  // State for overall affiliates list (based on all referrals)
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  // State for the affiliate selected for payment processing
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  // For payment modal input (admin-entered payment amount)
  const [amountToPay, setAmountToPay] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  // Date range fields used in the payment modal for filtering referred users
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  // Calculated earnings for the selected affiliate based on the date filter
  const [periodEarnings, setPeriodEarnings] = useState(null);

  // Helper: Compute overall earnings (without date filtering) for an affiliate.
  const calculateOverallEarnings = async (aff) => {
    const referred = await getReferredUsers(aff.referralCode);
    // Count all premium referrals (ignoring expireDate filter)
    const premiumCount = referred.filter(user => user.isPremium).length;
    return premiumCount * 100;
  };

  // Fetch all affiliates and calculate overall pending amounts.
  // Overall: pending = (overall earning) - (amountPaid)
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
      // Only show affiliates that have a pending payment greater than 0
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

  // Helper function to compute the effective premium date.
  // Since expireDate is 1 year ahead of the premium bought date,
  // we subtract one year to get the actual referral date.
  const getEffectiveDate = (expireDateStr) => {
    const effDate = new Date(expireDateStr);
    effDate.setFullYear(effDate.getFullYear() - 1);
    return effDate;
  };

  // In the payment modal, if a date filter is applied,
  // recalc the period earnings using the effective premium date.
  const applyDateFilter = async (affiliate) => {
    try {
      const referred = await getReferredUsers(affiliate.referralCode);
      // Filter referrals by effective premium date (expireDate minus 1 year)
      const filtered = referred.filter(user => {
        if (!filterStartDate && !filterEndDate) return true;
        const effectiveDate = getEffectiveDate(user.expireDate);
        if (filterStartDate) {
          const sDate = new Date(filterStartDate);
          sDate.setHours(0, 0, 0, 0); // Normalize start date to midnight
        
          if (effectiveDate < sDate) return false;
        }
        
        if (filterEndDate) {
          const eDate = new Date(filterEndDate);
          eDate.setHours(23, 59, 59, 999); // Normalize end date to the end of the day
        
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

  // When an affiliate's "Pay" button is clicked, open the payment modal.
  const handlePayClick = async (affiliate) => {
    setSelectedAffiliate(affiliate);
    setAmountToPay("");
    // Reset filter fields and period earnings.
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
    // Determine maximum allowed based on whether a filter is applied.
    const maxAllowed = periodEarnings !== null ? periodEarnings : selectedAffiliate.pending;
    if (amount > maxAllowed) {
      alert(`Amount exceeds the allowed payment of ₹${maxAllowed}.`);
      return;
    }
    setProcessingPayment(true);
    try {
      // Record the payment. Your service should update the affiliate’s paid amount.
      await recordAffiliatePayment(selectedAffiliate.id, { amountPaid: selectedAffiliate.amountPaid + amount });
      alert(`Paid ₹${amount} to ${selectedAffiliate.full_name}`);
      setSelectedAffiliate(null);
      setAmountToPay("");
      // Refresh the list to update pending amounts.
      fetchAffiliates();
    } catch (error) {
      alert("Error processing payment.");
      console.error("Payment error:", error);
    }
    setProcessingPayment(false);
  };

  return (
    <div className="affiliate-payment-container">
      <h1 className="success-heading">Affiliate Payment</h1>
      {loading ? (
        <p>Loading affiliates...</p>
      ) : (
        <table className="affiliates-payment-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Referral Code</th>
              <th>Total Earned (₹)</th>
              <th>Already Paid (₹)</th>
              <th>Pending Payment (₹)</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {affiliates.length > 0 ? (
              affiliates.map((aff) => (
                <tr key={aff.id}>
                  <td>{aff.full_name}</td>
                  <td>{aff.referralCode}</td>
                  <td>{aff.overallEarning}</td>
                  <td>{aff.amountPaid || 0}</td>
                  <td>{aff.pending}</td>
                  <td>
                    <button className="pay-btn" onClick={() => handlePayClick(aff)}>Pay</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No affiliates pending payment.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* Payment Modal */}
      {selectedAffiliate && (
        <div className="payment-modal-overlay">
          <div className="payment-modal-content">
            <h2>Process Payment for {selectedAffiliate.full_name}</h2>
            <p>
              <strong>Contact:</strong> {selectedAffiliate.email} | {selectedAffiliate.phone}
            </p>
            <p>
              <strong>Bank Details:</strong>{" "}
              {selectedAffiliate.bank_name
                ? `${selectedAffiliate.account_holder}, ${selectedAffiliate.account_number}, ${selectedAffiliate.branch_name}`
                : "Not Provided"}
            </p>
            <p>
              <strong>Overall Earned:</strong> ₹{selectedAffiliate.overallEarning} <br />
              <strong>Already Paid:</strong> ₹{selectedAffiliate.amountPaid || 0} <br />
              <strong>Overall Pending:</strong> ₹{selectedAffiliate.pending}
            </p>
            <hr />
            <h3>Filter Earnings by Date</h3>
            <p>(Leave blank to use overall earnings.)</p>
            <div className="filter-section">
              <label>
                Start Date:
                <input 
                  type="date" 
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                />
              </label>
              <label>
                End Date:
                <input 
                  type="date" 
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                />
              </label>
              <button onClick={() => applyDateFilter(selectedAffiliate)} className="filter-btn">
                Apply Filter
              </button>
            </div>
            {periodEarnings !== null && (
              <p>
                <strong>Period Earnings:</strong> ₹{periodEarnings}
              </p>
            )}
            <div className="payment-inputs">
              <label>
                Amount to Pay (₹):
                <input
                  type="number"
                  value={amountToPay}
                  onChange={(e) => setAmountToPay(e.target.value)}
                />
              </label>
            </div>
            <button onClick={handlePaymentSubmit} disabled={processingPayment}>
              {processingPayment ? "Processing..." : "Pay"}
            </button>
            <button onClick={() => setSelectedAffiliate(null)} className="modal-close">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AffiliatePaymentPage;
