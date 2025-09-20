
import React from 'react';
import RobotIcon from './icons/RobotIcon';

const Header: React.FC = () => {
  return (
    <header className="flex-shrink-0 flex items-center p-4 border-b border-stone-700">
      <RobotIcon className="w-8 h-8 mr-3 text-orange-400" />
      <h1 className="text-xl font-bold text-slate-100">AI Case Interview Buddy</h1>
    </header>
  );
};

export default Header;