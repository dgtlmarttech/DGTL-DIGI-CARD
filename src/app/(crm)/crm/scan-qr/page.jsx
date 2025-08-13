'use client';
import React, { useState, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../../../firebase/firebase';
import { toast, ToastContainer } from 'react-toastify';
import Scanner from '../../../../components/Scanner'; // Make sure this path is correct

const ScanQRPage = () => {
  const [user, loadingAuth] = useAuthState(auth);
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedContact, setScannedContact] = useState(null);

  const handleScanSuccess = useCallback(async (parsedContact) => {
    console.log('Scanned contact:', parsedContact);
    setScannedContact(parsedContact);
    setIsScanning(false);
    toast.success('QR code scanned successfully!');
  }, []);

  const handleScanError = useCallback((errorMessage) => {
    console.error('Scanner Error:', errorMessage);
    toast.error('Failed to scan QR code');
    setIsScanning(false);
  }, []);

  const handleScannerStopped = useCallback(() => {
    setIsScanning(false);
  }, []);

  const saveScannedContact = async () => {
    if (!user || !scannedContact) {
      toast.error('No contact data to save');
      return;
    }

    try {
      const contactData = {
        name: scannedContact.name || '',
        company: scannedContact.company || '',
        title: scannedContact.title || '',
        email: scannedContact.email || '',
        phone: scannedContact.phone || '',
        notes: scannedContact.notes || '',
        labels: [],
        groups: [],
        userId: user.uid,
        source: 'Scanned QR',
        dateAdded: serverTimestamp(),
        lastInteractionDate: serverTimestamp(),
        vcardString: scannedContact.vcardString || '',
      };

      await addDoc(collection(db, 'contacts'), contactData);
      toast.success('Contact saved successfully! 🎉');
      setScannedContact(null);
      router.push('/crm/contacts');
    } catch (error) {
      console.error('Error saving contact:', error);
      toast.error('Failed to save contact');
    }
  };

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/signin');
    return null;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Scan QR Code</h1>
        <p className="text-gray-600">Scan vCard QR codes to quickly add contacts</p>
      </div>

      {!scannedContact ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">📸</div>
            <h2 className="text-xl font-semibold mb-2">QR Code Scanner</h2>
            <p className="text-gray-600 mb-6">Position a vCard QR code in front of your camera</p>
            
            {!isScanning ? (
              <button
                onClick={() => setIsScanning(true)}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 text-lg font-semibold"
              >
                Start Scanning
              </button>
            ) : (
              <button
                onClick={() => setIsScanning(false)}
                className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 text-lg font-semibold"
              >
                Stop Scanning
              </button>
            )}
          </div>

          {isScanning && (
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
              <Scanner
                isActive={isScanning}
                onScanSuccess={handleScanSuccess}
                onScanError={handleScanError}
                onScannerStopped={handleScannerStopped}
                qrReaderId="qr-reader"
              />
            </div>
          )}

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Tips for better scanning:</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Hold your device steady</li>
              <li>• Ensure good lighting</li>
              <li>• Keep the QR code centered in the camera view</li>
              <li>• Make sure the QR code is not damaged or blurry</li>
              <li>• Allow camera permissions when prompted</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-semibold mb-6 text-center text-green-600">
            ✅ Contact Scanned Successfully!
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <div className="p-3 bg-gray-50 rounded-lg">{scannedContact.name || 'N/A'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <div className="p-3 bg-gray-50 rounded-lg">{scannedContact.company || 'N/A'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <div className="p-3 bg-gray-50 rounded-lg">{scannedContact.title || 'N/A'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="p-3 bg-gray-50 rounded-lg">{scannedContact.email || 'N/A'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <div className="p-3 bg-gray-50 rounded-lg">{scannedContact.phone || 'N/A'}</div>
            </div>
          </div>
          
          {scannedContact.notes && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <div className="p-3 bg-gray-50 rounded-lg">{scannedContact.notes}</div>
            </div>
          )}
          
          <div className="flex gap-4 justify-center">
            <button
              onClick={saveScannedContact}
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-semibold"
            >
              Save Contact
            </button>
            <button
              onClick={() => {
                setScannedContact(null);
                setIsScanning(false);
              }}
              className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 font-semibold"
            >
              Scan Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanQRPage;
