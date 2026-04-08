import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Zap, Calendar, Menu } from 'lucide-react';
import { motion } from 'motion/react';
import { Translations } from '../translations';
import { cn } from '../utils/cn';

export const ProviderBottomNav = ({ t, onMenuClick }: { t: Translations, onMenuClick: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { icon: Home, label: t.home, path: '/provider/dashboard', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
    { icon: Zap, label: t.inventory ?? 'Inventory', path: '/provider/inventory', color: '#C78200', bg: 'rgba(199, 130, 0, 0.1)' },
    { icon: Calendar, label: t.orders ?? 'Orders', path: '/provider/orders', color: '#0EA5E9', bg: 'rgba(14, 165, 233, 0.1)' },
  ];

  const activeItem = navItems.find(item => location.pathname === item.path) || navItems[0];

  return (
    <nav 
      className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md px-4 py-3 flex justify-between items-center z-50 rounded-[2.5rem] border border-white/20 shadow-2xl backdrop-blur-2xl transition-all duration-700 ease-in-out"
      style={{ backgroundColor: activeItem.bg }}
    >
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex flex-col items-center gap-1.5 transition-all duration-500 relative group flex-1",
              isActive ? "scale-110" : "text-ink/20 hover:text-ink/40"
            )}
            style={{ color: isActive ? item.color : '' }}
          >
            <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.5} className="transition-all duration-500" />
            <span className={cn(
              "text-[8px] font-black uppercase tracking-widest transition-all duration-500",
              isActive ? "opacity-100" : "opacity-0"
            )}>{item.label}</span>
            {isActive && (
              <motion.div 
                layoutId="nav-dot-provider"
                className="absolute -bottom-1 w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}66` }}
              />
            )}
          </button>
        );
      })}
      <button
        onClick={onMenuClick}
        className="flex-1 flex flex-col items-center gap-1.5 text-ink/20 hover:text-ink/40 transition-all group"
      >
        <Menu size={22} strokeWidth={1.5} />
        <span className="text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">Menu</span>
      </button>
    </nav>
  );
};
