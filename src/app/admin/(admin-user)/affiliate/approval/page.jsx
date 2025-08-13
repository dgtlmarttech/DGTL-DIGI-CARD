'use client'
import React, { useState, useEffect } from "react";
import { getAllAffiliates, updateAffiliate } from "../../../../../services/affiliateService";
import "./AffiliateApprovalPage.css";

const AffiliateApprovalPage = () => {
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState({});
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);

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

  // Approve the affiliate (set isVerified to true)
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

  return (
    <div className="approval-container">
      <h1 className="approval-heading">Affiliate Approval Page</h1>
      {loading ? (
        <p>Loading affiliates...</p>
      ) : pendingAffiliates.length === 0 ? (
        <p>No pending affiliates for approval.</p>
      ) : (
        <table className="affiliate-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Referral Code</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingAffiliates.map((affiliate) => (
              <tr key={affiliate.id}>
                <td>{affiliate.full_name}</td>
                <td>{affiliate.email}</td>
                <td>{affiliate.phone}</td>
                <td>{affiliate.referralCode}</td>
                <td>
                  <button
                    className="approve-btn"
                    onClick={() => handleApprove(affiliate.id)}
                    disabled={approving[affiliate.id]}
                  >
                    {approving[affiliate.id] ? "Approving..." : "Approve"}
                  </button>
                  <button
                    className="view-btn"
                    onClick={() => setSelectedAffiliate(affiliate)}
                  >
                    View Info
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {selectedAffiliate && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedAffiliate(null)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{selectedAffiliate.name}</h2>
            <p>
              <strong>Email:</strong> {selectedAffiliate.email}
            </p>
            <p>
              <strong>Phone:</strong> {selectedAffiliate.phone}
            </p>
            <p>
              <strong>Address:</strong> {selectedAffiliate.address}
            </p>
            <p>
              <strong>Referral Code:</strong> {selectedAffiliate.referralCode}
            </p>
            <h3 id="bank-details">Bank Details</h3>
            <ul>
              <li>
                <strong>Account Number:</strong> {selectedAffiliate.account_number}
              </li>
              <li>
                <strong>IFSC:</strong> {selectedAffiliate.ifsc}
              </li>
              <li>
                <strong>Account Holder:</strong> {selectedAffiliate.account_holder}
              </li>
              <li>
                <strong>Bank Name:</strong> {selectedAffiliate.bank_name}
              </li>
              <li>
                <strong>Branch Name:</strong> {selectedAffiliate.branch_name}
              </li>
            </ul>
            <button
              className="close-btn"
              onClick={() => setSelectedAffiliate(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AffiliateApprovalPage;
