import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '../../../services/triggerMail';

export async function POST(request) {
    try {
        const { email, firstName, uid } = await request.json();

        if (!email || !uid) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: email and uid are mandatory.' },
                { status: 400 }
            );
        }

        // Call the existing service logic (now running on the server)
        await sendWelcomeEmail(email, firstName, uid);

        return NextResponse.json({
            success: true,
            message: 'Welcome email dispatched successfully'
        });
    } catch (error) {
        console.error('Error in send-welcome API:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
