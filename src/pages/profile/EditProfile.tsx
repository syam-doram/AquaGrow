import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon, Mail, Phone, MapPin, Briefcase,
  Camera, Save, Maximize, Layers, CheckCircle2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '../../components/Header';
import type { Translations } from '../../translations';
import { User } from '../../types';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';

export const EditProfile = ({ user, t }: { user: User; t: Translations }) => {
  const navigate  = useNavigate();
  const { updateUser, theme } = useData();
  const isDark    = theme === 'dark' || theme === 'midnight';
  const [isSaving, setIsSaving]   = useState(false);
  const [toast, setToast]         = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [formData, setFormData] = useState({
    name:        user.name        || '',
    email:       user.email       || '',
    phoneNumber: user.phoneNumber || '',
    location:    user.location    || '',
    farmSize:    user.farmSize    || 0,
    pondCount:   user.pondCount   || 0,
    experience:  (user as any).experience || '',
  });

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) { showToast('error', 'Name is required'); return; }
    setIsSaving(true);
    try {
      const ok = await updateUser({
        ...formData,
        farmSize:  Number(formData.farmSize),
        pondCount: Number(formData.pondCount),
      });
      if (ok) { showToast('success', 'Profile updated!'); setTimeout(() => navigate('/profile'), 1200); }
      else       showToast('error', 'Failed to save. Please try again.');
    } catch { showToast('error', 'Connection error.'); }
    finally    { setIsSaving(false); }
  };

  const fields = [
    { label: t.fullName,    key: 'name',       icon: UserIcon, placeholder: 'e.g. Ramesh Kumar',    type: 'text' },
    { label: t.emailAddress,key: 'email',      icon: Mail,     placeholder: 'ramesh@example.com',   type: 'email' },
    { label: t.phoneNumber, key: 'phoneNumber',icon: Phone,    placeholder: '+91 00000 00000',       type: 'tel', disabled: true },
    { label: t.location,    key: 'location',   icon: MapPin,   placeholder: 'e.g. Bhimavaram, AP',  type: 'text' },
    { label: t.experience,  key: 'experience', icon: Briefcase,placeholder: 'e.g. 5 Years',          type: 'text' },
  ];

  return (
    <div className={cn('min-h-screen pb-32', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>
      <Header title={t.editProfile} showBack />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={cn(
              'fixed top-24 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl border text-sm font-black',
              toast.type === 'success'
                ? 'bg-emerald-500 text-white border-emerald-600'
                : 'bg-red-500 text-white border-red-600'
            )}>
            {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-22 px-4 py-6 space-y-6">

        {/* Avatar */}
        <div className="flex flex-col items-center mt-2">
          <div className="relative group">
            <div className="w-28 h-28 rounded-[2rem] overflow-hidden border-4 border-[#C78200]/30 shadow-xl">
              <img src={`https://picsum.photos/seed/${user.name}/200/200`} className="w-full h-full object-cover" alt="Profile" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[2rem]">
                <Camera size={28} className="text-white" />
              </div>
            </div>
            <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#C78200] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-[#C78200]/20 border-4 border-[#F0F4F8]">
              <Camera size={16} />
            </button>
          </div>
          <p className="text-[8px] font-black text-[#C78200] uppercase tracking-widest mt-5">{user.role}</p>
          <p className={cn('text-xs font-black', isDark ? 'text-white/50' : 'text-slate-600')}>{user.name}</p>
        </div>

        {/* Form card */}
        <div className={cn('rounded-[2rem] border p-5 space-y-4', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
          {fields.map(({ label, key, icon: Icon, placeholder, type, disabled }) => (
            <div key={key} className="space-y-1.5">
              <label className={cn('text-[7px] font-black uppercase tracking-widest block', isDark ? 'text-white/25' : 'text-slate-400')}>
                {label}
              </label>
              <div className="relative">
                <div className={cn('absolute left-4 top-1/2 -translate-y-1/2', isDark ? 'text-white/20' : 'text-slate-400')}>
                  <Icon size={15} />
                </div>
                <input
                  type={type}
                  disabled={disabled}
                  className={cn(
                    'w-full pl-10 pr-4 py-3.5 rounded-2xl border text-sm font-bold outline-none transition-all',
                    disabled ? 'opacity-50 cursor-not-allowed' : '',
                    isDark
                      ? 'bg-white/5 border-white/10 text-white placeholder:text-white/15 focus:border-[#C78200]/50'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-300 focus:border-[#C78200]'
                  )}
                  placeholder={placeholder}
                  value={(formData as any)[key]}
                  onChange={e => !disabled && setFormData(prev => ({ ...prev, [key]: e.target.value }))}
                />
              </div>
            </div>
          ))}

          {/* Farm size + Pond count side by side */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Farm Size (Acres)', key: 'farmSize',  icon: Maximize },
              { label: 'Pond Count',        key: 'pondCount', icon: Layers },
            ].map(({ label, key, icon: Icon }) => (
              <div key={key} className="space-y-1.5">
                <label className={cn('text-[7px] font-black uppercase tracking-widest block', isDark ? 'text-white/25' : 'text-slate-400')}>{label}</label>
                <div className="relative">
                  <div className={cn('absolute left-3 top-1/2 -translate-y-1/2', isDark ? 'text-white/20' : 'text-slate-400')}>
                    <Icon size={13} />
                  </div>
                  <input
                    type="number"
                    className={cn('w-full pl-9 pr-3 py-3.5 rounded-2xl border text-sm font-bold outline-none transition-all',
                      isDark ? 'bg-white/5 border-white/10 text-white focus:border-[#C78200]/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#C78200]'
                    )}
                    value={(formData as any)[key]}
                    onChange={e => setFormData(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-gradient-to-r from-[#C78200] to-[#FFA500] text-white py-4.5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-amber-900/15 flex items-center justify-center gap-3 disabled:opacity-70 transition-all">
          {isSaving
            ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><Save size={16} /> {t.saveChanges}</>
          }
        </motion.button>
      </div>
    </div>
  );
};
