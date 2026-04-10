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
  showLogo?: boolean;
}

export const Header = ({ title, showBack = false, onBack, rightElement, onMenuClick, showNotifications, showLogo }: HeaderProps) => {
  const navigate = useNavigate();
  const { unreadCount, theme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';
  
  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  // Default behavior: hide notifications if showBack is true, unless explicitly set
  const shouldShowNotifications = showNotifications ?? !showBack;

  return (
    <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full sm:max-w-[420px] z-50 premium-glass border-b border-card-border px-6 pt-[calc(env(safe-area-inset-top)+0.8rem)] pb-[0.8rem] flex items-center grid grid-cols-3 rounded-b-[2rem]">
      <div className="flex items-center justify-start">
        {showBack ? (
          <button onClick={handleBack} className="w-10 h-10 -ml-2 flex items-center justify-center rounded-xl text-ink hover:bg-ink/5 transition-all">
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
        ) : (
          <button onClick={onMenuClick} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-ink/5 hover:bg-ink/10 transition-all border border-card-border group">
            <CircleUser size={20} className="text-ink/70 group-hover:text-ink transition-colors" />
          </button>
        )}
      </div>
      
      <div className="flex items-center justify-center">
        {showLogo ? (
          <div className="flex items-center gap-2">
            <img
              src="/app_icon.png"
              alt="AquaGrow"
              className="w-8 h-8 rounded-xl object-cover shadow-lg shadow-emerald-500/20"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="flex flex-col items-start leading-tight">
              <span className={cn('font-black text-base tracking-tight leading-none', isDark ? 'text-white' : 'text-slate-900')}>
                AquaGrow
              </span>
              <span className={cn('text-[7px] font-black uppercase tracking-[0.2em]', isDark ? 'text-emerald-400' : 'text-emerald-600')}>
                Smart Farm
              </span>
            </div>
          </div>
        ) : (
          <h1 className="text-ink font-black text-lg tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">{title}</h1>
        )}
      </div>

      <div className="flex items-center justify-end">
        {rightElement || (shouldShowNotifications && (
          <button 
            onClick={() => navigate('/notifications')}
            className="w-10 h-10 -mr-2 flex items-center justify-center text-ink/30 relative active:scale-95 transition-all group"
          >
            <Bell size={22} className="text-ink/30 group-hover:text-ink/70 transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full border-2 border-white shadow-sm z-[60] animate-in zoom-in duration-300" />
            )}
          </button>
        ))}
      </div>
    </header>
  );
};
