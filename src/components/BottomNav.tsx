import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Waves, Pill, Utensils, Calculator } from 'lucide-react';
import { cn } from '../utils/cn';
import { Translations } from '../translations';

export const BottomNav = ({ t, onMenuClick }: { t: Translations, onMenuClick: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home,       label: t.home,     path: '/dashboard' },
    { icon: Waves,      label: t.ponds,    path: '/ponds'     },
    { icon: Pill,       label: t.medicine, path: '/medicine'  },
    { icon: Utensils,   label: t.feed,     path: '/feed'      },
    { icon: Calculator, label: t.roi,      path: '/roi'       },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50">
      <nav className="nav-blur px-2 py-3 flex justify-around items-center rounded-[2.5rem] border border-white/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] backdrop-blur-2xl relative overflow-hidden">
        {/* Soft Inner Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center gap-1.5 transition-all duration-500 relative group flex-1 min-w-0",
                isActive ? "text-[#4A2C2A]" : "text-[#4A2C2A]/20 hover:text-[#4A2C2A]/40"
              )}
            >
              <div className="relative">
                <item.icon 
                  size={isActive ? 22 : 20} 
                  strokeWidth={isActive ? 2.5 : 1.5} 
                  className={cn("transition-all duration-500", isActive && "drop-shadow-[0_0_8px_rgba(199,130,0,0.4)]")} 
                />
                {isActive && (
                  <motion.div 
                    layoutId="nav-bg"
                    className="absolute -inset-3 bg-[#C78200]/5 rounded-full -z-10"
                    transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                  />
                )}
              </div>
              
              <AnimatePresence mode="wait">
                {isActive && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.8, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 5 }}
                    className="text-[8px] font-black uppercase tracking-widest text-center truncate w-full px-1"
                  >
                    {item.label.split(' ')[0]}
                  </motion.span>
                )}
              </AnimatePresence>

              {isActive && (
                <motion.div 
                  layoutId="nav-dot"
                  className="absolute -bottom-1 w-1.5 h-1.5 bg-[#C78200] rounded-full shadow-[0_0_10px_rgba(199,130,0,0.6)]"
                  transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
