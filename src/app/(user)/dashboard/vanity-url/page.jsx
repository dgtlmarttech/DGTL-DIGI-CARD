'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../../../../context/userContext';
import { doc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../../firebase/firebase';
import { toast } from 'react-toastify';
import DigitalCard from '../../../../components/DigitalCard';

const VanityURLPage = () => {
  const router = useRouter();
  const { user, userInfo, updateUserInfo } = useUser();

  const [loading, setLoading] = useState(false);
  const [customUID, setCustomUID] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const canAccessPremiumFeatures = userInfo?.isPremium || userInfo?.isTrialActive;

  // On mount: sync state from DB
  useEffect(() => {
    if (userInfo?.customUID) {
      setCustomUID(userInfo.customUID);
      runValidation(userInfo.customUID);
    }
  }, [userInfo?.customUID]);

  // Firestore check - true if some other user has this UID
  const checkCustomUIDExists = async (uid) => {
    if (!uid) return false;
    try {
      const q = query(collection(db, 'users'), where('customUID', '==', uid));
      const snapshot = await getDocs(q);
      // If any doc found and it's not the current user
      return snapshot.docs.some(docSnap => docSnap.id !== user?.uid);
    } catch (err) {
      console.error('Error checking UID availability:', err);
      return false;
    }
  };

  // Validation + duplicate check
  const runValidation = async (value) => {
    if (!value) {
      setValidationMessage('');
      setIsValid(false);
      return false;
    }
    if (value.length < 3) {
      setValidationMessage('URL must be at least 3 characters long');
      setIsValid(false);
      return false;
    }
    if (value.length > 30) {
      setValidationMessage('URL must be less than 30 characters');
      setIsValid(false);
      return false;
    }
<<<<<<< HEAD
    // ✅ Allow letters, numbers, hyphen, underscore
    if (!/^[a-z0-9-_]+$/.test(value)) {
      setValidationMessage('Only lowercase letters, numbers, hyphens and underscores allowed');
      setIsValid(false);
      return false;
    }
    if (value.startsWith('-') || value.endsWith('-') || value.startsWith('_') || value.endsWith('_')) {
      setValidationMessage('URL cannot start or end with a hyphen or underscore');
      setIsValid(false);
      return false;
    }
    if (value.includes('--') || value.includes('__') || value.includes('_-') || value.includes('-_')) {
      setValidationMessage('URL cannot contain consecutive symbols (like --, __, _-, -_)');
      setIsValid(false);
      return false;
    }
=======
     // ✅ Allow letters, numbers, hyphen, underscore
  if (!/^[a-z0-9-_]+$/.test(value)) {
    setValidationMessage('Only lowercase letters, numbers, hyphens and underscores allowed');
    setIsValid(false);
    return false;
  }
  if (value.startsWith('-') || value.endsWith('-') || value.startsWith('_') || value.endsWith('_')) {
    setValidationMessage('URL cannot start or end with a hyphen or underscore');
    setIsValid(false);
    return false;
  }
  if (value.includes('--') || value.includes('__') || value.includes('_-') || value.includes('-_')) {
    setValidationMessage('URL cannot contain consecutive symbols (like --, __, _-, -_)');
    setIsValid(false);
    return false;
  }
>>>>>>> 3dfb2372ed1a1b4b12acbb8db30cfbc0b83fef2d
    // ✅ Check duplicate in Firestore
    const exists = await checkCustomUIDExists(value);
    if (exists) {
      setValidationMessage('❌ This URL is already taken. Please choose another.');
      setIsValid(false);
      return false;
    }

    setValidationMessage('✅ URL looks good!');
    setIsValid(true);
    return true;
  };

  const handleInputChange = async (e) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '');
    setCustomUID(value);
    await runValidation(value);
  };

  const saveVanityURL = async () => {
    if (!user || !canAccessPremiumFeatures) return;
    if (!isValid) {
      toast.error('Please enter a valid and unique vanity URL.');
      return;
    }
    try {
      setLoading(true);
      toast.info('Saving vanity URL...', { autoClose: 2000 });
      await updateDoc(doc(db, 'users', user.uid), { customUID });
      updateUserInfo({ ...userInfo, customUID });
      toast.success('Vanity URL updated successfully! 🎉');
    } catch (error) {
      toast.error('Failed to update vanity URL.');
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://my.dgtldigicard.com';
  const currentURL = customUID
    ? `${baseUrl}/${customUID}`
    : `${baseUrl}/${user?.uid}`;
=======
  const currentURL = customUID
    ? `https://my.dgtldigicard.com/${customUID}`
    : `https://my.dgtldigicard.com/${user?.uid}`;
>>>>>>> 3dfb2372ed1a1b4b12acbb8db30cfbc0b83fef2d

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentURL);
      toast.success('URL copied to clipboard! 📋');
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* MAIN FORM */}
      <div className="flex-1 p-4 lg:pr-[440px]">
        {/* Premium notice */}
        {!canAccessPremiumFeatures && (
          <div className="mb-6 rounded-xl bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200 p-6 text-center">
            <div className="text-4xl mb-3">🔗</div>
            <h3 className="text-lg font-semibold mb-2">Premium Feature Required</h3>
            <p className="text-sm mb-4">
              Create your personalized URL like <code className="bg-white px-2 py-1 rounded text-blue-600">my.dgtldigicard.com/yourname</code>
            </p>
            <button
              onClick={() => router.push('/payment')}
              className="rounded-xl bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700"
            >
              Upgrade to Premium
            </button>
          </div>
        )}

        {/* Current URL */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm text-gray-800">
          <h2 className="mb-4 text-lg font-semibold">Your Current URL</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-2 rounded-lg bg-gray-50 p-4">
              <code className="flex-1 text-sm font-mono break-all">{currentURL}</code>
              <button
                onClick={copyToClipboard}
                className="rounded-lg bg-blue-100 p-2 text-blue-700 hover:bg-blue-200"
              >
                📋
              </button>
            </div>
            <button
              onClick={copyToClipboard}
              className="w-full rounded-lg bg-gray-100 py-2 text-sm hover:bg-gray-200"
            >
              Copy Full URL
            </button>
          </div>
        </div>

        {/* Input Field */}
        <div className={`mb-6 rounded-xl bg-white p-6 shadow-sm  text-gray-900 ${!canAccessPremiumFeatures && 'opacity-50 pointer-events-none'}`}>
          <h2 className="mb-4 text-lg font-semibold">Custom URL Segment</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Your Custom Path</label>
              <div className="flex rounded-lg border overflow-hidden">
                <span className="inline-flex items-center bg-gray-50 px-4 py-3 text-sm border-r text-gray-600">
<<<<<<< HEAD
                  {typeof window !== 'undefined' ? window.location.host : 'my.dgtldigicard.com'}/
=======
                  my.dgtldigicard.com/
>>>>>>> 3dfb2372ed1a1b4b12acbb8db30cfbc0b83fef2d
                </span>
                <input
                  value={customUID}
                  onChange={handleInputChange}
                  placeholder="your-name"
                  disabled={!canAccessPremiumFeatures}
                  className="flex-1 px-4 py-3 text-sm focus:outline-none"
                />
              </div>
              {validationMessage && (
                <p className={`mt-2 text-xs font-semibold ${validationMessage.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
                  {validationMessage}
                </p>
              )}
            </div>
            <div className="rounded-lg bg-blue-50 border p-4">
              <h4 className="text-sm font-semibold mb-2">URL Requirements:</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• 3-30 characters long</li>
                <li>• Only lowercase letters, numbers, and hyphens</li>
                <li>• Cannot start or end with hyphens</li>
                <li>• No consecutive hyphens (--)</li>
                <li>• Must be unique (not already in use)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Desktop Save Button */}
        {canAccessPremiumFeatures && (
          <div className="hidden md:flex justify-end mb-6">
            <button
              onClick={saveVanityURL}
              disabled={loading || !customUID.trim() || !isValid}
              className="rounded-lg bg-blue-700 px-6 py-3 text-white font-semibold hover:bg-blue-800 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Vanity URL'}
            </button>
          </div>
        )}

        {/* Mobile Preview */}
        {canAccessPremiumFeatures && (
          <div className="mb-6 md:hidden">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="w-full rounded-lg bg-gray-200 py-2 text-sm hover:bg-gray-300"
            >
              {showPreview ? 'Hide Live Preview' : 'Show Live Preview'}
            </button>
            {showPreview && (
              <div
                className="mt-4 mx-auto w-[375px] rounded-3xl border-8 border-gray-300 shadow-lg overflow-y-auto max-h-[600px] bg-white"
                style={{ boxShadow: '0 0 15px rgba(0,0,0,0.18)' }}
              >
                <DigitalCard userInfo={userInfo} />
              </div>
            )}
          </div>
        )}

        {/* Mobile Save Button */}
        {canAccessPremiumFeatures && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg md:hidden">
            <button
              onClick={saveVanityURL}
              disabled={loading || !customUID.trim() || !isValid}
              className="w-full rounded-xl bg-blue-700 py-4 text-white font-semibold disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Vanity URL'}
            </button>
          </div>
        )}
      </div>

      {/* Desktop Preview */}
      {canAccessPremiumFeatures && (
        <aside className="hidden lg:flex lg:flex-col lg:fixed lg:right-4 lg:top-4 lg:w-[400px] lg:h-[calc(100vh-2rem)] rounded-3xl border-8 border-gray-300 bg-white shadow-lg">
          <header className="p-4 border-b text-center">
            <h3 className="text-lg font-semibold">Live Preview (Mobile View)</h3>
          </header>
          <section className="flex-1 overflow-y-auto p-4">
            <div className="mx-auto w-[375px] rounded-3xl overflow-hidden">
              <DigitalCard userInfo={userInfo} />
            </div>
          </section>
          <footer className="p-4 border-t text-xs text-center text-gray-500">
            Mobile device simulation
          </footer>
        </aside>
      )}
    </div>
  );
};

export default VanityURLPage;
