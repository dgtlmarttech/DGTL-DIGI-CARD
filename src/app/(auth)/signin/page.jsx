'use client';
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { auth } from "../../../firebase/firebase";
import { useRouter } from "next/navigation"; // Use Next.js router for navigation
import { signInUsingEmailPassword } from "../../../services/firebaseAuthService";
import Link from "next/link"; // Use Next.js Link component
import { sendEmailVerification } from "firebase/auth";
import { FaEye, FaEyeSlash, FaCheckCircle } from "react-icons/fa";
// Assuming these components are correctly implemented with Tailwind
import ProgressIndicator from "../../../components/ProgressIndicator";
import BubbleBackground from "../../../components/BubbleBackground";

const SignIn = () => {
  const router = useRouter();

  // react-hook-form setup
  const {
    register,
    handleSubmit,
    watch, // We need watch to know the current value of "password"
    formState: { errors },
  } = useForm();

  // Get the current password value to conditionally show the eye icon
  const passwordValue = watch("password", "");
  const [isLoading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  document.title = "Sign In – Digital Visiting Card";


  const togglePassword = () => setPasswordVisible((v) => !v);

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMessage(""); // Clear previous errors
    try {
      await signInUsingEmailPassword(data.email, data.password);
      const currentUser = auth.currentUser;
      if (currentUser && !currentUser.emailVerified) {
        await sendEmailVerification(currentUser);
        // Using state to display the message instead of a blocking alert()
        setErrorMessage("Email not verified. A new verification link has been sent. Please verify your email before logging in.");
        await auth.signOut();
        setLoading(false);
        return;
      }
    } catch (err) {
      setErrorMessage(err.message);
    }
    setLoading(false);
  };

  if (isLoading) {
    return <ProgressIndicator type={2} />;
  }

  return (
    // Main page container with Tailwind styles replacing #SignInPage
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-blue-500 font-sans text-gray-800">
      <BubbleBackground />

      {/* Wrapper grid replacing .signin-container */}
      <div className="relative z-10 mx-4 grid w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-xl md:grid-cols-2">
        {/* Left Promo Panel replacing .signin-left */}
        <aside className="hidden flex-col items-center p-8 text-center text-white md:flex" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)' }}>
          <img
            src="/form.jpg"
            alt="Digital Card Preview"
            // Replaced .signin-preview-img with Tailwind classes
            className="mb-8 w-48 rounded-lg shadow-lg"
          />
          {/* Replaced .signin-left h1 with Tailwind classes */}
          <h1 className="mb-6 text-3xl font-extrabold leading-tight">Welcome Back!</h1>
          {/* Replaced .signin-features with Tailwind classes */}
          <ul className="mb-4 list-none p-0">
            <li className="my-3 flex items-center text-lg font-medium">
              {/* Replaced .signin-features svg with Tailwind classes */}
              <FaCheckCircle className="mr-3 text-2xl text-green-400" /> Access Your Digital Card Instantly
            </li>
            <li className="my-3 flex items-center text-lg font-medium">
              <FaCheckCircle className="mr-3 text-2xl text-green-400" /> Share with Anyone, Anywhere
            </li>
            <li className="my-3 flex items-center text-lg font-medium">
              <FaCheckCircle className="mr-3 text-2xl text-green-400" /> Update Your Info in Real-Time
            </li>
            <li className="my-3 flex items-center text-lg font-medium">
              <FaCheckCircle className="mr-3 text-2xl text-green-400" /> Track Engagement & Analytics
            </li>
          </ul>
        </aside>

        {/* Right Form Panel replacing .signin-right */}
        <main className="flex flex-col items-center justify-center flex-direction-column bg-white p-8">
          {/* Replaced .signin-title with Tailwind classes */}
          <h2 className="mb-7 text-3xl font-bold text-gray-900">Sign In</h2>
          {/* Replaced .signin-form with Tailwind classes */}
          <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md" noValidate>
            {/* Display error message here instead of a popup */}
            {errorMessage && (
              <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}
            
            {/* Replaced .field with Tailwind classes */}
            <div className="mb-5">
              <input
                type="email"
                placeholder="Email Address"
                className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-gray-900 transition duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email",
                  },
                })}
              />
              {errors.email && (
                // Replaced .field small with Tailwind classes
                <small className="mt-1 block text-red-500">{errors.email.message}</small>
              )}
            </div>

            {/* Replaced .field .password-field with Tailwind classes */}
            <div className="relative mb-5">
              <input
                type={passwordVisible ? "text" : "password"}
                placeholder="Password"
                className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3 pr-10 text-gray-900 transition duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                {...register("password", {
                  required: "Password is required",
                })}
              />
              {/* Render toggle icon only if user has typed at least one character */}
              {passwordValue && (
                // Replaced .toggle-password with Tailwind classes
                <span className="absolute inset-y-0 right-3 flex cursor-pointer items-center text-gray-500" onClick={togglePassword}>
                  {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                </span>
              )}
              {errors.password && (
                <small className="mt-1 block text-red-500">{errors.password.message}</small>
              )}
            </div>

            {/* Replaced .forgot-password with Next.js Link component and Tailwind classes */}
            <Link href="/forgot-password" className="text-right text-sm text-blue-600 hover:underline">
              Forgot Password?
            </Link>

            {/* Replaced .login with Tailwind classes */}
            <div className="mt-7 flex">
              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold text-white transition duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Log In
              </button>
            </div>

            {/* Replaced .signup-link with Tailwind classes */}
            <p className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{" "}
              {/* Replaced .signup-link a with Next.js Link component and Tailwind classes */}
              <Link href="/signup" className="font-semibold text-blue-600 hover:underline">
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
