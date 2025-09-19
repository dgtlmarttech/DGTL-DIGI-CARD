'use client';
import React, { useState, useCallback, useRef } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../../../firebase/firebase';
import { toast, ToastContainer } from 'react-toastify';
import Scanner from '../../../../components/Scanner';

const ScanQRPage = () => {
  const [user, loadingAuth] = useAuthState(auth);
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedContact, setScannedContact] = useState(null);
  const [scannerError, setScannerError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Refs to prevent multiple scans and errors
  const lastScanTime = useRef(0);
  const errorCount = useRef(0);
  const maxErrors = useRef(5);

  const handleScanSuccess = useCallback(async (parsedContact) => {
    const now = Date.now();
    
    // Debounce: Prevent multiple scans within 2 seconds
    if (now - lastScanTime.current < 2000) {
      return;
    }
    
    // Prevent processing if already processing
    if (isProcessing) {
      return;
    }

    lastScanTime.current = now;
    setIsProcessing(true);

    try {
      // Normalize the contact data to prevent rendering errors
      const normalizedContact = {
        name: typeof parsedContact.name === 'string' ? parsedContact.name : '',
        company: typeof parsedContact.company === 'string' ? parsedContact.company : '',
        title: typeof parsedContact.title === 'string' ? parsedContact.title : '',
        email: typeof parsedContact.email === 'string' ? parsedContact.email : '',
        phone: typeof parsedContact.phone === 'string' ? parsedContact.phone : (parsedContact.phone ? String(parsedContact.phone) : ''),
        notes: typeof parsedContact.notes === 'string' ? parsedContact.notes : '',
        vcardString: typeof parsedContact.vcardString === 'string' ? parsedContact.vcardString : '',
      };

      console.log('Scanned contact:', normalizedContact);
      setScannedContact(normalizedContact);
      setIsScanning(false);
      setScannerError('');
      errorCount.current = 0; // Reset error count on success
      toast.success('QR code scanned successfully!');
    } catch (error) {
      console.error('Error processing scanned contact:', error);
      toast.error('Failed to process scanned contact');
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  const handleScanError = useCallback((errorMessage) => {
    errorCount.current += 1;
    
    // Only show error after multiple failed attempts to avoid infinite loop
    if (errorCount.current >= maxErrors.current) {
      console.error('Scanner Error:', errorMessage);
      setScannerError('Scanner having trouble finding QR codes. Please ensure good lighting and QR code is visible.');
      setIsScanning(false);
      errorCount.current = 0; // Reset error count
      toast.error('Scanner stopped due to multiple errors');
    }
    
    // Don't immediately stop scanning on first few errors - let it continue
  }, []);

  const handleScannerStopped = useCallback(() => {
    setIsScanning(false);
    setIsProcessing(false);
    setScannerError('');
    errorCount.current = 0;
  }, []);

  const startScanning = useCallback(() => {
    setScannerError('');
    errorCount.current = 0;
    lastScanTime.current = 0;
    setIsProcessing(false);
    setIsScanning(true);
  }, []);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
    setIsProcessing(false);
    setScannerError('');
    errorCount.current = 0;
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

  const resetScanner = useCallback(() => {
    setScannedContact(null);
    setScannerError('');
    errorCount.current = 0;
    lastScanTime.current = 0;
    setIsProcessing(false);
    setIsScanning(false);
  }, []);

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
            
            {/* Scanner Error Display */}
            {scannerError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {scannerError}
              </div>
            )}
            
            {!isScanning ? (
              <button
                onClick={startScanning}
                disabled={isProcessing}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Start Scanning'}
              </button>
            ) : (
              <button
                onClick={stopScanning}
                className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 text-lg font-semibold"
              >
                Stop Scanning
              </button>
            )}
          </div>

          {isScanning && (
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
              <Scanner
                isActive={isScanning && !isProcessing}
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
              <li>• Wait 2-3 seconds after camera opens before scanning</li>
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
              <div className="p-3 bg-gray-50 rounded-lg">
                {(typeof scannedContact.name === 'string' && scannedContact.name.trim()) || 'N/A'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <div className="p-3 bg-gray-50 rounded-lg">
                {(typeof scannedContact.company === 'string' && scannedContact.company.trim()) || 'N/A'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <div className="p-3 bg-gray-50 rounded-lg">
                {(typeof scannedContact.title === 'string' && scannedContact.title.trim()) || 'N/A'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="p-3 bg-gray-50 rounded-lg">
                {(typeof scannedContact.email === 'string' && scannedContact.email.trim()) || 'N/A'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <div className="p-3 bg-gray-50 rounded-lg">
                {(typeof scannedContact.phone === 'string' && scannedContact.phone.trim()) || 'N/A'}
              </div>
            </div>
          </div>
          
          {scannedContact.notes && typeof scannedContact.notes === 'string' && scannedContact.notes.trim() && (
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
              onClick={resetScanner}
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
