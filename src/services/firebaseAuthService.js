import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    sendPasswordResetEmail, 
    sendEmailVerification ,
    fetchSignInMethodsForEmail,
  } from "firebase/auth";
  // for gooogle login
  import { 
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from "firebase/auth";
  import { 
    collection, doc, getDoc, getDocs, query, setDoc, where, updateDoc 
  } from "firebase/firestore";
  import { auth, db } from "../firebase/firebase";
  import {sendWelcomeEmail} from "./triggerMail";


  
// Safely access the window object only on the client side
const getActionCodeSettings = () => {
  if (typeof window !== 'undefined') {
    return {
      url: `${window.location.origin}/signin`,
      handleCodeInApp: true,
    };
  }
  return {
    url: 'https://my.dgtldigicard.com/signin', // A fallback URL for server-side
    handleCodeInApp: true,
  };
};
  
  const signInUsingEmailPassword = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log("Signed in successfully");
    return result;
  } catch (error) {
    console.error("signInUsingEmailPassword error:", error);
    throw new Error(emailAuthException(error.code));
  }
};
  
// Enhanced Google Sign-In Implementation with proper fallback
const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    
    // Add custom parameters for better UX
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    // Always try popup first - it works on mobile browsers too
    try {
      const result = await signInWithPopup(auth, provider);
      
      if (!result || !result.user) {
        throw new Error('Google sign in failed');
      }

      console.log("Popup sign-in successful:", result.user.uid);
      return await processGoogleUser(result.user);
      
    } catch (popupError) {
      // If popup fails with specific errors, fallback to redirect
      if (popupError.code === 'auth/popup-blocked' || 
          popupError.code === 'auth/popup-closed-by-user' ||
          popupError.code === 'auth/cancelled-popup-request') {
        
        console.log("Popup blocked, falling back to redirect:", popupError.code);
        
        // Fallback to redirect
        await signInWithRedirect(auth, provider);
        return; // Don't continue processing here for redirect
      }
      
      // Re-throw other errors
      throw popupError;
    }
    
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw new Error(emailAuthException(error.code));
  }
};

// Keep the redirect result handler
const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      console.log("Redirect sign-in successful:", result.user.uid);
      return await processGoogleUser(result.user);
    }
    return null;
  } catch (error) {
    console.error("Error handling redirect result:", error);
    throw new Error(emailAuthException(error.code));
  }
};

// Extract common user processing logic
const processGoogleUser = async (user) => {
  // Check if user exists in Firestore
  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);
  
  if (!userDoc.exists()) {
    // Create new user document for Google sign-in
    const [firstName, lastName] = (user.displayName || 'User Name').split(' ');
    const customUID = `${firstName || 'User'}_${lastName || 'Name'}_${Math.floor(1000 + Math.random() * 9000)}`;
    
    await setDoc(userDocRef, {
      uid: user.uid,
      customUID: customUID,
      firstName: firstName || 'User',
      lastName: lastName || 'Name',
      email: user.email,
      mobile: user.phoneNumber || "",
      profilePicture: user.photoURL || "",
      authProvider: 'google',
      emailVerified: user.emailVerified,
      affiliateRef: "",
      // Business fields with default empty values
      businessName: "",
      website: "",
      address: "",
      about: "",
      //default values
      isPremium: false,
      isTrialActive: true,
      trialStartDate: new Date().toISOString(),
      // Profile completion status
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await sendWelcomeEmail(user.email, `${firstName} ${lastName}`, customUID);
  }

  return user;
};


  const signUpUsingEmailPassword = async (data) => {
  try {
    const { firstName, lastName, password, confirmPassword, ...userData } = data;
    const userCreds = await createUserWithEmailAndPassword(auth, data.email, password);
    
    let user = userCreds.user;
    const customUID = `${firstName}_${lastName}_${Math.floor(1000 + Math.random() * 9000)}`;

    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, {
      uid: user.uid,
      customUID: customUID,
      firstName: firstName,
      lastName: lastName,
      email: data.email,
      mobile: userData.mobile || "",
      affiliateRef: userData.affiliateRef || "",
      // Business fields with default empty values
      businessName: userData.businessName || "",
      website: userData.website || "",
      address: userData.address || "",
      about: userData.about || "",
      //default values
      isPremium: false,
      isTrialActive: true,
      trialStartDate: new Date().toISOString(),
      // Profile completion status
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await sendWelcomeEmail(data.email, `${firstName} ${lastName}`, customUID);


  } catch (e) {
    console.error("signUpUsingEmailPassword error:", e.message);
    throw new Error(emailAuthException(e.code));
  }
};
  
  const resetPasswordUsingEmail = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log("Password reset link sent to email");
      alert("Password reset link sent to " + email);
    } catch (e) {
      console.log("resetPasswordUsingEmail error ", e.message);
      alert(emailAuthException(e.code));
    }
  };
  
  const sendEmailVerificationLink = (user) => {
    sendEmailVerification(user, getActionCodeSettings)
      .then(() => {
        alert(`Email verification link sent to ${user.email}`);
      })
      .catch((e) => {
        console.log("sendEmailVerificationLink error ", e.message);
        alert(emailAuthException(e.code));
      });
  };
  
  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.log("signOutUser error ", e.message);
      alert(emailAuthException(e.code));
    }
  };
  
  const getUserData = async (userId) => {
    try {
      let userDocRef = doc(db, "users", userId);
      let docSnapshot = await getDoc(userDocRef);
  
      if (!docSnapshot.exists()) {
        const usersCollection = collection(db, "users");
        const querySnapshot = await getDocs(query(usersCollection, where("customUID", "==", userId)));
  
        if (querySnapshot.empty) {
          alert("ERROR: User not found!");
          return null;
        }
  
        docSnapshot = querySnapshot.docs[0];
      }
  console.log(docSnapshot.data())
      return docSnapshot.data();
      
    } catch (e) {
      console.error("getUserData error:", e);
      alert(e.message);
    }
  };
  
  const updateUserData = async (userId, updatedData) => {
    try {
      if (!userId || !updatedData) {
        return;
      }
  
      let userDocRef = doc(db, "users", userId);
      let docSnapshot = await getDoc(userDocRef);
  
      if (!docSnapshot.exists()) {
        const usersCollection = collection(db, "users");
        const querySnapshot = await getDocs(query(usersCollection, where("customUID", "==", userId)));
  
        if (querySnapshot.empty) {
          alert("ERROR: User not found!");
          return null;
        }
  
        userDocRef = querySnapshot.docs[0].ref;
      }
  
      delete updatedData["uid"];
  
      await setDoc(userDocRef, { ...updatedData }, { merge: true });
  
      console.log("User data updated successfully.");
      return true;
    } catch (e) {
      console.error("updateUserData error:", e);
      alert(e.message);
    }
  };
  
  // Enhanced error handling for auth exceptions
const emailAuthException = (code) => {
  switch (code) {
    case 'auth/user-not-found':
      return 'User does not exist with this email';
    case 'auth/wrong-password':
      return 'Invalid e-mail/password';
    case 'auth/invalid-email':
      return 'Enter a valid e-mail';
    case 'auth/email-already-in-use':
      return 'User already exist with this email';
    case 'auth/weak-password':
      return 'Password entered is too weak.';
    case 'auth/too-many-requests':
      return 'Requests are blocked from this device due to unusual activity. Try again after some time';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked. Please allow popups for this site.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled. Please try again.';
    case 'auth/cancelled-popup-request':
      return 'Another sign-in popup is already open.';
    case 'auth/operation-not-supported-in-this-environment':
      return 'This operation is not supported in the current environment.';
    default:
      return 'Something went wrong during authentication';
  }
};
  
  const updateUserPaymentStatus = async (userId, paymentData) => {
    try {
      const userRef = doc(db, "users", userId);
  
      // Calculate expiry date: one year from today
      const expireDate = new Date();
      expireDate.setFullYear(expireDate.getFullYear() + 1);
  
      await updateDoc(userRef, {
        isPremium: true,
        paymentData, // payment details (paymentId, orderId, signature, etc.)
        expireDate: expireDate.toISOString(), // store as ISO string
      });
  
      console.log("User payment status updated successfully");
    } catch (error) {
      console.error("Error updating user payment status:", error);
    }
  };
  
 

  //userinfo functions 

  /**
 * Blocks a user by setting the `blocked` flag to true in their Firestore document.
 * @param {string} userId - The Firestore document ID of the user.
 * @returns {Promise<boolean>}
 */
const blockUser = async (userId) => {
  try {
    const userDoc = doc(db, "users", userId);
    await updateDoc(userDoc, { blocked: true });
    console.log(`User ${userId} blocked successfully.`);
    return true;
  } catch (error) {
    console.error("Error blocking user:", error);
    throw error;
  }
};

/**
 * Unblocks a user by setting the `blocked` flag to false in their Firestore document.
 * @param {string} userId - The Firestore document ID of the user.
 * @returns {Promise<boolean>}
 */
const unblockUser = async (userId) => {
  try {
    const userDoc = doc(db, "users", userId);
    await updateDoc(userDoc, { blocked: false });
    console.log(`User ${userId} unblocked successfully.`);
    return true;
  } catch (error) {
    console.error("Error unblocking user:", error);
    throw error;
  }
};

/**
 * Retrieves all users from Firestore.
 * @returns {Promise<Array>} An array of user objects including the document ID.
 */
const getAllUsers = async () => {
  try {
    const usersCollection = collection(db, "users");
    const usersSnapshot = await getDocs(usersCollection);
    return usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};



const checkEmailExists = async (email) => {
  try {
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);
    return signInMethods.length > 0; // True if email exists, false otherwise
  } catch (error) {
    console.error("Error checking email:", error);
    return false;
  }
};

  

  
  /* -------------------------------------------------------------------
     Exports
  ---------------------------------------------------------------------*/
  export {
  signInWithGoogle,
  handleRedirectResult,
  signInUsingEmailPassword,
  signUpUsingEmailPassword,
  resetPasswordUsingEmail,
  sendEmailVerificationLink,
  signOutUser,
  getUserData,
  updateUserData,
  updateUserPaymentStatus,
  checkEmailExists,
  blockUser,
  getAllUsers,
  unblockUser
};
  