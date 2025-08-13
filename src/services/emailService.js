import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";

const SETTINGS_COLLECTION = "settings";
const EMAIL_TEMPLATES_DOC_ID = "emailTemplates";

/**
 * Fetches the email templates from Firestore.
 * Returns default templates if none exist.
 */
export const getEmailTemplates = async () => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, EMAIL_TEMPLATES_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // Default templates
      return {
        expiringSoon: {
          subject: "Your subscription expires soon",
          content: "Dear [name], your subscription will expire on [date]. Please renew soon."
        },
        expired: {
          subject: "Your subscription has expired",
          content: "Dear [name], your subscription expired on [date]. Please renew to regain access."
        }
      };
    }
  } catch (error) {
    console.error("Error fetching email templates:", error);
    throw error;
  }
};

/**
 * Updates the email templates in Firestore.
 */
export const updateEmailTemplates = async (templates) => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, EMAIL_TEMPLATES_DOC_ID);
    await setDoc(docRef, templates, { merge: true });
    console.log("Email templates updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating email templates:", error);
    throw error;
  }
};

