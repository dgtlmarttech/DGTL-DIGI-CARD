'use client'

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { auth} from "../../firebase/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { signInUsingEmailPassword } from "../../services/firebaseAuthService";
import ProgressIndicator from "../../components/ProgressIndicator";
import { signOut } from "firebase/auth";

// Function to check if the user has admin privileges.
const checkAdminPrivileges = async (user) => {
  if (!user || !user.getIdTokenResult) {
    console.error("Invalid user object:", user);
    return false;
  }
  try {
    const idTokenResult = await user.getIdTokenResult();
    // console.log("Admin Claim:", idTokenResult.claims.admin);
    return idTokenResult.claims.admin === true;
  } catch (error) {
    console.error("Error getting ID token result:", error);
    return false;
  }
};

const AdminSignIn = () => {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [user, loadingAuthState] = useAuthState(auth);
  const [isLoading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMessage("");
    try {
      await signInUsingEmailPassword(data.email, data.password);
      const currentUser = auth.currentUser;

      // Verify if the user is an admin
      const isAdmin = await checkAdminPrivileges(currentUser);
      if (!isAdmin) {
        setModalMessage("You do not have admin privileges.");
        setShowModal(true);
        await signOut(auth);
        setLoading(false);
        return;
      }
      console.log("Admin logged in successfully");
      router.push("/admin/dashboard");
    } catch (error) {
      setErrorMessage(error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Admin Sign In - Digital Visiting Card";

    if (!loadingAuthState && user) {
      checkAdminPrivileges(user).then((isAdmin) => {
        if (isAdmin) {
          router.push("/admin/dashboard");
        } else {
          signOut(auth);
        }
      });
    }
  }, [user, loadingAuthState, router]);

  const closeModal = () => {
    setShowModal(false);
    setModalMessage("");
  };

  return (
    <>
      {isLoading || loadingAuthState ? (
        <ProgressIndicator />
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-100 font-sans p-4">
          <div className="bg-white max-w-md w-full p-8 sm:p-10 rounded-3xl shadow-2xl border border-gray-200 transform hover:scale-105 transition-transform duration-300">
            <h2 className="text-center text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
              Admin Sign In 🔐
            </h2>
            <p className="text-center text-gray-500 mb-8">
              Access the administrator dashboard.
            </p>
            {errorMessage && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 text-sm">
                <span className="block sm:inline">{errorMessage}</span>
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col space-y-6">
              <div className="relative">
                <label className="text-sm font-medium text-gray-700 sr-only">Email Address</label>
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full p-4 border border-gray-300 text-gray-900 rounded-xl text-base focus:outline-none focus:ring-4 focus:ring-blue-200 transition-shadow duration-300"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                      message: "Enter a valid email",
                    },
                  })}
                />
                {errors.email && (
                  <span className="text-red-500 text-xs mt-1 absolute left-0 -bottom-5">
                    {errors.email.message}
                  </span>
                )}
              </div>
              <div className="relative">
                <label className="text-sm font-medium text-gray-700 sr-only">Password</label>
                <input
                  type={passwordVisible ? "text" : "password"}
                  placeholder="Password"
                  className="w-full p-4 border border-gray-300 text-gray-900 rounded-xl text-base focus:outline-none focus:ring-4 focus:ring-blue-200 transition-shadow duration-300"
                  {...register("password", { required: "Password is required" })}
                />
                <span
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 transition-colors duration-200"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                >
                  {passwordVisible ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                </span>
                {errors.password && (
                  <span className="text-red-500 text-xs mt-1 absolute left-0 -bottom-5">
                    {errors.password.message}
                  </span>
                )}
              </div>
              <Link
                href="/forgot-password"
                className="text-sm text-right text-blue-600 font-medium hover:text-blue-800 transition-colors duration-200 hover:underline"
              >
                Forgot Password?
              </Link>
              <button
                type="submit"
                className="bg-blue-600 text-white p-4 rounded-xl text-lg font-bold shadow-lg hover:bg-blue-700 transition-colors duration-200 transform hover:-translate-y-1"
              >
                Log In as Admin
              </button>
              <p className="text-center text-sm text-gray-600">
                Not an admin?{" "}
                <Link
                  href="/signin"
                  className="text-blue-600 font-semibold hover:text-blue-800 transition-colors duration-200 hover:underline"
                >
                  Sign In Here
                </Link>
              </p>
            </form>
          </div>
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center transform scale-105 transition-transform duration-300">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Permission Denied 🚫</h3>
            <p className="text-gray-700 mb-6">{modalMessage}</p>
            <button
              onClick={closeModal}
              className="bg-blue-600 text-white p-3 rounded-lg text-base font-semibold hover:bg-blue-700 transition-colors duration-200 w-full"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSignIn;