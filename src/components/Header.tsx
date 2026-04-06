import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, CircleUser } from 'lucide-react';
import { useData } from '../context/DataContext';
import { cn } from '../utils/cn';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  onMenuClick?: () => void;
  showNotifications?: boolean;
}

export const Header = ({ title, showBack = false, onBack, rightElement, onMenuClick, showNotifications }: HeaderProps) => {
  const navigate = useNavigate();
  const { user, unreadCount } = useData();
  
  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  // Default behavior: hide notifications if showBack is true, unless explicitly set
  const shouldShowNotifications = showNotifications ?? !showBack;

  return (
    <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.03] px-6 pt-[calc(env(safe-area-inset-top)+0.8rem)] pb-[0.8rem] flex items-center grid grid-cols-3">
      <div className="flex items-center justify-start">
        {showBack ? (
          <button onClick={handleBack} className="w-10 h-10 -ml-2 flex items-center justify-center rounded-xl text-[#012B1D] hover:bg-[#012B1D]/5 transition-all">
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
        ) : (
          <button onClick={onMenuClick} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#012B1D]/5 hover:bg-[#012B1D]/10 transition-all border border-black/5 group">
            <CircleUser size={20} className="text-[#012B1D]/70 group-hover:text-[#012B1D] transition-colors" />
          </button>
        )}
      </div>
      
      <div className="flex items-center justify-center">
        <h1 className="text-[#012B1D] font-black text-lg tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">{title}</h1>
      </div>

      <div className="flex items-center justify-end">
        {rightElement || (shouldShowNotifications && (
          <button 
            onClick={() => navigate('/notifications')}
            className="w-10 h-10 -mr-2 flex items-center justify-center text-[#012B1D]/30 relative active:scale-95 transition-all group"
          >
            <Bell size={22} className="text-[#4A2C2A]/30 group-hover:text-[#4A2C2A]/70 transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full border-2 border-white shadow-sm z-[60] animate-in zoom-in duration-300" />
            )}
          </button>
        ))}
      </div>
    </header>
  );
};
