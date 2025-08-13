'use client'
import React, { useState, useEffect } from 'react';
import { blockUser, unblockUser, getAllUsers } from '../../../../services/firebaseAuthService';
import './UserInfo.css';

const UserInfo = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("normal");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all users using the getAllUsers function from firebaseAuthService
  const fetchUsers = async () => {
    try {
      const usersData = await getAllUsers();
      setUsers(usersData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
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
    await blockUser(userId);
    fetchUsers();
  };

  const handleUnblock = async (userId) => {
    await unblockUser(userId);
    fetchUsers();
  };

  return (
    <div className="user-info-container">
      <h1>User Info</h1>
      <div className="user-info-controls">
        <div className="category-selector">
          <button 
            className={selectedCategory === "normal" ? "active" : ""}
            onClick={() => setSelectedCategory("normal")}
          >
            Normal Users
          </button>
          <button 
            className={selectedCategory === "premium" ? "active" : ""}
            onClick={() => setSelectedCategory("premium")}
          >
            Premium Users
          </button>
          <button 
            className={selectedCategory === "expired" ? "active" : ""}
            onClick={() => setSelectedCategory("expired")}
          >
            Expired Premium
          </button>
          <button 
            className={selectedCategory === "blocked" ? "active" : ""}
            onClick={() => setSelectedCategory("blocked")}
          >
            Blocked Users
          </button>
        </div>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <section className="user-list">
          <h2>
            {selectedCategory === "normal"
              ? "Normal Users"
              : selectedCategory === "premium"
              ? "Premium Users"
              : selectedCategory === "expired"
              ? "Expired Premium Users"
              : "Blocked Users"}
          </h2>
          {categoryUsers.length ? (
            categoryUsers.map((user) => (
              <div key={user.id} className="user-card">
                <img src={user.imgUrl} alt={user.firstName} className="user-image" />
                <div className="user-details">
                  <p>
                    {user.firstName} {user.lastName}
                  </p>
                  <p>Mobile: {user.mobile}</p>
                  {selectedCategory !== "blocked" ? (
                    <button onClick={() => handleBlock(user.id)} className="block-button">
                      Block
                    </button>
                  ) : (
                    <button onClick={() => handleUnblock(user.id)} className="unblock-button">
                      Unblock
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p>No {selectedCategory} users found.</p>
          )}
        </section>
      )}
    </div>
  );
};

export default UserInfo;
