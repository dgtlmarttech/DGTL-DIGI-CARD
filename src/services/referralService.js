import { db } from '../firebase/firebase';
import { 
  collection, doc, getDoc, getDocs, query, where, 
  setDoc, updateDoc, serverTimestamp, runTransaction
} from 'firebase/firestore';

const generateRandomCode = (randomLength = 4) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPart = '';
  for (let i = 0; i < randomLength; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return 'DGTL' + randomPart;
};

export const createReferralCodeForUser = async (userId) => {
  if (!userId) return null;
  
  // Check if they already have one
  const q = query(collection(db, 'referralCodes'), where('ownerUserId', '==', userId));
  const snap = await getDocs(q);
  if (!snap.empty) {
    return snap.docs[0].data();
  }
  
  let isUnique = false;
  let code = '';
  
  // Ensure uniqueness
  while (!isUnique) {
    code = generateRandomCode(5);
    const codeCheck = await getDocs(query(collection(db, 'referralCodes'), where('code', '==', code)));
    if (codeCheck.empty) {
      isUnique = true;
    }
  }
  
  const codeDocRef = doc(collection(db, 'referralCodes'));
  const newCodeData = {
    id: codeDocRef.id,
    code: code,
    ownerUserId: userId,
    status: 'active',
    commissionRate: 50, // Default 50%
    createdAt: new Date().toISOString(),
    usageCount: 0
  };
  
  await setDoc(codeDocRef, newCodeData);
  return newCodeData;
};

export const getReferralCodeByCode = async (code) => {
  if (!code) return null;
  const q = query(collection(db, 'referralCodes'), where('code', '==', code.toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data();
};

export const getReferralCodeByUserId = async (userId) => {
  if (!userId) return null;
  const q = query(collection(db, 'referralCodes'), where('ownerUserId', '==', userId));
  const snap = await getDocs(q);
  if (snap.empty) {
    // Auto-generate if not found
    return await createReferralCodeForUser(userId);
  }
  return snap.docs[0].data();
};

export const createReferralAssociation = async (referrerUserId, referredUserId, codeData) => {
  if (referrerUserId === referredUserId) return null; // Prevent self-referral
  
  // Check if referredUser already has a referrer
  const q = query(collection(db, 'referrals'), where('referredUserId', '==', referredUserId));
  const snap = await getDocs(q);
  if (!snap.empty) return snap.docs[0].data(); // Already referred
  
  const referralRef = doc(collection(db, 'referrals'));
  const referralData = {
    id: referralRef.id,
    referrerUserId,
    referredUserId,
    referralCode: codeData.code,
    status: 'registered',
    createdAt: new Date().toISOString(),
    qualifiedAt: null
  };
  
  await setDoc(referralRef, referralData);
  
  // Increment usage count
  const codeDocRef = doc(db, 'referralCodes', codeData.id);
  await updateDoc(codeDocRef, {
    usageCount: (codeData.usageCount || 0) + 1
  });
  
  return referralData;
};

export const getUserReferralStats = async (userId) => {
  try {
    const codeData = await getReferralCodeByUserId(userId);
    
    // Get referrals
    const referralsQ = query(collection(db, 'referrals'), where('referrerUserId', '==', userId));
    const referralsSnap = await getDocs(referralsQ);
    const totalReferrals = referralsSnap.size;
    
    // Get commissions
    const commsQ = query(collection(db, 'commissions'), where('referrerUserId', '==', userId));
    const commsSnap = await getDocs(commsQ);
    
    let pendingCommission = 0;
    let paidCommission = 0;
    
    commsSnap.forEach(doc => {
      const data = doc.data();
      if (data.status === 'pending' || data.status === 'approved') {
        pendingCommission += data.commissionAmount;
      } else if (data.status === 'paid') {
        paidCommission += data.commissionAmount;
      }
    });
    
    return {
      code: codeData ? codeData.code : null,
      totalReferrals,
      pendingCommission,
      paidCommission
    };
  } catch (error) {
    console.error("Error fetching referral stats:", error);
    return null;
  }
};

export const processSubscriptionCommission = async (userId, orderId, planType, amount) => {
  // Only process for base plans
  if (planType !== 'monthly' && planType !== 'yearly') return null;
  
  // Check if user is a referred user
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) return null;
  const userData = userDoc.data();
  
  if (!userData.isReferralUser || !userData.referredBy) return null;
  
  // Check if referral association exists
  const refQ = query(collection(db, 'referrals'), where('referredUserId', '==', userId));
  const refSnap = await getDocs(refQ);
  if (refSnap.empty) return null;
  
  const referralDoc = refSnap.docs[0];
  const referralData = referralDoc.data();
  
  // Idempotency: check if commission already exists for this orderId
  const commQ = query(collection(db, 'commissions'), where('orderId', '==', orderId));
  const commSnap = await getDocs(commQ);
  if (!commSnap.empty) return null; // Already processed
  
  // Calculate commission (50%)
  const commissionRate = 50;
  const commissionAmount = (amount * commissionRate) / 100;
  
  const commissionRef = doc(collection(db, 'commissions'));
  const commissionData = {
    id: commissionRef.id,
    referrerUserId: userData.referredBy,
    referredUserId: userId,
    referralId: referralData.id,
    orderId: orderId,
    planType: planType,
    subscriptionAmount: amount,
    commissionRate: commissionRate,
    commissionAmount: commissionAmount,
    currency: 'INR',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  await setDoc(commissionRef, commissionData);
  
  // Update referral status if first time
  if (referralData.status === 'registered') {
    await updateDoc(referralDoc.ref, {
      status: 'qualified',
      qualifiedAt: new Date().toISOString(),
      subscriptionId: orderId
    });
  }
  
  return commissionData;
};
