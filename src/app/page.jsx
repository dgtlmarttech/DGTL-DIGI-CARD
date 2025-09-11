'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../context/userContext';
import { signOutUser } from '../services/firebaseAuthService';

function AddToHomeScreenPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if device is iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if app is already installed/running as PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Show prompt after 3 seconds if not dismissed and not already installed
    const timer = setTimeout(() => {
      if (!localStorage.getItem('pwaInstallDismissed') && !standalone) {
        setShowPrompt(true);
      }
    }, 3000);

    function handleBeforeInstallPrompt(e) {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!localStorage.getItem('pwaInstallDismissed') && !standalone) {
        setShowPrompt(true);
      }
    }

    function handleAppInstalled() {
      localStorage.setItem('pwaInstalled', 'true');
      setShowPrompt(false);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const onInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(choiceResult => {
        if (choiceResult.outcome === 'accepted') {
          setShowPrompt(false);
          localStorage.setItem('pwaInstalled', 'true');
        } else {
          localStorage.setItem('pwaInstallDismissed', 'true');
        }
        setDeferredPrompt(null);
      });
    }
  };

  const onDismiss = () => {
    localStorage.setItem('pwaInstallDismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white text-center">
            <div className="text-4xl mb-3">📱</div>
            <h3 className="text-xl font-bold mb-2">Install DgtlDigiCard</h3>
            <p className="text-blue-100 text-sm">Get the best experience with our app</p>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600">⚡</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Faster Loading</p>
                  <p className="text-gray-600 text-sm">Lightning-fast performance</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600">📱</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Home Screen Access</p>
                  <p className="text-gray-600 text-sm">One tap to open your cards</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600">🔒</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Works Offline</p>
                  <p className="text-gray-600 text-sm">Access your cards anytime</p>
                </div>
              </div>
            </div>

            {/* iOS specific instructions */}
            {isIOS && !deferredPrompt && (
              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <p className="text-blue-800 text-sm font-semibold mb-2">For iPhone/iPad users:</p>
                <div className="flex items-center space-x-2 text-blue-700 text-sm">
                  <span>1. Tap</span>
                  <div className="w-5 h-5 bg-blue-200 rounded flex items-center justify-center">
                    <span className="text-xs">↑</span>
                  </div>
                  <span>share button</span>
                </div>
                <p className="text-blue-700 text-sm mt-1">2. Scroll down and tap "Add to Home Screen"</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              {deferredPrompt && (
                <button
                  onClick={onInstallClick}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
                >
                  Install App
                </button>
              )}
              
              <button
                onClick={onDismiss}
                className={`${deferredPrompt ? 'flex-1' : 'w-full'} border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200`}
              >
                {deferredPrompt ? 'Maybe Later' : 'Got It'}
              </button>
            </div>
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
    </>
  );
}

// Alternative: Floating Banner Prompt (less intrusive)
function FloatingInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!localStorage.getItem('pwaInstallDismissed') && 
          !window.matchMedia('(display-mode: standalone)').matches) {
        setShowBanner(true);
      }
    }, 5000);

    function handleBeforeInstallPrompt(e) {
      e.preventDefault();
      setDeferredPrompt(e);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(choiceResult => {
        if (choiceResult.outcome === 'accepted') {
          setShowBanner(false);
          localStorage.setItem('pwaInstalled', 'true');
        }
        setDeferredPrompt(null);
      });
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwaInstallDismissed', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed top-20 left-4 right-4 z-40 animate-slide-down">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg p-4 max-w-md mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">📱</div>
            <div>
              <p className="font-semibold text-sm">Install DgtlDigiCard</p>
              <p className="text-blue-100 text-xs">For the best experience</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {deferredPrompt && (
              <button
                onClick={handleInstall}
                className="bg-white text-blue-600 px-3 py-1 rounded-lg text-sm font-semibold hover:bg-blue-50 transition"
              >
                Install
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="text-white/80 hover:text-white text-xl leading-none"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { user, userInfo, isAuthenticated, loading, initializing } = useUser();
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    // Show permanent install button if PWA is supported but not installed
    const checkPWAStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isPWACapable = 'serviceWorker' in navigator;
      const notDismissedPermanently = !localStorage.getItem('pwaInstallDismissedPermanently');
      
      if (isPWACapable && !isStandalone && notDismissedPermanently) {
        setShowInstallButton(true);
      }
    };

    checkPWAStatus();
  }, []);

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

  const handleInstallClick = () => {
    // This will trigger the AddToHomeScreenPrompt to show
    localStorage.removeItem('pwaInstallDismissed');
    window.location.reload();
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
              {/* Install App Button - Always visible if PWA supported */}
              {showInstallButton && (
                <button
                  onClick={handleInstallClick}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold text-sm hover:from-green-700 hover:to-green-800 transition duration-200 shadow-md"
                >
                  📱 Install App
                </button>
              )}
              
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

          {/* PWA Install CTA for Mobile */}
          {showInstallButton && (
            <div className="sm:hidden mb-8">
              <button
                onClick={handleInstallClick}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition duration-200 shadow-lg transform hover:scale-105"
              >
                📱 Install App for Better Experience
              </button>
            </div>
          )}

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

      {/* PWA Install Prompts */}
      <AddToHomeScreenPrompt />
      <FloatingInstallBanner />
    </div>
  );
}
