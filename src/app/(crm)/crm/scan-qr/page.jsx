'use client';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../../../firebase/firebase';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Enhanced Scanner component with better error handling
import Scanner from '../../../../components/Scanner';

const ScanQRPage = () => {
  const [user, loadingAuth] = useAuthState(auth);
  const router = useRouter();
  
  // Scanner states
  const [isScanning, setIsScanning] = useState(false);
  const [scannedContact, setScannedContact] = useState(null);
  const [scannerError, setScannerError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);

  // Refs for debouncing and cleanup
  const lastScanTime = useRef(0);
  const scanTimeoutRef = useRef(null);
  const errorTimeoutRef = useRef(null);
  const consecutiveErrorCount = useRef(0);
  const maxConsecutiveErrors = 3;
  const scanDebounceMs = 3000; // 3 seconds between scans
  const errorDebounceMs = 5000; // 5 seconds between error messages

  // Cleanup function
  const cleanup = useCallback(() => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    setIsProcessing(false);
    setIsCameraLoading(false);
    consecutiveErrorCount.current = 0;
  }, []);

  // Check camera permissions
  const checkCameraPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
      setHasPermission(true);
      return true;
    } catch (error) {
      console.error('Camera permission denied:', error);
      setHasPermission(false);
      setScannerError({
        message: 'Camera access is required to scan QR codes. Please allow camera permissions.',
        type: 'permission'
      });
      return false;
    }
  }, []);

  // Enhanced scan success handler with proper debouncing
  const handleScanSuccess = useCallback(async (parsedContact) => {
    const now = Date.now();
    
    // Strict debouncing: Prevent multiple scans
    if (now - lastScanTime.current < scanDebounceMs || isProcessing) {
      return;
    }

    lastScanTime.current = now;
    setIsProcessing(true);
    consecutiveErrorCount.current = 0; // Reset error count on success

    try {
      // Validate and normalize contact data
      const normalizedContact = {
        name: String(parsedContact?.name || '').trim(),
        company: String(parsedContact?.company || '').trim(),
        title: String(parsedContact?.title || '').trim(),
        email: String(parsedContact?.email || '').trim(),
        phone: String(parsedContact?.phone || '').trim(),
        notes: String(parsedContact?.notes || '').trim(),
        vcardString: String(parsedContact?.vcardString || '').trim(),
      };

      // Validate that we have at least one meaningful field
      const hasValidData = Object.values(normalizedContact)
        .some(value => value.length > 0);

      if (!hasValidData) {
        throw new Error('No valid contact information found in QR code');
      }

      console.log('Successfully parsed contact:', normalizedContact);
      
      setScannedContact(normalizedContact);
      setIsScanning(false);
      setScannerError(null);
      
      toast.success('✅ QR code scanned successfully!', {
        position: 'top-center',
        autoClose: 2000,
      });

    } catch (error) {
      console.error('Error processing scanned contact:', error);
      setScannerError({
        message: 'Invalid QR code format. Please scan a valid vCard QR code.',
        type: 'decode'
      });
      toast.error('❌ Invalid QR code format');
    } finally {
      // Delayed processing state reset to prevent rapid re-scanning
      scanTimeoutRef.current = setTimeout(() => {
        setIsProcessing(false);
      }, 1000);
    }
  }, [isProcessing, scanDebounceMs]);

  // Enhanced error handler with intelligent error management
  const handleScanError = useCallback((errorMessage) => {
    // Don't process errors if already processing or recently had success
    if (isProcessing || Date.now() - lastScanTime.current < scanDebounceMs) {
      return;
    }

    consecutiveErrorCount.current += 1;
    
    // Only show user-facing errors after multiple consecutive failures
    if (consecutiveErrorCount.current >= maxConsecutiveErrors) {
      console.warn(`Scanner: ${consecutiveErrorCount.current} consecutive errors`);
      
      // Debounced error display to prevent spam
      if (!errorTimeoutRef.current) {
        setScannerError({
          message: 'Having trouble scanning. Please ensure good lighting and hold the QR code steady.',
          type: 'camera'
        });

        errorTimeoutRef.current = setTimeout(() => {
          setScannerError(null);
          consecutiveErrorCount.current = 0;
          errorTimeoutRef.current = null;
        }, errorDebounceMs);
      }
    }
  }, [isProcessing, scanDebounceMs, errorDebounceMs, maxConsecutiveErrors]);

  // Scanner stopped handler
  const handleScannerStopped = useCallback(() => {
    cleanup();
    setIsScanning(false);
    setScannerError(null);
  }, [cleanup]);

  // Start scanning with permission check
  const startScanning = useCallback(async () => {
    const hasPermissions = await checkCameraPermission();
    if (!hasPermissions) return;

    setIsCameraLoading(true);
    setScannerError(null);
    consecutiveErrorCount.current = 0;
    lastScanTime.current = 0;
    setIsProcessing(false);
    
    // Small delay to ensure state is set before starting camera
    setTimeout(() => {
      setIsScanning(true);
      setIsCameraLoading(false);
    }, 500);
  }, [checkCameraPermission]);

  // Stop scanning with proper cleanup
  const stopScanning = useCallback(() => {
    cleanup();
    setIsScanning(false);
    setScannerError(null);
  }, [cleanup]);

  // Save scanned contact with enhanced validation
  const saveScannedContact = useCallback(async () => {
    if (!user || !scannedContact) {
      toast.error('❌ No contact data to save');
      return;
    }

    setIsProcessing(true);

    try {
      const contactData = {
        name: scannedContact.name || 'Unknown',
        company: scannedContact.company || '',
        title: scannedContact.title || '',
        email: scannedContact.email || '',
        phone: scannedContact.phone || '',
        notes: scannedContact.notes || '',
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
        autoClose: 3000,
      });
      
      setScannedContact(null);
      
      // Navigate after a short delay to show success message
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
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
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
      
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            📱 QR Code Scanner
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Scan vCard QR codes to quickly add contacts to your CRM
          </p>
        </div>

        {!scannedContact ? (
          /* Scanner Interface */
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            
            {/* Scanner Header */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="text-center">
                <div className="text-4xl mb-3">📸</div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  QR Code Scanner
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">
                  Position a vCard QR code within the camera frame
                </p>
              </div>
            </div>

            {/* Error Display */}
            {scannerError && (
              <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="text-red-500 text-xl">⚠️</div>
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

            {/* Permission Warning */}
            {hasPermission === false && (
              <div className="mx-6 mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="text-yellow-500 text-xl">🔒</div>
                  <div>
                    <h4 className="text-yellow-800 font-medium text-sm">Camera Access Needed</h4>
                    <p className="text-yellow-700 text-sm mt-1">
                      Please allow camera access in your browser settings and refresh the page.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Scanner Controls */}
            <div className="p-6">
              {!isScanning ? (
                <button
                  onClick={startScanning}
                  disabled={isProcessing || isCameraLoading || hasPermission === false}
                  className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 
                           disabled:bg-gray-400 disabled:cursor-not-allowed text-base sm:text-lg 
                           font-semibold transition-colors duration-200 shadow-md"
                >
                  {isCameraLoading ? (
                    <span className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Starting Camera...</span>
                    </span>
                  ) : isProcessing ? (
                    'Processing...'
                  ) : (
                    '🎯 Start Scanning'
                  )}
                </button>
              ) : (
                <button
                  onClick={stopScanning}
                  className="w-full bg-red-600 text-white py-4 px-6 rounded-lg hover:bg-red-700 
                           text-base sm:text-lg font-semibold transition-colors duration-200 shadow-md"
                >
                  ⏹️ Stop Scanning
                </button>
              )}
            </div>

            {/* Camera View */}
            {isScanning && (
              <div className="px-6 pb-6">
                <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-black">
                  <Scanner
                    isActive={isScanning && !isProcessing}
                    onScanSuccess={handleScanSuccess}
                    onScanError={handleScanError}
                    onScannerStopped={handleScannerStopped}
                    qrReaderId="qr-reader-enhanced"
                  />
                  
                  {/* Processing overlay */}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="bg-white rounded-lg p-4 shadow-lg">
                        <div className="flex items-center space-x-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="text-gray-900 font-medium">Processing QR Code...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tips Section */}
            <div className="mx-6 mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3 text-sm">💡 Scanning Tips:</h3>
              <ul className="text-blue-800 text-xs sm:text-sm space-y-1.5">
                <li>• Ensure good lighting conditions</li>
                <li>• Hold your device steady and centered</li>
                <li>• Keep QR code fully visible in frame</li>
                <li>• Wait for the green focus indicator</li>
                <li>• Make sure QR code is not damaged or blurry</li>
              </ul>
            </div>
          </div>
        ) : (
          /* Contact Preview */
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            
            {/* Success Header */}
            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="text-center">
                <div className="text-4xl mb-3">✅</div>
                <h2 className="text-lg sm:text-xl font-semibold text-green-800 mb-2">
                  Contact Scanned Successfully!
                </h2>
                <p className="text-green-700 text-sm">Review the details below and save to your CRM</p>
              </div>
            </div>

            {/* Contact Details */}
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {[
                  { label: 'Name', value: scannedContact.name, icon: '👤' },
                  { label: 'Company', value: scannedContact.company, icon: '🏢' },
                  { label: 'Title', value: scannedContact.title, icon: '💼' },
                  { label: 'Email', value: scannedContact.email, icon: '📧' },
                  { label: 'Phone', value: scannedContact.phone, icon: '📱' },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="space-y-1">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                      <span>{icon}</span>
                      <span>{label}</span>
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg border text-sm">
                      {value?.trim() || 'Not provided'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Notes Section */}
              {scannedContact.notes?.trim() && (
                <div className="mb-6">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-1">
                    <span>📝</span>
                    <span>Notes</span>
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg border text-sm">
                    {scannedContact.notes}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={saveScannedContact}
                  disabled={isProcessing}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 
                           disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold 
                           transition-colors duration-200 shadow-md text-sm sm:text-base"
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
                  className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 
                           disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold 
                           transition-colors duration-200 shadow-md text-sm sm:text-base"
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
