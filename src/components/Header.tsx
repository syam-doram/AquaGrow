import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, LayoutGrid } from 'lucide-react';
import { useData } from '../context/DataContext';
import { cn } from '../utils/cn';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  onMenuClick?: () => void;
}

export const Header = ({ title, showBack = false, onBack, rightElement, onMenuClick }: HeaderProps) => {
  const navigate = useNavigate();
  const { user } = useData();
  
  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-50 bg-white/90 backdrop-blur-md border-b border-line px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {showBack ? (
          <button onClick={handleBack} className="p-1.5 rounded-lg text-primary hover:bg-primary/5 transition-all">
            <ChevronLeft size={20} />
          </button>
        ) : (
          <button onClick={onMenuClick} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#012B1D]/5 hover:bg-[#012B1D]/10 transition-all border border-black/5 group">
            <LayoutGrid size={20} className="text-[#012B1D]/60 group-hover:text-[#012B1D] transition-colors" />
          </button>
        )}
      </div>
      
      <h1 className="text-[#4A2C2A] font-black text-sm tracking-tight">{title}</h1>

      <div className="flex items-center gap-3">
        {rightElement || (
          <button className="p-1.5 text-primary/40 relative">
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#4F7AFF] rounded-full"></span>
          </button>
        )}
      </div>
    </header>
  );
};
