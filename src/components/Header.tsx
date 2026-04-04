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
    <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-50 bg-white/95 backdrop-blur-xl border-b border-black/5 px-6 pt-[calc(env(safe-area-inset-top)+2rem)] pb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {showBack ? (
          <button onClick={handleBack} className="p-2 rounded-xl text-primary hover:bg-primary/5 transition-all">
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
        ) : (
          <button onClick={onMenuClick} className="w-11 h-11 rounded-2xl flex items-center justify-center bg-[#012B1D]/5 hover:bg-[#012B1D]/10 transition-all border border-black/5 group">
            <CircleUser size={22} className="text-[#012B1D]/70 group-hover:text-[#012B1D] transition-colors" />
          </button>
        )}
      </div>
      
      <h1 className="text-[#4A2C2A] font-black text-xl tracking-tighter">{title}</h1>

      <div className="flex items-center gap-3">
        {rightElement || (shouldShowNotifications && (
          <button 
            onClick={() => navigate('/notifications')}
            className="p-2.5 text-[#4A2C2A]/30 relative active:scale-95 transition-all group"
          >
            <Bell size={24} className="text-[#4A2C2A]/30 group-hover:text-[#4A2C2A]/70 transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-4.5 px-1 bg-red-600 rounded-full border-2 border-white text-[8px] font-black text-white flex items-center justify-center shadow-md z-[60] animate-in zoom-in duration-300">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>
    </header>
  );
};
