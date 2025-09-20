import React, { useState, useCallback } from 'react';
import { InterviewState, Message, Feedback } from './types';
import {
  startInterviewWithTopic,
  startInterviewWithGeneratedCase,
  startInterviewWithUploadedCase,
  continueConversation,
  getFinalFeedback
} from './services/geminiService';
import WelcomeScreen from './components/WelcomeScreen';
import SelectionScreen from './components/SelectionScreen';
import InterviewScreen from './components/InterviewScreen';
import FeedbackScreen from './components/FeedbackScreen';
import Header from './components/Header';

const App: React.FC = () => {
  const [interviewState, setInterviewState] = useState<InterviewState>(InterviewState.WELCOME);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [caseContext, setCaseContext] = useState<string | null>(null); // Stores the uploaded case content

  const startInterview = useCallback(async (startFunction: () => Promise<Message>) => {
    setIsLoading(true);
    setError(null);
    setMessages([]);
    setFeedback(null);
    try {
      const initialMessage = await startFunction();
      setMessages([initialMessage]);
      setInterviewState(InterviewState.INTERVIEW);
    } catch (err) {
      console.error('Error starting interview:', err);
      setError('Failed to start the interview. Please try again later.');
      setInterviewState(InterviewState.SELECTION);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleStart = useCallback(() => {
    setInterviewState(InterviewState.SELECTION);
    setCaseContext(null); // Reset case context
  }, []);

  const handleStartWithTopic = useCallback((topic: string) => {
    setCaseContext(null); // Ensure case context is cleared for non-upload interviews
    startInterview(() => startInterviewWithTopic(topic));
  }, [startInterview]);

  const handleStartWithGeneratedCase = useCallback((caseType: string) => {
    setCaseContext(null); // Ensure case context is cleared
    startInterview(() => startInterviewWithGeneratedCase(caseType));
  }, [startInterview]);

  const handleStartWithUpload = useCallback((caseContent: string) => {
    setCaseContext(caseContent); // Set the case context from the upload
    startInterview(() => startInterviewWithUploadedCase(caseContent));
  }, [startInterview]);

  const handleSendMessage = useCallback(async (text: string) => {
    const userMessage: Message = { role: 'user', content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    setError(null);

    try {
      // Pass the updated history AND the stored case context to the service
      const aiResponse = await continueConversation(updatedMessages, caseContext);
      setMessages(prev => [...prev, aiResponse]);
    } catch (err) {
      console.error('Error continuing conversation:', err);
      const errorMessage: Message = { role: 'assistant', content: 'Sorry, I encountered an error. Please try sending your message again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, caseContext]); // Add caseContext to the dependency array

  const handleEndInterview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setInterviewState(InterviewState.FEEDBACK);
    try {
      const finalFeedback = await getFinalFeedback(messages);
      setFeedback(finalFeedback);
    } catch (err) {
      console.error('Error getting feedback:', err);
      setError('Failed to generate feedback. You can still review the conversation history.');
      setFeedback({
        overallSummary: "Could not generate feedback due to an error.",
        strengths: "N/A",
        areasForImprovement: "N/A",
        missedConcepts: "N/A",
        keyTakeaways: "N/A"
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const handleStartNew = useCallback(() => {
    setInterviewState(InterviewState.WELCOME);
    setMessages([]);
    setFeedback(null);
    setError(null);
    setCaseContext(null); // Reset case context
  }, []);

  const renderContent = () => {
    switch (interviewState) {
      case InterviewState.INTERVIEW:
        return (
          <InterviewScreen
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onEndInterview={handleEndInterview}
          />
        );
      case InterviewState.FEEDBACK:
        return (
          <FeedbackScreen
            feedback={feedback}
            isLoading={isLoading}
            onStartNew={handleStartNew}
            error={error}
          />
        );
      case InterviewState.SELECTION:
        return (
          <SelectionScreen
            onStartWithTopic={handleStartWithTopic}
            onStartWithGeneratedCase={handleStartWithGeneratedCase}
            onStartWithUpload={handleStartWithUpload}
            isLoading={isLoading}
            error={error}
          />
        );
      case InterviewState.WELCOME:
      default:
        return (
          <WelcomeScreen
            onStart={handleStart}
          />
        );
    }
  };

  return (
    <div className="bg-[#00040D] text-white min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full h-full flex flex-col bg-[#7a5104] rounded-2xl shadow-2xl border border-gray-700">
        <Header />
        <main className="flex-1 overflow-hidden p-6 flex flex-col">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;