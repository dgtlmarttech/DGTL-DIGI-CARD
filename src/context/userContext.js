'use client'
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { getUserData } from '../services/firebaseAuthService';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState(() => {
    // Initial load from localStorage for offline support
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('dgtl_user_info');
      return cached ? JSON.parse(cached) : null;
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect if running in standalone mode (PWA)
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone ||
        document.referrer.includes('android-app://');
      setIsStandalone(!!standalone);
    };
    checkStandalone();
  }, []);

  // Helper function to calculate effective premium status with trial logic
  const calculateEffectivePremium = (userData) => {
    if (!userData) return false;

    let effectiveIsPremium = userData.isPremium || false;

    // If not truly premium, check trial status
    if (!effectiveIsPremium && userData.trialStartDate) {
      const now = new Date();
      const trialStart = userData.trialStartDate.toDate ? userData.trialStartDate.toDate() : new Date(userData.trialStartDate);
      const trialEnd = new Date(trialStart.getTime() + (30 * 24 * 60 * 60 * 1000)); //30 days

      if (now < trialEnd) {
        effectiveIsPremium = true;
      }
    }

    return effectiveIsPremium;
  };

  // Load user data when auth user changes
  const loadUserData = async (authUser) => {
    try {
      setError(null);

      if (!authUser) {
        setUserInfo(null);
        if (typeof window !== 'undefined') localStorage.removeItem('dgtl_user_info');
        return;
      }

      setLoading(true);

      // Only proceed if user is verified
      if (!authUser.emailVerified) {
        console.log('User email not verified');
        setUserInfo(null);
        return;
      }

      const userData = await getUserData(authUser.uid);

      if (userData) {
        const effectiveIsPremium = calculateEffectivePremium(userData);
        const completeUserInfo = {
          ...userData,
          effectiveIsPremium
        };
        setUserInfo(completeUserInfo);
        // Save to localStorage for offline access
        if (typeof window !== 'undefined') {
          localStorage.setItem('dgtl_user_info', JSON.stringify(completeUserInfo));
        }
      } else {
        console.log('No user data found in Firestore');
        setUserInfo(null);
        if (typeof window !== 'undefined') localStorage.removeItem('dgtl_user_info');
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    // Safety timeout: force initialize to false after 6 seconds
    const timeout = setTimeout(() => {
      setInitializing(state => {
        if (state) {
          console.warn('Auth initialization timed out, continuing...');
          return false;
        }
        return state;
      });
    }, 6000);

    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      clearTimeout(timeout);
      setUser(authUser);

      // Load user data if we have a user
      if (authUser) {
        loadUserData(authUser);
      } else {
        setLoading(false);
        setUserInfo(null);
      }

      // Set initializing to false after first check
      setInitializing(false);
    });

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Refresh user data function
  const refreshUserData = async () => {
    if (user) {
      await loadUserData(user);
    }
  };

  // Update user info locally (for optimistic updates)
  const updateUserInfo = (updates) => {
    if (userInfo) {
      const updatedInfo = { ...userInfo, ...updates };
      // Recalculate effective premium status if relevant fields changed
      if ('isPremium' in updates || 'trialStartDate' in updates) {
        updatedInfo.effectiveIsPremium = calculateEffectivePremium(updatedInfo);
      }
      setUserInfo(updatedInfo);
    }
  };

  // Check if user is current user by comparing IDs
  const isCurrentUser = (targetUserId) => {
    if (!user || !userInfo) return false;
    return userInfo.uid === targetUserId || userInfo.customUID === targetUserId;
  };

  // Check if user has specific permissions
  const hasPermission = (permission) => {
    if (!userInfo) return false;

    switch (permission) {
      case 'premium_features':
        return userInfo.effectiveIsPremium;
      case 'admin':
        return userInfo.isAdmin || false;
      case 'edit_profile':
        return true; // All authenticated users can edit their profile
      default:
        return false;
    }
  };

  // Show loading state while initializing
  if (initializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing authentication...</p>
        </div>
      </div>
    );
  }

  const value = {
    // Auth state
    user,
    userInfo,
    loading,
    error,
    initializing,
    isStandalone,

    // Computed properties
    isAuthenticated: !!user && !!user.emailVerified,
    isPremium: userInfo?.effectiveIsPremium || false,
    isAdmin: userInfo?.isAdmin || false,
    isBlocked: userInfo?.blocked || false,

    // Functions
    refreshUserData,
    updateUserInfo,
    isCurrentUser,
    hasPermission,

    // User properties (with safe defaults)
    displayName: userInfo?.displayName || user?.displayName || '',
    email: userInfo?.email || user?.email || '',
    photoURL: userInfo?.photoURL || user?.photoURL || '',
    customUID: userInfo?.customUID || '',
    cardStyle: userInfo?.cardStyle || 'default',
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
