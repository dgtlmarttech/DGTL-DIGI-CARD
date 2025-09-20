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
  
  // Scanner states
  const [isScanning, setIsScanning] = useState(false);
  const [scannedContact, setScannedContact] = useState(null);
  const [scannerError, setScannerError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Refs for debouncing and cleanup
  const lastScanTime = useRef(0);
  const scanTimeoutRef = useRef(null);
  const consecutiveErrorCount = useRef(0);
  const maxConsecutiveErrors = 2;
  const scanDebounceMs = 2000;

  // Cleanup function
  const cleanup = useCallback(() => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    setIsProcessing(false);
    consecutiveErrorCount.current = 0;
  }, []);

  // Enhanced scan success handler - CREATE NEW OBJECT instead of modifying
  const handleScanSuccess = useCallback((parsedContact) => {
    const now = Date.now();
    
    if (now - lastScanTime.current < scanDebounceMs || isProcessing) {
      return;
    }

    lastScanTime.current = now;
    setIsProcessing(true);
    consecutiveErrorCount.current = 0;

    try {
      // CREATE A COMPLETELY NEW OBJECT - don't modify existing one
      const normalizedContact = {
        name: parsedContact?.name ? String(parsedContact.name).trim() : '',
        company: parsedContact?.company ? String(parsedContact.company).trim() : '',
        title: parsedContact?.title ? String(parsedContact.title).trim() : '',
        email: parsedContact?.email ? String(parsedContact.email).trim() : '',
        phone: parsedContact?.phone ? String(parsedContact.phone).trim() : '',
        notes: parsedContact?.notes ? String(parsedContact.notes).trim() : '',
        website: parsedContact?.website ? String(parsedContact.website).trim() : '',
        vcardString: parsedContact?.vcardString ? String(parsedContact.vcardString).trim() : '',
      };

      const hasValidData = Object.values(normalizedContact).some(value => value.length > 0);

      if (!hasValidData) {
        throw new Error('No valid contact information found in QR code');
      }

      setScannedContact(normalizedContact);
      setIsScanning(false);
      setScannerError(null);
      
    } catch (error) {
      console.error('Error processing scanned contact:', error);
      setScannerError({
        message: 'Invalid QR code format. Please scan a valid contact QR code.',
        type: 'decode'
      });
    } finally {
      scanTimeoutRef.current = setTimeout(() => {
        setIsProcessing(false);
      }, 1000);
    }
  }, [isProcessing, scanDebounceMs]);

  // Enhanced error handler
  const handleScanError = useCallback((errorMessage) => {
    if (isProcessing || Date.now() - lastScanTime.current < scanDebounceMs) {
      return;
    }

    if (!errorMessage.includes('No QR code found') && 
        !errorMessage.includes('NotFoundException')) {
      consecutiveErrorCount.current += 1;
    }
    
    if (consecutiveErrorCount.current >= maxConsecutiveErrors) {
      setScannerError({
        message: errorMessage.includes('Camera') || errorMessage.includes('Permission') 
          ? errorMessage 
          : 'Scanner having trouble. Please ensure good lighting and try again.',
        type: errorMessage.includes('Permission') || errorMessage.includes('Camera') 
          ? 'permission' 
          : 'camera'
      });

      setTimeout(() => {
        setScannerError(null);
        consecutiveErrorCount.current = 0;
      }, 3000);
    }
  }, [isProcessing, scanDebounceMs, maxConsecutiveErrors]);

  // Scanner stopped handler
  const handleScannerStopped = useCallback(() => {
    cleanup();
    setIsScanning(false);
    setScannerError(null);
  }, [cleanup]);

  // Start scanning
  const startScanning = useCallback(() => {
    setScannerError(null);
    consecutiveErrorCount.current = 0;
    lastScanTime.current = 0;
    setIsProcessing(false);
    setIsScanning(true);
  }, []);

  // Stop scanning
  const stopScanning = useCallback(() => {
    cleanup();
    setIsScanning(false);
    setScannerError(null);
  }, [cleanup]);

  // Save scanned contact - CREATE NEW OBJECT
  const saveScannedContact = useCallback(async () => {
    if (!user || !scannedContact) {
      toast.error('❌ No contact data to save');
      return;
    }

    setIsProcessing(true);

    try {
      // CREATE NEW OBJECT - don't reference the existing one directly
      const contactData = {
        name: scannedContact.name || 'Unknown Contact',
        company: scannedContact.company || '',
        title: scannedContact.title || '',
        email: scannedContact.email || '',
        phone: scannedContact.phone || '',
        notes: scannedContact.notes || '',
        website: scannedContact.website || '',
        labels: [],
        groups: [],
        userId: user.uid,
        source: 'QR Code Scanner',
        dateAdded: serverTimestamp(),
        lastInteractionDate: serverTimestamp(),
        vcardString: scannedContact.vcardString || '',
      };

      await addDoc(collection(db, 'contacts'), contactData);
      
      toast.success('🎉 Contact saved successfully!', {
        position: 'top-center',
        autoClose: 2000,
      });
      
      setScannedContact(null);
      
      setTimeout(() => {
        router.push('/crm/contacts');
      }, 1500);
      
    } catch (error) {
      console.error('Error saving contact:', error);
      toast.error('❌ Failed to save contact. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [user, scannedContact, router]);

  // Reset scanner state
  const resetScanner = useCallback(() => {
    cleanup();
    setScannedContact(null);
    setScannerError(null);
    setIsScanning(false);
  }, [cleanup]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Auth loading state
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

  // Redirect if not authenticated
  if (!user) {
    router.push('/signin');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-2 px-4">
      <ToastContainer 
        position="top-center" 
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="light"
        className="mt-16"
      />
      
      <div className="max-w-lg mx-auto">
        {/* Compact Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            📱 QR Scanner
          </h1>
          <p className="text-gray-600 text-sm">
            Scan contact QR codes to add to your CRM
          </p>
        </div>

        {!scannedContact ? (
          /* Scanner Interface */
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            
            {/* Error Display */}
            {scannerError && (
              <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <div className="text-red-500 text-lg">⚠️</div>
                  <div>
                    <h4 className="text-red-800 font-medium text-sm">
                      {scannerError.type === 'permission' ? 'Camera Permission Required' :
                       scannerError.type === 'decode' ? 'Invalid QR Code' : 'Scanner Issue'}
                    </h4>
                    <p className="text-red-700 text-sm mt-1">{scannerError.message}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Scanner Controls */}
            <div className="p-4">
              {!isScanning ? (
                <button
                  onClick={startScanning}
                  disabled={isProcessing}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 
                           disabled:bg-gray-400 disabled:cursor-not-allowed text-base 
                           font-semibold transition-colors duration-200 shadow-md"
                >
                  {isProcessing ? 'Processing...' : '🎯 Start Scanning'}
                </button>
              ) : (
                <button
                  onClick={stopScanning}
                  className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 
                           text-base font-semibold transition-colors duration-200 shadow-md"
                >
                  ⏹️ Stop Scanning
                </button>
              )}
            </div>

            {/* Camera View */}
            {isScanning && (
              <div className="px-4 pb-4">
                <div className="relative border-2 border-blue-300 rounded-lg overflow-hidden">
                  <Scanner
                    isActive={isScanning && !isProcessing}
                    onScanSuccess={handleScanSuccess}
                    onScanError={handleScanError}
                    onScannerStopped={handleScannerStopped}
                  />
                  
                  {/* Processing overlay */}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-lg p-4 shadow-lg">
                        <div className="flex items-center space-x-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="text-gray-900 font-medium">Processing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Contact Preview */
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            
            {/* Success Header */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="text-center">
                <div className="text-3xl mb-2">✅</div>
                <h2 className="text-lg font-semibold text-green-800 mb-1">
                  Contact Scanned!
                </h2>
                <p className="text-green-700 text-sm">Review and save to CRM</p>
              </div>
            </div>

            {/* Contact Details */}
            <div className="p-4">
              <div className="space-y-3 mb-4">
                {[
                  { label: 'Name', value: scannedContact.name, icon: '👤' },
                  { label: 'Company', value: scannedContact.company, icon: '🏢' },
                  { label: 'Title', value: scannedContact.title, icon: '💼' },
                  { label: 'Email', value: scannedContact.email, icon: '📧' },
                  { label: 'Phone', value: scannedContact.phone, icon: '📱' },
                  { label: 'Website', value: scannedContact.website, icon: '🌐' },
                ].map(({ label, value, icon }) => (
                  value?.trim() ? (
                    <div key={label}>
                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-1">
                        <span>{icon}</span>
                        <span>{label}</span>
                      </label>
                      <div className="p-3 bg-gray-50 rounded-lg border text-sm break-words">
                        {value.trim()}
                      </div>
                    </div>
                  ) : null
                ))}
              </div>

              {/* Notes Section */}
              {scannedContact.notes?.trim() && (
                <div className="mb-4">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-1">
                    <span>📝</span>
                    <span>Notes</span>
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg border text-sm break-words">
                    {scannedContact.notes}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col space-y-2">
                <button
                  onClick={saveScannedContact}
                  disabled={isProcessing}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 
                           disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold 
                           transition-colors duration-200 shadow-md"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </span>
                  ) : (
                    '💾 Save Contact'
                  )}
                </button>
                <button
                  onClick={resetScanner}
                  disabled={isProcessing}
                  className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 
                           disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold 
                           transition-colors duration-200 shadow-md"
                >
                  🔄 Scan Another
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanQRPage;
