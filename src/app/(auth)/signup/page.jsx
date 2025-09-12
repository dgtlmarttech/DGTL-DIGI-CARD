'use client';
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUpUsingEmailPassword } from "../../../services/firebaseAuthService";
import { getAuth, sendEmailVerification } from "firebase/auth";
import { FaEye, FaEyeSlash, FaUser, FaEnvelope, FaPhone, FaLock, FaArrowRight, FaArrowLeft, FaCheck } from "react-icons/fa";
import ProgressIndicator from "../../../components/ProgressIndicator.jsx";
import BubbleBackground from "../../../components/BubbleBackground.jsx";

const SignUp = () => {
  const router = useRouter();
  const auth = getAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [referralCode, setReferralCode] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    document.title = "Signup – Digital Visiting Card";
    const urlParams = new URLSearchParams(window.location.search);
    setReferralCode(urlParams.get("ref") || "");

    // Facebook Pixel initialization
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
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq("init", "396102998437619");
      window.fbq("track", "PageView");
    }
  }, []);

  const pwdValue = watch("password", "");
  const confirmValue = watch("confirmPassword", "");

  const handleNextStep = async () => {
    setErrorMessage("");
    const step1Fields = ["firstName", "lastName", "email", "mobile"];
    const isStep1Valid = await trigger(step1Fields);
    
    if (isStep1Valid) {
      setCurrentStep(2);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
    setErrorMessage("");
  };

  const onSubmit = async (data) => {
    setErrorMessage("");
    setLoading(true);

    try {
      const signupData = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim(),
        password: data.password,
        mobile: data.mobile?.trim() || "",
        affiliateRef: referralCode,
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
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-2 overflow-hidden">
      <BubbleBackground />
      
      {/* Main Container */}
      <div className="relative z-10 w-full max-w-6xl h-[95vh] grid lg:grid-cols-2 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Left Panel - Brand Side */}
        <div className="hidden lg:flex flex-col justify-center items-center p-8 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white relative">
          <div className="text-center max-w-sm">
            <img
              src="/form.jpg"
              alt="Digital Card Preview"
              className="w-40 h-28 object-cover rounded-xl shadow-xl mx-auto mb-6"
            />
            
            <h1 className="text-3xl font-bold mb-4 leading-tight">
              Create Your Digital
              <span className="block text-yellow-300">Business Card</span>
            </h1>

            {/* Step Indicator */}
            <div className="flex justify-center items-center mb-6 space-x-4">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                currentStep >= 1 ? 'bg-white text-blue-600 border-white' : 'border-white/50 text-white/50'
              }`}>
                {currentStep > 1 ? <FaCheck size={16} /> : '1'}
              </div>
              <div className={`w-8 h-1 rounded transition-all duration-300 ${
                currentStep >= 2 ? 'bg-white' : 'bg-white/30'
              }`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                currentStep >= 2 ? 'bg-white text-blue-600 border-white' : 'border-white/50 text-white/50'
              }`}>
                2
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className={`transition-all duration-300 ${currentStep === 1 ? 'text-yellow-300 font-semibold' : 'text-white/80'}`}>
                📝 Personal Information
              </div>
              <div className={`transition-all duration-300 ${currentStep === 2 ? 'text-yellow-300 font-semibold' : 'text-white/80'}`}>
                🔐 Secure Your Account
              </div>
            </div>
            
            <div className="mt-6 space-y-2 text-xs text-white/70">
              <div className="flex items-center justify-center space-x-2">
                <span>🚀</span>
                <span>Quick Registration</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span>🌐</span>
                <span>Instant DigiCard URL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Form Side */}
        <div className="flex flex-col justify-center p-4 lg:p-8">
          <div className="w-full max-w-sm mx-auto">
            
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {currentStep === 1 ? "Let's Get Started" : "Secure Your Account"}
              </h2>
              <p className="text-gray-600">
                {currentStep === 1 ? "Tell us about yourself" : "Create a secure password"}
              </p>
              
              {/* Mobile Step Indicator */}
              <div className="flex justify-center items-center mt-4 lg:hidden space-x-2">
                <div className={`w-8 h-2 rounded transition-all duration-300 ${
                  currentStep >= 1 ? 'bg-blue-600' : 'bg-gray-200'
                }`}></div>
                <div className={`w-8 h-2 rounded transition-all duration-300 ${
                  currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'
                }`}></div>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 rounded">
                <p className="text-red-700 text-sm">{errorMessage}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              
              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-fadeIn text-gray-600">
                  
                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <FaUser className="text-blue-500" size={12} />
                        First Name*
                      </label>
                      <input
                        className={`w-full px-4 py-3 rounded-xl border-2 bg-gray-50/50 transition-all duration-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 ${
                          errors.firstName ? 'border-red-400' : 'border-gray-200'
                        }`}
                        placeholder="John"
                        {...register("firstName", {
                          required: "First name is required",
                          minLength: { value: 2, message: "Minimum 2 characters" },
                        })}
                      />
                      {errors.firstName && (
                        <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <FaUser className="text-blue-500" size={12} />
                        Last Name*
                      </label>
                      <input
                        className={`w-full px-4 py-3 rounded-xl border-2 bg-gray-50/50 transition-all duration-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 ${
                          errors.lastName ? 'border-red-400' : 'border-gray-200'
                        }`}
                        placeholder="Doe"
                        {...register("lastName", {
                          required: "Last name is required",
                          minLength: { value: 2, message: "Minimum 2 characters" },
                        })}
                      />
                      {errors.lastName && (
                        <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <FaEnvelope className="text-blue-500" size={12} />
                      Email Address*
                    </label>
                    <input
                      type="email"
                      className={`w-full px-4 py-3 rounded-xl border-2 bg-gray-50/50 transition-all duration-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 ${
                        errors.email ? 'border-red-400' : 'border-gray-200'
                      }`}
                      placeholder="john@example.com"
                      {...register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "Please enter a valid email",
                        },
                      })}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Mobile */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <FaPhone className="text-blue-500" size={12} />
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      className={`w-full px-4 py-3 rounded-xl border-2 bg-gray-50/50 transition-all duration-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 ${
                        errors.mobile ? 'border-red-400' : 'border-gray-200'
                      }`}
                      placeholder="+91 8787886876"
                      {...register("mobile", {
                        pattern: {
                          value: /^[0-9]{6,14}$/,
                          message: "Please enter a valid phone number",
                        },
                      })}
                    />
                    {errors.mobile && (
                      <p className="text-red-500 text-sm mt-1">{errors.mobile.message}</p>
                    )}
                  </div>

                  {/* Next Button */}
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    Continue
                    <FaArrowRight size={14} />
                  </button>

                  {/* Sign In Link */}
                  <div className="text-center pt-4 border-t border-gray-100">
                    <p className="text-gray-600 text-sm">
                      Already have an account?{" "}
                      <Link 
                        href="/signin" 
                        className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Sign In
                      </Link>
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Security */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-fadeIn text-gray-600">
                  
                  {/* Password */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <FaLock className="text-blue-500" size={12} />
                      Password*
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className={`w-full px-4 py-3 pr-12 rounded-xl border-2 bg-gray-50/50 transition-all duration-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 ${
                          errors.password ? 'border-red-400' : 'border-gray-200'
                        }`}
                        placeholder="Create a strong password"
                        {...register("password", {
                          required: "Password is required",
                          minLength: { value: 8, message: "Minimum 8 characters required" },
                          pattern: {
                            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                            message: "Include uppercase, lowercase, and number",
                          },
                        })}
                      />
                      {pwdValue && (
                        <button
                          type="button"
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                      )}
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                    )}
                    
                    {/* Password Requirements */}
                    {pwdValue && (
                      <div className="mt-2 space-y-1">
                        <div className={`text-xs flex items-center gap-2 ${
                          pwdValue.length >= 8 ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${
                            pwdValue.length >= 8 ? 'bg-green-500' : 'bg-gray-300'
                          }`}></div>
                          At least 8 characters
                        </div>
                        <div className={`text-xs flex items-center gap-2 ${
                          /[A-Z]/.test(pwdValue) ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${
                            /[A-Z]/.test(pwdValue) ? 'bg-green-500' : 'bg-gray-300'
                          }`}></div>
                          One uppercase letter
                        </div>
                        <div className={`text-xs flex items-center gap-2 ${
                          /[a-z]/.test(pwdValue) ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${
                            /[a-z]/.test(pwdValue) ? 'bg-green-500' : 'bg-gray-300'
                          }`}></div>
                          One lowercase letter
                        </div>
                        <div className={`text-xs flex items-center gap-2 ${
                          /\d/.test(pwdValue) ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${
                            /\d/.test(pwdValue) ? 'bg-green-500' : 'bg-gray-300'
                          }`}></div>
                          One number
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <FaLock className="text-blue-500" size={12} />
                      Confirm Password*
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        className={`w-full px-4 py-3 pr-12 rounded-xl border-2 bg-gray-50/50 transition-all duration-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 ${
                          errors.confirmPassword ? 'border-red-400' : 'border-gray-200'
                        }`}
                        placeholder="Confirm your password"
                        {...register("confirmPassword", {
                          required: "Please confirm your password",
                          validate: (value) => value === pwdValue || "Passwords do not match",
                        })}
                      />
                      {confirmValue && (
                        <button
                          type="button"
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          onClick={() => setShowConfirm(!showConfirm)}
                        >
                          {showConfirm ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                      )}
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <FaArrowLeft size={14} />
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-2 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex-grow-2"
                      style={{ flexGrow: 2 }}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Creating...
                        </div>
                      ) : (
                        "Create My Digital Card"
                      )}
                    </button>
                  </div>

                  {/* Helper Text */}
                  <p className="text-xs text-gray-500 text-center">
                    Complete your business profile after account creation
                  </p>
                </div>
              )}

            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SignUp;
