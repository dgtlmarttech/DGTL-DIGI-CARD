import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { adminAuth, adminDb } from '../../../../firebase/firebaseAdmin';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { text, type, userId, idToken } = await req.json();

    if (!text || !userId || !idToken) {
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
    
    const isPA = userData.planType === 'personal_assistant';
    if (!isPA) {
      return NextResponse.json({ error: 'Forbidden. Personal Assistant subscription required.' }, { status: 403 });
    }

    let prompt = '';
    if (type === 'meeting') {
      prompt = `
You are a highly capable AI assistant. I will provide you with a transcript of a meeting.
Please analyze the transcript and provide two things:
1. A concise, professional summary of the meeting.
2. A list of specific action items discussed.

Format your response exactly as JSON with this structure:
{
  "summary": "String",
  "actionItems": ["Item 1", "Item 2"]
}

Here is the transcript:
"${text}"
`;
    } else {
      prompt = `Please summarize the following text:\n\n"${text}"\n\nReturn JSON in format {"summary": "..."}`;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Summarize API Error:', error);
    return NextResponse.json({ error: 'Failed to summarize text' }, { status: 500 });
  }
}
