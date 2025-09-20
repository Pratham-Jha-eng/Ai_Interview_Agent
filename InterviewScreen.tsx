import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message } from '../types';
import ChatMessage from './ChatMessage';
import LoadingSpinner from './LoadingSpinner';
import SendIcon from './icons/SendIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';

// SpeechRecognition setup
// FIX: Cast window to `any` to access non-standard SpeechRecognition APIs without TypeScript errors.
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
if (recognition) {
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
}

interface InterviewScreenProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onEndInterview: () => void;
}

const InterviewScreen: React.FC<InterviewScreenProps> = ({ messages, isLoading, onSendMessage, onEndInterview }) => {
  const [inputText, setInputText] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Effect to select a preferred voice
  useEffect(() => {
    const getAndSetVoice = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Preference logic: Prioritize a high-quality, male US English voice.
        const preferredVoice = 
            voices.find(voice => voice.lang === 'en-US' && voice.name.includes('Google') && voice.name.includes('Male')) ||
            voices.find(voice => voice.lang === 'en-US' && voice.name.includes('Male')) ||
            voices.find(voice => voice.name === 'Google US English') ||
            voices.find(voice => voice.lang === 'en-US' && voice.name.includes('Google')) ||
            voices.find(voice => voice.lang === 'en-US' && voice.name.includes('Natural')) ||
            voices.find(voice => voice.lang === 'en-US') ||
            voices[0]; // Fallback to the very first available voice
        
        setSelectedVoice(preferredVoice);
      }
    };

    // Voices often load asynchronously. We check immediately and also set up a listener.
    getAndSetVoice();
    speechSynthesis.onvoiceschanged = getAndSetVoice;

    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const cleanTextForSpeech = (text: string): string => {
    return text
      // Remove all asterisks, which are used for bold, italics, and list items.
      .replace(/\*/g, '')
      // Remove dashes that are used as list item markers at the beginning of a line.
      // This avoids removing dashes within words (e.g., "cost-benefit").
      .replace(/^- /gm, ''); // Matches a dash, followed by a space, at the start of a line.
  };

  // Text-to-Speech Effect
  useEffect(() => {
    if (isVoiceMode && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && !isLoading) {
        speechSynthesis.cancel(); // Clear any lingering speech
        
        const textToSpeak = cleanTextForSpeech(lastMessage.content);
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        
        // Make the voice deep and soothing
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
        utterance.rate = 1.0; // A calm, normal pace
        utterance.pitch = 0.8; // A lower pitch for a deeper voice

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
          setIsSpeaking(false);
          // The microphone will no longer automatically start.
          // The user must click the microphone icon to begin speaking.
        };
        speechSynthesis.speak(utterance);
      }
    }
     // Cleanup function to stop speech if component unmounts or mode changes
    return () => {
        speechSynthesis.cancel();
    }
  }, [messages, isLoading, isVoiceMode, selectedVoice]);

  // Speech-to-Text Effect
  useEffect(() => {
    if (!recognition) return;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => console.error('Speech recognition error:', event.error);

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');
      
      setInputText(transcript);

      if (event.results[0].isFinal) {
        if (transcript.trim()) {
           onSendMessage(transcript.trim());
        }
        setInputText('');
      }
    };
  }, [onSendMessage]);

  const handleToggleVoiceMode = () => {
    if (!recognition) {
        alert("Sorry, your browser doesn't support voice recognition.");
        return;
    }
    
    const newVoiceModeState = !isVoiceMode;
    setIsVoiceMode(newVoiceModeState);
    
    // If turning off voice mode, stop any ongoing speech/listening
    if (!newVoiceModeState) {
      speechSynthesis.cancel();
      recognition.stop();
      setIsSpeaking(false);
      setIsListening(false);
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      recognition?.stop();
    } else {
      recognition?.start();
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isLoading) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const renderInputArea = () => {
    if (isVoiceMode) {
      let statusText = "Click the mic to speak";
      if (isSpeaking) statusText = "Interviewer is speaking...";
      else if (isListening) statusText = "Listening...";
      else if (isLoading) statusText = "Thinking...";

      return (
        <div className="flex flex-col items-center gap-4">
          <button 
            onClick={handleMicClick}
            disabled={isSpeaking || isLoading}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors
              ${isListening ? 'bg-red-500 animate-pulse' : 'bg-cyan-600 hover:bg-cyan-500'} 
              disabled:bg-gray-700 disabled:cursor-not-allowed`}
          >
            <MicrophoneIcon className="w-10 h-10 text-white" />
          </button>
          <p className="text-sm text-slate-400 h-5">{statusText}</p>
        </div>
      );
    }

    return (
      <form onSubmit={handleSend} className="flex items-center gap-4">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Your response..."
          className="flex-1 bg-[#2D2D2D] border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="bg-cyan-600 text-white p-3 rounded-lg hover:bg-cyan-500 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
        >
          <SendIcon className="w-6 h-6" />
        </button>
      </form>
    );
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-6">
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} isSpoken={isVoiceMode && msg.role === 'assistant'}/>
        ))}
        {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
          <div className="flex justify-start">
             <div className="flex items-start gap-4">
               <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 6.75h4.5m-4.5 3h4.5m-4.5 3h4.5m3.75 3h-10.5A2.25 2.25 0 013 16.5V7.5A2.25 2.25 0 015.25 5.25h10.5A2.25 2.25 0 0118 7.5v9A2.25 2.25 0 0115.75 19.5z" /></svg>
               </div>
               <div className="bg-gray-700 p-4 rounded-lg rounded-bl-none max-w-lg">
                 <LoadingSpinner />
               </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-6 border-t border-gray-700 pt-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            {renderInputArea()}
          </div>
           {recognition && (
             <button
                onClick={handleToggleVoiceMode}
                title={isVoiceMode ? "Disable Voice Mode" : "Enable Voice Mode"}
                className={`p-3 rounded-lg transition-colors ${isVoiceMode ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-slate-300 hover:bg-gray-600'}`}
             >
                <MicrophoneIcon className="w-6 h-6"/>
             </button>
           )}
        </div>
        <button
          onClick={onEndInterview}
          disabled={isLoading}
          className="w-full mt-4 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:bg-gray-700 transition-colors"
        >
          Finish & Get Feedback
        </button>
      </div>
    </div>
  );
};

export default InterviewScreen;