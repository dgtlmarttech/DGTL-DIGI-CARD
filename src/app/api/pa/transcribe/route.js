import { NextResponse } from 'next/server';
import OpenAI, { toFile } from 'openai';
import fetch from 'node-fetch';
import { adminAuth, adminDb } from '../../../../firebase/firebaseAdmin';

export async function POST(req) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build',
    });
    const formData = await req.formData();
    const audioFile = formData.get('audio');
    const userId = formData.get('userId');
    const idToken = formData.get('idToken');

    if (!audioFile || !userId || !idToken) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // Verify token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (authError) {
      return NextResponse.json({ error: 'Unauthorized. Invalid or expired session.' }, { status: 401 });
    }

    if (decodedToken.uid !== userId) {
      return NextResponse.json({ error: 'Unauthorized. User ID mismatch.' }, { status: 403 });
    }

    // Verify PA Subscription
    const userSnap = await adminDb.collection('users').doc(userId).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    const userData = userSnap.data();
    
    // Allow if they have an active PA plan OR if we just check planType for now 
    // (You can also add expiry date checks here based on paExpireDate)
    let isPA = userData.planType === 'personal_assistant' || userData.premiumPlan === 'pa' || userData.hasPA === true;
    if (isPA && userData.paExpireDate) {
       isPA = new Date(userData.paExpireDate) > new Date();
    }
    
    if (!isPA) {
      return NextResponse.json({ error: 'Forbidden. Personal Assistant subscription required.' }, { status: 403 });
    }

    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Convert to OpenAI File object
    const file = await toFile(buffer, 'audio.webm', { type: 'audio/webm' });

    // Call OpenAI Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
    });

    return NextResponse.json({ text: transcription.text });
  } catch (error) {
    console.error('Transcription API Error:', error);
    return NextResponse.json({ error: 'Failed to transcribe audio' }, { status: 500 });
  }
}
