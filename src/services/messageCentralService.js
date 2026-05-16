import axios from 'axios';

const BASE_URL = 'https://cpaas.messagecentral.com';
const CUSTOMER_ID = process.env.MESSAGE_CENTRAL_CUSTOMER_ID;
const PASSWORD = process.env.MESSAGE_CENTRAL_PASSWORD;

/**
 * Message Central OTP Service
 */
export const messageCentralService = {
  /**
   * Generates an authentication token for Message Central APIs
   */
  async getAuthToken() {
    try {
      if (!CUSTOMER_ID || !PASSWORD) {
        throw new Error('Message Central credentials missing');
      }

      const response = await axios.get(`${BASE_URL}/auth/v1/authentication/token`, {
        params: {
          customerId: CUSTOMER_ID,
          key: PASSWORD,
          scope: 'NEW'
        }
      });

      if (response.data && response.data.token) {
        return response.data.token;
      }
      throw new Error('Failed to obtain auth token');
    } catch (error) {
      console.error('Message Central Auth Error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Sends an OTP via SMS (Verification v3 API)
   * @param {string} mobileNumber - User's mobile number
   * @param {string} countryCode - Country code (default: 91)
   */
  async sendOTP(mobileNumber, countryCode = '91') {
    try {
      const token = await this.getAuthToken();
      const url = `${BASE_URL}/verification/v3/send`;
      
      const params = new URLSearchParams({
        countryCode: countryCode,
        customerId: CUSTOMER_ID,
        flowType: 'SMS',
        mobileNumber: mobileNumber,
        otpLength: '6',
      });

      console.log(`🚀 [DEBUG] Dispatching Message Central OTP to ${mobileNumber}...`);
      const response = await fetch(`${url}?${params.toString()}`, {
        method: 'POST',
        headers: {
          'authToken': token,
        }
      });

      const text = await response.text();
      let data = {};
      if (text) {
        data = JSON.parse(text);
      }

      if (data && (data.responseCode === 200 || data.status === 200) && data.data) {
        return {
          success: true,
          verificationId: data.data.verificationId,
          message: 'OTP sent via SMS'
        };
      }
      
      throw new Error(data.message || data.error || 'Failed to send verification code');
    } catch (error) {
      console.error('Message Central Send Error:', error.message);
      throw error;
    }
  },

  /**
   * Verifies the OTP entered by the user (Verification v3 API)
   * @param {string} mobileNumber 
   * @param {string} otp 
   * @param {string} verificationId 
   */
  async verifyOTP(mobileNumber, otp, verificationId, countryCode = '91') {
    try {
      const token = await this.getAuthToken();
      const url = `${BASE_URL}/verification/v3/validateOtp`;
      
      const params = new URLSearchParams({
        countryCode: countryCode,
        verificationId: verificationId,
        customerId: CUSTOMER_ID,
        code: otp,
      });

      console.log(`🔍 [DEBUG] Validating Message Central OTP for verificationId ${verificationId}...`);
      const response = await fetch(`${url}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'authToken': token,
        }
      });

      const text = await response.text();
      let data = {};
      if (text) {
        data = JSON.parse(text);
      }

      if (data && (data.responseCode === 200 || data.status === 200)) {
        return { success: true };
      }
      
      return { 
        success: false, 
        message: data.message || data.error || 'Invalid or expired OTP' 
      };
    } catch (error) {
      console.error('Message Central Verify Error:', error.message);
      return { 
        success: false, 
        message: error.message || 'OTP verification failed' 
      };
    }
  },

  /**
   * Sends a custom text message (Transactional SMS)
   */
  async sendSMS(mobileNumber, message, countryCode = '91') {
    try {
      const token = await this.getAuthToken();
      
      const response = await axios.post(`${BASE_URL}/messaging/v1/sms/send`, {
        customerId: CUSTOMER_ID,
        countryCode: countryCode,
        mobileNumber: mobileNumber,
        message: message,
        type: 'TRANSACTIONAL'
      }, {
        headers: {
          'authToken': token,
          'Content-Type': 'application/json'
        }
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Message Central SMS Error:', error.response?.data || error.message);
      throw error;
    }
  }
};
