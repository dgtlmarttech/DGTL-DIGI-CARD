'use client';
import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter, useParams } from 'next/navigation';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../../../../../firebase/firebase';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EditContactPage = () => {
  const [user, loadingAuth] = useAuthState(auth);
  const router = useRouter();
  const { id: contactId } = useParams();
  const [labels, setLabels] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingContact, setLoadingContact] = useState(true);

  const [contactForm, setContactForm] = useState({
    name: '',
    company: '',
    title: '',
    email: '',
    phone: '',
    notes: '',
    website: '',
    labels: [],
    groups: [],
    vcardString: '',
  });

  // Load contact data, labels, and groups
  useEffect(() => {
    if (loadingAuth) return;
    if (!user) {
      router.push('/signin');
      return;
    }

    if (!contactId) {
      toast.error('No contact ID provided');
      router.push('/crm/contacts');
      return;
    }

    let unsubscribeLabels, unsubscribeGroups;

    // Load the specific contact
    const loadContact = async () => {
      try {
        const contactDoc = await getDoc(doc(db, 'contacts', contactId));
        if (contactDoc.exists()) {
          const contactData = contactDoc.data();
          
          // Verify ownership
          if (contactData.userId !== user.uid) {
            toast.error('Unauthorized access to this contact');
            router.push('/crm/contacts');
            return;
          }

          // Populate form with existing contact data
          setContactForm({
            name: contactData.name || '',
            company: contactData.company || '',
            title: contactData.title || '',
            email: contactData.email || '',
            phone: contactData.phone || '',
            notes: contactData.notes || '',
            website: contactData.website || '',
            labels: contactData.labels || [],
            groups: contactData.groups || [],
            vcardString: contactData.vcardString || '',
          });
        } else {
          toast.error('Contact not found');
          router.push('/crm/contacts');
          return;
        }
      } catch (error) {
        console.error('Error loading contact:', error);
        toast.error('Error loading contact data');
        router.push('/crm/contacts');
        return;
      } finally {
        setLoadingContact(false);
      }
    };

    // Load labels
    const labelsQuery = query(collection(db, 'labels'), where('userId', '==', user.uid));
    unsubscribeLabels = onSnapshot(labelsQuery, (snapshot) => {
      const fetchedLabels = [];
      snapshot.forEach((doc) => {
        fetchedLabels.push({ id: doc.id, ...doc.data() });
      });
      setLabels(fetchedLabels);
    });

    // Load groups
    const groupsQuery = query(collection(db, 'groups'), where('userId', '==', user.uid));
    unsubscribeGroups = onSnapshot(groupsQuery, (snapshot) => {
      const fetchedGroups = [];
      snapshot.forEach((doc) => {
        fetchedGroups.push({ id: doc.id, ...doc.data() });
      });
      setGroups(fetchedGroups);
    });

    loadContact();

    return () => {
      if (unsubscribeLabels) unsubscribeLabels();
      if (unsubscribeGroups) unsubscribeGroups();
    };
  }, [user, loadingAuth, router, contactId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({ ...prev, [name]: value }));
  };

  const handleLabelSelect = (labelId) => {
    setContactForm(prev => {
      const currentLabels = prev.labels || [];
      if (currentLabels.includes(labelId)) {
        return { ...prev, labels: currentLabels.filter(id => id !== labelId) };
      } else {
        return { ...prev, labels: [...currentLabels, labelId] };
      }
    });
  };

  const handleGroupSelect = (groupId) => {
    setContactForm(prev => {
      const currentGroups = prev.groups || [];
      if (currentGroups.includes(groupId)) {
        return { ...prev, groups: currentGroups.filter(id => id !== groupId) };
      } else {
        return { ...prev, groups: [...currentGroups, groupId] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Authentication required to update contacts.');
      return;
    }
    if (!contactForm.name.trim()) {
      toast.error('Contact name is required!');
      return;
    }

    setLoading(true);

    try {
      const contactData = {
        name: contactForm.name.trim(),
        company: contactForm.company.trim(),
        title: contactForm.title.trim(),
        email: contactForm.email.trim(),
        phone: contactForm.phone.trim(),
        notes: contactForm.notes.trim(),
        website: contactForm.website.trim(),
        labels: contactForm.labels,
        groups: contactForm.groups,
        // Keep original fields and add updated timestamp
        lastInteractionDate: new Date(),
        // Don't update userId, dateAdded, source, or vcardString
      };

      await updateDoc(doc(db, 'contacts', contactId), contactData);
      toast.success('Contact updated successfully! 🎉');
      router.push('/crm/contacts');
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error('Error updating contact');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !contactId) {
      toast.error('Cannot delete contact');
      return;
    }

    // Confirmation using react-toastify
    toast.warn(
      <div>
        <p className="mb-3">Are you sure you want to delete this contact?</p>
        <div className="flex space-x-2">
          <button
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            onClick={async () => {
              try {
                await deleteDoc(doc(db, 'contacts', contactId));
                toast.success('Contact deleted successfully!');
                router.push('/crm/contacts');
              } catch (error) {
                console.error('Error deleting contact:', error);
                toast.error('Error deleting contact');
              } finally {
                toast.dismiss();
              }
            }}
          >
            Yes, Delete
          </button>
          <button
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            onClick={() => toast.dismiss()}
          >
            Cancel
          </button>
        </div>
      </div>,
      {
        autoClose: false,
        closeButton: false,
        draggable: false,
      }
    );
  };

  if (loadingAuth || loadingContact) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">
            {loadingAuth ? 'Loading...' : 'Loading contact data...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
        >
          ← Back to Contacts
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Contact</h1>
        <p className="text-gray-600">Update contact information in your CRM database</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={contactForm.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                Company
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={contactForm.company}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Company name"
              />
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Job Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={contactForm.title}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Job title or position"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={contactForm.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={contactForm.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Phone number"
              />
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={contactForm.website}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={contactForm.notes}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes about this contact..."
            />
          </div>

          {/* Labels */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Labels
            </label>
            {labels.length === 0 ? (
              <div className="text-gray-500 text-sm mb-4">
                No labels created yet. 
                <button
                  type="button"
                  onClick={() => router.push('/crm/contacts/manage')}
                  className="text-blue-600 hover:text-blue-800 ml-1"
                >
                  Create labels here
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {labels.map(label => (
                  <label key={label.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contactForm.labels.includes(label.id)}
                      onChange={() => handleLabelSelect(label.id)}
                      className="mr-3"
                    />
                    <span
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: label.color }}
                    ></span>
                    <span className="text-sm">{label.labelName}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Groups */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Groups
            </label>
            {groups.length === 0 ? (
              <div className="text-gray-500 text-sm mb-4">
                No groups created yet. 
                <button
                  type="button"
                  onClick={() => router.push('/crm/contacts/manage')}
                  className="text-blue-600 hover:text-blue-800 ml-1"
                >
                  Create groups here
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {groups.map(group => (
                  <label key={group.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contactForm.groups.includes(group.id)}
                      onChange={() => handleGroupSelect(group.id)}
                      className="mr-3"
                    />
                    <span className="text-sm">{group.groupName}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* vCard String Display (Read-only) */}
          {contactForm.vcardString && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Original vCard Data
              </label>
              <textarea
                value={contactForm.vcardString}
                readOnly
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                placeholder="No vCard data available"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <div>
              <button
                type="button"
                onClick={handleDelete}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
              >
                🗑️ Delete Contact
              </button>
            </div>
            
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !contactForm.name.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </div>
                ) : (
                  'Update Contact'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditContactPage;
