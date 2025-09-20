'use client';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../../../firebase/firebase';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Scanner from '../../../../components/Scanner';

const ScanQRPage = () => {
  const [user, loadingAuth] = useAuthState(auth);
  const router = useRouter();
  
  // State management exactly like your working app
  const [isScanning, setIsScanning] = useState(false);
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
  const [showContactForm, setShowContactForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Scanner callbacks using your successful pattern
  const handleScanSuccess = useCallback((parsedContact) => {
    console.log('Scan successful:', parsedContact);
    
    // Exactly like your working app - pre-populate form
    setContactForm({
      name: parsedContact.name || '',
      company: parsedContact.company || '',
      title: parsedContact.title || '',
      email: parsedContact.email || '',
      phone: parsedContact.phone || '',
      notes: parsedContact.notes || '',
      website: parsedContact.website || '',
      labels: [],
      groups: [],
      vcardString: parsedContact.vcardString || '',
    });
    
    setShowContactForm(true);
    setIsScanning(false); // Stop scanning after success
    toast.success('QR code scanned successfully!');
  }, []);

  const handleScanError = useCallback((errorMessage) => {
    console.error('Scanner Error:', errorMessage);
    // Don't stop scanning on error - let it continue like your working app
  }, []);

  const handleScannerStopped = useCallback(() => {
    setIsScanning(false);
    console.log('Scanner stopped');
  }, []);

  // Form handlers
  const handleContactFormChange = (e) => {
    const { name, value } = e.target;
    setContactForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Authentication required to save contacts.');
      return;
    }
    
    if (!contactForm.name.trim()) {
      toast.error('Contact name is required!');
      return;
    }

    setIsProcessing(true);

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
        userId: user.uid,
        source: contactForm.vcardString ? 'Scanned QR' : 'Manual Add',
        dateAdded: serverTimestamp(),
        lastInteractionDate: serverTimestamp(),
        vcardString: contactForm.vcardString,
      };

      await addDoc(collection(db, 'contacts'), contactData);
      toast.success('Contact added successfully! 🎉');
      
      // Reset form and go back to scanner
      setContactForm({
        name: '', company: '', title: '', email: '', phone: '', 
        notes: '', website: '', labels: [], groups: [], vcardString: ''
      });
      setShowContactForm(false);
      
      // Navigate to contacts or stay on scanner
      setTimeout(() => {
        router.push('/crm/contacts');
      }, 1500);

    } catch (error) {
      console.error('Error saving contact:', error);
      toast.error(`Error saving contact: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setContactForm({
      name: '', company: '', title: '', email: '', phone: '', 
      notes: '', website: '', labels: [], groups: [], vcardString: ''
    });
    setShowContactForm(false);
    setIsScanning(false);
  };

  // Auth redirect
  useEffect(() => {
    if (loadingAuth) return;
    if (!user) {
      toast.error('You need to be logged in to access the CRM.');
      router.push('/signin');
    }
  }, [user, loadingAuth, router]);

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4">
      <ToastContainer 
        position="top-right" 
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            📱 Scan vCard QR Code
          </h1>
          <p className="text-gray-600">
            Scan a vCard QR code to quickly add contact details
          </p>
        </div>

        {!showContactForm ? (
          /* Scanner Section - Using your exact working pattern */
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="scanner-container">
              <Scanner
                isActive={!showContactForm} // Active when not showing form
                onScanSuccess={handleScanSuccess}
                onScanError={handleScanError}
                onScannerStopped={handleScannerStopped}
                qrReaderId="dc-network-qr-reader"
              />
            </div>
            
            <div className="text-center mt-6">
              {!isScanning ? (
                <button
                  onClick={() => setIsScanning(true)}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Start Scanning
                </button>
              ) : (
                <button
                  onClick={() => setIsScanning(false)}
                  className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 font-semibold"
                >
                  Stop Scanning
                </button>
              )}
            </div>
            
            <p className="text-center text-gray-500 mt-4">
              Point your camera at a vCard QR code to scan
            </p>
          </div>
        ) : (
          /* Contact Form - Exactly like your working app */
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-6 text-center text-green-600">
              ✅ Contact Scanned Successfully!
            </h2>
            
            <form onSubmit={handleSaveContact} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={contactForm.name}
                  onChange={handleContactFormChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    type="text"
                    name="company"
                    value={contactForm.company}
                    onChange={handleContactFormChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={contactForm.title}
                    onChange={handleContactFormChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={contactForm.email}
                    onChange={handleContactFormChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={contactForm.phone}
                    onChange={handleContactFormChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              {contactForm.website && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    name="website"
                    value={contactForm.website}
                    onChange={handleContactFormChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={contactForm.notes}
                  onChange={handleContactFormChange}
                  rows="3"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold transition-colors duration-200"
                >
                  {isProcessing ? 'Saving...' : 'Save Contact'}
                </button>
                <button
                  type="button"
                  onClick={resetScanner}
                  disabled={isProcessing}
                  className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 font-semibold transition-colors duration-200"
                >
                  Scan Another
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanQRPage;
