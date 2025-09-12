"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWAInstall } from './usePWAInstall';
import { useRouter } from 'next/navigation';

export default function InstallAppPage() {
  const router = useRouter();
  const { deviceType, installAvailable, promptInstall, isStandalone, canShare } = usePWAInstall();
  const [showToast, setShowToast] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // show toast when installAvailable toggles to true
  React.useEffect(() => {
    if (installAvailable) {
      setShowToast(true);
      // auto-hide after 6s
      const t = setTimeout(() => setShowToast(false), 6000);
      return () => clearTimeout(t);
    }
  }, [installAvailable]);

  const onInstallClick = async () => {
    // For Android/PC: trigger the stored prompt
    const result = await promptInstall();
    // result may include outcome; we keep UI simple
    setShowToast(false);
    // optionally navigate or show success
    if ((result && (result as any).outcome === 'accepted') || (result as any).outcome === 'accepted') {
      // small delay so browser can finalize install
      setTimeout(() => router.push('/'), 800);
    }
  };

  const onIOSAdd = async () => {
    if (canShare && typeof (navigator as any).share === 'function') {
      try {
        await (navigator as any).share({
          title: 'DgtlDigiCard - Digital Business Cards',
          text: 'Add DgtlDigiCard to your home screen for quick access!',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled or failed', err);
        setShowOnboarding(true);
      }
    } else {
      setShowOnboarding(true);
    }
  };

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-3">App Already Installed!</h1>
          <p className="text-gray-600 text-sm mb-6">DgtlDigiCard is running as an installed app.</p>
          <Link href="/" className="inline-block bg-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-700 transition">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <img src="/dgtlmart-logo.png" alt="DgtlDigiCard" className="h-8 w-auto" />
            <span className="font-semibold text-gray-900">DgtlDigiCard</span>
          </Link>
          <Link href="/" className="text-blue-600 text-sm font-medium">
            ← Back
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Install DGTLDIGICARD Progressive Web App (Android/iOS/PC)</h1>
          <div className="inline-block bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600">{deviceType || 'Unknown'}</div>
        </div>

        {/* Content based on device */}
        <div className="max-w-md mx-auto">

          {deviceType === 'Android' && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-center mb-4">
                <img src="/icons/android.svg" alt="Android" className="w-12 h-12 mx-auto mb-3" />
                <h2 className="font-medium text-gray-900 mb-2">Install on Android</h2>
              </div>

              <button onClick={onInstallClick} className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition">
                Install PWA
              </button>

              <p className="text-xs text-gray-500 mt-2 text-center">If this button doesn't trigger an installer: open browser menu (⋮) → Add to Home screen</p>
            </div>
          )}

          {deviceType === 'iOS' && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <img src="/icons/apple.svg" alt="iOS" className="w-12 h-12 mx-auto mb-3" />
                <h2 className="font-medium text-gray-900 mb-2">Install on iOS</h2>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <button onClick={onIOSAdd} className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition">Add to Home Screen</button>
                <p className="text-xs text-gray-500 mt-2 text-center">This opens the share sheet — then tap "Add to Home Screen" in Safari.</p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Follow the guide on how to install PWA on iOS:</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-800 text-sm mb-2">Add DgtlDigiCard to Home Screen</h4>
                    <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                      <li>Open this page in Safari</li>
                      <li>Tap the Share button (the square with an arrow)</li>
                      <li>Scroll and tap 'Add to Home Screen'</li>
                    </ol>
                  </div>

                  <div className="pt-3 border-t border-blue-200">
                    <h4 className="font-medium text-gray-800 text-sm mb-2">Troubleshoot</h4>
                    <p className="text-sm text-gray-600 mb-2">If you run into issues try clearing Safari data or reinstalling:</p>
                    <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                      <li>Delete the installed shortcut (if present)</li>
                      <li>
                        <a href="https://support.apple.com/en-vn/HT201265" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Settings → Safari → Clear History and Website Data.</a>
                      </li>
                      <li>Re-add via Safari's Share → Add to Home Screen</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          {deviceType === 'PC' && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-center mb-4">
                <div className="w-12 h-12 mx-auto mb-3 bg-gray-200 rounded-lg flex items-center justify-center"><span className="text-2xl">💻</span></div>
                <h2 className="font-medium text-gray-900 mb-2">Install on Desktop</h2>
              </div>

              <button onClick={onInstallClick} className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition">Install PWA</button>

              <p className="text-xs text-gray-500 mt-2 text-center">If the button doesn't work: look for an install icon in the address bar or browser menu.</p>
            </div>
          )}

          <div className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 text-white">
            <h3 className="font-medium mb-3 text-center">Why Install?</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="text-center"><div className="mb-1">⚡</div><div>Faster loading</div></div>
              <div className="text-center"><div className="mb-1">📴</div><div>Works offline</div></div>
              <div className="text-center"><div className="mb-1">🏠</div><div>Home screen access</div></div>
              <div className="text-center"><div className="mb-1">🔒</div><div>More secure</div></div>
            </div>
          </div>

          <div className="mt-4 bg-gray-50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-900 mb-2">How PWA Installation Works:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Browser detects installable PWA (manifest.json + service worker)</li>
              <li>• Clicking button triggers native browser installation UI (if available)</li>
              <li>• App installs directly to home screen like native app</li>
              <li>• Works offline with faster loading and app-like experience</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Toast / Snackbar */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.35 }}
            className="fixed left-1/2 transform -translate-x-1/2 bottom-6 z-50 w-[92%] max-w-lg"
          >
            <div className="bg-white border shadow-lg rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-md flex items-center justify-center text-white">⬇️</div>
                <div>
                  <div className="font-medium text-sm">App install available</div>
                  <div className="text-xs text-gray-500">Tap to install DgtlDigiCard</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setShowToast(false)} className="text-xs px-3 py-1">Dismiss</button>
                <button onClick={onInstallClick} className="bg-blue-600 text-white text-xs px-3 py-1 rounded-md">Install</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Onboarding Modal */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }} className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-medium">Add to Home Screen</h3>
                <button onClick={() => setShowOnboarding(false)} className="text-sm text-gray-500">Close</button>
              </div>

              <div className="mt-4 text-sm text-gray-700 space-y-3">
                <p>Follow these steps to add DgtlDigiCard to your home screen:</p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Open this page in Safari (required on iOS)</li>
                  <li>Tap the Share button (the square with an arrow)</li>
                  <li>Swipe the action row until you find "Add to Home Screen" and tap it</li>
                  <li>Tap Add — the shortcut will appear on your home screen</li>
                </ol>

                <div className="mt-3 p-3 bg-gray-50 rounded">
                  <div className="font-medium text-sm mb-1">Tip</div>
                  <div className="text-xs text-gray-600">If you don't see "Add to Home Screen", ensure you're in Safari and clear website data from Settings → Safari.</div>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => setShowOnboarding(false)} className="px-3 py-2 rounded-md text-sm">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
