'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiCheckCircle, FiXCircle, FiStar, FiClock, FiCalendar } from 'react-icons/fi';
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

const allFeatures = [
  'Smart digital business card',
  'Profile photo & auto-generated URL',
  'QR code + built-in card scanner',
  'Networking CRM dashboard',
  'Contact labels & notes',
  'WhatsApp direct messaging',
  'Custom vanity URL (yourname.dgtldigicard.com)',
  '6+ premium card themes',
  'Unlimited profile & detail edits',
  'Contact management & bulk import',
  'Advanced view & engagement analytics',
  'Real-time profile tracking & analytics',
  'Priority customer support',
  'Date-wise To-Do List',
  'Meeting Notes with Voice-to-Text',
  'Voice Notes & Transcription',
  'Start / Stop Voice Recording',
  'Personal Assistant Dashboard',
  'AI Summaries & Action Items'
];

/**
 * Derive the real subscription state from raw userInfo fields.
 * This intentionally does NOT use isPremium/isBasic/hasAccess from context
 * because those are computed access flags — we need the actual plan details here.
 */
function getSubscriptionState(userInfo) {
  if (!userInfo) return { type: 'loading' };

  const now = new Date();

  // Check if the user has verified payment data
  const hasVerifiedPayment = !!(userInfo.paymentData?.paymentId || userInfo.paymentId);

  let hasPaidPlanFlag = false;

  // We STRICTLY require a verified payment for 'monthly' and 'yearly' plans to prevent free-trial users
  // from being incorrectly upgraded due to data leaks or unverified states.
  if (hasVerifiedPayment && (userInfo.planType === 'monthly' || userInfo.planType === 'yearly')) {
    hasPaidPlanFlag = true;
  }

  // Check for active paid plan
  const expireDates = [];
  if (hasPaidPlanFlag) {
    if (userInfo.expireDate) expireDates.push(new Date(userInfo.expireDate));
    if (userInfo.premiumEndDate) expireDates.push(new Date(userInfo.premiumEndDate));
  }

  if (hasPaidPlanFlag) {
    if (expireDates.length > 0) {
      const maxExpiry = new Date(Math.max(...expireDates));
      if (maxExpiry > now) {
        // Active paid subscription
        return {
          type: 'paid',
          planType: userInfo.planType,
          expireDate: maxExpiry,
        };
      }
      // Subscription has expired — fall through to trial/expired check
    } else {
      // Has paid flag but no expiry set — treat as active
      return {
        type: 'paid',
        planType: userInfo.planType,
        expireDate: null,
      };
    }
  }

  // Check trial
  if (userInfo.createdAt) {
    const createdAt = new Date(userInfo.createdAt);
    const trialEnd = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (trialEnd > now) {
      const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
      return { type: 'trial', daysRemaining, trialEnd };
    }
  }

  return { type: 'expired' };
}

const PaymentPage = () => {
  const router = useRouter();
  const {
    user,
    userInfo,
    loading: userLoading,
    isAuthenticated,
    updateUserInfo
  } = useUser();

  const [processingPlan, setProcessingPlan] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(null); // 'monthly' | 'yearly'
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [billingCycle, setBillingCycle] = useState('yearly');

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

    setProcessingPlan(planType);
    setErrorMsg('');
    toast.info('Initializing payment...', { autoClose: 2000 });

    const sdkOK = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
    if (!sdkOK) {
      const error = 'Unable to load the payment gateway. Please check your internet connection.';
      setErrorMsg(error);
      toast.error(error);
      setProcessingPlan(null);
      return;
    }

    let order;
    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, userId: user.uid, userEmail: user.email }),
      });
      if (!res.ok) throw new Error('Failed to create order.');
      order = await res.json();
    } catch (e) {
      const error = 'Failed to create payment order. Please try again.';
      setErrorMsg(error);
      toast.error(error);
      setProcessingPlan(null);
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
      amount: order.amount,
      currency: order.currency,
      name: `DigiCard ${planType === 'yearly' ? 'Yearly' : 'Monthly'}`,
      description: `${planType === 'yearly' ? 'Yearly' : 'Monthly'} Subscription`,
      order_id: order.id,
      prefill: {
        name: `${userInfo?.firstName || ''} ${userInfo?.lastName || ''}`.trim() || user?.displayName || '',
        email: userInfo?.email || user?.email || '',
        contact: userInfo?.mobile || user?.phoneNumber || '+919999999999',
      },
      theme: { color: '#4c51bf' },
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
          }, planType);

          const newEndDate = new Date();
          if (planType === 'monthly') {
            newEndDate.setMonth(newEndDate.getMonth() + 1);
          } else {
            newEndDate.setFullYear(newEndDate.getFullYear() + 1);
          }

          updateUserInfo({
            planType,
            planStartDate: new Date().toISOString(),
            expireDate: newEndDate.toISOString(),
            paymentData: {
              paymentId: resp.razorpay_payment_id,
              orderId: resp.razorpay_order_id,
              signature: resp.razorpay_signature,
            },
            paymentId: resp.razorpay_payment_id,
          });

          setPaymentSuccess(planType);
          toast.success('🎉 Payment successful! Your plan is now active.');
        } catch (e) {
          console.error('Payment verification error:', e);
          const error = 'Payment successful, but failed to update your account. Please contact support.';
          setErrorMsg(error);
          toast.error(error);
        } finally {
          setProcessingPlan(null);
        }
      },
      modal: {
        ondismiss: () => {
          setProcessingPlan(null);
          toast.info('Payment cancelled');
        }
      }
    };

    const rzp1 = new window.Razorpay(options);
    rzp1.on('payment.failed', (response) => {
      setErrorMsg(`Payment failed: ${response.error.description}`);
      toast.error('Payment failed. Please try again.');
      setProcessingPlan(null);
    });
    rzp1.open();
  }, [agreedToTerms, user, userInfo, updateUserInfo]);

  // ── Loading ────────────────────────────────────────────────────────────────
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

  // ── Post-payment success screen ────────────────────────────────────────────
  if (paymentSuccess) {
    const isYearly = paymentSuccess === 'yearly';
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4 font-sans">
        <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center text-gray-800 dark:text-gray-200">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-green-100 text-green-600 dark:bg-green-800/30 dark:text-green-300">
            <FiCheckCircle size={32} />
          </div>
          <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
            You&apos;re now subscribed to the <strong>{isYearly ? 'Yearly' : 'Monthly'}</strong> plan.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {isYearly ? '₹999 / year' : '₹99 / month'} · Full access to all features
          </p>
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
  }

  // ── Derive subscription state from raw userInfo (NOT from isPremium/hasAccess) ──
  const subState = getSubscriptionState(userInfo);

  // ── Active paid subscription view (with plan info + optional upgrade) ──────
  const renderActivePlanBanner = () => {
    if (subState.type !== 'paid') return null;

    const planLabel =
      subState.planType === 'yearly' ? 'Yearly' :
        subState.planType === 'monthly' ? 'Monthly' : 'Unknown Plan';

    const priceLabel =
      subState.planType === 'yearly' ? '₹999 / year' :
        subState.planType === 'monthly' ? '₹99 / month' : '';

    return (
      <div className="max-w-2xl mx-auto mb-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-800/40 flex items-center justify-center text-green-600">
            <FiCheckCircle size={20} />
          </div>
          <div>
            <p className="font-semibold text-green-800 dark:text-green-300">
              You&apos;re subscribed to {planLabel}
            </p>
            <p className="text-sm text-green-700 dark:text-green-400">{priceLabel} · Full access to all features</p>
          </div>
        </div>
        {subState.expireDate && (
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 mt-2">
            <FiCalendar size={14} />
            <span>Active until: <strong>{subState.expireDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></span>
          </div>
        )}
        <div className="mt-4 flex gap-3">
          <Link href="/dashboard" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors text-center text-sm">
            Go to Dashboard
          </Link>
          <Link href={`/${userInfo?.customUID || user?.uid}`} className="flex-1 px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-colors text-center text-sm">
            View My Card
          </Link>
        </div>
      </div>
    );
  };

  // ── Pricing cards (always rendered except after fresh payment) ─────────────
  const renderPricingCards = () => (
    <>
      {/* Heading – only shown when not on an active paid plan */}
      {subState.type !== 'paid' && (
        <div className="text-center mb-8">
          <h2 className="text-sm font-semibold text-indigo-600 tracking-wide uppercase">Pricing</h2>
          <h1 className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Simple, honest pricing
          </h1>
          <p className="mt-4 text-xl text-gray-500 dark:text-gray-400">
            Choose a plan that works for you. No surprises.
          </p>
        </div>
      )}

      {/* Trial banner */}
      {subState.type === 'trial' && (
        <div className="max-w-2xl mx-auto mb-8 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-xl p-4 flex items-center justify-center gap-3">
          <FiClock className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" size={22} />
          <p className="text-indigo-800 dark:text-indigo-300 font-medium">
            🎉 7 Days Free Trial Active — {subState.daysRemaining} {subState.daysRemaining === 1 ? 'day' : 'days'} remaining. Upgrade anytime to keep access.
          </p>
        </div>
      )}

      {/* Expired banner */}
      {subState.type === 'expired' && (
        <div className="max-w-2xl mx-auto mb-8 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <FiXCircle className="text-red-600 dark:text-red-400 flex-shrink-0" size={22} />
          <p className="text-red-800 dark:text-red-300 font-medium">
            Your 7-day free trial has ended. Please choose a plan to continue using all features.
          </p>
        </div>
      )}

      {/* Upgrade prompt for active paid subscribers */}
      {subState.type === 'paid' && (
        <div className="text-center mb-6">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {subState.planType === 'monthly' ? 'Upgrade to Yearly and save ~15%.' : 'Manage or renew your subscription below.'}
          </p>
        </div>
      )}

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center mb-8">
        <div className="relative flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`relative w-32 py-2 text-sm font-semibold rounded-full transition-all duration-200 z-10 ${billingCycle === 'monthly'
                ? 'text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`relative w-32 py-2 text-sm font-semibold rounded-full transition-all duration-200 z-10 ${billingCycle === 'yearly'
                ? 'text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
          >
            Yearly
          </button>
          {/* Animated Toggle Background */}
          <div
            className={`absolute top-1 bottom-1 w-32 bg-white dark:bg-gray-700 rounded-full shadow transition-transform duration-300 ease-in-out ${billingCycle === 'yearly' ? 'translate-x-full' : 'translate-x-0'
              }`}
          ></div>
        </div>
      </div>

      {/* Plan Card */}
      <div className="mt-4 lg:max-w-lg lg:mx-auto">
        <div className={`border-2 rounded-2xl shadow-lg divide-y divide-gray-200 dark:divide-gray-700 flex flex-col relative transition-all duration-300 ${billingCycle === 'yearly'
            ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50/10 dark:bg-gray-800'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
          }`}>
          {billingCycle === 'yearly' && (
            <div className="absolute top-0 right-0 -mt-4 mr-4 px-4 py-1 bg-indigo-600 text-white text-xs font-bold uppercase tracking-wide rounded-full shadow-md flex items-center gap-1">
              <FiStar size={10} /> BEST VALUE
            </div>
          )}

          <div className="p-6">
            <h2 className={`text-lg leading-6 font-semibold tracking-wider ${billingCycle === 'yearly' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'
              }`}>
              {billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}
            </h2>
            <p className="mt-6 flex items-baseline gap-1">
              <span className="text-5xl font-extrabold text-gray-900 dark:text-white">
                {billingCycle === 'monthly' ? '₹99' : '₹999'}
              </span>
              <span className="text-base font-medium text-gray-500 dark:text-gray-400">
                {billingCycle === 'monthly' ? '/month' : '/year'}
              </span>
            </p>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              {billingCycle === 'monthly'
                ? 'Complete access to all features, billed monthly.'
                : 'Save ~15% compared to the monthly plan.'}
            </p>
          </div>

          <div className="pt-6 pb-8 px-6 flex-1 flex flex-col">
            <ul className="space-y-3 flex-1">
              {allFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <FiCheckCircle className="flex-shrink-0 h-4 w-4 text-indigo-500 mt-0.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              id={`btn-get-${billingCycle}`}
              onClick={() => handlePayment(billingCycle, billingCycle === 'monthly' ? 99 : 999)}
              disabled={!agreedToTerms || processingPlan !== null}
              className={`mt-8 w-full rounded-md py-3 px-5 text-center text-sm font-semibold text-white shadow-md transition-all duration-200 ${agreedToTerms && processingPlan === null
                  ? 'bg-indigo-600 hover:bg-indigo-700 transform hover:scale-[1.02]'
                  : 'bg-gray-400 cursor-not-allowed'
                }`}
            >
              {processingPlan === billingCycle
                ? 'Processing...'
                : `Get ${billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}`}
            </button>
          </div>
        </div>
      </div>

      {/* Terms checkbox */}
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
            I agree to the{' '}
            <Link href="/terms" className="text-indigo-600 hover:underline">Terms & Conditions</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link>
          </label>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-4 flex items-center justify-center gap-2 p-3 text-sm text-red-700 bg-red-100 rounded-lg max-w-lg mx-auto">
          <FiXCircle size={16} className="flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </>
  );

  // ── Page layout ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center mb-8">
          <button
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            onClick={() => router.back()}
          >
            <FiArrowLeft size={24} />
          </button>
        </header>

        {/* Active plan info (always shown if on a paid plan) */}
        {renderActivePlanBanner()}

        {/* Pricing cards — always shown regardless of paid/trial/expired state */}
        {renderPricingCards()}
      </div>
    </div>
  );
};

export default PaymentPage;
