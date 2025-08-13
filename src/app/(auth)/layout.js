'use client';

import React, { useEffect, useState } from 'react';
import { auth } from '../../firebase/firebase';
import { onAuthStateChanged, sendEmailVerification } from 'firebase/auth';
import { useRouter } from 'next/navigation';

const AuthLayout = ({ children }) => {
  const router = useRouter();
  const [isUser, setIsUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setLoading(true);
        setErrorMessage(''); // Clear previous errors

        if (user) {
          // Check if email is verified
          if (!user.emailVerified) {
            try {
              await sendEmailVerification(user);
              setErrorMessage(
                "Email not verified. A new verification link has been sent. Please verify your email before continuing."
              );
              await auth.signOut();
              setIsUser(false);
            } catch (verificationError) {
              console.error('Error sending verification email:', verificationError);
              setErrorMessage(
                "Unable to send verification email. Please try again later."
              );
              await auth.signOut();
              setIsUser(false);
            }
          } else {
            // User is authenticated and verified
            setIsUser(true);
            router.push('/dashboard');
          }
        } else {
          // No user is signed in
          setIsUser(false);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        setErrorMessage('An error occurred during authentication. Please try again.');
        setIsUser(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication status...</p>
        </div>
      </div>
    );
  }

  // Error message display
  if (errorMessage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => setErrorMessage('')}
              className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render children for non-authenticated users or after successful auth
  return <>{children}</>;
};

export default AuthLayout;
