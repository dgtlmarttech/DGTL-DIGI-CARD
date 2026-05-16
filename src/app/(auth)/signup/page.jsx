// app/signup/page.jsx
'use client';
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUpUsingEmailPassword, signInWithGoogle } from "../../../services/firebaseAuthService";
import { getAuth } from "firebase/auth";
import { FaEye, FaEyeSlash, FaUser, FaEnvelope, FaPhone, FaLock, FaArrowRight, FaArrowLeft, FaCheck, FaGoogle, FaShieldAlt } from "react-icons/fa";
import BubbleBackground from "../../../components/BubbleBackground.jsx";
import { db } from "../../../firebase/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const SignUp = () => {
  const router = useRouter();
  const auth = getAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [referralCode, setReferralCode] = useState("");

  // OTP State
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [emailTimer, setEmailTimer] = useState(0);
  const [phoneTimer, setPhoneTimer] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    getValues,
    formState: { errors },
  } = useForm();

  const emailValue = watch("email");
  const mobileValue = watch("mobile");
  const firstNameValue = watch("firstName");

  useEffect(() => {
    document.title = "Signup – Digital Visiting Card";
    const urlParams = new URLSearchParams(window.location.search);
    setReferralCode(urlParams.get("ref") || "");
  }, []);

  // Timer logic for resending OTP
  useEffect(() => {
    let interval;
    if (emailTimer > 0) {
      interval = setInterval(() => setEmailTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [emailTimer]);

  useEffect(() => {
    let interval;
    if (phoneTimer > 0) {
      interval = setInterval(() => setPhoneTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [phoneTimer]);

  const pwdValue = watch("password", "");
  const confirmValue = watch("confirmPassword", "");

  /**
   * STEP 1 -> STEP 2: Send OTPs
   */
  const handleSendOTPs = async () => {
    setErrorMessage("");
    const isValid = await trigger(["firstName", "lastName", "email", "mobile"]);
    if (!isValid) return;

    setLoading(true);
    try {
      // Check if email is already registered
      const qEmail = query(collection(db, "users"), where("email", "==", emailValue.trim()));
      const emailSnap = await getDocs(qEmail);
      if (!emailSnap.empty) {
        throw new Error("This email is already registered. Please Sign In or use another email.");
      }

      // Check if phone number is already registered
      const qMobile = query(collection(db, "users"), where("mobile", "==", mobileValue.trim()));
      const mobileSnap = await getDocs(qMobile);
      if (!mobileSnap.empty) {
        throw new Error("This mobile number is already registered. Please use another mobile number.");
      }

      // 1. Send Email OTP
      const emailRes = await fetch('/api/otp/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailValue, firstName: firstNameValue })
      });
      const emailData = await emailRes.json();
      if (!emailData.success) throw new Error(emailData.error || 'Failed to send email OTP');

      // 2. Send Phone OTP (Message Central)
      const phoneRes = await fetch('/api/otp/phone/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber: mobileValue })
      });
      const phoneData = await phoneRes.json();
      if (!phoneData.success) throw new Error(phoneData.error || 'Failed to send phone OTP');

      setVerificationId(phoneData.verificationId);
      setEmailTimer(60);
      setPhoneTimer(60);
      setCurrentStep(2);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * VERIFY EMAIL OTP
   */
  const handleVerifyEmail = async () => {
    if (!emailOtp || emailOtp.length < 6) return;
    setLoading(true);
    try {
      const res = await fetch('/api/otp/email/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailValue, otp: emailOtp })
      });
      const data = await res.json();
      if (data.success) {
        setIsEmailVerified(true);
      } else {
        setErrorMessage(data.message || 'Invalid Email OTP');
      }
    } catch (error) {
      setErrorMessage('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * VERIFY PHONE OTP
   */
  const handleVerifyPhone = async () => {
    if (!phoneOtp || phoneOtp.length < 6) return;
    setLoading(true);
    try {
      const res = await fetch('/api/otp/phone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mobileNumber: mobileValue, 
          otp: phoneOtp,
          verificationId: verificationId
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsPhoneVerified(true);
      } else {
        setErrorMessage(data.message || 'Invalid Phone OTP');
      }
    } catch (error) {
      setErrorMessage('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * FINAL SUBMIT (STEP 3)
   */
  const onSubmit = async (data) => {
    if (!isEmailVerified || !isPhoneVerified) {
      setErrorMessage("Please verify both Email and Phone first.");
      setCurrentStep(2);
      return;
    }

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
        // Since we verified via OTP, we can potentially skip manual link verification 
        // but it's good to have for Firebase consistency. 
        // Here we just redirect as they are already "verified" in our logic.
        
        fetch('/api/send-welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: data.email.trim(),
            firstName: data.firstName.trim(),
            uid: currentUser.uid,
          }),
        }).catch((err) => console.error('Welcome email error:', err));

        router.push("/dashboard");
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-4 lg:p-8">
      <BubbleBackground />

      {/* Modern, Premium Glassmorphism Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white/10 border border-white/20 p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 max-w-xs text-center backdrop-blur-lg">
            <div className="h-12 w-12 animate-[spin_1s_linear_infinite] rounded-full border-4 border-white/20 border-t-blue-400"></div>
            <p className="text-white font-semibold text-lg">Please wait...</p>
            <p className="text-white/75 text-sm">Processing your request</p>
          </div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-6xl min-h-[85vh] grid lg:grid-cols-2 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Left Side (Branding) */}
        <div className="hidden lg:flex flex-col justify-center items-center p-8 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
          <div className="text-center max-w-sm">
            <h1 className="text-4xl font-bold mb-6">Join the Digital Revolution</h1>
            <p className="text-white/80 mb-8 text-lg">Verify your identity and start creating professional business cards in minutes.</p>
            
            <div className="flex flex-col gap-6">
              <div className={`flex items-center gap-4 p-4 rounded-xl transition-all ${currentStep === 1 ? 'bg-white/20 border border-white/30' : 'opacity-50'}`}>
                <div className="w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold">1</div>
                <div className="text-left">
                  <p className="font-semibold text-lg">Basic Info</p>
                  <p className="text-sm">Personal details</p>
                </div>
              </div>
              <div className={`flex items-center gap-4 p-4 rounded-xl transition-all ${currentStep === 2 ? 'bg-white/20 border border-white/30' : 'opacity-50'}`}>
                <div className="w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold">2</div>
                <div className="text-left">
                  <p className="font-semibold text-lg">Security Check</p>
                  <p className="text-sm">Email & Phone OTP</p>
                </div>
              </div>
              <div className={`flex items-center gap-4 p-4 rounded-xl transition-all ${currentStep === 3 ? 'bg-white/20 border border-white/30' : 'opacity-50'}`}>
                <div className="w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold">3</div>
                <div className="text-left">
                  <p className="font-semibold text-lg">Account Setup</p>
                  <p className="text-sm">Create password</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side (Form) */}
        <div className="flex flex-col justify-center p-6 lg:p-12">
          <div className="w-full max-w-md mx-auto">
            
            {/* Step Header */}
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {currentStep === 1 && "Start Your Journey"}
                {currentStep === 2 && "Identity Verification"}
                {currentStep === 3 && "Secure Your Account"}
              </h2>
              <p className="text-gray-500">
                {currentStep === 1 && "Fill in your details to get started"}
                {currentStep === 2 && "We've sent codes to your email and phone"}
                {currentStep === 3 && "Almost there! Create your password"}
              </p>
            </div>

            {errorMessage && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <p className="text-sm font-medium">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              
              {/* STEP 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-5 animate-fadeIn">
                   <button
                    type="button"
                    onClick={handleGoogleSignUp}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all mb-6"
                  >
                    <FaGoogle className="text-red-500" />
                    Continue with Google
                  </button>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 h-[1px] bg-gray-200"></div>
                    <span className="text-gray-400 text-sm">or register with email</span>
                    <div className="flex-1 h-[1px] bg-gray-200"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-gray-700 block mb-1">First Name*</label>
                      <input
                        {...register("firstName", { required: "Required" })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-700 block mb-1">Last Name*</label>
                      <input
                        {...register("lastName", { required: "Required" })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-1">Email*</label>
                    <input
                      type="email"
                      {...register("email", { required: "Required", pattern: /^\S+@\S+$/i })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-1">Mobile Number*</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">+91</span>
                      <input
                        type="tel"
                        {...register("mobile", { required: "Required", minLength: 10, maxLength: 10 })}
                        className="w-full pl-14 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                        placeholder="9876543210"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendOTPs}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-6"
                  >
                    Send Verification Codes
                    <FaArrowRight />
                  </button>
                </div>
              )}

              {/* STEP 2: Verification */}
              {currentStep === 2 && (
                <div className="space-y-8 animate-fadeIn">
                  
                  {/* Email OTP Section */}
                  <div className="p-5 border-2 border-gray-100 rounded-2xl bg-gray-50/50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isEmailVerified ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                          {isEmailVerified ? <FaCheck /> : <FaEnvelope />}
                        </div>
                        <span className="font-bold text-gray-700">Email OTP</span>
                      </div>
                      {isEmailVerified && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">VERIFIED</span>}
                    </div>
                    
                    <div className="flex gap-2">
                      <input
                        disabled={isEmailVerified}
                        type="text"
                        maxLength={6}
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value)}
                        className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold tracking-[0.5em] text-center outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-gray-900"
                        placeholder="000000"
                      />
                      <button
                        type="button"
                        disabled={isEmailVerified || emailOtp.length < 6}
                        onClick={handleVerifyEmail}
                        className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        Verify
                      </button>
                    </div>
                    {!isEmailVerified && (
                      <button 
                        type="button"
                        disabled={emailTimer > 0}
                        onClick={handleSendOTPs}
                        className="mt-3 text-sm font-semibold text-blue-600 hover:underline disabled:text-gray-400"
                      >
                        {emailTimer > 0 ? `Resend in ${emailTimer}s` : "Resend Email Code"}
                      </button>
                    )}
                  </div>

                  {/* Phone OTP Section */}
                  <div className="p-5 border-2 border-gray-100 rounded-2xl bg-gray-50/50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPhoneVerified ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                          {isPhoneVerified ? <FaCheck /> : <FaPhone />}
                        </div>
                        <span className="font-bold text-gray-700">Phone OTP</span>
                      </div>
                      {isPhoneVerified && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">VERIFIED</span>}
                    </div>
                    
                    <div className="flex gap-2">
                      <input
                        disabled={isPhoneVerified}
                        type="text"
                        maxLength={6}
                        value={phoneOtp}
                        onChange={(e) => setPhoneOtp(e.target.value)}
                        className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold tracking-[0.5em] text-center outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-gray-900"
                        placeholder="000000"
                      />
                      <button
                        type="button"
                        disabled={isPhoneVerified || phoneOtp.length < 6}
                        onClick={handleVerifyPhone}
                        className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        Verify
                      </button>
                    </div>
                    {!isPhoneVerified && (
                      <button 
                        type="button"
                        disabled={phoneTimer > 0}
                        onClick={handleSendOTPs}
                        className="mt-3 text-sm font-semibold text-blue-600 hover:underline disabled:text-gray-400"
                      >
                        {phoneTimer > 0 ? `Resend in ${phoneTimer}s` : "Resend SMS Code"}
                      </button>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="flex-1 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                    >
                      <FaArrowLeft /> Back
                    </button>
                    <button
                      type="button"
                      disabled={!isEmailVerified || !isPhoneVerified}
                      onClick={() => setCurrentStep(3)}
                      className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      Continue <FaArrowRight />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Password */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="bg-blue-50 p-4 rounded-xl flex items-center gap-3 mb-6">
                    <FaShieldAlt className="text-blue-600 text-2xl" />
                    <p className="text-sm text-blue-800">Your email and phone are verified! Now create a password for your account.</p>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-1">Create Password*</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        {...register("password", { 
                          required: "Required",
                          minLength: { value: 8, message: "Minimum 8 characters" }
                        })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-1">Confirm Password*</label>
                    <input
                      type={showConfirm ? "text" : "password"}
                      {...register("confirmPassword", { 
                        validate: val => val === pwdValue || "Passwords do not match"
                      })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Complete Registration
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="w-full py-3 text-gray-500 font-semibold hover:text-gray-700"
                  >
                    Back to Verification
                  </button>
                </div>
              )}

            </form>

            {/* Footer */}
            <div className="mt-8 text-center border-t border-gray-100 pt-6">
              <p className="text-gray-600 text-sm">
                Already have an account?{" "}
                <Link href="/signin" className="font-bold text-blue-600 hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SignUp;
