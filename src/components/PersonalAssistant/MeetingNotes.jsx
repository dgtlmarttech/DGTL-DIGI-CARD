import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../../context/userContext';
import { db, storage } from '../../firebase/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { FiMic, FiSquare, FiPlay, FiTrash2, FiFileText } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function MeetingNotes() {
  const { user } = useUser();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recordingState, setRecordingState] = useState('IDLE'); // IDLE, RECORDING, PROCESSING
  const [elapsedTime, setElapsedTime] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const fetchNotes = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'meetingNotes'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotes(fetched);
    } catch (error) {
      console.error('Error fetching meeting notes:', error);
      toast.error('Failed to load meeting notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [user]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = processRecording;

      mediaRecorder.start();
      setRecordingState('RECORDING');
      setElapsedTime(0);
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'RECORDING') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      clearInterval(timerRef.current);
      setRecordingState('PROCESSING');
    }
  };

  const processRecording = async () => {
    try {
      toast.info('Processing meeting note...', { autoClose: 3000 });
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // 1. Save to Firestore initially
      const newNote = {
        userId: user.uid,
        title: `Meeting on ${new Date().toLocaleDateString()}`,
        meetingDate: new Date().toISOString(),
        transcript: 'Processing transcription...',
        summary: 'Processing AI summary...',
        actionItems: [],
        duration: elapsedTime,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'meetingNotes'), newNote);
      setNotes([{ id: docRef.id, ...newNote }, ...notes]);

      try {
        // 2. Call Transcription API (Directly)
        const idToken = await user.getIdToken();
        const formData = new FormData();
        formData.append('audio', audioBlob, 'audio.webm');
        formData.append('userId', user.uid);
        formData.append('idToken', idToken);

        const transcribeRes = await fetch('/api/pa/transcribe', {
          method: 'POST',
          body: formData
        });
        const transcribeData = await transcribeRes.json();
        
        if (!transcribeRes.ok) throw new Error(transcribeData.error || 'Transcription failed');

        // 3. Call Summarization API (OpenAI GPT) only if there is substantial text
        let summaryData = { summary: '', actionItems: [] };
        
        if (transcribeData.text && transcribeData.text.trim().length > 15) {
          const summaryRes = await fetch('/api/pa/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: transcribeData.text, type: 'meeting', userId: user.uid, idToken })
          });
          summaryData = await summaryRes.json();

          if (!summaryRes.ok) throw new Error(summaryData.error || 'Summarization failed');
        } else {
          summaryData.summary = "Transcript too short to generate a meaningful summary.";
        }

        // 4. Update Firestore with AI results
        await updateDoc(doc(db, 'meetingNotes', docRef.id), {
          transcript: transcribeData.text,
          summary: summaryData.summary || '',
          actionItems: summaryData.actionItems || []
        });

        setNotes(prev => prev.map(n => n.id === docRef.id ? {
          ...n,
          transcript: transcribeData.text,
          summary: summaryData.summary || '',
          actionItems: summaryData.actionItems || []
        } : n));
        
        toast.success('Meeting Note Processed!');
      } catch (aiError) {
        console.error('AI Processing error:', aiError);
        toast.error('AI processing failed.');
        await updateDoc(doc(db, 'meetingNotes', docRef.id), {
          transcript: 'Transcription failed.',
          summary: 'Summarization failed.'
        });
        setNotes(prev => prev.map(n => n.id === docRef.id ? {
          ...n, transcript: 'Transcription failed.', summary: 'Summarization failed.'
        } : n));
      }
    } catch (error) {
      console.error('Error processing recording:', error);
      toast.error('Failed to process meeting note');
    } finally {
      setRecordingState('IDLE');
      setElapsedTime(0);
    }
  };

  const deleteNote = async (id) => {
    try {
      await deleteDoc(doc(db, 'meetingNotes', id));
      setNotes(notes.filter(n => n.id !== id));
      toast.success('Note deleted');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Meeting Notes</h2>
        
        {/* Main Recording Button */}
        <div className="flex items-center gap-3">
          {recordingState === 'RECORDING' && (
            <span className="text-red-500 font-mono font-medium animate-pulse">
              🔴 {formatTime(elapsedTime)}
            </span>
          )}
          {recordingState === 'PROCESSING' && (
            <span className="text-purple-500 text-sm font-medium flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </span>
          )}
          
          <button
            onClick={recordingState === 'RECORDING' ? stopRecording : startRecording}
            disabled={recordingState === 'PROCESSING'}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-semibold shadow-md transition-all ${
              recordingState === 'RECORDING' 
                ? 'bg-red-500 hover:bg-red-600' 
                : recordingState === 'PROCESSING'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {recordingState === 'RECORDING' ? (
              <><FiSquare /> Stop Recording</>
            ) : (
              <><FiMic /> Start Recording</>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-10 text-gray-400 flex flex-col items-center">
            <FiFileText size={40} className="mb-3 text-gray-300" />
            <p>No meeting notes yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map(note => (
              <div key={note.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50 group">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{note.title}</h3>
                    <p className="text-xs text-gray-500">{new Date(note.createdAt).toLocaleString()} • {formatTime(note.duration || 0)}</p>
                  </div>
                  <button onClick={() => deleteNote(note.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <FiTrash2 />
                  </button>
                </div>
                

                
                {note.summary && (
                  <div className="mb-3">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Summary</h4>
                    <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-100">{note.summary}</p>
                  </div>
                )}
                
                {note.actionItems && note.actionItems.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Action Items</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-100">
                      {note.actionItems.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-2">
                  <details className="text-sm text-gray-500">
                    <summary className="cursor-pointer hover:text-purple-600 font-medium transition-colors">View Full Transcript</summary>
                    <p className="mt-2 text-gray-600 bg-white p-3 rounded-lg border border-gray-100 whitespace-pre-wrap">{note.transcript}</p>
                  </details>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
