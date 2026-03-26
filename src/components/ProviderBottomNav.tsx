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
    { icon: Home, label: t.home, path: '/provider/dashboard' },
    { icon: Zap, label: t.inventory ?? 'Inventory', path: '/provider/inventory' },
    { icon: Calendar, label: t.orders ?? 'Orders', path: '/provider/orders' },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-sm bg-white/10 backdrop-blur-xl px-6 py-4 flex justify-between items-center z-50 rounded-[32px] border border-white/20 shadow-2xl">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex flex-col items-center gap-2 transition-all duration-500 relative group",
              isActive ? "text-[#C78200] scale-110" : "text-[#4A2C2A]/20 hover:text-[#4A2C2A]/40"
            )}
          >
            <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.5} className="transition-all duration-500" />
            <span className={cn(
              "text-[8px] font-black uppercase tracking-[0.2em] transition-all duration-500",
              isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            )}>{item.label}</span>
            {isActive && (
              <motion.div 
                layoutId="nav-dot-provider"
                className="absolute -bottom-1 w-1 h-1 bg-[#C78200] rounded-full"
              />
            )}
          </button>
        );
      })}
      <button
        onClick={onMenuClick}
        className="flex flex-col items-center gap-2 text-[#4A2C2A]/20 hover:text-[#4A2C2A]/40 transition-all group"
      >
        <Menu size={22} strokeWidth={1.5} />
        <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all">Menu</span>
      </button>
    </nav>
  );
};
