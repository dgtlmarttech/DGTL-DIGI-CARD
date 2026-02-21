'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../../firebase/firebase';
import { toast, ToastContainer } from 'react-toastify';

const CrmDashboard = () => {
  const [user, loadingAuth] = useAuthState(auth);
  const router = useRouter();
  const [contacts, setContacts] = useState([]);
  const [labels, setLabels] = useState([]);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    if (loadingAuth) return;
    if (!user) {
      toast.error('You need to be logged in to access the CRM.');
      router.push('/signin');
      return;
    }

    let unsubscribeContacts, unsubscribeLabels, unsubscribeGroups;

    if (user) {
      // Listen for contacts
      const contactsQuery = query(collection(db, 'contacts'), where('userId', '==', user.uid));
      unsubscribeContacts = onSnapshot(contactsQuery, (snapshot) => {
        const fetchedContacts = [];
        snapshot.forEach((doc) => {
          fetchedContacts.push({ id: doc.id, ...doc.data() });
        });
        setContacts(fetchedContacts);
      });

      // Listen for labels
      const labelsQuery = query(collection(db, 'labels'), where('userId', '==', user.uid));
      unsubscribeLabels = onSnapshot(labelsQuery, (snapshot) => {
        const fetchedLabels = [];
        snapshot.forEach((doc) => {
          fetchedLabels.push({ id: doc.id, ...doc.data() });
        });
        setLabels(fetchedLabels);
      });

      // Listen for groups
      const groupsQuery = query(collection(db, 'groups'), where('userId', '==', user.uid));
      unsubscribeGroups = onSnapshot(groupsQuery, (snapshot) => {
        const fetchedGroups = [];
        snapshot.forEach((doc) => {
          fetchedGroups.push({ id: doc.id, ...doc.data() });
        });
        setGroups(fetchedGroups);
      });
    }

    return () => {
      if (unsubscribeContacts) unsubscribeContacts();
      if (unsubscribeLabels) unsubscribeLabels();
      if (unsubscribeGroups) unsubscribeGroups();
    };
  }, [user, loadingAuth, router]);

  const contactAnalytics = useMemo(() => {
    const totalContacts = contacts.length;

    const contactsBySource = contacts.reduce((acc, contact) => {
      const source = contact.source || 'Unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    const contactsByLabel = labels.reduce((acc, label) => {
      const count = contacts.filter(contact => contact.labels && contact.labels.includes(label.id)).length;
      acc[label.labelName] = { count, color: label.color };
      return acc;
    }, {});

    const contactsByGroup = groups.reduce((acc, group) => {
      const count = contacts.filter(contact => contact.groups && contact.groups.includes(group.id)).length;
      acc[group.groupName] = { count };
      return acc;
    }, {});

    return { totalContacts, contactsBySource, contactsByLabel, contactsByGroup };
  }, [contacts, labels, groups]);

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">CRM Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's an overview of your contacts and CRM activity.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => router.push('/crm/contacts')}
          className="bg-blue-600 text-white p-6 rounded-xl hover:bg-blue-700 transition-colors"
        >
          <div className="text-2xl mb-2">👥</div>
          <div className="font-semibold">View Contacts</div>
          <div className="text-sm opacity-90">{contactAnalytics.totalContacts} total</div>
        </button>
        
        <button
          onClick={() => router.push('/crm/scan-qr')}
          className="bg-green-600 text-white p-6 rounded-xl hover:bg-green-700 transition-colors"
        >
          <div className="text-2xl mb-2">📸</div>
          <div className="font-semibold">Scan QR Code</div>
          <div className="text-sm opacity-90">Add contact quickly</div>
        </button>
        
        <button
          onClick={() => router.push('/crm/import')}
          className="bg-purple-600 text-white p-6 rounded-xl hover:bg-purple-700 transition-colors"
        >
          <div className="text-2xl mb-2">📥</div>
          <div className="font-semibold">Import CSV</div>
          <div className="text-sm opacity-90">Bulk import contacts</div>
        </button>
        
        <div className="bg-orange-600 text-white p-6 rounded-xl">
          <div className="text-2xl mb-2">📊</div>
          <div className="font-semibold">Analytics</div>
          <div className="text-sm opacity-90">Track performance</div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Total Contacts</h4>
          <p className="text-3xl font-bold text-blue-600">{contactAnalytics.totalContacts}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Contacts by Source</h4>
          <ul className="space-y-2">
            {Object.entries(contactAnalytics.contactsBySource).map(([source, count]) => (
              <li key={source} className="flex justify-between text-sm">
                <span>{source}:</span>
                <span className="font-semibold">{count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Contacts by Label</h4>
          <ul className="space-y-2">
            {Object.entries(contactAnalytics.contactsByLabel).map(([labelName, data]) => (
              <li key={labelName} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <span
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: data.color }}
                  ></span>
                  <span>{labelName}:</span>
                </div>
                <span className="font-semibold">{data.count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Contacts by Group</h4>
          <ul className="space-y-2">
            {Object.entries(contactAnalytics.contactsByGroup).map(([groupName, data]) => (
              <li key={groupName} className="flex justify-between text-sm">
                <span>{groupName}:</span>
                <span className="font-semibold">{data.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold mb-4">Recent Contacts</h3>
        {contacts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No contacts yet. Start by adding your first contact!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Company</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Source</th>
                </tr>
              </thead>
              <tbody>
                {contacts.slice(0, 5).map((contact) => (
                  <tr key={contact.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{contact.name || 'N/A'}</td>
                    <td className="py-3 px-4 text-gray-600">{contact.company || 'N/A'}</td>
                    <td className="py-3 px-4 text-gray-600">{contact.email || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                        {contact.source || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {contacts.length > 5 && (
              <div className="text-center mt-4">
                <button
                  onClick={() => router.push('/crm/contacts')}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all {contacts.length} contacts →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CrmDashboard;
