'use client';
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUpUsingEmailPassword } from "../../../services/firebaseAuthService";
import { getAuth, sendEmailVerification } from "firebase/auth";
import { FaEye, FaEyeSlash, FaCheckCircle } from "react-icons/fa";
import ProgressIndicator from "../../../components/ProgressIndicator.jsx";
import BubbleBackground from "../../../components/BubbleBackground.jsx";

const SignUp = () => {
  const router = useRouter();
  const auth = getAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [referralCode, setReferralCode] = useState("");
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    document.title = "Signup – Digital Visiting Card";
    
    const urlParams = new URLSearchParams(window.location.search);
    setReferralCode(urlParams.get("ref") || "");

    // Facebook Pixel (client-side only)
    (function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(
      window,
      document,
      "script",
      "https://connect.facebook.net/en_US/fbevents.js"
    );
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq("init", "396102998437619");
      window.fbq("track", "PageView");
    }
  }, []);

  const pwdValue = watch("password", "");
  const confirmValue = watch("confirmPassword", "");

  const onSubmit = async (data) => {
    setErrorMessage("");
    setLoading(true);

    try {
      // Create account with only essential data
      const signupData = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim(),
        password: data.password,
        mobile: data.mobile?.trim() || "", // Optional field
        affiliateRef: referralCode,
        // Set default values for business fields
        businessName: "",
        website: "",
        address: "",
        about: "",
      };

      await signUpUsingEmailPassword(signupData);
      
      const currentUser = auth.currentUser;
      if (currentUser) {
        await sendEmailVerification(currentUser);
        await auth.signOut();
        router.push("/successful-signup");
      }
    } catch (error) {
      setErrorMessage(error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <ProgressIndicator type={2} />;
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#5e68f2] font-sans text-gray-800">
      <BubbleBackground />
      <div className="relative z-10 mx-4 grid w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-xl md:grid-cols-2">
        {/* Left Panel */}
        <aside className="hidden flex-col items-center p-8 text-center text-white md:flex" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)' }}>
          <img
            src="/form.jpg"
            alt="Digital Card Preview"
            className="mb-8 w-48 rounded-lg shadow-lg"
          />
          <h1 className="mb-6 text-3xl font-extrabold leading-tight">
            Create &amp; Share Your
            <br />
            Free Digital Card!
          </h1>
          <ul className="mb-4 list-none p-0">
            <li className="my-3 flex items-center text-lg font-medium text-black">
              <FaCheckCircle className="mr-3 text-2xl text-green-400" />
              Quick Registration
            </li>
            <li className="my-3 flex items-center text-lg font-medium text-black">
              <FaCheckCircle className="mr-3 text-2xl text-green-400" />
              Get Your DigiCard Weblink
            </li>
            <li className="my-3 flex items-center text-lg font-medium text-black">
              <FaCheckCircle className="mr-3 text-2xl text-green-400" />
              Complete Profile Later
            </li>
            <li className="my-3 flex items-center text-lg font-medium text-black">
              <FaCheckCircle className="mr-3 text-2xl text-green-400" />
              Share Your DigiCard
            </li>
          </ul>
        </aside>

        {/* Right Panel (Form) */}
        <main className="flex items-center justify-center bg-white p-8">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="w-full max-w-md">
            <h2 className="mb-7 text-3xl font-bold text-gray-900">Create New Account</h2>
            
            {/* Display error message */}
            {errorMessage && (
              <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
  <div>
    <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-gray-700">First Name*</label>
    <input id="firstName" className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-gray-900 transition duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50" {...register("firstName", { required: "First Name is required", minLength: { value: 2, message: "First name must be at least 2 characters" } })} />
    {errors.firstName && <small className="mt-1 block text-red-500">{errors.firstName.message}</small>}
  </div>
  <div>
    <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-gray-700">Last Name*</label>
    <input id="lastName" className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-gray-900 transition duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50" {...register("lastName", { required: "Last Name is required", minLength: { value: 2, message: "Last name must be at least 2 characters" } })} />
    {errors.lastName && <small className="mt-1 block text-red-500">{errors.lastName.message}</small>}
  </div>
</div>


            <div className="mb-5">
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Email*
              </label>
              <input
                id="email"
                type="email"
                className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-gray-900 transition duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Invalid email address"
                  },
                })}
              />
              {errors.email && <small className="mt-1 block text-red-500">{errors.email.message}</small>}
            </div>

            <div className="mb-5">
              <label htmlFor="mobile" className="mb-1 block text-sm font-medium text-gray-700">
                Mobile (Optional)
              </label>
              <input
                id="mobile"
                type="tel"
                placeholder="Enter your mobile number"
                className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-gray-900 transition duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                {...register("mobile", {
                  pattern: {
                    value: /^[0-9]{6,14}$/,
                    message: "Invalid phone number"
                  },
                })}
              />
              {errors.mobile && <small className="mt-1 block text-red-500">{errors.mobile.message}</small>}
            </div>

            <div className="mb-5">
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                Password*
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3 pr-10 text-gray-900 transition duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                  {...register("password", { 
                    required: "Password is required", 
                    minLength: { value: 8, message: "Password must be at least 8 characters" },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: "Password must contain at least one uppercase letter, one lowercase letter, and one number"
                    }
                  })}
                />
                {pwdValue && (
                  <span
                    className="absolute inset-y-0 right-3 flex cursor-pointer items-center text-gray-500"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                )}
              </div>
              {errors.password && (
                <small className="mt-1 block text-red-500">{errors.password.message}</small>
              )}
            </div>

            <div className="mb-5">
              <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-gray-700">
                Confirm Password*
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3 pr-10 text-gray-900 transition duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (v) => v === pwdValue || "Passwords must match",
                  })}
                />
                {confirmValue && (
                  <span
                    className="absolute inset-y-0 right-3 flex cursor-pointer items-center text-gray-500"
                    onClick={() => setShowConfirm((v) => !v)}
                  >
                    {showConfirm ? <FaEyeSlash /> : <FaEye />}
                  </span>
                )}
              </div>
              {errors.confirmPassword && (
                <small className="mt-1 block text-red-500">{errors.confirmPassword.message}</small>
              )}
            </div>

            <div className="mt-7">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold text-white transition duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                You can complete your business profile after creating your account
              </p>
            </div>

            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/signin" className="font-semibold text-blue-600 hover:underline">
                Log In
              </Link>
            </p>
          </form>
        </main>
      </div>
    </div>
  );
};

export default SignUp;
