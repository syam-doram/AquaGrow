import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Package, IndianRupee, MessageSquare, BarChart2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Translations } from '../translations';
import { useData } from '../context/DataContext';
import { cn } from '../utils/cn';

export const ProviderBottomNav = ({ t, onMenuClick }: { t: Translations; onMenuClick: () => void }) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { theme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  const navItems = [
    { icon: Home,          label: 'Hub',      path: '/provider/dashboard', color: '#C78200' },
    { icon: Package,       label: 'Orders',   path: '/provider/orders',    color: '#6366f1' },
    { icon: IndianRupee,   label: 'Rates',    path: '/provider/rates',     color: '#10b981' },
    { icon: MessageSquare, label: 'Chat',     path: '/provider/chat',      color: '#3b82f6' },
    { icon: BarChart2,     label: 'Ledger',   path: '/provider/ledger',    color: '#f59e0b' },
  ];

  const activeItem = navItems.find(item => location.pathname === item.path) || navItems[0];

  return (
    <nav className={cn(
      'fixed bottom-4 left-1/2 -translate-x-1/2 w-[94%] max-w-[420px] px-2 py-3 flex justify-between items-center z-50 rounded-[2rem] border shadow-2xl backdrop-blur-2xl transition-all duration-500',
      isDark ? 'bg-[#0A1120]/90 border-white/8' : 'bg-white/90 border-slate-200'
    )}>
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              'flex flex-col items-center gap-1 flex-1 py-1 rounded-[1.5rem] transition-all duration-300 relative',
              isActive ? 'scale-105' : ''
            )}
          >
            {isActive && (
              <motion.div layoutId="provider-nav-bg"
                className="absolute inset-0 rounded-[1.5rem]"
                style={{ background: item.color + '20' }}
                transition={{ type: 'spring', damping: 22, stiffness: 260 }}
              />
            )}
            <item.icon
              size={20}
              strokeWidth={isActive ? 2.5 : 1.5}
              style={{ color: isActive ? item.color : isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)' }}
              className="relative z-10 transition-all duration-300"
            />
            <span
              className={cn('text-[7px] font-black uppercase tracking-widest relative z-10 transition-all duration-300',
                isActive ? 'opacity-100' : 'opacity-0')}
              style={{ color: item.color }}
            >
              {item.label}
            </span>
            {isActive && (
              <motion.div layoutId="provider-nav-dot"
                className="absolute -bottom-1 w-1 h-1 rounded-full"
                style={{ background: item.color }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};
