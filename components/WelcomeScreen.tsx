import React from 'react';
import RobotIcon from './icons/RobotIcon';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <RobotIcon className="w-24 h-24 mb-6 text-orange-400" />
      <h1 className="text-4xl font-bold text-slate-100 mb-2">AI Case Interview Buddy</h1>
      <p className="text-slate-400 mb-12 max-w-md">
        Hone your consulting skills with an AI-powered practice partner.
      </p>
      <button
        onClick={onStart}
        className="px-8 py-4 bg-orange-600 text-white text-lg font-semibold rounded-lg hover:bg-orange-500 transition-transform hover:scale-105 shadow-lg"
      >
        Start Interview
      </button>
    </div>
  );
};

export default WelcomeScreen;