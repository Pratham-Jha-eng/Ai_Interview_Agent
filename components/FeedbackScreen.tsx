import React from 'react';
import { Feedback } from '../types';
import LoadingSpinner from './LoadingSpinner';
import MarkdownRenderer from './MarkdownRenderer';

interface FeedbackScreenProps {
  feedback: Feedback | null;
  isLoading: boolean;
  onStartNew: () => void;
  error: string | null;
}

const FeedbackSection: React.FC<{ title: string; content: string }> = ({ title, content }) => (
  <div className="bg-stone-800 p-6 rounded-lg border border-stone-700">
    <h3 className="text-xl font-semibold text-orange-400 mb-3">{title}</h3>
    <div className="prose prose-invert prose-p:text-slate-300">
       <MarkdownRenderer content={content} />
    </div>
  </div>
);


const FeedbackScreen: React.FC<FeedbackScreenProps> = ({ feedback, isLoading, onStartNew, error }) => {
  return (
    <div className="flex flex-col h-full text-center">
      <h2 className="text-3xl font-bold text-slate-100 mb-6">Interview Feedback</h2>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center flex-1">
          <LoadingSpinner />
          <p className="mt-4 text-slate-300">Analyzing your performance and generating feedback...</p>
        </div>
      ) : error && !feedback ? (
          <div className="flex flex-col items-center justify-center flex-1 bg-red-900/20 border border-red-500/50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-red-400 mb-3">Error Generating Feedback</h3>
              <p className="text-slate-300">{error}</p>
          </div>
      ) : feedback ? (
        <div className="flex-1 overflow-y-auto space-y-6 text-left pr-2">
          <FeedbackSection title="Overall Summary" content={feedback.overallSummary} />
          <FeedbackSection title="Strengths" content={feedback.strengths} />
          <FeedbackSection title="Areas for Improvement" content={feedback.areasForImprovement} />
          {feedback.missedConcepts && <FeedbackSection title="What You Missed: Key Concepts" content={feedback.missedConcepts} />}
          {feedback.keyTakeaways && <FeedbackSection title="Notes for Future Reference" content={feedback.keyTakeaways} />}
        </div>
      ) : null}

      <div className="mt-8">
        <button
          onClick={onStartNew}
          className="w-full py-3 px-4 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-500 transition-colors"
        >
          Start New Interview
        </button>
      </div>
    </div>
  );
};

export default FeedbackScreen;