'use client'
import React, { useState, useEffect } from "react";
import { getAllUsers } from "../../../../services/firebaseAuthService";
import { getEmailTemplates, updateEmailTemplates } from "../../../../services/emailService";
import { sendTemplateEmail } from "../../../../services/TemlateEmail";
import "./Mailer.css";

const MailerPage = () => {
  const [users, setUsers] = useState([]);
  const [templates, setTemplates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingTemplates, setSavingTemplates] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState({
    expiringSoon: false,
    expired: false,
  });

  // Fetch premium users (those with expireDate)
  const fetchUsers = async () => {
    try {
      const allUsers = await getAllUsers();
      // Filter premium users with an expireDate
      const premiumUsers = allUsers.filter((user) => user.isPremium && user.expireDate);
      setUsers(premiumUsers);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setLoading(false);
    }
  };

  // Fetch email templates from Firestore
  const fetchTemplates = async () => {
    try {
      const data = await getEmailTemplates();
      setTemplates(data);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchTemplates();
  }, []);

  const today = new Date();
  const msInDay = 1000 * 60 * 60 * 24;

  // Filter users into two categories
  const expiringSoonUsers = users.filter((user) => {
    const expire = new Date(user.expireDate);
    const diffDays = (expire - today) / msInDay;
    return diffDays >= 0 && diffDays <= 7;
  });

  const expiredUsers = users.filter((user) => {
    const expire = new Date(user.expireDate);
    const diffDays = (expire - today) / msInDay;
    return diffDays < 0;
  });


  // Send email to a single user based on template category.
  const sendEmailToUser = async (templateType, user) => {
    setSendingEmails(true);
    try {
      const subject = templates[templateType].subject;
      let content = templates[templateType].content;
      // Replace placeholders with user details.
      content = content
        .replace("[name]", `${user.firstName} ${user.lastName}`)
        .replace("[date]", new Date(user.expireDate).toLocaleDateString());
      await sendTemplateEmail(
        user.email,
        `${user.firstName} ${user.lastName}`,
        subject,
        content
      );
      alert(`Email sent successfully to ${user.email}.`);
    } catch (error) {
      alert(`Error sending email to ${user.email}.`);
    }
    setSendingEmails(false);
  };

  // Handle changes to template fields
  const handleTemplateChange = (templateType, field, value) => {
    setTemplates((prev) => ({
      ...prev,
      [templateType]: {
        ...prev[templateType],
        [field]: value,
      },
    }));
  };

  // Save updated templates to Firestore
  const handleSaveTemplates = async () => {
    setSavingTemplates(true);
    try {
      await updateEmailTemplates(templates);
      alert("Templates updated successfully.");
    } catch (error) {
      alert("Error updating templates.");
    }
    setSavingTemplates(false);
  };

  return (
    <div className="mailer-page-container">
      <h1>Mailer Page</h1>
      {loading ? (
        <p>Loading user data...</p>
      ) : (
        <>
          <section className="user-section">
            <h2>Premium Users Expiring This Week</h2>
            {expiringSoonUsers.length !== 0 ? (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Expiry Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {expiringSoonUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.firstName} {user.lastName}</td>
                      <td>{user.email}</td>
                      <td>{new Date(user.expireDate).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="send-email-button"
                          onClick={() => sendEmailToUser("expiringSoon", user)}
                          disabled={sendingEmails}
                        >
                          Send Email
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No premium users expiring this week.</p>
            )}
          </section>

          <section className="user-section">
            <h2>Premium Users Already Expired</h2>
            {expiredUsers.length !==  0 ? (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Expiry Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {expiredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.firstName} {user.lastName}</td>
                      <td>{user.email}</td>
                      <td>{new Date(user.expireDate).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="send-email-button"
                          onClick={() => sendEmailToUser("expired", user)}
                          disabled={sendingEmails}
                        >
                          Send Email
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No premium users have expired.</p>
            )}
          </section>

          <section className="template-edit-section">
            <h2>Email Templates</h2>
            {templates && (
              <>
                <div className="template-block">
                  <h3>Template for Expiring Soon Users</h3>
                  <button
                    onClick={() =>
                      setEditingTemplate((prev) => ({
                        ...prev,
                        expiringSoon: !prev.expiringSoon,
                      }))
                    }
                  >
                    {editingTemplate.expiringSoon ? "Cancel Edit" : "Edit Template"}
                  </button>
                  {editingTemplate.expiringSoon ? (
                    <div className="template-edit-form">
                      <label>Subject:</label>
                      <input
                        type="text"
                        value={templates.expiringSoon.subject}
                        onChange={(e) => handleTemplateChange("expiringSoon", "subject", e.target.value)}
                      />
                      <label>Content (HTML allowed):</label>
                      <textarea
                        rows="5"
                        value={templates.expiringSoon.content}
                        onChange={(e) => handleTemplateChange("expiringSoon", "content", e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="template-preview">
                      <h4>{templates.expiringSoon.subject}</h4>
                      <div
                        className="template-content-preview"
                        dangerouslySetInnerHTML={{ __html: templates.expiringSoon.content }}
                      />
                    </div>
                  )}
                </div>
                <div className="template-block">
                  <h3>Template for Expired Users</h3>
                  <button
                    onClick={() =>
                      setEditingTemplate((prev) => ({
                        ...prev,
                        expired: !prev.expired,
                      }))
                    }
                  >
                    {editingTemplate.expired ? "Cancel Edit" : "Edit Template"}
                  </button>
                  {editingTemplate.expired ? (
                    <div className="template-edit-form">
                      <label>Subject:</label>
                      <input
                        type="text"
                        value={templates.expired.subject}
                        onChange={(e) => handleTemplateChange("expired", "subject", e.target.value)}
                      />
                      <label>Content (HTML allowed):</label>
                      <textarea
                        rows="5"
                        value={templates.expired.content}
                        onChange={(e) => handleTemplateChange("expired", "content", e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="template-preview">
                      <h4>{templates.expired.subject}</h4>
                      <div
                        className="template-content-preview"
                        dangerouslySetInnerHTML={{ __html: templates.expired.content }}
                      />
                    </div>
                  )}
                </div>
                <button className="save-template-button" onClick={handleSaveTemplates} disabled={savingTemplates}>
                  {savingTemplates ? "Saving Templates..." : "Save Templates"}
                </button>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default MailerPage;
