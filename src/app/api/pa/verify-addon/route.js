import { NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "../../../../firebase/firebaseAdmin";
import { ADDON_LIMIT_SECONDS } from "../../../../utils/meetingUsage";

export async function POST(req) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_SECRET.trim();

    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      console.error("❌ Invalid payment signature for addon.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Securely update the user's addon data
    const userRef = adminDb.collection("users").doc(userId);
    
    // Addon expires in 30 days from now
    const addonExpireDate = new Date();
    addonExpireDate.setMonth(addonExpireDate.getMonth() + 1);

    await userRef.update({
      meetingNotesAddon: {
        active: true,
        expireDate: addonExpireDate.toISOString(),
        usedSeconds: 0, // Reset usage
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        purchasedAt: new Date().toISOString()
      }
    });

    console.log(`✅ Addon payment verification successful for user ${userId}.`);
    return NextResponse.json({ success: true, addonSeconds: ADDON_LIMIT_SECONDS });

  } catch (error) {
    console.error("Error verifying addon payment:", error);
    return NextResponse.json({ error: "Failed to verify addon payment." }, { status: 500 });
  }
}
