'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../context/userContext';
import { signOutUser } from '../services/firebaseAuthService';

function PWAInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Show banner after 5 seconds if not dismissed and not already installed
    const timer = setTimeout(() => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone;
      const dismissed = localStorage.getItem('pwaInstallDismissed');

      if (!isStandalone && !dismissed) {
        setShowBanner(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleInstallClick = () => {
    router.push('/install-app');
  };

  const handleDismiss = () => {
    localStorage.setItem('pwaInstallDismissed', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 relative animate-slide-down">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-lg">
            📱
          </div>
          <div>
            <p className="font-semibold text-sm">Install DgtlDigiCard App</p>
            <p className="text-xs text-blue-100">Get quick access and offline features</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleInstallClick}
            className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-semibold hover:cursor-pointer hover:bg-blue-50 transition-colors duration-200"
          >
            Install Now
          </button>
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:cursor-pointer hover:text-white hover:bg-white/10 rounded-full p-2 transition-colors duration-200"
            aria-label="Dismiss banner"
          >
            ✕
          </button>
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
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

function HeaderInstallButton() {
  const [canInstall, setCanInstall] = useState(false);
  const router = useRouter();
  const { isAuthenticated } = useUser(); // Add this line

  useEffect(() => {
    if (!isAuthenticated) {
      setCanInstall(false);
      return;
    }

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone;

    if (!isStandalone) {
      setCanInstall(true);
    }
  }, [isAuthenticated]); // Add to dependency array

  if (!canInstall) return null;

  return (
    <button
      onClick={() => router.push('/install-app')}
      className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold text-sm hover:cursor-pointer hover:from-green-700 hover:to-green-800 transition duration-200 shadow-md transform hover:scale-105"
    >
      <span>📱</span>
      <span>Install App</span>
    </button>
  );
}


export default function HomePage() {
  const router = useRouter();
  const { user, userInfo, isAuthenticated, loading, initializing, isStandalone } = useUser();

  useEffect(() => {
    // If running in standalone mode (installed PWA) and authenticated,
    // automatically redirect to the user's card.
    if (isStandalone && isAuthenticated && !initializing && !loading) {
      const cardUrl = userInfo?.customUID || user?.uid;
      if (cardUrl) {
        router.push(`/${cardUrl}`);
      }
    }
  }, [isStandalone, isAuthenticated, initializing, loading, userInfo, user, router]);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <img
                src="/dgtlmart-logo.png"
                alt="DgtlDigiCard Logo"
                className="h-10 sm:h-12 w-auto object-contain"
                loading="lazy"
              />
            </div>
            <nav className="flex items-center gap-2 sm:gap-4">
              <HeaderInstallButton />

              {!isAuthenticated ? (
                <>
                  <button
                    onClick={() => router.push('/signin')}
                    className="px-3 sm:px-4 py-2 rounded-lg text-gray-700 border-2 border-gray-300 hover:cursor-pointer hover:bg-gray-50 transition font-semibold text-sm sm:text-base"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => router.push('/signup')}
                    className="px-3 sm:px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:cursor-pointer hover:from-blue-700 hover:to-purple-700 transition font-semibold shadow text-sm sm:text-base"
                  >
                    Sign Up
                  </button>
                </>
              ) : null}
            </nav>
          </div>
        </div>
      </header>

      {/* PWA Install Banner - Under Navbar */}
      <PWAInstallBanner />

      {/* Main Content - Mobile and Desktop Compatible */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold text-gray-900 mb-4 sm:mb-5 leading-tight">
            Your Digital Business Card
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Made Simple
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-12 sm:mb-16 max-w-3xl mx-auto leading-relaxed px-4">
            Create stunning, professional digital business cards that make lasting impressions.
            Share your contact info instantly with QR codes, custom URLs, and beautiful designs.
          </p>

          {/* Auth-based Actions */}
          {isAuthenticated ? (
            <div className="flex justify-center items-center mb-16 sm:mb-20">
              <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-gray-100 max-w-md w-full mx-4">
                <div className="flex flex-col sm:flex-row items-center mb-6">
                  {userInfo?.imgUrl ? (
                    <img
                      src={userInfo.imgUrl}
                      alt="Profile"
                      className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover border-4 border-blue-100 mb-4 sm:mb-0"
                    />
                  ) : (
                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-extrabold text-2xl sm:text-3xl select-none mb-4 sm:mb-0">
                      {userInfo?.firstName?.[0] || user?.email?.[0] || '?'}
                    </div>
                  )}
                  <div className="sm:ml-6 text-center sm:text-left">
                    <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">
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

                <div className="space-y-3 sm:space-y-4">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 sm:py-4 rounded-xl font-semibold hover:cursor-pointer hover:from-blue-700 hover:to-purple-700 transition duration-200 shadow-lg"
                  >
                    📊 Open Dashboard
                  </button>
                  <button
                    onClick={handleViewCard}
                    className="w-full bg-white border-2 border-blue-200 text-blue-700 py-3 rounded-xl font-semibold hover:cursor-pointer hover:bg-blue-50 transition duration-200"
                  >
                    👁️ View My Card
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-gray-600 py-2 rounded-xl font-medium hover:cursor-pointer hover:text-gray-800 hover:bg-gray-100 transition duration-200"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row justify-center items-center mb-16 sm:mb-20 gap-4 sm:gap-6 px-4">
              <button
                onClick={() => router.push('/signup')}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 sm:px-10 rounded-xl font-semibold text-lg hover:cursor-pointer hover:from-blue-700 hover:to-purple-700 transition duration-200 shadow-lg transform hover:scale-105"
              >
                🚀 Get Started Free
              </button>
              <button
                onClick={() => router.push('/signin')}
                className="w-full sm:w-auto bg-white border-2 border-gray-300 text-gray-700 py-4 px-8 sm:px-10 rounded-xl font-semibold text-lg hover:cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition duration-200"
              >
                Sign In
              </button>
            </div>
          )}

          {/* Features Grid - Mobile Responsive */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10 px-4">
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
                className="bg-white p-6 sm:p-8 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition duration-300 flex flex-col items-center text-center"
              >
                <div className="text-4xl sm:text-5xl mb-4 sm:mb-5">{icon}</div>
                <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3 text-gray-900">{title}</h3>
                <p className="text-gray-600 text-sm sm:text-base">{description}</p>
              </div>
            ))}
          </div>

          {/* CTA Section for Non-authenticated - Mobile Responsive */}
          {!isAuthenticated && (
            <section className="mt-20 sm:mt-28 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 sm:p-14 text-white max-w-3xl mx-4 sm:mx-auto shadow-lg">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-5">Ready to Go Digital?</h2>
              <p className="text-blue-100 mb-8 sm:mb-10 text-base sm:text-lg">
                Join thousands of professionals who've ditched paper cards forever.
              </p>
              <button
                onClick={() => router.push('/signup')}
                className="bg-white text-blue-600 py-4 px-8 sm:px-12 rounded-xl font-semibold text-lg hover:cursor-pointer hover:bg-blue-50 transition duration-200 shadow-lg w-full sm:w-auto"
              >
                Create Your Card Now
              </button>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
