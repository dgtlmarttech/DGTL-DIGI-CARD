import React, { useEffect, useState, useRef } from 'react';
import Vapi from '@vapi-ai/web';
import { FiMic, FiSquare, FiPhone } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function VapiAssistant() {
  const [callStatus, setCallStatus] = useState('inactive'); // inactive, starting, active
  const vapiRef = useRef(null);

  useEffect(() => {
    // Initialize Vapi with the Public Key
    // Note: The Private Key is kept secure on the backend for other operations.
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || 'your-vapi-public-key-here';
    
    if (!vapiRef.current && publicKey !== 'your-vapi-public-key-here') {
      try {
        const vapi = new Vapi(publicKey);
        vapiRef.current = vapi;

        vapi.on('call-start', () => {
          setCallStatus('active');
        });

        vapi.on('call-end', () => {
          setCallStatus('inactive');
        });

        vapi.on('error', (e) => {
          console.error(e);
          setCallStatus('inactive');
          toast.error('Voice Assistant encountered an error.');
        });
      } catch (error) {
        console.error("Vapi initialization error:", error);
      }
    }

    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
      }
    };
  }, []);

  const toggleCall = async () => {
    if (!vapiRef.current) {
      toast.error('Voice Assistant is not configured properly.');
      return;
    }

    if (callStatus === 'inactive') {
      setCallStatus('starting');
      try {
        // Start call with a specific assistant ID
        const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || 'your-assistant-id';
        await vapiRef.current.start(assistantId);
      } catch (error) {
        console.error("Error starting Vapi call:", error);
        setCallStatus('inactive');
        toast.error('Could not start Voice Assistant');
      }
    } else {
      vapiRef.current.stop();
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl shadow-lg p-6 text-white h-full flex flex-col items-center justify-center text-center relative overflow-hidden">
      {/* Decorative background circles */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-purple-500 opacity-20 rounded-full translate-x-1/3 translate-y-1/3 blur-xl"></div>
      
      <div className="relative z-10 w-full flex flex-col items-center">
        <h2 className="text-xl font-bold mb-2">Voice Assistant</h2>
        <p className="text-indigo-200 text-sm mb-8 px-4">
          Need help? Tap to talk to your AI assistant. It can schedule tasks, answer questions, and manage your day.
        </p>

        <button
          onClick={toggleCall}
          className={`relative flex items-center justify-center w-24 h-24 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 ${
            callStatus === 'active' 
              ? 'bg-red-500 shadow-red-500/50' 
              : callStatus === 'starting'
                ? 'bg-indigo-400'
                : 'bg-indigo-500 shadow-indigo-500/50 hover:bg-indigo-400'
          }`}
        >
          {callStatus === 'active' && (
            <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-75"></div>
          )}
          
          {callStatus === 'active' ? (
            <FiSquare size={32} />
          ) : callStatus === 'starting' ? (
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <FiMic size={36} />
          )}
        </button>
        
        <p className="mt-6 text-sm font-semibold tracking-wider uppercase text-indigo-200">
          {callStatus === 'active' ? 'Listening...' : callStatus === 'starting' ? 'Connecting...' : 'Tap to Speak'}
        </p>
      </div>
    </div>
  );
}
