import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  X, Home, Settings, Waves, Camera, Zap, TrendingUp,
  LogOut, Utensils, Activity, Calculator, Pill, Cloud,
  BookOpen, Bell, Users, ShoppingCart, Moon, BarChart2,
  Stethoscope, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../context/DataContext';
import { Translations } from '../translations';
import { User } from '../types';
import { cn } from '../utils/cn';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Drawer = ({
  isOpen, onClose, user, t,
}: {
  isOpen: boolean; onClose: () => void; user: User; t: Translations;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useData();

  const farmerSections: NavSection[] = [
    {
      title: 'Monitoring',
      items: [
        { icon: Activity,    label: 'IoT Multi-Sensor',    path: '/monitor' },
        { icon: Camera,      label: 'Live AI Eye',         path: '/live-monitor' },
        { icon: Shield,      label: t.aiDisease,           path: '/disease-detection' },
        { icon: Cloud,       label: t.weather,             path: '/weather' },
        { icon: BarChart2,   label: t.market,              path: '/market' },
      ],
    },
    {
      title: 'Tools & Learn',
      items: [
        { icon: BookOpen,     label: t.learningCenter,     path: '/learn' },
        { icon: Stethoscope,  label: t.expertConsultations, path: '/expert-consultations' },
        { icon: Bell,         label: t.notifications,      path: '/notifications' },
        { icon: TrendingUp,   label: 'Export Trends',      path: '/export-trends' },
      ],
    },
    {
      title: 'Account',
      items: [
        { icon: Settings,  label: t.settings || 'Settings',             path: '/profile' },
        { icon: Shield,    label: t.subscription || 'Subscription Plan', path: '/profile/subscription' },
      ],
    },
  ];

  const providerSections: NavSection[] = [
    {
      title: 'Provider',
      items: [
        { icon: Home,        label: t.home,       path: '/provider/dashboard' },
        { icon: ShoppingCart,label: 'Inventory',  path: '/provider/inventory' },
        { icon: Users,       label: 'Orders',     path: '/provider/orders' },
        { icon: Settings,    label: t.settings,   path: '/profile' },
      ],
    },
  ];

  const sections = user.role === 'farmer' ? farmerSections : providerSections;

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#4A2C2A]/40 backdrop-blur-sm z-[60]"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed inset-y-0 left-0 w-[82%] max-w-[300px] bg-white z-[70] shadow-2xl flex flex-col"
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 pt-8 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#C78200] rounded-2xl flex items-center justify-center">
                  <Waves size={18} className="text-white" />
                </div>
                <h2 className="text-[#4A2C2A] font-black text-lg tracking-tighter">AquaGrow</h2>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-[#F8F9FE] flex items-center justify-center hover:bg-[#4A2C2A]/5 transition-all"
              >
                <X size={18} className="text-[#4A2C2A]/50" />
              </button>
            </div>

            {/* ── User Profile Pill ── */}
            <div className="mx-5 mb-4 bg-[#F8F9FE] rounded-2xl px-4 py-3 flex items-center gap-3 border border-black/5">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-black/5 flex-shrink-0">
                <img
                  src={user.role === 'provider'
                    ? 'https://picsum.photos/seed/provider/200/200'
                    : 'https://picsum.photos/seed/farmer/200/200'}
                  className="w-full h-full object-cover"
                  alt="profile"
                />
              </div>
              <div className="min-w-0">
                <p className="font-black text-sm tracking-tight text-[#4A2C2A] truncate">{user.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={cn(
                    'text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border',
                    user.subscriptionStatus === 'pro_silver' ? 'bg-slate-400/10 border-slate-400/20 text-slate-500' :
                    user.subscriptionStatus === 'pro_gold' ? 'bg-[#C78200]/10 border-[#C78200]/20 text-[#C78200]' :
                    user.subscriptionStatus === 'pro_diamond' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                    'bg-[#4A2C2A]/5 border-[#4A2C2A]/10 text-[#4A2C2A]/40'
                  )}>
                    {user.subscriptionStatus === 'pro_silver' ? 'Silver Plan' :
                     user.subscriptionStatus === 'pro_gold' ? 'Gold Plan' :
                     user.subscriptionStatus === 'pro_diamond' ? 'Diamond Plan' :
                     'Aqua Standard'}
                  </span>
                  <span className="text-[7px] font-black text-[#4A2C2A]/25 uppercase tracking-widest">{user.role}</span>
                </div>
              </div>
            </div>

            {/* ── Scrollable nav sections ── */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-5">
              {sections.map((section, si) => (
                <div key={si}>
                  <p className="text-[8px] font-black text-[#4A2C2A]/25 uppercase tracking-[0.2em] px-2 mb-2">
                    {section.title}
                  </p>
                  <div className="space-y-1">
                    {section.items.map(item => {
                      const isActive = location.pathname === item.path ||
                        (item.path !== '/' && location.pathname.startsWith(item.path) && item.path.length > 1);
                      return (
                        <button
                          key={item.path}
                          onClick={() => handleNav(item.path)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all group',
                            isActive
                              ? 'bg-[#0D523C] text-white shadow-md shadow-emerald-900/10'
                              : 'hover:bg-[#4A2C2A]/5 text-[#4A2C2A]'
                          )}
                        >
                          <div className={cn(
                            'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
                            isActive
                              ? 'bg-white/15 text-white'
                              : 'bg-[#4A2C2A]/5 text-[#4A2C2A]/50 group-hover:bg-[#4A2C2A]/10'
                          )}>
                            <item.icon size={16} />
                          </div>
                          <span className={cn(
                            'font-black text-[13px] tracking-tight',
                            isActive ? 'text-white' : 'text-[#4A2C2A]'
                          )}>
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className="ml-auto text-[7px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                          {isActive && (
                            <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Footer ── */}
            <div className="px-4 pb-8 pt-3 border-t border-black/5 space-y-2">
              {/* Pro upgrade banner — free users only */}
              {user.subscriptionStatus === 'free' && (
                <button
                  onClick={() => handleNav('/subscription')}
                  className="w-full bg-[#4A2C2A] rounded-2xl px-4 py-3 text-left relative overflow-hidden mb-2 hover:bg-[#3a2220] transition-colors"
                >
                  <div className="relative z-10">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Zap size={10} className="text-[#C78200]" />
                      <span className="text-[8px] font-black uppercase tracking-[0.25em] text-[#C78200]">AquaGrow Pro</span>
                    </div>
                    <p className="text-white text-[11px] font-black tracking-tight leading-tight">{t.elevateYield}</p>
                    <p className="text-white/40 text-[8px] font-medium mt-1">Tap to unlock all features →</p>
                  </div>
                  <TrendingUp size={50} className="absolute -right-2 -bottom-3 text-white/8" />
                </button>
              )}

              {/* Logout */}
              <button
                onClick={() => {
                  setUser(null);
                  onClose();
                  navigate('/');
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-red-50 text-red-500 transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                  <LogOut size={16} />
                </div>
                <span className="font-black text-[13px] tracking-tight">{t.logout}</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
