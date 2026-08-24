import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../../context/userContext';
import { db } from '../../firebase/firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { FiMic, FiSquare, FiTrash2, FiFileText, FiClock, FiStar, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';

const loadScript = (src) => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function MeetingNotes() {
  const { user } = useUser();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recordingState, setRecordingState] = useState('IDLE'); // IDLE, RECORDING, PROCESSING
  const [elapsedTime, setElapsedTime] = useState(0);
  const elapsedTimeRef = useRef(0);

  const [usageData, setUsageData] = useState(null);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

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

  const fetchUsage = async () => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/pa/meeting-usage?userId=${user.uid}`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUsageData(data);
      }
    } catch (error) {
      console.error('Error fetching usage data:', error);
    } finally {
      setLoadingUsage(false);
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchUsage();
  }, [user]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Monitor recording limits
  useEffect(() => {
    if (recordingState === 'RECORDING' && usageData) {
      if (elapsedTime >= usageData.totalRemainingSeconds) {
        toast.warn('Recording time limit reached. Stopping automatically.');
        stopRecording();
      }
    }
  }, [elapsedTime, recordingState, usageData]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startRecording = async () => {
    if (!usageData || usageData.totalRemainingSeconds <= 0) {
      toast.error('You have reached your recording limit. Please upgrade.');
      return;
    }
    
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
      elapsedTimeRef.current = 0;
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => {
          const next = prev + 1;
          elapsedTimeRef.current = next;
          return next;
        });
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
      if (elapsedTimeRef.current < 2) {
        toast.info('Recording too short to process.');
        setRecordingState('IDLE');
        setElapsedTime(0);
        elapsedTimeRef.current = 0;
        return;
      }

      toast.info('Processing meeting note...', { autoClose: 3000 });
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      const newNote = {
        userId: user.uid,
        title: `Meeting on ${new Date().toLocaleDateString()}`,
        meetingDate: new Date().toISOString(),
        transcript: 'Processing transcription...',
        summary: 'Processing AI summary...',
        actionItems: [],
        duration: elapsedTimeRef.current,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'meetingNotes'), newNote);
      setNotes([{ id: docRef.id, ...newNote }, ...notes]);

      try {
        const idToken = await user.getIdToken();
        const formData = new FormData();
        formData.append('audio', audioBlob, 'audio.webm');
        formData.append('userId', user.uid);
        formData.append('idToken', idToken);
        formData.append('duration', elapsedTimeRef.current.toString());

        const transcribeRes = await fetch('/api/pa/transcribe', {
          method: 'POST',
          body: formData
        });
        const transcribeData = await transcribeRes.json();
        
        if (!transcribeRes.ok) throw new Error(transcribeData.error || 'Transcription failed');

        let summaryData = { summary: null, actionItems: [] };
        
        if (transcribeData.text && transcribeData.text.trim().length > 15) {
          const summaryRes = await fetch('/api/pa/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: transcribeData.text, type: 'meeting', userId: user.uid, idToken })
          });
          summaryData = await summaryRes.json();

          if (!summaryRes.ok) throw new Error(summaryData.error || 'Summarization failed');
        }

        await updateDoc(doc(db, 'meetingNotes', docRef.id), {
          transcript: transcribeData.text || 'No speech detected.',
          summary: summaryData.summary || null,
          actionItems: summaryData.actionItems || []
        });

        setNotes(prev => prev.map(n => n.id === docRef.id ? {
          ...n,
          transcript: transcribeData.text || 'No speech detected.',
          summary: summaryData.summary || null,
          actionItems: summaryData.actionItems || []
        } : n));
        
        toast.success('Meeting Note Processed!');
        fetchUsage(); // Refresh usage after processing
      } catch (aiError) {
        console.error('AI Processing error:', aiError);
        toast.error(`AI processing failed: ${aiError.message}`);
        await updateDoc(doc(db, 'meetingNotes', docRef.id), {
          transcript: 'Transcription failed.',
          summary: 'Summarization failed.'
        });
        setNotes(prev => prev.map(n => n.id === docRef.id ? {
          ...n, transcript: 'Transcription failed.', summary: 'Summarization failed.'
        } : n));
        fetchUsage(); // Still fetch usage as quota might have been deducted
      }
    } catch (error) {
      console.error('Error processing recording:', error);
      toast.error('Failed to process meeting note');
    } finally {
      setRecordingState('IDLE');
      setElapsedTime(0);
      elapsedTimeRef.current = 0;
    }
  };

  const deleteNote = async (id) => {
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/pa/delete-note?noteId=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      
      if (!res.ok) {
        throw new Error('Failed to delete note');
      }

      setNotes(notes.filter(n => n.id !== id));
      toast.success('Note deleted');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  const handlePurchaseAddon = async () => {
    if (!user) return;
    setProcessingPayment(true);
    const amount = 149; // 149 INR

    const sdkOK = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
    if (!sdkOK) {
      toast.error('Unable to load payment gateway. Check your internet connection.');
      setProcessingPayment(false);
      return;
    }

    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, userId: user.uid, userEmail: user.email }),
      });
      if (!res.ok) throw new Error('Failed to create order.');
      const order = await res.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
        amount: order.amount,
        currency: order.currency,
        name: `DigiCard Meeting Notes Add-on`,
        description: `3 Hours of Meeting Notes (30 Days)`,
        order_id: order.id,
        prefill: {
          email: user.email || '',
          contact: user.phoneNumber || '9876543210',
        },
        theme: { color: '#4c51bf' },
        handler: async (resp) => {
          try {
            toast.info('Verifying payment...', { autoClose: 2000 });
            const verify = await fetch('/api/pa/verify-addon', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
                userId: user.uid,
              }),
            });
            if (!verify.ok) throw new Error('Payment verification failed.');
            
            toast.success('🎉 Add-on activated successfully!');
            await fetchUsage();
          } catch (e) {
            console.error('Payment verification error:', e);
            toast.error('Payment successful, but failed to activate add-on. Please contact support.');
          } finally {
            setProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessingPayment(false);
            toast.info('Payment cancelled');
          }
        }
      };
      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', (response) => {
        toast.error(`Payment failed: ${response.error.description}`);
        setProcessingPayment(false);
      });
      rzp1.open();
    } catch (e) {
      toast.error('Failed to initialize payment.');
      setProcessingPayment(false);
    }
  };

  const isLimitReached = usageData && usageData.totalRemainingSeconds <= 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Meeting Notes</h2>
          {!loadingUsage && usageData && (
            <div className="flex items-center gap-2 mt-1">
              <FiClock className={isLimitReached ? "text-red-500" : "text-gray-500"} size={14} />
              <span className={`text-sm font-medium ${isLimitReached ? "text-red-500" : "text-gray-600"}`}>
                {isLimitReached ? "Quota Exhausted" : `${formatTime(usageData.totalRemainingSeconds)} remaining this cycle`}
              </span>
            </div>
          )}
        </div>
        
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
          
          {!isLimitReached && (
            <button
              onClick={recordingState === 'RECORDING' ? stopRecording : startRecording}
              disabled={recordingState === 'PROCESSING' || loadingUsage}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-semibold shadow-md transition-all ${
                recordingState === 'RECORDING' 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : recordingState === 'PROCESSING' || loadingUsage
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
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {/* Upgrade Card if Limit Reached */}
        {isLimitReached && !loadingUsage && (
          <div className="mb-6 p-6 rounded-2xl border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wider rounded-full mb-3">
                <FiClock /> Limit Reached
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Need more Meeting Notes?</h3>
              <p className="text-sm text-gray-600 mb-3 max-w-md">
                You've used up your 10-minute monthly allowance. Purchase the Meeting Notes Add-on to unlock an additional <strong>3 hours (10,800 seconds)</strong> valid for 30 days.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className="flex items-center gap-2"><FiCheckCircle className="text-green-500" /> Does not change your main plan</li>
                <li className="flex items-center gap-2"><FiCheckCircle className="text-green-500" /> Instant activation upon payment</li>
              </ul>
            </div>
            
            <div className="flex flex-col items-center shrink-0 w-full md:w-auto">
              <div className="text-3xl font-extrabold text-indigo-600 mb-1">₹149<span className="text-sm font-medium text-gray-500">/mo</span></div>
              <button
                onClick={handlePurchaseAddon}
                disabled={processingPayment}
                className={`mt-3 w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-bold shadow-md transition-all ${
                  processingPayment ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02]'
                }`}
              >
                {processingPayment ? 'Processing...' : <><FiStar /> Buy 3-Hour Add-on</>}
              </button>
            </div>
          </div>
        )}

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

                {note.transcript && note.transcript !== 'Processing transcription...' && (
                  <div className="mt-2">
                    <details className="text-sm text-gray-500">
                      <summary className="cursor-pointer hover:text-purple-600 font-medium transition-colors">View Full Transcript</summary>
                      <p className="mt-2 text-gray-600 bg-white p-3 rounded-lg border border-gray-100 whitespace-pre-wrap">{note.transcript}</p>
                    </details>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
