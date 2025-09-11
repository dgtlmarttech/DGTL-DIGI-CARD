'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../context/userContext';
import { signOutUser } from '../services/firebaseAuthService';

function DirectPWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone;
    
    if (isStandalone) return;

    // Capture the beforeinstallprompt event
    function handleBeforeInstallPrompt(e) {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Auto-show prompt after 3 seconds if not dismissed before
      setTimeout(() => {
        if (!localStorage.getItem('pwaInstallDismissed')) {
          setShowPrompt(true);
        }
      }, 3000);
    }

    // Handle successful installation
    function handleAppInstalled(e) {
      console.log('PWA was installed', e);
      setShowPrompt(false);
      localStorage.setItem('pwaInstalled', 'true');
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 animate-slide-in';
      successDiv.innerHTML = `
        <div class="flex items-center gap-2">
          <span>🎉</span>
          <span>App installed successfully!</span>
        </div>
      `;
      document.body.appendChild(successDiv);
      
      setTimeout(() => successDiv.remove(), 4000);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleDirectInstall = async () => {
    if (!deferredPrompt) {
      // If no native prompt available, try alternative methods
      handleFallbackInstall();
      return;
    }

    try {
      setIsInstalling(true);
      
      // Show the native install prompt (Android Chrome/Edge)
      const promptResult = await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setShowPrompt(false);
        localStorage.setItem('pwaInstalled', 'true');
      } else {
        localStorage.setItem('pwaInstallDismissed', 'true');
        setShowPrompt(false);
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Installation failed:', error);
      handleFallbackInstall();
    } finally {
      setIsInstalling(false);
    }
  };

  const handleFallbackInstall = () => {
    // Create overlay with device-specific quick instructions
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-4';
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    overlay.innerHTML = `
      <div class="bg-white rounded-2xl max-w-sm w-full p-6 text-center animate-pop-in">
        <div class="text-4xl mb-4">${isIOS ? '🍎' : isAndroid ? '🤖' : '💻'}</div>
        <h3 class="text-xl font-bold mb-4">Quick Install</h3>
        
        ${isIOS ? `
          <div class="bg-blue-50 rounded-xl p-4 mb-4">
            <p class="text-sm font-semibold mb-2">iOS - Safari Only:</p>
            <div class="space-y-2 text-sm">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">1</span>
                <span>Tap Share ↑ button below</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">2</span>
                <span>Scroll → "Add to Home Screen"</span>
              </div>
            </div>
          </div>
        ` : isAndroid ? `
          <div class="bg-green-50 rounded-xl p-4 mb-4">
            <p class="text-sm font-semibold mb-2">Android:</p>
            <div class="space-y-2 text-sm">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">1</span>
                <span>Menu ⋮ → "Add to Home screen"</span>
              </div>
            </div>
          </div>
        ` : `
          <div class="bg-purple-50 rounded-xl p-4 mb-4">
            <p class="text-sm font-semibold mb-2">Desktop:</p>
            <div class="space-y-2 text-sm">
              <div class="flex items-center gap-2">
                <span class="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs">1</span>
                <span>Look for install icon in address bar</span>
              </div>
            </div>
          </div>
        `}
        
        <button onclick="this.closest('.fixed').remove(); localStorage.setItem('pwaInstallDismissed', 'true');" 
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
    
    document.body.appendChild(overlay);
    
    // Auto-remove after 15 seconds
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.remove();
      }
    }, 15000);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwaInstallDismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 max-w-sm mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xl">
            📱
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-sm">Install DgtlDigiCard</h3>
            <p className="text-gray-600 text-xs">Instant access from home screen</p>
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleDirectInstall}
            disabled={isInstalling}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-semibold text-sm hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50"
          >
            {isInstalling ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Installing...
              </div>
            ) : deferredPrompt ? (
              "Install Now"
            ) : (
              "Quick Install"
            )}
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
          >
            ×
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}

// Header Install Button - Most Direct Available
function HeaderInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone ||
                       localStorage.getItem('pwaInstalled');
    
    if (!isInstalled) {
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

  const handleQuickInstall = async () => {
    if (deferredPrompt) {
      // Direct installation for supported browsers
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        
        if (choice.outcome === 'accepted') {
          setCanInstall(false);
        }
      } catch (error) {
        console.error('Direct install failed:', error);
      }
    } else {
      // Force show the prompt
      localStorage.removeItem('pwaInstallDismissed');
      window.dispatchEvent(new Event('show-install-prompt'));
    }
  };

  if (!canInstall) return null;

  return (
    <button
      onClick={handleQuickInstall}
      className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold text-sm hover:from-green-700 hover:to-green-800 transition duration-200 shadow-md transform hover:scale-105"
    >
      <span>📱</span>
      <span>{deferredPrompt ? 'Install' : 'Get App'}</span>
    </button>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { user, userInfo, isAuthenticated, loading, initializing } = useUser();

  // Rest of your existing code...

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
              {/* Most Direct Install Button Possible */}
              <HeaderInstallButton />
              
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

      {/* Your existing main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Your existing content here */}
      </main>

      {/* Direct PWA Installer */}
      <DirectPWAInstaller />
    </div>
  );
}
