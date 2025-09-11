'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../context/userContext';
import { signOutUser } from '../services/firebaseAuthService';

function AddToHomeScreenPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [browserName, setBrowserName] = useState('');

  useEffect(() => {
    // Detect device and browser
    const userAgent = navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(userAgent);
    const android = /Android/.test(userAgent);
    const chrome = /Chrome/.test(userAgent);
    const safari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    const firefox = /Firefox/.test(userAgent);
    const edge = /Edg/.test(userAgent);

    setIsIOS(iOS);
    setIsAndroid(android);
    
    if (chrome) setBrowserName('Chrome');
    else if (safari) setBrowserName('Safari');
    else if (firefox) setBrowserName('Firefox');
    else if (edge) setBrowserName('Edge');

    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      window.navigator.standalone || 
                      document.referrer.includes('android-app://');
    setIsStandalone(standalone);

    // Show prompt after 2 seconds if conditions are met
    const timer = setTimeout(() => {
      if (!localStorage.getItem('pwaInstallDismissed') && !standalone) {
        setShowPrompt(true);
      }
    }, 2000);

    // Handle beforeinstallprompt event (Android Chrome)
    function handleBeforeInstallPrompt(e) {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!localStorage.getItem('pwaInstallDismissed') && !standalone) {
        setShowPrompt(true);
      }
    }

    // Handle app installed event
    function handleAppInstalled() {
      localStorage.setItem('pwaInstalled', 'true');
      setShowPrompt(false);
      // Show success message
      setTimeout(() => {
        alert('🎉 DgtlDigiCard has been installed successfully!');
      }, 1000);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    try {
      if (deferredPrompt) {
        // Android Chrome - Direct installation
        const result = await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        
        if (choice.outcome === 'accepted') {
          setShowPrompt(false);
          localStorage.setItem('pwaInstalled', 'true');
        } else {
          localStorage.setItem('pwaInstallDismissed', 'true');
        }
        setDeferredPrompt(null);
      } else if (isIOS) {
        // iOS - Automated instructions with visual guide
        showIOSInstallGuide();
      } else if (isAndroid) {
        // Android other browsers - Show specific browser instructions
        showAndroidInstallGuide();
      } else {
        // Desktop - Show desktop installation guide
        showDesktopInstallGuide();
      }
    } catch (error) {
      console.error('Installation error:', error);
      // Fallback to manual instructions
      showManualInstallGuide();
    }
  };

  const showIOSInstallGuide = () => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-sm w-full p-6 text-center animate-scale-in">
        <div class="text-4xl mb-4">📱</div>
        <h3 class="text-xl font-bold mb-4">Install DgtlDigiCard</h3>
        
        <div class="space-y-4 text-left">
          <div class="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <div class="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold">1</div>
            <div>
              <p class="font-semibold text-sm">Tap the Share button</p>
              <div class="flex items-center space-x-1 text-xs text-gray-600 mt-1">
                <div class="w-4 h-4 bg-blue-500 rounded flex items-center justify-center text-white text-xs">↑</div>
                <span>at the bottom of Safari</span>
              </div>
            </div>
          </div>
          
          <div class="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <div class="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-white font-bold">2</div>
            <div>
              <p class="font-semibold text-sm">Scroll and tap "Add to Home Screen"</p>
              <p class="text-xs text-gray-600 mt-1">Look for the + icon</p>
            </div>
          </div>
          
          <div class="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
            <div class="w-8 h-8 bg-purple-500 rounded flex items-center justify-center text-white font-bold">3</div>
            <div>
              <p class="font-semibold text-sm">Tap "Add" to confirm</p>
              <p class="text-xs text-gray-600 mt-1">App will appear on your home screen</p>
            </div>
          </div>
        </div>
        
        <div class="mt-6 flex gap-2">
          <button onclick="this.closest('.fixed').remove(); localStorage.setItem('pwaInstallDismissed', 'true');" 
                  class="flex-1 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50">
            Got It
          </button>
          <button onclick="this.closest('.fixed').remove(); window.location.reload();" 
                  class="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
            Done
          </button>
        </div>
      </div>
      
      <style>
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
      </style>
    `;
    
    document.body.appendChild(modal);
    
    // Auto-remove after 30 seconds
    setTimeout(() => {
      if (modal.parentNode) {
        modal.remove();
      }
    }, 30000);
  };

  const showAndroidInstallGuide = () => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-sm w-full p-6 text-center animate-scale-in">
        <div class="text-4xl mb-4">🤖</div>
        <h3 class="text-xl font-bold mb-4">Install DgtlDigiCard</h3>
        
        <div class="space-y-4 text-left">
          <div class="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <div class="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-white font-bold">1</div>
            <div>
              <p class="font-semibold text-sm">Tap the menu (⋮) in ${browserName}</p>
              <p class="text-xs text-gray-600 mt-1">Usually at top-right corner</p>
            </div>
          </div>
          
          <div class="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <div class="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold">2</div>
            <div>
              <p class="font-semibold text-sm">Tap "Add to Home screen" or "Install app"</p>
              <p class="text-xs text-gray-600 mt-1">Look for the + or download icon</p>
            </div>
          </div>
          
          <div class="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
            <div class="w-8 h-8 bg-purple-500 rounded flex items-center justify-center text-white font-bold">3</div>
            <div>
              <p class="font-semibold text-sm">Tap "Install" or "Add"</p>
              <p class="text-xs text-gray-600 mt-1">App will be added to your home screen</p>
            </div>
          </div>
        </div>
        
        <div class="mt-6 flex gap-2">
          <button onclick="this.closest('.fixed').remove(); localStorage.setItem('pwaInstallDismissed', 'true');" 
                  class="flex-1 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50">
            Got It
          </button>
          <button onclick="this.closest('.fixed').remove(); window.location.reload();" 
                  class="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">
            Done
          </button>
        </div>
      </div>
      
      <style>
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
      </style>
    `;
    
    document.body.appendChild(modal);
    
    setTimeout(() => {
      if (modal.parentNode) {
        modal.remove();
      }
    }, 30000);
  };

  const showDesktopInstallGuide = () => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl max-w-md w-full p-6 text-center animate-scale-in">
        <div class="text-4xl mb-4">💻</div>
        <h3 class="text-xl font-bold mb-4">Install DgtlDigiCard</h3>
        
        <div class="space-y-4 text-left">
          <div class="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <div class="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold">1</div>
            <div>
              <p class="font-semibold text-sm">Look for install icon in address bar</p>
              <p class="text-xs text-gray-600 mt-1">Usually a + or download icon</p>
            </div>
          </div>
          
          <div class="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <div class="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-white font-bold">2</div>
            <div>
              <p class="font-semibold text-sm">Click "Install DgtlDigiCard"</p>
              <p class="text-xs text-gray-600 mt-1">Or use Ctrl+Shift+A (Chrome)</p>
            </div>
          </div>
          
          <div class="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
            <div class="w-8 h-8 bg-purple-500 rounded flex items-center justify-center text-white font-bold">3</div>
            <div>
              <p class="font-semibold text-sm">App opens in new window</p>
              <p class="text-xs text-gray-600 mt-1">Access from desktop or taskbar</p>
            </div>
          </div>
        </div>
        
        <div class="mt-6 flex gap-2">
          <button onclick="this.closest('.fixed').remove(); localStorage.setItem('pwaInstallDismissed', 'true');" 
                  class="flex-1 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50">
            Got It
          </button>
        </div>
      </div>
      
      <style>
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
      </style>
    `;
    
    document.body.appendChild(modal);
  };

  const onDismiss = () => {
    localStorage.setItem('pwaInstallDismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in">
        
        {/* Header with device-specific styling */}
        <div className={`${
          isIOS ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 
          isAndroid ? 'bg-gradient-to-r from-green-600 to-green-700' : 
          'bg-gradient-to-r from-blue-600 to-purple-600'
        } p-6 text-white text-center`}>
          <div className="text-4xl mb-3">
            {isIOS ? '🍎' : isAndroid ? '🤖' : '💻'}
          </div>
          <h3 className="text-xl font-bold mb-2">Install DgtlDigiCard</h3>
          <p className="text-sm opacity-90">
            {deferredPrompt ? 'One-click installation available!' : 
             isIOS ? 'Install on your iPhone/iPad' :
             isAndroid ? 'Add to your Android home screen' :
             'Install on your device'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600">⚡</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Instant Access</p>
                <p className="text-gray-600 text-sm">Launch directly from home screen</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600">🚀</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Faster Performance</p>
                <p className="text-gray-600 text-sm">Native app-like experience</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600">📴</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Works Offline</p>
                <p className="text-gray-600 text-sm">Access your cards anywhere</p>
              </div>
            </div>
          </div>

          {/* Install Button with device-specific text */}
          <div className="flex gap-3">
            <button
              onClick={handleInstallClick}
              className={`flex-1 py-4 px-6 rounded-xl font-semibold text-white shadow-lg transition-all duration-200 transform hover:scale-105 ${
                isIOS ? 'bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black' :
                isAndroid ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' :
                'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
              }`}
            >
              {deferredPrompt ? '📱 Install Now' : 
               isIOS ? '🍎 Add to iPhone' :
               isAndroid ? '🤖 Add to Android' :
               '💻 Install App'}
            </button>
            
            <button
              onClick={onDismiss}
              className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              Later
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

// Enhanced Install Button Component
function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check installation status
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      window.navigator.standalone;
    setIsStandalone(standalone);

    if (!standalone) {
      setCanInstall(true);
    }

    function handleBeforeInstallPrompt(e) {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      const result = await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      
      if (choice.outcome === 'accepted') {
        setCanInstall(false);
        // Show success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50';
        notification.textContent = '🎉 App installed successfully!';
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
      }
      setDeferredPrompt(null);
    } else {
      // Show manual installation guide
      localStorage.removeItem('pwaInstallDismissed');
      window.location.reload();
    }
  };

  if (isStandalone || !canInstall) return null;

  return (
    <button
      onClick={handleInstall}
      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold text-sm hover:from-green-700 hover:to-green-800 transition duration-200 shadow-md transform hover:scale-105"
    >
      📱 Install App
    </button>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { user, userInfo, isAuthenticated, loading, initializing } = useUser();

  const handleSignOut = async () => {
    try {
      await signOutUser();
      router.push('/signin');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleViewCard = () => {
    const cardUrl = userInfo?.customUID || user?.uid;
    if (cardUrl) {
      router.push(`/${cardUrl}`);
    }
  };

  if (initializing || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <img
                src="/dgtlmart-logo.png"
                alt="DgtlDigiCard Logo"
                className="h-12 w-auto object-contain"
                loading="lazy"
              />
              <span className="text-2xl font-extrabold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
                DgtlDigiCard
              </span>
            </div>
            <nav className="flex items-center gap-4">
              {/* Enhanced Install Button */}
              <InstallButton />
              
              {!isAuthenticated ? (
                <>
                  <button
                    onClick={() => router.push('/signin')}
                    className="px-4 py-2 rounded-lg text-gray-700 border-2 border-gray-300 hover:bg-gray-50 transition font-semibold"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => router.push('/signup')}
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition font-semibold shadow"
                  >
                    Sign Up
                  </button>
                </>
              ) : null}
            </nav>
          </div>
        </div>
      </header>

      {/* Rest of your existing homepage content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Your existing main content here */}
      </main>

      {/* Enhanced PWA Install Prompt */}
      <AddToHomeScreenPrompt />
    </div>
  );
}
