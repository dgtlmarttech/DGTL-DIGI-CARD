'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiCheckCircle, FiXCircle, FiGift, FiStar } from 'react-icons/fi';
import Link from 'next/link';
import { useUser } from '../../../context/userContext';
import { updateUserPaymentStatus } from '../../../services/firebaseAuthService';
import { toast } from 'react-toastify';

const loadScript = (src) => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const PaymentPage = () => {
  const router = useRouter();
  const { 
    user, 
    userInfo, 
    loading: userLoading, 
    isAuthenticated, 
    isPremium,
    isBasic,
    updateUserInfo
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

  const handlePayment = useCallback(async (planType, amount) => {
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
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: amount,
          userId: user.uid,
          userEmail: user.email
        }),
      });

      if (!res.ok) throw new Error('Failed to create order.');
      order = await res.json();
    } catch (e) {
      const error = 'Failed to create payment order. Please try again.';
      setErrorMsg(error);
      toast.error(error);
      setIsProcessing(false);
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
      amount: order.amount,
      currency: order.currency,
      name: `DigiCard ${planType === 'premium' ? 'Premium' : 'Basic'}`,
      description: `Yearly Subscription - ${planType === 'premium' ? 'Premium' : 'Basic'} Plan`,
      order_id: order.id,
      prefill: {
        name: `${userInfo?.firstName || ''} ${userInfo?.lastName || ''}`.trim() || user?.displayName || '',
        email: userInfo?.email || user?.email || '',
        contact: userInfo?.mobile || user?.phoneNumber || '',
      },
      theme: { color: planType === 'premium' ? '#4c51bf' : '#10b981' },
      handler: async (resp) => {
        try {
          toast.info('Verifying payment...', { autoClose: 2000 });
          
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
          
          if (!verify.ok) throw new Error('Payment verification failed.');

          await updateUserPaymentStatus(user.uid, {
            paymentId: resp.razorpay_payment_id,
            orderId: resp.razorpay_order_id,
            signature: resp.razorpay_signature,
            planStartDate: new Date().toISOString(),
            planEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          }, planType);

          updateUserInfo({ 
            isPremium: planType === 'premium',
            isBasic: planType === 'basic',
            planType: planType,
            planStartDate: new Date(),
            planEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          });

          setPaymentSuccess(true);
          toast.success(`🎉 Welcome to ${planType === 'premium' ? 'Premium' : 'Basic'}! Your account is upgraded!`);
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

  const SuccessView = ({ title, message, plan }) => (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4 font-sans">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center text-gray-800 dark:text-gray-200">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
          plan === 'premium' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-800/30 dark:text-yellow-300' : 'bg-green-100 text-green-600 dark:bg-green-800/30 dark:text-green-300'
        }`}>
          {plan === 'premium' ? <FiStar size={32} /> : <FiCheckCircle size={32} />}
        </div>
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">{message}</p>
        
        {userInfo?.planEndDate && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Your subscription is valid until {new Date(userInfo.planEndDate.toDate?.() || userInfo.planEndDate).toLocaleDateString()}
          </p>
        )}

        <div className="flex gap-3 mt-6">
          <Link href="/dashboard" className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-center">
            Go to Dashboard
          </Link>
          <Link href={`/${userInfo?.customUID || user?.uid}`} className="flex-1 px-6 py-3 border border-indigo-600 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors text-center">
            View My Card
          </Link>
        </div>
      </div>
    </div>
  );

  if (paymentSuccess) {
    return (
      <SuccessView
        title="Welcome Aboard!"
        message="Your payment was successful and your plan is now active."
        plan={userInfo?.isPremium ? 'premium' : 'basic'}
      />
    );
  }

  if (isPremium) {
    return <SuccessView title="You're Premium!" message="You are enjoying all the exclusive features of DigiCard Premium." plan="premium" />;
  }
  
  if (isBasic) {
    return <SuccessView title="You're on the Basic Plan!" message="You have access to all essential networking tools." plan="basic" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center mb-8">
          <button 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" 
            onClick={() => router.back()}
          >
            <FiArrowLeft size={24} />
          </button>
        </header>

        <div className="text-center mb-8">
          <h2 className="text-sm font-semibold text-green-600 tracking-wide uppercase">Pricing</h2>
          <h1 className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Simple, honest pricing
          </h1>
          <p className="mt-4 text-xl text-gray-500 dark:text-gray-400">
            One low yearly price. No per-contact fees, no surprises.
          </p>
        </div>

        <div className="mt-6 space-y-4 sm:mt-8 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto">
          {/* Basic Plan */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 flex flex-col">
            <div className="p-6">
              <h2 className="text-lg leading-6 font-semibold tracking-wider text-green-600">BASIC</h2>
              <p className="mt-8">
                <span className="text-5xl font-extrabold text-gray-900 dark:text-white">₹199</span>
                <span className="text-base font-medium text-gray-500 dark:text-gray-400">/year</span>
              </p>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 italic">Everything you need to start networking.</p>
            </div>
            <div className="pt-6 pb-8 px-6 flex-1 flex flex-col">
              <ul className="mt-2 space-y-4 flex-1">
                {[
                  'Smart digital business card',
                  'Profile photo & auto-generated URL',
                  'Up to 50 profile & detail edits',
                  'QR code + built-in card scanner',
                  'Networking CRM dashboard',
                  'Contact management & bulk import',
                  'Contact labels & notes',
                  'WhatsApp direct messaging'
                ].map((feature) => (
                  <li key={feature} className="flex">
                    <FiCheckCircle className="flex-shrink-0 h-5 w-5 text-green-500" />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handlePayment('basic', 199)}
                disabled={!agreedToTerms || isProcessing}
                className={`mt-8 w-full block border border-transparent rounded-md py-3 px-5 text-center text-sm font-semibold text-white shadow-md transition-all duration-200 ${
                  agreedToTerms && !isProcessing ? 'bg-green-600 hover:bg-green-700 transform hover:scale-[1.02]' : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {isProcessing ? 'Processing...' : 'Get Basic'}
              </button>
            </div>
          </div>

          {/* Premium Plan */}
          <div className="border border-yellow-400 dark:border-yellow-600 rounded-2xl shadow-lg divide-y divide-gray-200 dark:divide-gray-700 bg-orange-50/10 dark:bg-gray-800 relative flex flex-col">
            <div className="absolute top-0 right-0 -mt-4 mr-4 px-4 py-1 bg-yellow-500 text-white text-xs font-bold uppercase tracking-wide rounded-full shadow-md flex items-center gap-1">
               <FiStar /> MOST POPULAR
            </div>
            <div className="p-6">
              <h2 className="text-lg leading-6 font-semibold tracking-wider text-yellow-600">PREMIUM</h2>
              <p className="mt-8">
                <span className="text-5xl font-extrabold text-gray-900 dark:text-white">₹499</span>
                <span className="text-base font-medium text-gray-500 dark:text-gray-400">/year</span>
              </p>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 italic">
                Everything in Basic, <span className="font-semibold text-yellow-600">plus power tools.</span>
              </p>
            </div>
            <div className="pt-6 pb-8 px-6 flex-1 flex flex-col">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Everything in Basic, plus:</p>
              <ul className="space-y-4 flex-1">
                {[
                  'Custom vanity URL (yourname.dgtldigicard.com)',
                  '6+ premium card themes',
                  'Unlimited profile & detail edits',
                  'Advanced view & engagement analytics',
                  'Real-time profile tracking & analytics',
                  'WhatsApp broadcast & message templates',
                  'Priority customer support'
                ].map((feature) => (
                  <li key={feature} className="flex">
                    <FiCheckCircle className="flex-shrink-0 h-5 w-5 text-yellow-500" />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handlePayment('premium', 499)}
                disabled={!agreedToTerms || isProcessing}
                className={`mt-8 w-full block border border-transparent rounded-md py-3 px-5 text-center text-sm font-semibold text-white shadow-md transition-all duration-200 ${
                  agreedToTerms && !isProcessing ? 'bg-yellow-500 hover:bg-yellow-600 transform hover:scale-[1.02]' : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {isProcessing ? 'Processing...' : 'Get Premium'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="agree"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out border-gray-300 rounded cursor-pointer"
            />
            <label htmlFor="agree" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">
              I agree to the <Link href="/terms" className="text-indigo-600 hover:underline">Terms & Conditions</Link> and <Link href="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link>
            </label>
          </div>
        </div>
        
        {errorMsg && (
          <div className="mt-4 flex items-center justify-center gap-2 p-3 text-sm text-red-700 bg-red-100 rounded-lg max-w-lg mx-auto">
            <FiXCircle size={16} className="flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;
