import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User as UserIcon,
  Smartphone, 
  Trash2,
  Lock,
  ChevronRight, 
  Zap, 
  Waves, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { cn } from '../utils/cn';
import { Translations } from '../translations';
import { User } from '../types';

export const AuthScreen = ({ t }: { t: Translations }) => {
  const { register, login } = useData();
  const [role, setRole] = useState<'farmer' | 'provider'>('farmer');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAction = async () => {
    setError('');
    if (!phone || !password || (isRegister && !name)) {
      setError(t.fillAllFields);
      return;
    }

    if (isRegister) {
      const result = await register({
        name,
        phoneNumber: `+91 ${phone}`,
        password,
        location: 'Bhimavaram, AP',
        farmSize: 0,
        language: 'English',
        role: role
      }) as any;
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || t.registrationFailed);
      }
    } else {
      const result = await login(`+91 ${phone}`, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || t.loginFailed);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF5] p-8 flex flex-col justify-center">
      <div className="mb-12 text-center">
        <div className="w-24 h-24 bg-[#C78200] rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl rotate-3">
          <Waves size={48} className="text-white" />
        </div>
        <h1 className="text-5xl font-serif italic text-[#4A2C2A] tracking-tighter mb-4">AquaGrow</h1>
        <p className="text-[#C78200] text-[10px] font-black uppercase tracking-[0.3em] font-sans">{t.ecosystemForFarmers}</p>
      </div>

      <div className="space-y-6">
        <div className="flex bg-white/50 backdrop-blur-md p-1.5 rounded-3xl border border-[#C78200]/10 shadow-sm mb-4">
          <button 
            onClick={() => setRole('farmer')}
            className={cn(
              "flex-1 py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all text-[11px] font-black uppercase tracking-widest",
              role === 'farmer' ? "bg-[#C78200] text-white shadow-xl" : "text-[#4A2C2A]/40"
            )}
          >
            <UserIcon size={16} /> {t.farmer}
          </button>
          <button 
            onClick={() => setRole('provider')}
            className={cn(
              "flex-1 py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all text-[11px] font-black uppercase tracking-widest",
              role === 'provider' ? "bg-[#C78200] text-white shadow-xl" : "text-[#4A2C2A]/40"
            )}
          >
            <Zap size={16} /> {t.provider}
          </button>
        </div>

        <div className="space-y-5">
          {error && (
            <div className="p-4 bg-red-50 rounded-2xl flex items-center gap-4 text-red-500 border border-red-100 mb-6">
              <AlertCircle size={20} />
              <p className="text-xs font-black">{error}</p>
            </div>
          )}

          {isRegister && (
            <div className="space-y-2">
              <div className="relative group">
                <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-[#C78200]/20 group-focus-within:text-[#C78200] transition-colors" size={20} />
                <input 
                  className="w-full pl-16 pr-6 py-5 rounded-[2rem] border border-[#C78200]/10 bg-white shadow-sm focus:ring-4 focus:ring-[#C78200]/5 focus:border-[#C78200] outline-none transition-all text-sm font-black text-[#4A2C2A]" 
                  placeholder={t.fullName || "Full Name"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <div className="relative group">
              <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 text-[#C78200]/20 group-focus-within:text-[#C78200] transition-colors" size={20} />
              <input 
                className="w-full pl-16 pr-6 py-5 rounded-[2rem] border border-[#C78200]/10 bg-white shadow-sm focus:ring-4 focus:ring-[#C78200]/5 focus:border-[#C78200] outline-none transition-all text-sm font-black text-[#4A2C2A]" 
                placeholder={t.phoneNumber || "Phone Number"} 
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-ink/30 text-[9px] font-black uppercase tracking-[0.2em] ml-2">{t.password}</label>
            <div className="relative group">
              <Zap className="absolute left-6 top-1/2 -translate-y-1/2 text-[#C78200]/20 group-focus-within:text-[#C78200] transition-colors" size={20} />
              <input 
                className="w-full pl-16 pr-6 py-5 rounded-[2rem] border border-[#C78200]/10 bg-white shadow-sm focus:ring-4 focus:ring-[#C78200]/5 focus:border-[#C78200] outline-none transition-all text-sm font-black text-[#4A2C2A]" 
                placeholder="••••••••" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            onClick={handleAction}
            className="w-full bg-[#C78200] text-white font-black py-6 rounded-[2.5rem] shadow-2xl shadow-[#C78200]/30 transition-all flex items-center justify-center gap-4 mt-8 uppercase tracking-[0.3em] text-[11px] active:scale-95"
          >
            {isRegister ? t.register : t.login} <ChevronRight size={20} />
          </button>

          <div className="text-center pt-10">
            <button 
              onClick={() => setIsRegister(!isRegister)}
              className="text-[#4A2C2A]/40 text-[10px] uppercase font-black tracking-widest hover:text-[#C78200] transition-colors"
            >
              {isRegister ? t.alreadyHaveAccount : t.dontHaveAccount}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
