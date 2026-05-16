import { adminDb } from '../firebase/firebaseAdmin';
import { sendOTPEmail } from './triggerMail';

/**
 * Service to handle OTP generation and storage in Firestore
 */
export const otpService = {
  /**
   * Generates a 6-digit OTP and stores it in Firestore
   */
  async createOTP(identifier, type = 'email') {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await adminDb.collection('pending_verifications').doc(`${type}_${identifier}`).set({
      otp,
      expiresAt: expiresAt.toISOString(),
      type: type
    });

    return otp;
  },

  /**
   * Verifies the OTP from Firestore
   */
  async verifyOTP(identifier, code, type = 'email') {
    const doc = await adminDb.collection('pending_verifications').doc(`${type}_${identifier}`).get();
    
    if (!doc.exists) {
      return { success: false, message: `No OTP found for this ${type}` };
    }

    const data = doc.data();
    const now = new Date();
    const expiresAt = new Date(data.expiresAt);

    if (now > expiresAt) {
      await adminDb.collection('pending_verifications').doc(`${type}_${identifier}`).delete();
      return { success: false, message: 'OTP has expired' };
    }

    if (data.otp === code) {
      await adminDb.collection('pending_verifications').doc(`${type}_${identifier}`).delete();
      return { success: true };
    }

    return { success: false, message: 'Invalid OTP' };
  },

  // Legacy wrappers for backward compatibility if needed
  async createEmailOTP(email) { return this.createOTP(email, 'email'); },
  async verifyEmailOTP(email, code) { return this.verifyOTP(email, code, 'email'); },
  async createPhoneOTP(phone) { return this.createOTP(phone, 'phone'); },
  async verifyPhoneOTP(phone, code) { return this.verifyOTP(phone, code, 'phone'); }
};
