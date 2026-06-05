'use client'
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import ProgressIndicator from '../../../components/ProgressIndicator';
import BubbleBackground from '../../../components/BubbleBackground';

const ForgotPassword = () => {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [isLoading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const onSubmit = async (data) => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        if (result.error === 'auth/user-not-found') {
          throw new Error('User does not exist with this email');
        }
        throw new Error(result.error || 'An error occurred. Please try again.');
      }

      setMessage('Password reset email sent. Check your inbox.');

      // router.push('/signin'); // Removed to allow user to see the success message
    } catch (err) {
      setMessage(err.message || 'An error occurred. Please try again.');
    }
    setLoading(false);
  };

  document.title = "Forgot Password – Digital Visiting Card";

  if (isLoading) {
    return <ProgressIndicator type={2} />;
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 flex items-center justify-center p-4 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <BubbleBackground />

      {/* Main container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Glass morphism card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none rounded-3xl"></div>

          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-white/30 to-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/20">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Forgot Password?</h2>
              <p className="text-white/80 text-sm">No worries, we'll send you reset instructions</p>
            </div>

            {/* Form */}
            <div className="space-y-6">
              {/* Email field */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-white/90 block">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Enter a valid email",
                      },
                    })}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSubmit(onSubmit)();
                      }
                    }}
                  />
                </div>
                {errors.email && (
                  <div className="flex items-center space-x-2 text-red-300 text-sm">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{errors.email.message}</span>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleSubmit(onSubmit)}
                  className="w-full py-4 px-6 bg-white text-indigo-600 font-semibold rounded-2xl hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </div>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>

                <Link
                  href="/signin"
                  className="w-full py-4 px-6 bg-white/10 border border-white/20 text-white font-medium rounded-2xl hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200 backdrop-blur-sm text-center block group"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Back to Sign In</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Message Modal */}
      {message && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm transform animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${message.includes('sent')
                  ? 'bg-green-100 text-green-600'
                  : 'bg-red-100 text-red-600'
                }`}>
                {message.includes('sent') ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )}
              </div>
              <h3 className="text-xl font-bold mb-3 text-red-600">
                {message.includes('sent') ? 'Email Sent!' : 'Oops!'}
              </h3>
              <p className="text-red-600 mb-6 font-semibold leading-relaxed">{message}</p>
              <button
                onClick={() => {
                  setMessage('');
                  if (message.includes('sent')) {
                    router.push('/signin');
                  }
                }}
                className={`w-full py-3 px-6 font-semibold rounded-2xl transition-all duration-200 ${message.includes('sent')
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                  } hover:shadow-lg transform hover:-translate-y-0.5`}
              >
                {message.includes('sent') ? 'Continue to Sign In' : 'Try Again'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;