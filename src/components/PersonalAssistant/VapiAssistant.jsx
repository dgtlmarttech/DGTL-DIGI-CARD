import React, { useState, useRef, useEffect } from 'react';
import { FiMic, FiSquare, FiVolume2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useUser } from '../../context/userContext';

export default function VoiceAssistant() {
  const { user } = useUser();
  const [status, setStatus] = useState('idle'); // idle, listening, processing, speaking
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [textInput, setTextInput] = useState('');
  
  const statusRef = useRef('idle');
  const transcriptRef = useRef('');
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const manualCancelRef = useRef(false);
  const hasGreetedRef = useRef(false);
  const silenceTimerRef = useRef(null);

  const updateStatus = (newStatus) => {
    setStatus(newStatus);
    statusRef.current = newStatus;
  };

  const updateTranscript = (newTranscript) => {
    setTranscript(newTranscript);
    transcriptRef.current = newTranscript;
  };

  useEffect(() => {
    // Initialize Speech Synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    // Initialize Speech Recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = true; // Use continuous so it doesn't cut off early
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          updateStatus('listening');
          updateTranscript('');
        };

        recognition.onresult = (event) => {
          const current = event.resultIndex;
          const transcriptText = Array.from(event.results)
            .map(res => res[0].transcript)
            .join('');
            
          updateTranscript(transcriptText);

          // Reset silence timer on every new word
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (statusRef.current === 'listening') {
              if (recognitionRef.current) {
                recognitionRef.current.manualStop = true;
                recognitionRef.current.stop();
              }
              const finalTxt = transcriptRef.current.trim();
              if (finalTxt) {
                processTranscriptText(finalTxt);
              } else {
                updateStatus('idle');
              }
            }
          }, 2500); // 2.5 seconds of silence = user is done talking
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          if (statusRef.current !== 'processing') {
            updateStatus('idle');
          }
          if (event.error !== 'aborted' && event.error !== 'no-speech') {
            toast.error(`Microphone error: ${event.error}`);
          }
        };

        recognition.onend = () => {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          
          if (recognitionRef.current?.manualStop) {
            recognitionRef.current.manualStop = false;
            return; 
          }
          
          if (statusRef.current === 'listening') {
             const finalTxt = transcriptRef.current.trim();
             if (finalTxt) {
               processTranscriptText(finalTxt);
             } else {
               updateStatus('idle');
             }
          }
        };

        recognitionRef.current = recognition;
      } else {
        setIsSupported(false);
        console.warn('Speech Recognition API not supported in this browser.');
      }
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const fetchTodosContext = async () => {
    if (!user) return null;
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(
        `/api/pa/todos?userId=${encodeURIComponent(user.uid)}&idToken=${encodeURIComponent(idToken)}`
      );
      if (!res.ok) return null;

      const data = await res.json();
      const todos = data.todos || [];

      if (todos.length === 0) {
        return 'The user currently has no tasks in their To-Do list.';
      }

      const today = new Date().toISOString().split('T')[0];
      const pending = todos.filter(t => t.status === 'pending');
      const completed = todos.filter(t => t.status === 'completed');

      const formatTask = (t, i) => {
        const dateLabel = t.taskDate === today ? ' (today)' : t.taskDate ? ` (${t.taskDate})` : '';
        const timeLabel = t.taskTime ? ` at ${t.taskTime}` : '';
        const recLabel = t.recurrence && t.recurrence !== 'none' ? ` [Repeats ${t.recurrence}]` : '';
        return `  ${i + 1}. [ID: ${t.id}] "${t.title}"${dateLabel}${timeLabel}${recLabel}`;
      };

      const pendingToday = pending.filter(t => t.taskDate === today);
      const pendingSection = pending.length === 0 ? '  (none)' : pending.map(formatTask).join('\n');
      const completedSection = completed.length === 0 ? '  (none)' : completed.map(formatTask).join('\n');
      
      const todayPendingNote = pendingToday.length > 0 
          ? `\n⚠️ REMINDER: ${pendingToday.length} task(s) due TODAY are still pending: ${pendingToday.map(t => `"${t.title}"`).join(', ')}`
          : '';
          
      // Format Meetings Context
      const meetings = data.meetings || [];
      let meetingsSection = '';
      if (meetings.length > 0) {
        meetingsSection = '\n\nRECENT MEETINGS:\n' + meetings.map((m, i) => {
           const dateStr = new Date(m.createdAt).toLocaleDateString();
           let txt = `${i+1}. ${m.title} (${dateStr})\n   Summary: ${m.summary || 'None'}`;
           if (m.actionItems && m.actionItems.length > 0) {
             txt += `\n   Follow-ups/Tasks: ${m.actionItems.join(', ')}`;
           }
           return txt;
        }).join('\n\n');
      }

      return `PENDING TASKS (${pending.length}):\n${pendingSection}\n\nCOMPLETED TASKS (${completed.length}):\n${completedSection}${todayPendingNote}${meetingsSection}`;
    } catch (err) {
      console.error('Failed to fetch todos:', err);
      return null;
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      toast.error('Voice recognition is not supported in this browser. Please use Chrome.');
      return;
    }
    
    if (synthRef.current) synthRef.current.cancel(); 
    updateTranscript('');
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error('Recognition start error', err);
    }
  };

  const processTranscriptText = async (finalText) => {
    if (!finalText) {
      updateStatus('idle');
      return;
    }

    updateStatus('processing');

    try {
      const context = await fetchTodosContext();
      const idToken = await user.getIdToken();

      const res = await fetch('/api/pa/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: finalText, context, idToken })
      });

      if (!res.ok) throw new Error('API failed');
      const data = await res.json();
      
      speakResponse(data.reply);
    } catch (error) {
      console.error('Chat processing error:', error);
      toast.error('Failed to get a response.');
      updateStatus('idle');
    }
  };

  const stopListeningAndProcess = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      recognitionRef.current.manualStop = true;
      recognitionRef.current.stop();
    }
    processTranscriptText(transcriptRef.current.trim());
  };

  const speakResponse = (text, isGreeting = false) => {
    manualCancelRef.current = false;
    if (!synthRef.current) {
      if (isGreeting) startListening();
      else updateStatus('idle');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    
    const voices = synthRef.current.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en-') && v.name.includes('Google'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => {
      updateStatus('speaking');
    };

    utterance.onend = () => {
      if (manualCancelRef.current) return;
      
      if (isGreeting) {
        startListening();
      } else {
        updateStatus('idle');
        updateTranscript('');
      }
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis stopped or errored', e);
      updateStatus('idle');
    };

    synthRef.current.speak(utterance);
  };

  const toggleVoice = () => {
    if (status === 'idle') {
      if (!hasGreetedRef.current) {
        hasGreetedRef.current = true;
        speakResponse("Hi, I am your AI assistant. How can I help you?", true);
      } else {
        startListening();
      }
    } else if (status === 'listening') {
      stopListeningAndProcess();
    } else if (status === 'speaking' || status === 'processing') {
      manualCancelRef.current = true;
      if (synthRef.current) synthRef.current.cancel();
      updateStatus('idle');
      updateTranscript('');
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    processTranscriptText(textInput.trim());
    setTextInput('');
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl shadow-lg p-6 text-white h-full flex flex-col items-center justify-center text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-purple-500 opacity-20 rounded-full translate-x-1/3 translate-y-1/3 blur-xl"></div>

      <div className="relative z-10 w-full flex flex-col items-center">
        <h2 className="text-xl font-bold mb-2">Voice Assistant</h2>
        <p className="text-indigo-200 text-sm mb-6 px-4">
          Need help? Tap to talk to your AI assistant. It can answer questions about your tasks.
        </p>

        {!isSupported ? (
          <div className="w-full max-w-sm bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
            <p className="text-indigo-100 text-sm mb-4 font-medium">
              Your browser doesn't support voice recognition. You can still type your request below:
            </p>
            <form onSubmit={handleTextSubmit} className="flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Ask your assistant..."
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                disabled={status === 'processing'}
              />
              <button
                type="submit"
                disabled={status === 'processing' || !textInput.trim()}
                className="bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
              >
                Send
              </button>
            </form>
            {status === 'processing' && (
              <p className="mt-3 text-sm font-semibold text-indigo-200 animate-pulse">Thinking...</p>
            )}
          </div>
        ) : (
          <>
            <button
              onClick={toggleVoice}
              className={`relative flex items-center justify-center w-24 h-24 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 ${
                status === 'listening'
                  ? 'bg-red-500 shadow-red-500/50'
                  : status === 'processing'
                  ? 'bg-indigo-400'
                  : status === 'speaking'
                  ? 'bg-green-500 shadow-green-500/50'
                  : 'bg-indigo-500 shadow-indigo-500/50 hover:bg-indigo-400'
              }`}
            >
              {status === 'listening' && (
                <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-75"></div>
              )}
              {status === 'speaking' && (
                <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-pulse opacity-75"></div>
              )}

              {status === 'listening' ? (
                <FiSquare size={32} />
              ) : status === 'processing' ? (
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : status === 'speaking' ? (
                <FiVolume2 size={36} />
              ) : (
                <FiMic size={36} />
              )}
            </button>

            <p className="mt-6 text-sm font-semibold tracking-wider uppercase text-indigo-200">
              {status === 'listening'
                ? 'Listening (Tap to Stop)...'
                : status === 'processing'
                ? 'Thinking...'
                : status === 'speaking'
                ? 'Speaking (Tap to Stop)...'
                : 'Tap to Speak'}
            </p>

            {transcript && status === 'listening' && (
              <p className="mt-4 text-xs text-indigo-100 italic px-2 bg-black/20 py-2 rounded-lg max-w-full truncate">
                "{transcript}"
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
