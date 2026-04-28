'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiCheckCircle, FiXCircle, FiGift, FiStar } from 'react-icons/fi';
import Link from 'next/link';
import { useUser } from '../../../context/userContext';
import { updateUserPaymentStatus } from '../../../services/firebaseAuthService';
import { toast } from 'react-toastify';

/**
 * A promise-based function to dynamically load an external script.
 * @param {string} src The URL of the script to load.
 * @returns {Promise<boolean>} A promise that resolves to true if the script loaded successfully, false otherwise.
 */
const loadScript = (src) => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * A component for the premium payment page. It handles user authentication,
 * checks for existing premium status, and manages the Razorpay payment flow.
 */
const PaymentPage = () => {
  const router = useRouter();
  const { 
    user, 
    userInfo, 
    loading: userLoading, 
    isAuthenticated, 
    isPremium,
    updateUserInfo,
    refreshUserData
  } = useUser();

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);



  useEffect(() => {
    if (!userLoading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [isAuthenticated, userLoading, router]);

  /**
   * Handles the payment process by creating an order and opening the Razorpay checkout.
   */
  const handlePayment = useCallback(async () => {
    if (!agreedToTerms) {
      setErrorMsg('Please agree to the terms and conditions to proceed.');
      toast.error('Please agree to the terms and conditions to proceed.');
      return;
    }

    if (!user) {
      setErrorMsg('User not authenticated. Please try again.');
      toast.error('User not authenticated. Please try again.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');
    toast.info('Initializing payment...', { autoClose: 2000 });

    // Load the Razorpay SDK
    const sdkOK = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
    if (!sdkOK) {
      const error = 'Unable to load the payment gateway. Please check your internet connection.';
      setErrorMsg(error);
      toast.error(error);
      setIsProcessing(false);
      return;
    }

    let order;
    try {
      // Create a new order via API route
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: 99,
          userId: user.uid,
          userEmail: user.email
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create order.');
      }

      order = await res.json();
    } catch (e) {
      const error = 'Failed to create payment order. Please try again.';
      setErrorMsg(error);
      toast.error(error);
      setIsProcessing(false);
      return;
    }

    // Razorpay checkout options
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
      amount: order.amount,
      currency: order.currency,
      name: 'DigiCard Premium',
      description: 'Yearly Subscription - Premium Features',
      order_id: order.id,
      prefill: {
        name: `${userInfo?.firstName || ''} ${userInfo?.lastName || ''}`.trim() || user?.displayName || '',
        email: userInfo?.email || user?.email || '',
        contact: userInfo?.mobile || user?.phoneNumber || '',
      },
      theme: { color: '#4c51bf' },
      handler: async (resp) => {
        try {
          toast.info('Verifying payment...', { autoClose: 2000 });
          
          // Verify payment on the server side
          const verify = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
              userId: user.uid,
            }),
          });
          
          if (!verify.ok) {
            throw new Error('Payment verification failed.');
          }

          // Update the user's payment status in Firebase
          await updateUserPaymentStatus(user.uid, {
            paymentId: resp.razorpay_payment_id,
            orderId: resp.razorpay_order_id,
            signature: resp.razorpay_signature,
            isPremium: true,
            premiumStartDate: new Date(),
            premiumEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          });

          // Update local user context
          updateUserInfo({ 
            isPremium: true,
            premiumStartDate: new Date(),
            premiumEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          });

          setPaymentSuccess(true);
          toast.success('🎉 Welcome to Premium! Your account has been upgraded successfully!');
        } catch (e) {
          console.error('Payment verification error:', e);
          const error = 'Payment successful, but failed to update your account. Please contact support.';
          setErrorMsg(error);
          toast.error(error);
        } finally {
          setIsProcessing(false);
        }
      },
      modal: {
        ondismiss: () => {
          setIsProcessing(false);
          toast.info('Payment cancelled');
        }
      }
    };

    const rzp1 = new window.Razorpay(options);
    rzp1.on('payment.failed', (response) => {
      const error = `Payment failed: ${response.error.description}`;
      setErrorMsg(error);
      toast.error('Payment failed. Please try again.');
      setIsProcessing(false);
    });
    rzp1.open();
  }, [agreedToTerms, user, userInfo, updateUserInfo]);

  // Loading state
  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Success view component
  const SuccessView = ({ title, message, isPremiumUser = false }) => (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4 font-sans">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center text-gray-800 dark:text-gray-200">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
          isPremiumUser ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-800/30 dark:text-yellow-300' : 'bg-green-100 text-green-600 dark:bg-green-800/30 dark:text-green-300'
        }`}>
          {isPremiumUser ? <FiStar size={32} /> : <FiCheckCircle size={32} />}
        </div>
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
          {message}
        </p>
        
        {isPremiumUser && userInfo?.premiumEndDate && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Your premium subscription is valid until {new Date(userInfo.premiumEndDate.toDate?.() || userInfo.premiumEndDate).toLocaleDateString()}
          </p>
        )}

        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Premium Features</h3>
          <ul className="text-left space-y-3 text-gray-700 dark:text-gray-300">
            <li className="flex items-center gap-3">
              <FiGift className="text-indigo-500 flex-shrink-0" size={16} />
              <span>Ad-free digital card experience</span>
            </li>
            <li className="flex items-center gap-3">
              <FiGift className="text-indigo-500 flex-shrink-0" size={16} />
              <span>6+ premium card themes</span>
            </li>
            <li className="flex items-center gap-3">
              <FiGift className="text-indigo-500 flex-shrink-0" size={16} />
              <span>Custom vanity URL</span>
            </li>
            <li className="flex items-center gap-3">
              <FiGift className="text-indigo-500 flex-shrink-0" size={16} />
              <span>Unlimited profile edits</span>
            </li>
            <li className="flex items-center gap-3">
              <FiGift className="text-indigo-500 flex-shrink-0" size={16} />
              <span>Priority customer support</span>
            </li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Link 
            href="/dashboard" 
            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-center"
          >
            Go to Dashboard
          </Link>
          <Link 
            href={`/${userInfo?.customUID || user?.uid}`}
            className="flex-1 px-6 py-3 border border-indigo-600 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors text-center"
          >
            View My Card
          </Link>
        </div>
      </div>
    </div>
  );

  // Show success screen for existing premium users
  if (isPremium && !paymentSuccess) {
    return (
      <SuccessView
        title="You're Already Premium!"
        message="You're enjoying all the exclusive features of DigiCard Premium."
        isPremiumUser={true}
      />
    );
  }

  // Show success screen after successful payment
  if (paymentSuccess) {
    return (
      <SuccessView
        title="Welcome to Premium!"
        message="Your payment was successful and your Premium plan is now active."
      />
    );
  }

  // Main purchase flow view
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden text-gray-800 dark:text-gray-200 flex flex-col">
        <header className="flex items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <button 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" 
            onClick={() => router.back()}
          >
            <FiArrowLeft size={24} />
          </button>
          <h1 className="flex-grow text-center text-xl font-bold tracking-wide">
            Upgrade to Premium
          </h1>
        </header>

        <main className="p-6 flex-grow">


          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            Unlock the full potential of your digital card with <strong className="font-semibold text-gray-800 dark:text-gray-200">Premium</strong> features.
          </p>

          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-5xl font-bold text-gray-900 dark:text-gray-50">
              ₹99
            </span>
            <span className="text-lg text-gray-500 dark:text-gray-400">
              /year
            </span>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-6">
            <p className="text-sm text-green-800 dark:text-green-200 text-center">
              <span className="font-semibold">🎉 Launch Offer!</span> Get premium at just ₹99/year
            </p>
          </div>

          <ul className="space-y-3 mb-6 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-center gap-3">
              <FiCheckCircle className="text-green-500 flex-shrink-0" size={16} />
              <span>Remove all advertisements</span>
            </li>
            <li className="flex items-center gap-3">
              <FiCheckCircle className="text-green-500 flex-shrink-0" size={16} />
              <span>6+ premium card themes</span>
            </li>
            <li className="flex items-center gap-3">
              <FiCheckCircle className="text-green-500 flex-shrink-0" size={16} />
              <span>Custom vanity URL (yourname.dgtlcard.com)</span>
            </li>
            <li className="flex items-center gap-3">
              <FiCheckCircle className="text-green-500 flex-shrink-0" size={16} />
              <span>Unlimited profile edits</span>
            </li>
            <li className="flex items-center gap-3">
              <FiCheckCircle className="text-green-500 flex-shrink-0" size={16} />
              <span>Advanced contact analytics</span>
            </li>
            <li className="flex items-center gap-3">
              <FiCheckCircle className="text-green-500 flex-shrink-0" size={16} />
              <span>Priority customer support</span>
            </li>
          </ul>

          <div className="flex items-start gap-2 mb-6">
            <input
              type="checkbox"
              id="agree"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 form-checkbox h-4 w-4 text-indigo-600 dark:text-indigo-400 transition duration-150 ease-in-out border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-700"
            />
            <label htmlFor="agree" className="text-sm text-gray-600 dark:text-gray-400">
              I agree to the{' '}
              <Link 
                href="/terms" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Terms & Conditions
              </Link>{' '}
              and{' '}
              <Link 
                href="/privacy" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Privacy Policy
              </Link>
            </label>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400 mb-4">
              <FiXCircle size={16} className="flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </main>

        <footer className="p-6 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handlePayment}
            disabled={!agreedToTerms || isProcessing}
            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all duration-300 ease-in-out ${
              agreedToTerms && !isProcessing
                ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50 transform hover:scale-[1.02]'
                : 'bg-gray-400 cursor-not-allowed dark:bg-gray-600'
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Payment...
              </div>
            ) : (
              'Upgrade to Premium - ₹99/year'
            )}
          </button>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
            Secure payment powered by Razorpay • Cancel anytime
          </p>
        </footer>
      </div>
    </div>
  );
};

export default PaymentPage;
