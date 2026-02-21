import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req) {
  const body = await req.json();
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

  const secret = process.env.RAZORPAY_SECRET.trim();

  const generated_signature = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generated_signature === razorpay_signature) {
    console.log("✅ Payment verification successful.");
    return NextResponse.json({ success: true });
  } else {
    console.error("❌ Invalid payment signature.");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
}
