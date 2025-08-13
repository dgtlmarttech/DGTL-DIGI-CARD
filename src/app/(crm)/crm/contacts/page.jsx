'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, getDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../../../firebase/firebase';
import { toast, ToastContainer } from 'react-toastify';
import { exportContactsToVCF } from '../../../../utils/vcardUtils';

const ContactsPage = () => {
  const [user, loadingAuth] = useAuthState(auth);
  const router = useRouter();
  const [contacts, setContacts] = useState([]);
  const [labels, setLabels] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('dateAdded');
  const [filterLabels, setFilterLabels] = useState([]);
  const [filterGroups, setFilterGroups] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);

  useEffect(() => {
    if (loadingAuth) return;
    if (!user) {
      router.push('/signin');
      return;
    }

    let unsubscribeContacts, unsubscribeLabels, unsubscribeGroups;

    if (user) {
      const contactsQuery = query(collection(db, 'contacts'), where('userId', '==', user.uid));
      unsubscribeContacts = onSnapshot(contactsQuery, (snapshot) => {
        const fetchedContacts = [];
        snapshot.forEach((doc) => {
          fetchedContacts.push({ id: doc.id, ...doc.data() });
        });
        setContacts(fetchedContacts);
      });

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
    }

    return () => {
      if (unsubscribeContacts) unsubscribeContacts();
      if (unsubscribeLabels) unsubscribeLabels();
      if (unsubscribeGroups) unsubscribeGroups();
    };
  }, [user, loadingAuth, router]);

  const filteredAndSortedContacts = useMemo(() => {
    let filtered = contacts;

    if (searchTerm.trim()) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(contact =>
        (contact.name && contact.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (contact.email && contact.email.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (contact.phone && contact.phone.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }

    if (filterLabels.length > 0) {
      filtered = filtered.filter(contact =>
        contact.labels && filterLabels.every(filterLabelId => contact.labels.includes(filterLabelId))
      );
    }

    if (filterGroups.length > 0) {
      filtered = filtered.filter(contact =>
        contact.groups && filterGroups.every(filterGroupId => contact.groups.includes(filterGroupId))
      );
    }

    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'dateAdded') {
        const dateA = a.dateAdded?.toDate ? a.dateAdded.toDate().getTime() : 0;
        const dateB = b.dateAdded?.toDate ? b.dateAdded.toDate().getTime() : 0;
        return dateB - dateA;
      }
      return 0;
    });

    return filtered;
  }, [contacts, searchTerm, sortBy, filterLabels, filterGroups]);

  const handleExportAllVCF = () => {
    if (filteredAndSortedContacts.length > 0) {
      exportContactsToVCF(filteredAndSortedContacts, 'all_contacts.vcf');
      toast.success(`${filteredAndSortedContacts.length} contacts exported!`);
    } else {
      toast.info('No contacts to export.');
    }
  };

  const viewContactDetails = async (contactId) => {
    try {
      const contactDoc = await getDoc(doc(db, 'contacts', contactId));
      if (contactDoc.exists()) {
        setSelectedContact({ id: contactDoc.id, ...contactDoc.data() });
      }
    } catch (error) {
      toast.error('Error loading contact details');
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      await deleteDoc(doc(db, 'contacts', contactId));
      toast.success('Contact deleted successfully!');
      setSelectedContact(null);
    } catch (error) {
      toast.error('Error deleting contact');
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
    <div className="p-6 max-w-7xl mx-auto">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Contacts</h1>
        <p className="text-gray-600">Manage and organize your contact database</p>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => router.push('/crm/contacts/add')}
          className="bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center"
        >
          <span className="text-2xl mr-2">➕</span>
          <div>
            <div className="font-semibold">Add Contact</div>
            <div className="text-sm opacity-90">Create new contact</div>
          </div>
        </button>
        
        <button
          onClick={() => router.push('/crm/contacts/manage')}
          className="bg-green-600 text-white p-4 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center"
        >
          <span className="text-2xl mr-2">⚙️</span>
          <div>
            <div className="font-semibold">Manage</div>
            <div className="text-sm opacity-90">Labels & Groups</div>
          </div>
        </button>
        
        <button
          onClick={() => router.push('/crm/scan-qr')}
          className="bg-purple-600 text-white p-4 rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center"
        >
          <span className="text-2xl mr-2">📸</span>
          <div>
            <div className="font-semibold">Scan QR</div>
            <div className="text-sm opacity-90">Quick add</div>
          </div>
        </button>
        
        <button
          onClick={() => router.push('/crm/import')}
          className="bg-orange-600 text-white p-4 rounded-xl hover:bg-orange-700 transition-colors flex items-center justify-center"
        >
          <span className="text-2xl mr-2">📥</span>
          <div>
            <div className="font-semibold">Import CSV</div>
            <div className="text-sm opacity-90">Bulk import</div>
          </div>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="dateAdded">Sort by Date Added</option>
            <option value="name">Sort by Name</option>
            <option value="lastInteractionDate">Sort by Last Interaction</option>
          </select>
          
          <button
            onClick={handleExportAllVCF}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Export All (VCF)
          </button>
        </div>

        {/* Filter Section */}
        <div className="flex flex-wrap gap-4 mt-4">
          {/* Labels Filter */}
          <div className="relative">
            <select
              multiple
              value={filterLabels}
              onChange={(e) => setFilterLabels(Array.from(e.target.selectedOptions, option => option.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-32"
            >
              <option value="">All Labels</option>
              {labels.map(label => (
                <option key={label.id} value={label.id}>
                  {label.labelName}
                </option>
              ))}
            </select>
          </div>

          {/* Groups Filter */}
          <div className="relative">
            <select
              multiple
              value={filterGroups}
              onChange={(e) => setFilterGroups(Array.from(e.target.selectedOptions, option => option.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-32"
            >
              <option value="">All Groups</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.groupName}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {(filterLabels.length > 0 || filterGroups.length > 0) && (
            <button
              onClick={() => {
                setFilterLabels([]);
                setFilterGroups([]);
              }}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredAndSortedContacts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No contacts found</h3>
            <p className="text-gray-600 mb-6">Start building your network by adding contacts</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => router.push('/crm/contacts/add')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Add Contact
              </button>
              <button
                onClick={() => router.push('/crm/scan-qr')}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
              >
                Scan QR Code
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-700">Company</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-700">Phone</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-700">Labels</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedContacts.map((contact) => (
                  <tr key={contact.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{contact.name || 'N/A'}</div>
                      <div className="text-sm text-gray-600">{contact.title || ''}</div>
                    </td>
                    <td className="py-4 px-6 text-gray-600">{contact.company || 'N/A'}</td>
                    <td className="py-4 px-6">
                      {contact.email && (
                        <a href={`mailto:${contact.email}`} className="text-blue-600 hover:text-blue-800">
                          {contact.email}
                        </a>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {contact.phone && (
                        <a href={`tel:${contact.phone}`} className="text-blue-600 hover:text-blue-800">
                          {contact.phone}
                        </a>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1">
                        {contact.labels?.map(labelId => {
                          const label = labels.find(l => l.id === labelId);
                          return label ? (
                            <span
                              key={label.id}
                              className="px-2 py-1 text-xs rounded-full border"
                              style={{
                                backgroundColor: label.color + '20',
                                borderColor: label.color,
                                color: label.color
                              }}
                            >
                              {label.labelName}
                            </span>
                          ) : null;
                        })}
                        {contact.groups?.map(groupId => {
                          const group = groups.find(g => g.id === groupId);
                          return group ? (
                            <span
                              key={group.id}
                              className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-800"
                            >
                              {group.groupName}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewContactDetails(contact.id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          View
                        </button>
                        <button
                          onClick={() => router.push(`/crm/contacts/edit/${contact.id}`)}
                          className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                        >
                          Edit
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

      {/* Contact Detail Modal */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{selectedContact.name}</h2>
                <button
                  onClick={() => setSelectedContact(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div><strong>Company:</strong> {selectedContact.company || 'N/A'}</div>
                <div><strong>Title:</strong> {selectedContact.title || 'N/A'}</div>
                <div><strong>Email:</strong> {selectedContact.email || 'N/A'}</div>
                <div><strong>Phone:</strong> {selectedContact.phone || 'N/A'}</div>
                <div><strong>Notes:</strong> {selectedContact.notes || 'No notes'}</div>
                <div><strong>Source:</strong> {selectedContact.source || 'Unknown'}</div>
                <div><strong>Date Added:</strong> {selectedContact.dateAdded?.toDate?.()?.toLocaleDateString() || 'N/A'}</div>
              </div>
              
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => router.push(`/crm/contacts/edit/${selectedContact.id}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Edit Contact
                </button>
                <button
                  onClick={() => handleDeleteContact(selectedContact.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelectedContact(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsPage;
