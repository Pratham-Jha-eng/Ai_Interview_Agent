import React from 'react';
import { Message } from '../types';
import RobotIcon from './icons/RobotIcon';
import UserIcon from './icons/UserIcon';
import SpeakerIcon from './icons/SpeakerIcon';

interface ChatMessageProps {
  message: Message;
  isSpoken?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isSpoken }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
          <RobotIcon className="w-6 h-6 text-orange-400" />
        </div>
      )}
      <div
        className={`p-4 rounded-lg max-w-lg relative ${
          isUser
            ? 'bg-orange-800 text-white rounded-br-none'
            : 'bg-stone-700 text-slate-200 rounded-bl-none'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {!isUser && isSpoken && (
          <SpeakerIcon className="w-4 h-4 text-slate-400 absolute bottom-2 right-2" />
        )}
      </div>
      {isUser && (
        <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
          <UserIcon className="w-6 h-6 text-slate-200" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;