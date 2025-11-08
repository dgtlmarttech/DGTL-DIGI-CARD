"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../context/userContext";

export default function InstallAppPage() {
  const router = useRouter();
  const { isAuthenticated, loading, initializing, userInfo, user } = useUser();

  useEffect(() => {
    if (!initializing && !loading) {
      if (!isAuthenticated) {
        // Redirect to sign-in with return URL
        router.push('/signin?returnUrl=/install-app');
      } else {
        // Redirect authenticated users to their card page
        const cardUrl = userInfo?.customUID || user?.uid;
        if (cardUrl) {
          router.push(`/${cardUrl}`);
        }
      }
    }
  }, [isAuthenticated, loading, initializing, router, userInfo, user]);

  // Show loading state while checking authentication and redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
