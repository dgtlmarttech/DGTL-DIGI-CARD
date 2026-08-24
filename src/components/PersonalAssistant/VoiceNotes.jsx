import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../../context/userContext';
import { db, storage } from '../../firebase/firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { FiMic, FiSquare, FiPlay, FiTrash2, FiHeadphones } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function VoiceNotes() {
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
        collection(db, 'voiceNotes'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotes(fetched);
    } catch (error) {
      console.error('Error fetching voice notes:', error);
      toast.error('Failed to load voice notes');
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
      toast.info('Processing voice note...', { autoClose: 3000 });
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // 1. Save to Firestore initially
      const newNote = {
        userId: user.uid,
        title: `Voice Note on ${new Date().toLocaleDateString()}`,
        transcript: 'Processing transcription...',
        duration: elapsedTime,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'voiceNotes'), newNote);
      setNotes([{ id: docRef.id, ...newNote }, ...notes]);

      // 2. Transcribe directly (bypass storage)
      try {
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
        if (transcribeRes.ok) {
          await updateDoc(doc(db, 'voiceNotes', docRef.id), { transcript: transcribeData.text });
          setNotes(prev => prev.map(n => n.id === docRef.id ? { ...n, transcript: transcribeData.text } : n));
          toast.success('Voice Note Saved & Transcribed!');
        } else {
          throw new Error('Transcription failed');
        }
      } catch (err) {
        console.warn("Transcription failed for voice note:", err);
        await updateDoc(doc(db, 'voiceNotes', docRef.id), { transcript: 'Transcription failed.' });
        setNotes(prev => prev.map(n => n.id === docRef.id ? { ...n, transcript: 'Transcription failed.' } : n));
        toast.info('Voice Note saved (Transcription failed)');
      }
    } catch (error) {
      console.error('Error processing recording:', error);
      toast.error('Failed to process voice note');
    } finally {
      setRecordingState('IDLE');
      setElapsedTime(0);
    }
  };

  const deleteNote = async (id) => {
    try {
      await deleteDoc(doc(db, 'voiceNotes', id));
      setNotes(notes.filter(n => n.id !== id));
      toast.success('Note deleted');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-800 whitespace-nowrap">Voice Notes</h2>
        
        {/* Main Recording Button */}
        <div className="flex items-center gap-3">
          {recordingState === 'RECORDING' && (
            <span className="text-red-500 font-mono font-medium animate-pulse">
              🔴 {formatTime(elapsedTime)}
            </span>
          )}
          {recordingState === 'PROCESSING' && (
            <span className="text-indigo-500 text-sm font-medium flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              Saving...
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
                  : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {recordingState === 'RECORDING' ? (
              <><FiSquare /> Stop</>
            ) : (
              <><FiMic /> Record</>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-10 text-gray-400 flex flex-col items-center">
            <FiHeadphones size={40} className="mb-3 text-gray-300" />
            <p>No voice notes yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map(note => (
              <div key={note.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50 group flex flex-col sm:flex-row items-center gap-4">
                
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800 truncate">{note.title}</h3>
                    <p className="text-xs text-gray-500 flex-shrink-0">{formatTime(note.duration || 0)}</p>
                  </div>
                  
                  {note.transcript && (
                    <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200 shadow-sm whitespace-pre-wrap">
                      {note.transcript}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">{new Date(note.createdAt).toLocaleDateString()}</p>
                </div>
                
                <button onClick={() => deleteNote(note.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 hidden sm:block">
                  <FiTrash2 />
                </button>
                <div className="sm:hidden w-full flex justify-end">
                   <button onClick={() => deleteNote(note.id)} className="text-red-500 p-2 text-sm flex items-center gap-1">
                    <FiTrash2 /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
