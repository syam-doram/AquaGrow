import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Mail, Phone, MapPin, Briefcase, Camera, Save } from 'lucide-react';
import { Header } from '../../components/Header';
import type { Translations } from '../../translations';
import { User } from '../../types';
import { useData } from '../../context/DataContext';

export const EditProfile = ({ user, t }: { user: User, t: Translations }) => {
  const navigate = useNavigate();
  const { setUser } = useData();
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phoneNumber: user.phoneNumber || '',
    location: user.location || '',
    experience: '5 Years', // Placeholder
  });

  const handleSave = () => {
    // In a real app, this would call an API
    setUser({ ...user, ...formData });
    navigate('/profile');
  };

  return (
    <div className="pb-32 bg-[#F8F9FE] min-h-screen">
      <Header title={t.editProfile} showBack />
      
      <div className="pt-24 px-6 py-8 space-y-8">
        {/* Profile Pic Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative group">
            <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl relative">
              <img 
                src={user.role === 'provider' ? "https://picsum.photos/seed/provider/200/200" : "https://picsum.photos/seed/farmer/200/200"} 
                className="w-full h-full object-cover" 
                alt="Profile"
              />
              <div className="absolute inset-0 bg-[#4A2C2A]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={32} className="text-white" />
              </div>
            </div>
            <button className="absolute -bottom-2 -right-2 w-12 h-12 bg-[#C78200] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-[#C78200]/20 border-4 border-[#F8F9FE]">
              <Camera size={20} />
            </button>
          </div>
          <p className="text-[10px] font-black text-[#C78200] uppercase tracking-[0.2em] mt-6">{user.role}</p>
        </div>

        <div className="space-y-6">
          <InputGroup 
            label={t.fullName} 
            icon={UserIcon} 
            value={formData.name} 
            onChange={(v) => setFormData({...formData, name: v})} 
            placeholder="e.g. Ramesh Kumar"
          />
          <InputGroup 
            label={t.emailAddress} 
            icon={Mail} 
            value={formData.email} 
            onChange={(v) => setFormData({...formData, email: v})} 
            placeholder="ramesh@example.com"
            type="email"
          />
          <InputGroup 
            label={t.phoneNumber} 
            icon={Phone} 
            value={formData.phoneNumber} 
            onChange={(v) => setFormData({...formData, phoneNumber: v})} 
            placeholder="+91 00000 00000"
            disabled
          />
          <InputGroup 
            label={t.location} 
            icon={MapPin} 
            value={formData.location} 
            onChange={(v) => setFormData({...formData, location: v})} 
            placeholder="e.g. Bhimavaram, AP"
          />
          <InputGroup 
            label={t.experience} 
            icon={Briefcase} 
            value={formData.experience} 
            onChange={(v) => setFormData({...formData, experience: v})} 
            placeholder="e.g. 5 Years"
          />
        </div>

        <button 
          onClick={handleSave}
          className="w-full mt-12 bg-[#C78200] text-white py-6 rounded-3xl font-black text-[12px] uppercase tracking-[0.3em] shadow-2xl shadow-[#C78200]/20 transition-all active:scale-95 flex items-center justify-center gap-4"
        >
          {t.saveChanges} <Save size={18} />
        </button>
      </div>
    </div>
  );
};

const InputGroup = ({ label, icon: Icon, value, onChange, placeholder, type = 'text', disabled = false }: any) => (
  <div className="space-y-3">
    <label className="text-[#4A2C2A]/30 text-[9px] font-black uppercase tracking-[0.2em] ml-2">{label}</label>
    <div className="relative group">
      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#C78200]/20 group-focus-within:text-[#C78200] transition-colors">
        <Icon size={20} />
      </div>
      <input 
        type={type}
        disabled={disabled}
        className="w-full pl-16 pr-6 py-5 rounded-[2rem] border border-[#C78200]/10 bg-white shadow-sm focus:ring-4 focus:ring-[#C78200]/5 focus:border-[#C78200] outline-none transition-all text-sm font-black text-[#4A2C2A] disabled:opacity-50" 
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  </div>
);
