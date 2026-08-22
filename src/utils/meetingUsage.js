import { adminDb } from '../firebase/firebaseAdmin';

export const BASE_LIMIT_SECONDS = 600; // 10 minutes
export const ADDON_LIMIT_SECONDS = 10800; // 3 hours

/**
 * Calculates and returns the current Meeting Notes usage limits for a user.
 * It does NOT mutate the database. Cycle resets are determined dynamically.
 */
export async function getMeetingUsageData(userData) {
  const now = new Date();
  
  // 1. Determine Base Cycle
  let baseUsed = 0;
  let cycleStart = null;
  
  if (userData.meetingNotesUsage) {
    baseUsed = userData.meetingNotesUsage.usedSeconds || 0;
    cycleStart = userData.meetingNotesUsage.cycleStartDate 
      ? new Date(userData.meetingNotesUsage.cycleStartDate) 
      : null;
  }

  // If no cycleStart, use planStartDate or createdAt
  if (!cycleStart) {
    cycleStart = userData.planStartDate 
      ? new Date(userData.planStartDate) 
      : (userData.createdAt ? new Date(userData.createdAt) : now);
  }

  // Check if we need to roll over to a new 30-day cycle
  // Cycle rolls over every 30 days from cycleStart
  const daysSinceStart = Math.floor((now - cycleStart) / (1000 * 60 * 60 * 24));
  let needsBaseReset = false;
  
  if (daysSinceStart >= 30) {
    needsBaseReset = true;
    baseUsed = 0;
    // Calculate new cycle start: advance by blocks of 30 days
    const cyclesPassed = Math.floor(daysSinceStart / 30);
    cycleStart = new Date(cycleStart.getTime() + (cyclesPassed * 30 * 24 * 60 * 60 * 1000));
  }

  const baseRemaining = Math.max(0, BASE_LIMIT_SECONDS - baseUsed);

  // 2. Determine Addon Cycle
  let addonRemaining = 0;
  let addonActive = false;
  let addonExpireDate = null;
  let addonUsed = 0;
  let needsAddonReset = false;

  if (userData.meetingNotesAddon) {
    addonExpireDate = userData.meetingNotesAddon.expireDate 
      ? new Date(userData.meetingNotesAddon.expireDate) 
      : null;
    addonUsed = userData.meetingNotesAddon.usedSeconds || 0;
    addonActive = userData.meetingNotesAddon.active === true;
    
    if (addonActive && addonExpireDate) {
      if (now > addonExpireDate) {
        // Addon expired
        addonActive = false;
        needsAddonReset = true;
      } else {
        addonRemaining = Math.max(0, ADDON_LIMIT_SECONDS - addonUsed);
      }
    }
  }

  const totalRemainingSeconds = baseRemaining + addonRemaining;

  return {
    baseUsed,
    baseRemaining,
    cycleStart,
    needsBaseReset,
    addonActive,
    addonUsed,
    addonRemaining,
    addonExpireDate,
    needsAddonReset,
    totalRemainingSeconds,
  };
}

/**
 * Deducts usage atomically using a Firestore Transaction.
 * Returns { success, error, actualDeducted, remainingSeconds }
 */
export async function deductMeetingUsage(userId, durationSeconds) {
  const userRef = adminDb.collection('users').doc(userId);

  try {
    return await adminDb.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const usageData = await getMeetingUsageData(userData);

      // Check if they have ANY quota left
      if (usageData.totalRemainingSeconds <= 0) {
        throw new Error('Quota Exceeded');
      }

      // Calculate how much to actually deduct. 
      // If duration exceeds total remaining, we process the allowed remaining.
      const actualDeducted = Math.min(durationSeconds, usageData.totalRemainingSeconds);
      
      let toDeductFromBase = 0;
      let toDeductFromAddon = 0;

      if (usageData.baseRemaining >= actualDeducted) {
        toDeductFromBase = actualDeducted;
      } else {
        toDeductFromBase = usageData.baseRemaining;
        toDeductFromAddon = actualDeducted - usageData.baseRemaining;
      }

      // Prepare updates
      const updates = {};
      
      // Update Base
      const newBaseUsed = usageData.baseUsed + toDeductFromBase;
      updates.meetingNotesUsage = {
        usedSeconds: newBaseUsed,
        cycleStartDate: usageData.cycleStart.toISOString(),
      };

      // Update Addon if active
      if (usageData.addonActive || usageData.needsAddonReset) {
        updates.meetingNotesAddon = {
          active: usageData.addonActive,
          expireDate: usageData.addonExpireDate ? usageData.addonExpireDate.toISOString() : null,
          usedSeconds: usageData.addonUsed + toDeductFromAddon,
        };
      }

      transaction.update(userRef, updates);

      return {
        success: true,
        actualDeducted,
        remainingSeconds: usageData.totalRemainingSeconds - actualDeducted,
      };
    });
  } catch (error) {
    if (error.message === 'Quota Exceeded') {
      return { success: false, error: 'Meeting Notes quota exceeded.' };
    }
    console.error('Transaction failure:', error);
    return { success: false, error: 'Failed to process usage deduction securely.' };
  }
}
