import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebase"; // Ensure Firebase is properly initialized

const SETTINGS_COLLECTION = "settings";
const AD_BANNER_DOC_ID = "adBannerSettings";

/**
 * Fetches the ad banner settings from Firestore.
 * Returns default settings if none are found.
 */
export const getAdBannerSettings = async () => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, AD_BANNER_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // Return default settings if no document exists
      return {
        type: "manual", // or "google"
        imageDesktop: "",
        imageMobile: "",
        link: ""
      };
    }
  } catch (error) {
    console.error("Error fetching ad banner settings:", error);
    throw error;
  }
};

/**
 * Updates the ad banner settings in Firestore.
 * The settings parameter should include the ad type, image URLs for mobile & desktop, and link.
 */
export const updateAdBannerSettings = async (settings) => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, AD_BANNER_DOC_ID);
    await setDoc(docRef, settings, { merge: true });
  } catch (error) {
    console.error("Error updating ad banner settings:", error);
    throw error;
  }
};
