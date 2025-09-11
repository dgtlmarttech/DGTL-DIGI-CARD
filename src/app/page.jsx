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
      handleFallbackInstall();
      return;
    }

    try {
      setIsInstalling(true);
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
      localStorage.removeItem('pwaInstallDismissed');
      window.location.reload();
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 mb-5 leading-tight">
            Your Digital Business Card
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Made Simple
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-16 max-w-3xl mx-auto leading-relaxed">
            Create stunning, professional digital business cards that make lasting impressions.
            Share your contact info instantly with QR codes, custom URLs, and beautiful designs.
          </p>

          {/* Auth-based Actions */}
          {isAuthenticated ? (
            <div className="flex justify-center items-center mb-20 space-x-8 flex-wrap">
              <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100 max-w-md w-full sm:w-auto">
                <div className="flex items-center mb-6">
                  {userInfo?.imgUrl ? (
                    <img
                      src={userInfo.imgUrl}
                      alt="Profile"
                      className="h-20 w-20 rounded-full object-cover border-4 border-blue-100"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-extrabold text-3xl select-none">
                      {userInfo?.firstName?.[0] || user?.email?.[0] || '?'}
                    </div>
                  )}
                  <div className="ml-6 text-left">
                    <h3 className="text-2xl font-semibold text-gray-900">
                      Welcome back, {userInfo?.firstName || 'User'}!
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {userInfo?.isPremium
                        ? '👑 Premium Member'
                        : userInfo?.effectiveIsPremium
                        ? '🚀 Trial Active'
                        : '💫 Free Plan'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition duration-200 shadow-lg"
                  >
                    📊 Open Dashboard
                  </button>
                  <button
                    onClick={handleViewCard}
                    className="w-full bg-white border-2 border-blue-200 text-blue-700 py-3 rounded-xl font-semibold hover:bg-blue-50 transition duration-200"
                  >
                    👁️ View My Card
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-gray-600 py-2 rounded-xl font-medium hover:text-gray-800 hover:bg-gray-100 transition duration-200"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center mb-20 gap-6 flex-wrap">
              <button
                onClick={() => router.push('/signup')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-10 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition duration-200 shadow-lg transform hover:scale-105"
              >
                🚀 Get Started Free
              </button>
              <button
                onClick={() => router.push('/signin')}
                className="bg-white border-2 border-gray-300 text-gray-700 py-4 px-10 rounded-xl font-semibold text-lg hover:bg-gray-50 hover:border-gray-400 transition duration-200"
              >
                Sign In
              </button>
            </div>
          )}

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                icon: '🎨',
                title: 'Beautiful Designs',
                description:
                  'Choose from stunning templates or customize your own unique design.',
              },
              {
                icon: '📱',
                title: 'Mobile Optimized',
                description:
                  'Perfect viewing experience on all devices, from phones to desktops.',
              },
              {
                icon: '🔗',
                title: 'Easy Sharing',
                description:
                  'Share via QR codes, custom URLs, or direct links. No app required.',
              },
            ].map(({ icon, title, description }) => (
              <div
                key={title}
                className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition duration-300 flex flex-col items-center text-center"
                tabIndex={0}
                aria-label={title}
              >
                <div className="text-5xl mb-5">{icon}</div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-900">{title}</h3>
                <p className="text-gray-600">{description}</p>
              </div>
            ))}
          </div>

          {/* CTA Section for Non-authenticated */}
          {!isAuthenticated && (
            <section className="mt-28 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-14 text-white max-w-3xl mx-auto shadow-lg">
              <h2 className="text-4xl font-bold mb-5">Ready to Go Digital?</h2>
              <p className="text-blue-100 mb-10 text-lg">
                Join thousands of professionals who've ditched paper cards forever.
              </p>
              <button
                onClick={() => router.push('/signup')}
                className="bg-white text-blue-600 py-4 px-12 rounded-xl font-semibold text-lg hover:bg-blue-50 transition duration-200 shadow-lg"
              >
                Create Your Card Now
              </button>
            </section>
          )}
        </div>
      </main>

      {/* PWA Install Components */}
      <DirectPWAInstaller />
    </div>
  );
}
