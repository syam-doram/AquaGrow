import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, Waves, Pill, Utensils, Calculator } from 'lucide-react';
import { cn } from '../utils/cn';
import { Translations } from '../translations';

export const BottomNav = ({ t, onMenuClick }: { t: Translations, onMenuClick: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home,       label: t.home,           path: '/dashboard' },
    { icon: Waves,      label: t.ponds,          path: '/ponds'     },
    { icon: Pill,       label: t.medicine,       path: '/medicine'  },
    { icon: Utensils,   label: t.feedManagement, path: '/feed'      },
    { icon: Calculator, label: 'ROI',            path: '/roi'       },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md nav-blur px-4 py-3 flex justify-between items-center z-50 rounded-[24px] border border-line shadow-2xl">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex flex-col items-center gap-1 transition-all duration-500 relative group flex-1",
              isActive ? "text-[#4A2C2A] scale-105" : "text-ink/20 hover:text-primary/40"
            )}
          >
            <item.icon size={18} strokeWidth={isActive ? 2.5 : 1.5} className="transition-all duration-500" />
            <span className={cn(
              "text-[6px] font-black uppercase tracking-[0.1em] transition-all duration-500 text-center",
              isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
            )}>{item.label}</span>
            {isActive && (
              <motion.div 
                layoutId="nav-dot"
                className="absolute -bottom-1 w-1 h-1 bg-[#C78200] rounded-full"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};
