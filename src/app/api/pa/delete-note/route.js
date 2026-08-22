import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../firebase/firebaseAdmin';

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get('noteId');
    const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];

    if (!noteId || !idToken) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Verify token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const noteRef = adminDb.collection('meetingNotes').doc(noteId);
    const noteSnap = await noteRef.get();
    
    if (!noteSnap.exists) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    if (noteSnap.data().userId !== decodedToken.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await noteRef.delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
