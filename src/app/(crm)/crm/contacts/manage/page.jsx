'use client';
import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../../../../firebase/firebase';
import { toast, ToastContainer } from 'react-toastify';

const ManagePage = () => {
  const [user, loadingAuth] = useAuthState(auth);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('labels');
  const [labels, setLabels] = useState([]);
  const [groups, setGroups] = useState([]);
  const [contacts, setContacts] = useState([]);

  // Form states
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#3b82f6');
  const [newGroupName, setNewGroupName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (loadingAuth) return;
    if (!user) {
      router.push('/signin');
      return;
    }

    let unsubscribeLabels, unsubscribeGroups, unsubscribeContacts;

    if (user) {
      const labelsQuery = query(collection(db, 'labels'), where('userId', '==', user.uid));
      unsubscribeLabels = onSnapshot(labelsQuery, (snapshot) => {
        const fetchedLabels = [];
        snapshot.forEach((doc) => {
          fetchedLabels.push({ id: doc.id, ...doc.data() });
        });
        setLabels(fetchedLabels);
      });

      const groupsQuery = query(collection(db, 'groups'), where('userId', '==', user.uid));
      unsubscribeGroups = onSnapshot(groupsQuery, (snapshot) => {
        const fetchedGroups = [];
        snapshot.forEach((doc) => {
          fetchedGroups.push({ id: doc.id, ...doc.data() });
        });
        setGroups(fetchedGroups);
      });

      const contactsQuery = query(collection(db, 'contacts'), where('userId', '==', user.uid));
      unsubscribeContacts = onSnapshot(contactsQuery, (snapshot) => {
        const fetchedContacts = [];
        snapshot.forEach((doc) => {
          fetchedContacts.push({ id: doc.id, ...doc.data() });
        });
        setContacts(fetchedContacts);
      });
    }

    return () => {
      if (unsubscribeLabels) unsubscribeLabels();
      if (unsubscribeGroups) unsubscribeGroups();
      if (unsubscribeContacts) unsubscribeContacts();
    };
  }, [user, loadingAuth, router]);

  const handleAddLabel = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Authentication required');
      return;
    }
    if (!newLabelName.trim()) {
      toast.error('Label name is required');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'labels'), {
        labelName: newLabelName.trim(),
        color: newLabelColor,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      toast.success('Label added successfully!');
      setNewLabelName('');
      setNewLabelColor('#3b82f6');
    } catch (error) {
      console.error('Error adding label:', error);
      toast.error('Error adding label');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLabel = async (labelId) => {
    if (!window.confirm('Are you sure? This will remove the label from all contacts.')) return;

    try {
      // Remove label from all contacts that use it
      const contactsToUpdate = contacts.filter(contact => 
        contact.labels && contact.labels.includes(labelId)
      );
      
      const batchUpdates = contactsToUpdate.map(contact => {
        const updatedLabels = contact.labels.filter(l => l !== labelId);
        return updateDoc(doc(db, 'contacts', contact.id), { labels: updatedLabels });
      });
      
      await Promise.all(batchUpdates);
      await deleteDoc(doc(db, 'labels', labelId));
      toast.success('Label deleted successfully!');
    } catch (error) {
      console.error('Error deleting label:', error);
      toast.error('Error deleting label');
    }
  };

  const handleAddGroup = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Authentication required');
      return;
    }
    if (!newGroupName.trim()) {
      toast.error('Group name is required');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'groups'), {
        groupName: newGroupName.trim(),
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      toast.success('Group added successfully!');
      setNewGroupName('');
    } catch (error) {
      console.error('Error adding group:', error);
      toast.error('Error adding group');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Are you sure? This will remove the group from all contacts.')) return;

    try {
      // Remove group from all contacts that use it
      const contactsToUpdate = contacts.filter(contact => 
        contact.groups && contact.groups.includes(groupId)
      );
      
      const batchUpdates = contactsToUpdate.map(contact => {
        const updatedGroups = contact.groups.filter(g => g !== groupId);
        return updateDoc(doc(db, 'contacts', contact.id), { groups: updatedGroups });
      });
      
      await Promise.all(batchUpdates);
      await deleteDoc(doc(db, 'groups', groupId));
      toast.success('Group deleted successfully!');
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Error deleting group');
    }
  };

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
        >
          ← Back to Contacts
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Labels & Groups</h1>
        <p className="text-gray-600">Organize your contacts with custom labels and groups</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
        <button
          onClick={() => setActiveTab('labels')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'labels'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🏷️ Labels
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'groups'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🗂️ Groups
        </button>
      </div>

      {/* Labels Tab */}
      {activeTab === 'labels' && (
        <div className="space-y-6">
          {/* Add Label Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Create New Label</h2>
            <form onSubmit={handleAddLabel} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  placeholder="Label name (e.g., Lead, Client, Follow-up)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <input
                  type="color"
                  value={newLabelColor}
                  onChange={(e) => setNewLabelColor(e.target.value)}
                  className="w-20 h-12 border border-gray-300 rounded-lg cursor-pointer"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !newLabelName.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Label'}
              </button>
            </form>
          </div>

          {/* Labels List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">
              Existing Labels ({labels.length})
            </h2>
            {labels.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🏷️</div>
                <p>No labels created yet</p>
                <p className="text-sm">Create your first label to organize contacts</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {labels.map(label => {
                  const contactCount = contacts.filter(contact => 
                    contact.labels && contact.labels.includes(label.id)
                  ).length;
                  
                  return (
                    <div key={label.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span
                            className="w-4 h-4 rounded-full mr-3"
                            style={{ backgroundColor: label.color }}
                          ></span>
                          <span className="font-medium">{label.labelName}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteLabel(label.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete label"
                        >
                          🗑️
                        </button>
                      </div>
                      <p className="text-sm text-gray-600">
                        Used by {contactCount} contact{contactCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Groups Tab */}
      {activeTab === 'groups' && (
        <div className="space-y-6">
          {/* Add Group Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Create New Group</h2>
            <form onSubmit={handleAddGroup} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Group name (e.g., Networking Event 2025, Sales Prospects)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || !newGroupName.trim()}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Group'}
              </button>
            </form>
          </div>

          {/* Groups List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">
              Existing Groups ({groups.length})
            </h2>
            {groups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🗂️</div>
                <p>No groups created yet</p>
                <p className="text-sm">Create your first group to organize contacts</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map(group => {
                  const contactCount = contacts.filter(contact => 
                    contact.groups && contact.groups.includes(group.id)
                  ).length;
                  
                  return (
                    <div key={group.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="text-lg mr-3">🗂️</span>
                          <span className="font-medium">{group.groupName}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete group"
                        >
                          🗑️
                        </button>
                      </div>
                      <p className="text-sm text-gray-600">
                        Contains {contactCount} contact{contactCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePage;
