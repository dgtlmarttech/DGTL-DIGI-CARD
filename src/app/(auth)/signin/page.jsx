'use client';
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { auth } from "../../../firebase/firebase";
import { useRouter } from "next/navigation";
import {
  signInUsingEmailPassword,
  signInWithGoogle,
  handleRedirectResult
} from "../../../services/firebaseAuthService";
import Link from "next/link";
import { sendEmailVerification } from "firebase/auth";
import { FaEye, FaEyeSlash, FaCheckCircle, FaGoogle } from "react-icons/fa";
import ProgressIndicator from "../../../components/ProgressIndicator";
import BubbleBackground from "../../../components/BubbleBackground";

const SignIn = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const passwordValue = watch("password", "");
  const [isLoading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Handle redirect result on page load (for fallback cases)
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        setLoading(true);
        const user = await handleRedirectResult();
        if (user) {
          router.push('/dashboard');
        }
      } catch (err) {
        setErrorMessage(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkRedirectResult();
  }, [router]);

  const togglePassword = () => setPasswordVisible((v) => !v);

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMessage("");

    try {
      await signInUsingEmailPassword(data.email, data.password);

      const currentUser = auth.currentUser;

      if (currentUser && !currentUser.emailVerified) {
        await sendEmailVerification(currentUser);
        setErrorMessage("Email not verified. A new verification link has been sent. Please verify your email before logging in.");
        await auth.signOut();
        return;
      }

      router.push('/dashboard');
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const result = await signInWithGoogle();

      // If we get a result (popup worked), redirect to dashboard
      if (result) {
        router.push('/dashboard');
      }
      // If no result, it means redirect was triggered, so don't set loading to false
      // The useEffect will handle the redirect result
    } catch (err) {
      setErrorMessage(err.message);
      setLoading(false);
    }
  };

  if (isLoading) {
    return <ProgressIndicator type={2} />;
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 font-sans text-gray-800">
      <BubbleBackground />
      <div className="relative z-10 mx-4 my-8 grid w-full max-w-5xl overflow-visible rounded-xl bg-white/95 backdrop-blur-sm shadow-2xl md:grid-cols-2">
        {/* Left Promo Panel */}
        <aside className="hidden flex-col items-center justify-center p-8 text-center text-white md:flex bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
          <img
            src="/form.jpg"
            alt="Digital Card Preview"
            className="mb-8 w-48 rounded-lg shadow-lg"
          />
          <h1 className="mb-6 text-3xl font-extrabold leading-tight">Welcome Back!</h1>
          <ul className="mb-4 space-y-3">
            <li className="flex items-center text-lg font-medium">
              <FaCheckCircle className="mr-3 text-2xl text-green-400" />
              Access Your Digital Card Instantly
            </li>
            <li className="flex items-center text-lg font-medium">
              <FaCheckCircle className="mr-3 text-2xl text-green-400" />
              Share with Anyone, Anywhere
            </li>
            <li className="flex items-center text-lg font-medium">
              <FaCheckCircle className="mr-3 text-2xl text-green-400" />
              Update Your Info in Real-Time
            </li>
            <li className="flex items-center text-lg font-medium">
              <FaCheckCircle className="mr-3 text-2xl text-green-400" />
              Track Engagement & Analytics
            </li>
          </ul>
        </aside>

        {/* Right Form Panel */}
        <main className="flex flex-col items-center justify-center p-8 bg-white">
          <h2 className="mb-7 text-3xl font-bold text-gray-900">Sign In</h2>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 w-full max-w-md rounded-lg bg-red-50 border-l-4 border-red-400 p-3">
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="mb-6 w-full max-w-md flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaGoogle className="text-red-500" size={20} />
            Continue with Google
          </button>

          {/* Rest of the component remains the same */}
          {/* Divider */}
          <div className="w-full max-w-md flex items-center mb-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md" noValidate>
            {/* Email Field */}
            <div className="mb-5">
              <input
                type="email"
                placeholder="Email Address"
                className={`w-full rounded-lg border-2 bg-gray-50/50 p-3 text-gray-900 transition-all duration-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 ${errors.email ? 'border-red-400' : 'border-gray-300'
                  }`}
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email",
                  },
                })}
              />
              {errors.email && (
                <small className="mt-1 block text-red-500">{errors.email.message}</small>
              )}
            </div>

            {/* Password Field */}
            <div className="relative mb-5">
              <input
                type={passwordVisible ? "text" : "password"}
                placeholder="Password"
                className={`w-full rounded-lg border-2 bg-gray-50/50 p-3 pr-10 text-gray-900 transition-all duration-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 ${errors.password ? 'border-red-400' : 'border-gray-300'
                  }`}
                {...register("password", {
                  required: "Password is required",
                })}
              />
              {passwordValue && (
                <span
                  className="absolute inset-y-0 right-3 flex cursor-pointer items-center text-gray-500 hover:text-gray-700 transition-colors"
                  onClick={togglePassword}
                >
                  {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                </span>
              )}
              {errors.password && (
                <small className="mt-1 block text-red-500">{errors.password.message}</small>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="text-right mb-5">
              <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-3 text-lg font-semibold text-white transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing In...
                </div>
              ) : (
                "Sign In"
              )}
            </button>

            {/* Sign Up Link */}
            <p className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/signup" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                Sign Up
              </Link>
            </p>
          </form>
        </main>
      </div>
    </div>
  );
};

export default SignIn;
