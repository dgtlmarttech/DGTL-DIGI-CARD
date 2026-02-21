// affiliateService.js
import { 
    addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where 
  } from "firebase/firestore";
  import { db } from "../firebase/firebase";
  
// Check if email or phone already exists
const checkAffiliateExists = async (email, phone) => {
  const q = query(
      collection(db, "affiliates"), 
      where("email", "==", email)
  );
  const q2 = query(
      collection(db, "affiliates"), 
      where("phone", "==", phone)
  );

  const [emailSnap, phoneSnap] = await Promise.all([getDocs(q), getDocs(q2)]);
  
  if (!emailSnap.empty) {
      throw new Error("An affiliate with this email already exists.");
  }
  if (!phoneSnap.empty) {
      throw new Error("An affiliate with this phone number already exists.");
  }
};

// Create a new affiliate and generate a referral code.
export const createAffiliate = async (affiliateData) => {
  if (!affiliateData.full_name || affiliateData.full_name.length < 3) {
      throw new Error("Affiliate name must be at least 3 characters long");
  }

  await checkAffiliateExists(affiliateData.email, affiliateData.phone); // Check before creating

  const referralCode = (affiliateData.full_name.substring(0, 3) + Math.floor(1000 + Math.random() * 9000)).toUpperCase();

  const data = {
      ...affiliateData,
      referralCode,
      points: 0,
      amountPaid: 0,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
  };

  const docRef = await addDoc(collection(db, "affiliates"), data);
  return { id: docRef.id, ...data };
};
  
  // Fetch all affiliates.
  export const getAllAffiliates = async () => {
    const snapshot = await getDocs(collection(db, "affiliates"));
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  };
  
  // Get a single affiliate by ID.
  export const getAffiliateById = async (affiliateId) => {
    const docRef = doc(db, "affiliates", affiliateId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    throw new Error("Affiliate not found");
  };
  
  // Update affiliate details.
  export const updateAffiliate = async (affiliateId, updatedData) => {
    const docRef = doc(db, "affiliates", affiliateId);
    updatedData.updatedAt = new Date();
    await updateDoc(docRef, updatedData);
  };
  
  // Record affiliate payment.
  export const recordAffiliatePayment = async (affiliateId, paymentData) => {
    // paymentData: { amountPaid, conversionRate, pointsRedeemed }
    const affiliate = await getAffiliateById(affiliateId);
    const totalDue = affiliate.totalDue || 0;
    const amountPaid = paymentData.amountPaid;
    const remainingAmount = totalDue - amountPaid;
    console.log("Updating payment for affiliate:", affiliateId, { totalDue, amountPaid, remainingAmount });
    await updateAffiliate(affiliateId, { amountPaid, remainingAmount });
    return { amountPaid, remainingAmount };
  };
  
  // Get referred users by affiliate referral code.
  export const getReferredUsers = async (referralCode) => {
    const q = query(collection(db, "users"), where("affiliateRef", "==", referralCode));
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  };
  