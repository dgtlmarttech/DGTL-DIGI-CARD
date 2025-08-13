'use client'
import React, { useState, useEffect } from "react";
import { getAllAffiliates, getReferredUsers, updateAffiliate } from "../../../../services/affiliateService";
import "./AffiliateListPage.css";

const AffiliateListPage = () => {
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  // For modal view details
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  // For modal, load full referred users details
  const [referredUsers, setReferredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  // Fetch affiliates (only verified ones) and preload referred user count
  const fetchAffiliates = async () => {
    setLoading(true);
    try {
      const data = await getAllAffiliates();
      const verifiedAffiliates = data.filter((affiliate) => affiliate.isVerified);
      // For each affiliate, fetch the number of referred users
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

  // When "View Profile" is clicked, show modal with affiliate details and full referred users list.
  const handleViewAffiliate = async (affiliate) => {
    setSelectedAffiliate(affiliate);
    setIsEditing(false);
    setEditFormData(affiliate);
    try {
      const users = await getReferredUsers(affiliate.referralCode);
      setReferredUsers(users);
    } catch (error) {
      console.error("Error fetching referred users:", error);
    }
  };

  // Handle changes in the edit form inputs
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Save updated affiliate details
  const handleSave = async () => {
    try {
      await updateAffiliate(selectedAffiliate.id, editFormData);
      // Update selected affiliate data and the main affiliates list
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

  // Filter affiliates based on the search term (by full name or referral code)
  const filteredAffiliates = affiliates.filter((affiliate) => {
    const term = searchTerm.toLowerCase();
    return (
      affiliate.full_name.toLowerCase().includes(term) ||
      (affiliate.referralCode && affiliate.referralCode.toLowerCase().includes(term))
    );
  });

  return (
    <div className="verified-affiliate-container">
      <h1 className="verified-affiliate-heading">Verified Affiliate List</h1>
      <div className="search-container">
        <input
          type="text"
          placeholder="Search by name or referral code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>
      {loading ? (
        <p>Loading affiliates...</p>
      ) : filteredAffiliates.length === 0 ? (
        <p>No verified affiliates found.</p>
      ) : (
        <table className="verified-affiliate-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Referral Code</th>
              <th>No. of Users Joined</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAffiliates.map((affiliate) => (
              <tr key={affiliate.id}>
                <td>{affiliate.full_name}</td>
                <td>{affiliate.referralCode}</td>
                <td>{affiliate.referredUserCount || 0}</td>
                <td>
                  <button
                    onClick={() => handleViewAffiliate(affiliate)}
                    className="view-btn"
                  >
                    View Profile
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedAffiliate && (
        <div
          className="affiliate-profile-modal"
          onClick={() => {
            setSelectedAffiliate(null);
            setIsEditing(false);
          }}
        >
          <div className="affiliate-profile-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-modal-btn"
              onClick={() => {
                setSelectedAffiliate(null);
                setIsEditing(false);
              }}
            >
              X
            </button>

            {isEditing ? (
              <>
                <h2>Edit Affiliate Profile</h2>
                <div className="edit-form">
                  <label>
                    Full Name:
                    <input
                      type="text"
                      name="full_name"
                      value={editFormData.full_name}
                      onChange={handleEditChange}
                    />
                  </label>
                  <label>
                    Email:
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleEditChange}
                    />
                  </label>
                  <label>
                    Phone:
                    <input
                      type="tel"
                      name="phone"
                      value={editFormData.phone}
                      onChange={handleEditChange}
                    />
                  </label>
                  <label>
                    Address:
                    <textarea
                      name="address"
                      value={editFormData.address}
                      onChange={handleEditChange}
                    />
                  </label>
                  <label>
                    Account Number:
                    <input
                      type="text"
                      name="account_number"
                      value={editFormData.account_number}
                      onChange={handleEditChange}
                    />
                  </label>
                  <label>
                    IFSC:
                    <input
                      type="text"
                      name="ifsc"
                      value={editFormData.ifsc}
                      onChange={handleEditChange}
                    />
                  </label>
                  <label>
                    Account Holder:
                    <input
                      type="text"
                      name="account_holder"
                      value={editFormData.account_holder}
                      onChange={handleEditChange}
                    />
                  </label>
                  <label>
                    Bank Name:
                    <input
                      type="text"
                      name="bank_name"
                      value={editFormData.bank_name}
                      onChange={handleEditChange}
                    />
                  </label>
                  <label>
                    Branch Name:
                    <input
                      type="text"
                      name="branch_name"
                      value={editFormData.branch_name}
                      onChange={handleEditChange}
                    />
                  </label>
                </div>
                <div className="modal-actions">
                  <button onClick={handleSave} className="save-btn">
                    Save
                  </button>
                  <button onClick={() => setIsEditing(false)} className="cancel-btn">
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2>Affiliate Profile: {selectedAffiliate.full_name}</h2>
                <p>
                  <strong>Referral Code:</strong> {selectedAffiliate.referralCode}
                </p>
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
                  <strong>Bank Details:</strong>
                  <br />
                  Account Number: {selectedAffiliate.account_number}
                  <br />
                  IFSC: {selectedAffiliate.ifsc}
                  <br />
                  Account Holder: {selectedAffiliate.account_holder}
                  <br />
                  Bank Name: {selectedAffiliate.bank_name}
                  <br />
                  Branch Name: {selectedAffiliate.branch_name}
                </p>
                <p>
                  <strong>Total Users Joined:</strong> {selectedAffiliate.referredUserCount || 0}
                </p>
                <hr />
                <p>
                <strong>
                  {`https://my.dgtldigicard.com/signup?ref=${selectedAffiliate.referralCode}`}
                </strong>
                </p>
                <hr />
                <h3 className="success-heading">Referred Users</h3>
                {referredUsers.length > 0 ? (
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Premium</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referredUsers.map((user) => (
                        <tr key={user.id}>
                          <td>{user.firstName} {user.lastName}</td>
                          <td>{user.email}</td>
                          <td>{user.isPremium ? "YES" : "NO"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No referred users found for this affiliate.</p>
                )}
                <div className="modal-actions">
                  <button onClick={() => setIsEditing(true)} className="edit-btn">
                    Edit
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AffiliateListPage;
