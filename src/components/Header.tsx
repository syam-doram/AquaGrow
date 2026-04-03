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
  const { user } = useData();
  
  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  // Default behavior: hide notifications if showBack is true, unless explicitly set
  const shouldShowNotifications = showNotifications ?? !showBack;

  return (
    <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-50 bg-white/90 backdrop-blur-md border-b border-line px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {showBack ? (
          <button onClick={handleBack} className="p-1.5 rounded-lg text-primary hover:bg-primary/5 transition-all">
            <ChevronLeft size={20} />
          </button>
        ) : (
          <button onClick={onMenuClick} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#012B1D]/5 hover:bg-[#012B1D]/10 transition-all border border-black/5 group">
            <CircleUser size={20} className="text-[#012B1D]/60 group-hover:text-[#012B1D] transition-colors" />
          </button>
        )}
      </div>
      
      <h1 className="text-[#4A2C2A] font-black text-base tracking-tighter">{title}</h1>

      <div className="flex items-center gap-3">
        {rightElement || (shouldShowNotifications && (
          <button 
            onClick={() => navigate('/notifications')}
            className="p-2 text-primary/40 relative active:scale-95 transition-all group"
          >
            <Bell size={22} className="text-[#4A2C2A]/20 group-hover:text-[#4A2C2A]/60 transition-colors" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#C78200] rounded-full border-2 border-white shadow-sm ring-1 ring-[#C78200]/20"></span>
          </button>
        ))}
      </div>
    </header>
  );
};
