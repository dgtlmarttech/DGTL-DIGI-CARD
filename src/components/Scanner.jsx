import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode'; // Only import Html5Qrcode, not Html5QrcodeScanner
import { toast } from 'react-toastify';
import { parseVCard } from '../utils/vcardUtils'; // Assuming this path is correct

/**
 * Scanner Component for QR Code scanning.
 * Manages camera access, scanning, and provides callbacks for scan results and errors.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.isActive - A boolean indicating if the scanner should be active (controlled by parent).
 * @param {function(object)} props.onScanSuccess - Callback function for successful QR code scans.
 * Receives an object with parsed contact data.
 * @param {function(string)} props.onScanError - Callback function for scanner errors.
 * Receives an error message string.
 * @param {function} props.onScannerStopped - Callback function when the scanner has stopped.
 */
const Scanner = ({ isActive, onScanSuccess, onScanError, onScannerStopped }) => {
  const html5QrCodeRef = useRef(null); // Ref to store the Html5Qrcode instance
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState('unknown'); // 'unknown', 'granted', 'denied', 'not-found'
  const [isInitializing, setIsInitializing] = useState(false); // To show "Initializing camera..."
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [isLoadingCameras, setIsLoadingCameras] = useState(true); // State for initial camera loading
  const [isScanningActive, setIsScanningActive] = useState(false); // New state to track if camera is truly active and scanning

  // Corrected and simplified Placeholder SVG for camera icon
  const cameraPlaceholderSvg = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzNzEuNjQzIDM3MS42NDMiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDM3MS42NDMgMzcxLjY0MyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PHBhdGggZD0iTTEwNS4wODQgMzguMjcxaDE2My43Njh2MjBIMTA1LjA4NHoiLz48cGF0aCBkPSJNMzExLjU5NiAxOTAuMTg5Yy03LjQ0MS05LjM0Ny0xOC40MDMtMTYuMjA2LTMyLjc0My0yMC41MjJWMzBjMC0xNi41NDItMTMuNDU4LTMwLTMwLTMwSDEyNS4wODRjLTE2LjU0MiAwLTMwIDEzLjQ1OC0zMCAzMHYxMjAuMTQzaC04LjI5NmMtMTYuNTQyIDAtMzAgMTMuNDU4LTMwIDMwdjEuMzMzYTI5LjgwNCAyOS44MDQgMCAwIDAgNC42MDMgMTUuOTM5Yy03LjM0IDUuNDc0LTEyLjEwMyAxNC4yMjEtMTIuMTAzIDI0LjA2MXYxLjMzM2MwIDkuODQgNC43NjMgMTguNTg3IDEyLjEwMyAyNC4wNjJhMjkuODEgMjkuODEgMCAwIDAtNC42MDMgMTUuOTM4djEuMzMzYzAgMTYuNTQyIDEzLjQ1OCAzMCAzMCAzMGg4LjMyNGMuNDI3IDExLjYzMSA3LjUwMyAyMS41ODcgMTcuNTM0IDI2LjE3Ny45MzEgMTAuNTAzIDQuMDg0IDMwLjE4NyAxNC43NjggNDUuNTM3YTkuOTg4IDkuOTg4IDAgMCAwIDguMjE2IDQuMjg4IDkuOTU4IDkuOTU4IDAgMCAwIDUuNzA0LTEuNzkzYzQuNTMzLTMuMTU1IDUuNjUtOS4zODggMi40OTUtMTMuOTIxLTYuNzk4LTkuNzY3LTkuNjAyLTIyLjYwOC0xMC43Ni0zMS40aDgyLjY4NWMuMjcyLjQxNC41NDUuODE4LjgxNSAxLjIxIDMuMTQyIDQuNTQxIDkuMzcyIDUuNjc5IDEzLjkxMyAyLjUzNCA0LjU0Mi0zLjE0MiA1LjY3Ny05LjM3MSAyLjUzNS0xMy45MTMtMTEuOTE5LTE3LjIyOS04Ljc4Ny0zNS44ODQgOS41ODEtNTcuMDEyIDMuMDY3LTIuNjUyIDEyLjMwNy0xMS43MzIgMTEuMjE3LTI0LjAzMy0uODI4LTkuMzQzLTcuMTA5LTE3LjE5NC0xOC42NjktMjMuMzM3YTkuODU3IDkuODU3IDAgMCAwLTEuMDYxLS40ODZjLS40NjYtLjE4Mi0xMS40MDMtNC41NzktOS43NDEtMTUuNzA2IDEuMDA3LTYuNzM3IDE0Ljc2OC04LjI3MyAyMy43NjYtNy42NjYgMjMuMTU2IDEuNTY5IDM5LjY5OCA3LjgwMyA0Ny44MzYgMTguMDI2IDUuNzUyIDcuMjI1IDcuNjA3IDE2LjYyMyA1LjY3MyAyOC43MzMtLjQxMyAyLjU4NS0uODI0IDUuMjQxLTEuMjQ1IDcuOTU5LTUuNzU2IDM3LjE5NC0xMi45MTkgODMuNDgzLTQ5Ljg3IDExNC42NjEtNC4yMjEgMy41NjEtNC43NTYgOS44Ny0xLjE5NCAxNC4wOTJhOS45OCA5Ljk4IDAgMCAwIDcuNjQ4IDMuNTUxIDkuOTU1IDkuOTU1IDAgMCAwIDYuNDQ0LTIuMzU4YzQyLjY3Mi0zNi4wMDUgNTAuODAyLTg4LjUzMyA1Ni43MzctMTI2Ljg4OC40MTUtMi42ODQuODIxLTUuMzA5IDEuMjI5LTcuODYzIDIuODM0LTE3LjcyMS0uNDU1LTMyLjY0MS05Ljc3Mi00NC4zNDV6bS0yMzIuMzA4IDQyLjYyYy01LjUxNCAwLTEwLTQuNDg2LTEwLTEwdi0xLjMzM2MwLTUuNTE0IDQuNDg2LTEwIDEwLTEwaDE1djIxLjMzM2gtMTV6bS0yLjUtNTIuNjY2YzAtNS41MTQgNC40ODYtMTAgMTAtMTBoNy41djIxLjMzM2gtNy41Yy01LjUxNCAwLTEwLTQuNDg2LTEwLTEwdi0xLjMzM3ptMTcuNSA5My45OTloLTcuNWMtNS41MTQgMC0xMC00LjQ4Ni0xMC0xMHYtMS4zMzNjMC01LjUxNCA0LjQ4Ni0xMCAxMC0xMGg3LjV2MjEuMzMzem0zMC43OTYgMjguODg3Yy01LjUxNCAwLTEwLTQuNDg2LTEwLTEwdi04LjI3MWg5MS40NTdjLS44NTEgNi42NjgtLjQzNyAxMi43ODcuNzMxIDE4LjI3MWgtODIuMTg4em03OS40ODItMTEzLjY5OGMtMy4xMjQgMjAuOTA2IDEyLjQyNyAzMy4xODQgMjEuNjI1IDM3LjA0IDUuNDQxIDIuOTY4IDcuNTUxIDUuNjQ3IDcuNzAxIDcuMTg4LjIxIDIuMTUtMi41NTMgNS42ODQtNC40NzcgNy4yNTEtLjQ4Mi4zNzgtLjkyOS44LTEuMzM1IDEuMjYxLTYuOTg3IDcuOTM2LTExLjk4MiAxNS41Mi0xNS40MzIgMjIuNjg4aC05Ny41NjRWMzBjMC01LjUxNCA0LjQ4Ni0xMCAxMC0xMGgxMjMuNzY5YzUuNTE0IDAgMTAgNC40ODYgMTAgMTB2MTM1LjU3OWMtMy4wMzItLjM4MS02LjE1LS42OTQtOS4zODktLjkxNC0yNS4xNTktMS42OTQtNDIuMzcgNy43NDgtNDQuODk4IDI0LjY2NnoiLz48cGF0aCBkPSJNMTc5LjEyOSA4My4xNjdoLTI0LjA2YTUgNSAwIDAgMC01IDV2MjQuMDYxYTUgNSAwIDAgMCA1IDVoMjQuMDZhNSA1IDAgMCAwIDUtNVY4OC4xNjdhNSA1IDAgMCAwLTUtNXpNMTcyLjYyOSAxNDIuODZoLTEyLjU2VjEzMC44YTUgNSAwIDEgMC0xMCAwdjE3LjA2MWE1IDUgMCAwIDAgNSA1aDE3LjU2YTUgNSAwIDEgMCAwLTEwLjAwMXpNMjE2LjU2OCA4My4xNjdoLTI0LjA2YTUgNSAwIDAgMC01IDV2MjQuMDYxYTUgNSAwIDAgMCA1IDVoMjQuMDZhNSA1IDAgMCAwIDUtNVY4OC4xNjdhNSA1IDAgMCAwLTUtNXptLTUgMjQuMDYxaC0xNC4wNlY5My4xNjdoMTQuMDZ2MTQuMDYxek0yMTEuNjY5IDEyNS45MzZIMTk3LjQxYTUgNSAwIDAgMC01IDV2MTQuMjU3YTUgNSAwIDAgMCA1IDVoMTQuMjU5YTUgNSAwIDAgMCA1LTV2LTE0LjI1N2E1IDUgMCAwIDAtNS01eiIvPjwvc3ZnPg==";

  // Function to stop the QR scanner
  const stopQrScanner = useCallback(async () => {
    // Check if the HTML5 QR Code scanner instance exists and is currently scanning
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        // Attempt to stop the scanner gracefully
        await html5QrCodeRef.current.stop();
        toast.info('QR scanner stopped.');
      } catch (error) {
        // If stopping gracefully fails (e.g., due to the removeChild error)
        console.warn("Error stopping QR scanner gracefully:", error);
        // Attempt a more aggressive cleanup by clearing the scanner
        try {
          await html5QrCodeRef.current.clear(); // This removes all child nodes and cleans up resources
          html5QrCodeRef.current = null; // Nullify the ref to ensure a fresh instance on next start
          console.log("Scanner cleared after stop failure.");
        } catch (clearError) {
          console.error("Critical: Error clearing QR scanner after stop failure:", clearError);
        }
      } finally {
        // Always ensure initializing state is off, scanning state is off, and parent is notified
        setIsInitializing(false);
        setIsScanningActive(false); // Set scanning active to false
        onScannerStopped();
      }
    } else if (html5QrCodeRef.current) {
      // If scanner instance exists but is not scanning (e.g., it failed to start),
      // ensure it's cleared to prevent lingering issues.
      try {
        await html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null; // Nullify the ref to ensure a fresh instance
      } catch (clearError) {
        console.error("Error clearing QR scanner when not scanning:", clearError);
      } finally {
        setIsInitializing(false);
        setIsScanningActive(false); // Set scanning active to false
        onScannerStopped();
      }
    } else {
      // If no scanner instance exists, just reset states
      setIsInitializing(false);
      setIsScanningActive(false); // Set scanning active to false
      onScannerStopped();
    }
  }, [onScannerStopped, onScanError]);

  // Function to initialize and start the QR scanner
  const initializeQrScanner = useCallback(async () => {
    const qrReaderId = 'dc-network-qr-reader';
    const qrReaderElement = document.getElementById(qrReaderId);

    if (!qrReaderElement) {
      console.error('QR reader element not found for initialization.');
      onScanError('QR reader element not found.');
      stopQrScanner(); // Call stop to reset states
      return;
    }

    if (!selectedCameraId) {
      console.warn('No camera selected for scanning.');
      onScanError('Please select a camera to start scanning.');
      stopQrScanner(); // Call stop to reset states
      return;
    }

    // If scanner instance exists and is currently scanning, stop it before restarting
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      await stopQrScanner();
    }

    setIsInitializing(true); // Indicate that initialization is in progress

    // Create Html5Qrcode instance if it doesn't exist (should be handled by useEffect on mount, but good fallback)
    if (!html5QrCodeRef.current) {
      html5QrCodeRef.current = new Html5Qrcode(qrReaderId);
    }
    let hasScanned = false; // Flag to prevent multiple rapid scans

    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
      if (hasScanned) return; // Ignore any scans after the first one
      hasScanned = true;

      console.log(`QR Code Scanned: ${decodedText}`);
      toast.success('QR Code Scanned!', { autoClose: 2000 });

      let parsedContact = {
        name: '', company: '', title: '', email: '', phone: '', notes: '', website: '', vcardString: decodedText
      };

      // Attempt to parse different QR code formats
      if (decodedText.startsWith('BEGIN:VCARD')) {
        const vcardData = parseVCard(decodedText);
        parsedContact = {
          ...parsedContact,
          name: vcardData.name,
          company: vcardData.company,
          title: vcardData.title,
          email: vcardData.email,
          phone: vcardData.phone,
          website: vcardData.website,
          notes: vcardData.notes,
        };
        toast.info('vCard detected.');
      } else if (decodedText.startsWith('tel:')) {
        parsedContact.phone = decodedText.substring(4);
        toast.info('Phone number detected.');
      } else if (decodedText.startsWith('mailto:')) {
        parsedContact.email = decodedText.substring(7);
        toast.info('Email address detected.');
      } else if (decodedText.startsWith('http://wa.me/') || decodedText.startsWith('https://wa.me/')) {
        const phoneMatch = decodedText.match(/wa\.me\/(\+?\d+)/);
        if (phoneMatch) {
          parsedContact.phone = phoneMatch[1];
          parsedContact.notes = `WhatsApp link: ${decodedText}`;
          toast.info('WhatsApp link detected.');
        }
      } else if (decodedText.includes('linkedin.com/in/') || decodedText.includes('linkedin.com/pub/')) {
        parsedContact.website = decodedText;
        parsedContact.notes = `LinkedIn Profile: ${decodedText}`;
        const nameMatch = decodedText.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/);
        if (nameMatch && !parsedContact.name) {
          parsedContact.name = nameMatch[1].replace(/-/g, ' ');
        }
        toast.info('LinkedIn profile detected.');
      } else if (decodedText.startsWith('http://') || decodedText.startsWith('https://')) {
        parsedContact.website = decodedText;
        parsedContact.notes = `Website: ${decodedText}`;
        toast.info('General URL detected.');
      } else {
        if (decodedText.length < 50) {
          parsedContact.name = decodedText;
        } else {
          parsedContact.notes = decodedText;
        }
        toast.info('Plain text detected.');
      }

      onScanSuccess(parsedContact); // Send parsed data to parent
      // IMPORTANT: Stop the scanner immediately after a successful scan to prevent continuous re-detection.
      stopQrScanner();
    };

    const qrCodeErrorCallback = (errorMessage) => {
      // This error callback is for issues *during* scanning (e.g., no QR code found)
      // or for initial permission errors that Html5Qrcode.start() catches.
      if (errorMessage.includes('No QR code found') || errorMessage.includes('NotFoundException')) {
        // IMPORTANT: Explicitly ignore "No QR code found" or "NotFoundException" messages.
        // These are normal during continuous scanning when no QR code is in view.
        // Do NOT call onScanError or stopQrScanner for these.
        // console.log("Scanner is actively looking for a QR code..."); // For debugging
      } else if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        setCameraPermissionStatus('denied');
        onScanError('Camera access denied. Please enable camera in browser settings.');
        // The start() call itself will fail and trigger its catch block, which calls stopQrScanner.
      } else if (errorMessage.includes('NotFoundError')) {
        setCameraPermissionStatus('not-found');
        onScanError('No camera found on this device.');
        // The start() call itself will fail and trigger its catch block, which calls stopQrScanner.
      } else {
        console.error('QR Scanner Runtime Error:', errorMessage);
        onScanError(`QR Scanner Error: ${errorMessage}`);
        // The start() call itself will fail and trigger its catch block, which calls stopQrScanner.
      }
    };

    try {
      // Attempt to start the QR code scanner with the selected camera
      await html5QrCodeRef.current.start(
        selectedCameraId, // Camera ID
        { 
          fps: 20, 
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdgePercentage = 0.8; // 80% of the smallest edge for a larger, easier scan area
            const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
            return {
              width: qrboxSize,
              height: qrboxSize
            };
          },
          disableFlip: false 
        }, // Configuration
        qrCodeSuccessCallback, // Success callback
        qrCodeErrorCallback // Error callback
      );
      setCameraPermissionStatus('granted'); // If start succeeds, permission is granted
      setIsInitializing(false); // Initialization complete
      setIsScanningActive(true); // Camera is now actively scanning
    } catch (err) {
      console.error('Html5Qrcode.start failed:', err);
      // Handle different types of errors during camera start
      if (err.name === 'NotAllowedError') {
        setCameraPermissionStatus('denied');
        onScanError('Camera access denied. Please enable camera permissions for this site in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setCameraPermissionStatus('not-found');
        onScanError('No camera found on this device. Please ensure a camera is connected and working.');
      } else {
        setCameraPermissionStatus('denied'); // General error, treat as denied
        onScanError(`Error accessing camera: ${err.message}. Please check permissions.`);
      }
      setIsInitializing(false); // Initialization failed
      setIsScanningActive(false); // Camera is not active
      stopQrScanner(); // Ensure scanner is stopped if start failed
    }
  }, [onScanSuccess, onScanError, stopQrScanner, selectedCameraId]);

  // Effect to manage scanner lifecycle based on isActive prop and selectedCameraId
  useEffect(() => {
    if (isActive && selectedCameraId) {
      // If active and camera selected, initialize/start the scanner
      initializeQrScanner();
    } else if (!isActive) {
      // If not active, stop the scanner
      stopQrScanner();
    }
  }, [isActive, selectedCameraId, initializeQrScanner, stopQrScanner]);

  // Effect to enumerate cameras and initialize Html5Qrcode instance on mount
  useEffect(() => {
    const qrReaderId = 'dc-network-qr-reader';

    // Initialize Html5Qrcode instance once on mount if it doesn't exist
    if (!html5QrCodeRef.current) {
      html5QrCodeRef.current = new Html5Qrcode(qrReaderId);
    }

    const enumerateCameras = async () => {
      setIsLoadingCameras(true); // Start loading cameras
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const devices = await Html5Qrcode.getCameras(); // Get available camera devices
          setAvailableCameras(devices);
          if (devices && devices.length > 0) {
            // Try to find the back camera automatically
            const backCamera = devices.find(device => 
              device.label.toLowerCase().includes('back') || 
              device.label.toLowerCase().includes('environment') ||
              device.label.toLowerCase().includes('rear')
            );
            setSelectedCameraId(backCamera ? backCamera.id : devices[0].id);
          } else {
            setCameraPermissionStatus('not-found');
            onScanError('No cameras found on this device.');
          }
        } catch (error) {
          console.error('Error enumerating cameras:', error);
          setCameraPermissionStatus('denied'); // Assume denied if enumeration fails
          onScanError(`Error enumerating cameras: ${error.message}. Please check permissions.`);
        }
      } else {
        setCameraPermissionStatus('not-found');
        onScanError('Your browser does not support camera access or it is blocked.');
      }
      setIsLoadingCameras(false); // Finish loading cameras
    };
    enumerateCameras(); // Call enumerate cameras on mount

    // Set up a listener for camera permission changes
    const checkPermission = async () => {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permission = await navigator.permissions.query({ name: 'camera' });
          setCameraPermissionStatus(permission.state); // Update permission status
          permission.onchange = () => {
            setCameraPermissionStatus(permission.state);
            // If permission changes from denied to granted, re-enumerate cameras
            if (permission.state === 'granted') {
              enumerateCameras();
            }
          };
        } catch (error) {
          console.error('Error querying camera permission:', error);
          // If query fails, it might mean the browser doesn't support it or there's a security issue.
          // We'll rely on Html5Qrcode.start()'s error for denied states during render.
        }
      }
    };
    checkPermission(); // Call checkPermission on mount

    return () => {
      // Cleanup function on component unmount: This is the ONLY place clear() should be called.
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.clear(); // Clear all resources and DOM elements
          html5QrCodeRef.current = null; // Nullify ref after clearing
        } catch (error) {
          console.warn("Error clearing QR scanner on unmount:", error);
        }
      }
    };
  }, [onScanError]); // Dependency array for useEffect

  // Handler for camera selection change
  const handleCameraChange = (event) => {
    const newCameraId = event.target.value;
    setSelectedCameraId(newCameraId);
    // If scanner is active, stopping it will trigger the useEffect to restart it with the new camera
    if (isActive) {
      stopQrScanner();
    }
  };

  return (
    <div className="dc-network-qr-active-container">
      {/* Display loading message while cameras are being enumerated */}
      {isLoadingCameras ? (
        <p className="dc-network-loading-message">Loading cameras...</p>
      ) : availableCameras.length === 0 ? (
        // Display error if no cameras are found
        <p className="dc-network-error-message dc-network-mt-4">
          No cameras found on this device. Please ensure a camera is connected and working.
        </p>
      ) : (
        // Camera selection dropdown
        <div className="dc-network-camera-select-container">
          <label htmlFor="camera-select" className="dc-network-camera-select-label">Select Camera:</label>
          <select
            id="camera-select"
            className="dc-network-input-field dc-network-camera-select"
            onChange={handleCameraChange}
            value={selectedCameraId || ''}
            // disabled={isActive} 
          >
            {availableCameras.map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.label || `Camera ${camera.id}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* This div is the target for Html5Qrcode to render the video stream */}
      <div id="dc-network-qr-reader" className="dc-network-qr-reader-container">
        {/* The placeholder content is always rendered inside, but will be visually covered by the video when active */}
        <div className="dc-network-camera-placeholder">
          <img src={cameraPlaceholderSvg} alt="Camera Placeholder" className="dc-network-camera-placeholder-icon" />
          <p className="dc-network-camera-placeholder-text">
            {!selectedCameraId && availableCameras.length > 0 ? 'Please select a camera.' :
             isInitializing ? 'Initializing camera...' :
             cameraPermissionStatus === 'denied' ? 'Camera access denied. Please enable permissions.' :
             isScanningActive ? 'Camera active, scanning for QR code...' : // New message when actively scanning
             'Click "Start Scan" to activate camera.'}
          </p>
        </div>
        {/* The Html5Qrcode library will inject its video element directly into this div
            when it successfully starts, visually replacing the placeholder content. */}
      </div>

      {/* Display specific error messages for camera access issues */}
      {cameraPermissionStatus === 'denied' && (
        <p className="dc-network-error-message dc-network-mt-4">
          Camera access is denied. Please enable camera permissions for this site in your browser settings.
          <br />
          (e.g., Chrome: Settings &gt; Privacy and security &gt; Site Settings &gt; Camera)
          <br />
          Also, ensure you are accessing the site over HTTPS for camera to work.
        </p>
      )}
      {cameraPermissionStatus === 'not-found' && availableCameras.length === 0 && (
        <p className="dc-network-error-message dc-network-mt-4">
          No cameras found on this device. Please ensure a camera is connected and working.
        <br />
        (This message is shown if no cameras are detected at all, even before attempting to start.)
        </p>
      )}
    </div>
  );
};

export default Scanner;
