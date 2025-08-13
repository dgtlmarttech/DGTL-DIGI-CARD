import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req) {
  const body = await req.json();

  const key = process.env.RAZORPAY_KEY.trim();
  const secret = process.env.RAZORPAY_SECRET.trim();

  console.log(key,secret);

  try {
    const amount = Number(body.amount * 100); // Convert to paise
    const data = {
      amount,
      currency: "INR",
    };

    const authString = Buffer.from(`${key}:${secret}`).toString("base64");

    const response = await axios.post("https://api.razorpay.com/v1/orders", data, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${authString}`,
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error creating Razorpay order:", error.response?.data || error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
