'use client';
import { useRouter } from 'next/navigation';
import { useUser } from '../context/userContext';
import { signOutUser } from '../services/firebaseAuthService';

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

  // Show loading while initializing
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
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className="ml-3 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                DgtlDigiCard
              </span>
            </div>

            {/* <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition">Pricing</a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900 transition">Contact</a>
            </nav> */}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
            Your Digital Business Card
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Made Simple
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Create stunning, professional digital business cards that make lasting impressions. 
            Share your contact info instantly with QR codes, custom URLs, and beautiful designs.
          </p>

          {/* Action Buttons Based on Auth Status */}
          {isAuthenticated ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 max-w-md">
                <div className="flex items-center mb-6">
                  {userInfo?.imgUrl ? (
                    <img 
                      src={userInfo.imgUrl} 
                      alt="Profile" 
                      className="h-16 w-16 rounded-full object-cover border-4 border-blue-100"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                      {userInfo?.firstName?.[0] || user?.email?.[0] || '?'}
                    </div>
                  )}
                  <div className="ml-4 text-left">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Welcome back, {userInfo?.firstName || 'User'}!
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {userInfo?.isPremium ? '👑 Premium Member' : 
                       userInfo?.effectiveIsPremium ? '🚀 Trial Active' : '💫 Free Plan'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition duration-200 shadow-lg"
                  >
                    📊 Open Dashboard
                  </button>
                  
                  <button
                    onClick={handleViewCard}
                    className="w-full bg-white border-2 border-blue-200 text-blue-700 py-3 px-6 rounded-xl font-semibold hover:bg-blue-50 transition duration-200"
                  >
                    👁️ View My Card
                  </button>
                  
                  <button
                    onClick={handleSignOut}
                    className="w-full text-gray-600 py-2 px-6 rounded-xl font-medium hover:text-gray-800 hover:bg-gray-100 transition duration-200"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <button
                onClick={() => router.push('/signup')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition duration-200 shadow-lg transform hover:scale-105"
              >
                🚀 Get Started Free
              </button>
              
              <button
                onClick={() => router.push('/signin')}
                className="bg-white border-2 border-gray-200 text-gray-700 py-4 px-8 rounded-xl font-semibold text-lg hover:bg-gray-50 hover:border-gray-300 transition duration-200"
              >
                Sign In
              </button>
            </div>
          )}

          {/* Feature Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition duration-300">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Beautiful Designs</h3>
              <p className="text-gray-600">
                Choose from stunning templates or customize your own unique design.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition duration-300">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Mobile Optimized</h3>
              <p className="text-gray-600">
                Perfect viewing experience on all devices, from phones to desktops.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition duration-300">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Easy Sharing</h3>
              <p className="text-gray-600">
                Share via QR codes, custom URLs, or direct links. No app required.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          {!isAuthenticated && (
            <div className="mt-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
              <h2 className="text-3xl font-bold mb-4">Ready to Go Digital?</h2>
              <p className="text-blue-100 mb-8 text-lg">
                Join thousands of professionals who've ditched paper cards forever.
              </p>
              <button
                onClick={() => router.push('/signup')}
                className="bg-white text-blue-600 py-4 px-8 rounded-xl font-semibold text-lg hover:bg-blue-50 transition duration-200 shadow-lg"
              >
                Create Your Card Now
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      {/* <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">D</span>
                </div>
                <span className="ml-2 font-bold">DigitalCard</span>
              </div>
              <p className="text-gray-400">
                The modern way to share your professional information.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Templates</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="mailto:contact@dgtlmart.com" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition">LinkedIn</a></li>
                <li><a href="#" className="hover:text-white transition">Instagram</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 DigitalCard. All rights reserved.</p>
          </div>
        </div>
      </footer> */}
    </div>
  );
}
