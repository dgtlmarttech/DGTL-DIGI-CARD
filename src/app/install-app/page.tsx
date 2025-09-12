'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function InstallAppPage() {
  const [deviceType, setDeviceType] = useState('');
  const [browserName, setBrowserName] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Device and browser detection
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    
    if (isIOS) setDeviceType('iOS');
    else if (isAndroid) setDeviceType('Android');
    else setDeviceType('Desktop');

    // Browser detection
    if (/Chrome/.test(userAgent) && !/Edg/.test(userAgent)) setBrowserName('Chrome');
    else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) setBrowserName('Safari');
    else if (/Edg/.test(userAgent)) setBrowserName('Edge');
    else if (/Firefox/.test(userAgent)) setBrowserName('Firefox');
    else setBrowserName('Browser');

    // Check if Web Share API is available (for iOS native share)
    setCanShare('share' in navigator);

    // Check if already running as PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Handle PWA install prompt - This is the key for direct browser popup
    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault(); // Prevent automatic browser prompt
      setDeferredPrompt(e); // Store the event for later use
    }

    function handleAppInstalled() {
      setIsStandalone(true);
      // Show success message
      const success = document.createElement('div');
      success.className = 'fixed top-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50';
      success.innerHTML = '🎉 DgtlDigiCard installed successfully!';
      document.body.appendChild(success);
      setTimeout(() => success.remove(), 4000);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Direct PWA Installation - This triggers the native browser popup
  const handleDirectInstall = async () => {
    if (deferredPrompt) {
      try {
        // This shows the NATIVE BROWSER INSTALL POPUP directly
        const promptResult = await (deferredPrompt as any).prompt();
        const choiceResult = await (deferredPrompt as any).userChoice;
        
        console.log('Install prompt result:', choiceResult.outcome);
        
        if (choiceResult.outcome === 'accepted') {
          setIsStandalone(true);
        }
        
        setDeferredPrompt(null); // Clear the deferred prompt
      } catch (error) {
        console.error('Installation failed:', error);
        // Fallback to manual instructions
        showManualInstructions();
      }
    } else {
      // No native prompt available, show manual instructions
      showManualInstructions();
    }
  };

  // iOS Native Share Menu - This opens the iOS share dialog
  const handleIOSShare = async () => {
    if (canShare && 'share' in navigator) {
      try {
        // This opens the NATIVE iOS SHARE MENU
        await navigator.share({
          title: 'DgtlDigiCard - Digital Business Cards',
          text: 'Install DgtlDigiCard as an app for the best experience!',
          url: window.location.origin
        });
        
        // Show instructions after sharing
        setTimeout(() => {
          const modal = document.createElement('div');
          modal.className = 'fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-4';
          modal.innerHTML = `
            <div class="bg-white rounded-2xl max-w-sm w-full p-6 text-center animate-pop-in">
              <div class="text-4xl mb-4">📱</div>
              <h3 class="text-xl font-bold mb-4">Add to Home Screen</h3>
              <p class="text-gray-600 mb-4">
                In the share menu that just opened, scroll down and tap "Add to Home Screen" to install the app.
              </p>
              <button onclick="this.closest('.fixed').remove();" 
                      class="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                Got It
              </button>
            </div>
            <style>
              @keyframes pop-in {
                from { opacity: 0; transform: scale(0.8); }
                to { opacity: 1; transform: scale(1); }
              }
              .animate-pop-in { animation: pop-in 0.3s ease-out; }
            </style>
          `;
          document.body.appendChild(modal);
          setTimeout(() => modal.remove(), 10000);
        }, 1000);
        
      } catch (error) {
        console.log('Share was cancelled or failed:', error);
        // Fallback to manual instructions
        showManualInstructions();
      }
    } else {
      // Web Share API not available, show manual instructions
      showManualInstructions();
    }
  };

  const showManualInstructions = () => {
    const isIOS = deviceType === 'iOS';
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-sm w-full p-6 text-center animate-pop-in">
        <div class="text-4xl mb-4">${isIOS ? '🍎' : '🤖'}</div>
        <h3 class="text-xl font-bold mb-4">Manual Installation</h3>
        <div class="text-left space-y-3">
          ${isIOS ? `
            <div class="flex items-center space-x-2 text-sm">
              <span class="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">1</span>
              <span>Tap Share (↑) button in Safari</span>
            </div>
            <div class="flex items-center space-x-2 text-sm">
              <span class="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">2</span>
              <span>Scroll down → "Add to Home Screen"</span>
            </div>
            <div class="flex items-center space-x-2 text-sm">
              <span class="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">3</span>
              <span>Tap "Add" to install</span>
            </div>
          ` : `
            <div class="flex items-center space-x-2 text-sm">
              <span class="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">1</span>
              <span>Tap menu (⋮) in ${browserName}</span>
            </div>
            <div class="flex items-center space-x-2 text-sm">
              <span class="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">2</span>
              <span>Tap "Add to Home screen"</span>
            </div>
            <div class="flex items-center space-x-2 text-sm">
              <span class="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">3</span>
              <span>Tap "Install" or "Add"</span>
            </div>
          `}
        </div>
        <button onclick="this.closest('.fixed').remove();" 
                class="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
          Got It
        </button>
      </div>
      <style>
        @keyframes pop-in {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-pop-in { animation: pop-in 0.3s ease-out; }
      </style>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.remove(), 15000);
  };

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              App Already Installed!
            </h1>
            <p className="text-gray-600 mb-6">
              DgtlDigiCard is running as an installed app on your device.
            </p>
            <Link 
              href="/"
              className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition duration-200 shadow-lg"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <img
                src="/dgtlmart-logo.png"
                alt="DgtlDigiCard Logo"
                className="h-10 w-auto object-contain"
              />
              <span className="text-xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
                DgtlDigiCard
              </span>
            </Link>
            <Link 
              href="/"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Install DgtlDigiCard Progressive Web App
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            {deviceType} / {browserName}
          </p>
          <p className="text-gray-500">
            Get native app experience with offline access and home screen installation
          </p>
        </div>

        {/* Installation Options */}
        <div className="grid gap-8 max-w-2xl mx-auto">
          
          {/* Direct Install Button (Android Chrome/Edge) - Native Browser Popup */}
          {deferredPrompt && (
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
              <div className="text-center">
                <div className="text-5xl mb-4">🚀</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  One-Click Installation Available
                </h2>
                <p className="text-gray-600 mb-6">
                  Click below to open the native browser install dialog.
                </p>
                <button
                  onClick={handleDirectInstall}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-8 rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition duration-200 shadow-lg transform hover:scale-105"
                >
                  🚀 Install PWA (Native Popup)
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  This will show your browser's native installation dialog
                </p>
              </div>
            </div>
          )}

          {/* iOS Native Share Button */}
          {deviceType === 'iOS' && canShare && (
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
              <div className="text-center">
                <div className="text-5xl mb-4">🍎</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  iOS Installation
                </h2>
                <p className="text-gray-600 mb-6">
                  Click below to open the native iOS share menu, then select "Add to Home Screen".
                </p>
                <button
                  onClick={handleIOSShare}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-8 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition duration-200 shadow-lg transform hover:scale-105"
                >
                  📱 Open Share Menu (Native)
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  This will open iOS native share dialog
                </p>
              </div>
            </div>
          )}

          {/* Manual Installation Fallback */}
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
            <div className="flex items-center mb-6">
              <div className={`w-16 h-16 ${
                deviceType === 'iOS' ? 'bg-gray-100' : 
                deviceType === 'Android' ? 'bg-green-100' : 'bg-purple-100'
              } rounded-full flex items-center justify-center mr-4`}>
                <span className="text-3xl">
                  {deviceType === 'iOS' ? '🍎' : deviceType === 'Android' ? '🤖' : '💻'}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Manual Installation</h2>
                <p className="text-gray-600">If automatic installation doesn't work</p>
              </div>
            </div>

            <button
              onClick={showManualInstructions}
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 px-8 rounded-xl font-bold text-lg hover:from-gray-700 hover:to-gray-800 transition duration-200 shadow-lg"
            >
              📋 Show Manual Instructions
            </button>
          </div>

          {/* Benefits Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-6 text-center">Why Install DgtlDigiCard?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <h3 className="font-semibold mb-1">Lightning Fast</h3>
                  <p className="text-blue-100 text-sm">Instant loading and smooth performance</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-2xl">📴</span>
                <div>
                  <h3 className="font-semibold mb-1">Works Offline</h3>
                  <p className="text-blue-100 text-sm">Access your cards without internet</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🏠</span>
                <div>
                  <h3 className="font-semibold mb-1">Home Screen Access</h3>
                  <p className="text-blue-100 text-sm">One tap to open from your device</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🔒</span>
                <div>
                  <h3 className="font-semibold mb-1">Secure & Private</h3>
                  <p className="text-blue-100 text-sm">No app store tracking or permissions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
