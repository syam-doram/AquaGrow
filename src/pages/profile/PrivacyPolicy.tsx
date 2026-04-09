import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, Database, Eye, Share2, Lock,
  UserCheck, Trash2, Bell, Globe, ChevronDown, ChevronRight,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';
import { Header } from '../../components/Header';

// ─── SECTION DATA ─────────────────────────────────────────────────────────────
const SECTIONS = [
  {
    icon: Database,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10 border-blue-500/20',
    title: 'Data We Collect',
    content: [
      '**Account Information:** Name, phone number, email address, farm name, and location (state/district) provided during registration.',
      '**Pond & Culture Data:** Pond dimensions, species (Vannamei/Monodon), stocking date, seed count, water quality readings (pH, DO, ammonia, temperature, salinity), feed logs, medicine schedules, and harvest records.',
      '**Device Information:** Device type, OS version, app version, and crash/error logs for support purposes.',
      '**Usage Data:** Pages visited, features used, and interaction timestamps to improve app performance.',
      '**Push Notification Tokens:** FCM tokens to deliver real-time farm alerts to your device.',
    ],
  },
  {
    icon: Eye,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    title: 'How We Use Your Data',
    content: [
      '**Farm Intelligence:** Your pond and water data drives our AI-powered SOP engine, disease detection alerts, feed adjustment recommendations, and harvest timing guidance.',
      '**Smart Alerts:** Water quality thresholds, lunar phase cautions, DOC-based reminders, and WSSV/EMS risk warnings are generated from your logged data.',
      '**ROI & Analytics:** Profit, cost, and yield calculations shown in the Finance module are computed locally from your entered data.',
      '**Notifications:** Alert preferences you set control what push and in-app notifications you receive.',
      '**Support & Improvement:** Anonymised usage patterns help us improve features and fix bugs.',
    ],
  },
  {
    icon: Share2,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10 border-purple-500/20',
    title: 'Data Sharing',
    content: [
      '**We do not sell your data.** Your farm records, pond data, and personal information are never sold to third parties.',
      '**Expert Consultations:** If you request an expert consultation, your pond summary (species, DOC, water quality) is shared only with the assigned expert.',
      '**Market Data:** Market price information displayed is sourced from public APIs and does not include your personal farm data.',
      '**Service Providers:** We use Firebase (Google) for authentication, notifications, and data storage, all governed by their enterprise privacy standards.',
      '**Legal Compliance:** We may disclose data if required by Indian law (IT Act 2000 / DPDP Act 2023) or valid legal process.',
    ],
  },
  {
    icon: Lock,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10 border-amber-500/20',
    title: 'Data Storage & Security',
    content: [
      '**Encryption:** All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption on Firebase infrastructure.',
      '**Authentication:** Account access is protected by password hashing (bcrypt) and optional biometric login (FaceID / Fingerprint).',
      '**Data Location:** Your data is stored on Google Firebase servers with regional data centres compliant with Indian data localisation guidelines.',
      '**Retention:** Active farm data is retained for the duration of your account. Archived pond records are kept for 3 years to preserve yield history.',
      '**Breach Protocol:** In case of a data breach, affected users will be notified within 72 hours with details of what was exposed and remediation steps.',
    ],
  },
  {
    icon: Bell,
    color: 'text-red-500',
    bg: 'bg-red-500/10 border-red-500/20',
    title: 'Notifications & Tracking',
    content: [
      '**Push Notifications:** You control which alert categories you receive (Water, Feed, Disease, Harvest, Market, Lunar) via Notification Settings.',
      '**No Ad Tracking:** AquaGrow does not use any advertising networks, pixels, or cross-site tracking technologies.',
      '**Analytics:** We use privacy-safe analytics (no personally identifiable information) to understand feature adoption and fix performance issues.',
      '**Camera / Gallery:** The Disease Detection and Water Test Scanner features use your camera only while those screens are active. No images are stored without your explicit save action.',
    ],
  },
  {
    icon: UserCheck,
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
    title: 'Your Rights',
    content: [
      '**Access:** You may request a full export of your personal data via Settings → Security & Privacy → Export Data.',
      '**Correction:** You can update your profile, farm name, pond details, and contact information at any time within the app.',
      '**Deletion:** You may request account deletion from Profile → Danger Zone. All personal data and pond records will be permanently removed within 30 days.',
      '**Opt-out:** You can disable all push notifications or revoke camera/location permissions from your device Settings at any time.',
      '**Grievance Redressal:** Contact our Data Protection Officer at privacy@aquagrow.in within 30 days for any data-related concerns.',
    ],
  },
  {
    icon: Globe,
    color: 'text-teal-500',
    bg: 'bg-teal-500/10 border-teal-500/20',
    title: 'Updates to This Policy',
    content: [
      'We may update this Privacy Policy as we add new features or comply with regulatory changes.',
      'Significant changes will be notified via in-app alerts and email at least 14 days before they take effect.',
      'Continued use of AquaGrow after the effective date constitutes acceptance of the updated policy.',
      'This policy was last updated: **April 2026**. Effective from launch.',
    ],
  },
];

// ─── EXPANDABLE SECTION CARD ──────────────────────────────────────────────────
const SectionCard = ({
  section, isDark, index,
}: { section: typeof SECTIONS[0]; isDark: boolean; index: number }) => {
  const [open, setOpen] = useState(index === 0);

  const renderLine = (line: string) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return parts.map((p, i) =>
      i % 2 === 1
        ? <span key={i} className={cn('font-black', isDark ? 'text-white' : 'text-slate-900')}>{p}</span>
        : <span key={i}>{p}</span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={cn('rounded-[2rem] border overflow-hidden', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center border flex-shrink-0', section.bg, section.color)}>
          <section.icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-[11px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{section.title}</p>
          <p className={cn('text-[8px] font-bold uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>
            {section.content.length} points
          </p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className={isDark ? 'text-white/20' : 'text-slate-400'} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className={cn('mx-4 mb-4 rounded-2xl border p-4 space-y-3', isDark ? 'bg-white/3 border-white/5' : 'bg-slate-50 border-slate-100')}>
              {section.content.map((line, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className={cn('w-1 h-1 rounded-full mt-2 flex-shrink-0', section.color.replace('text-', 'bg-'))} />
                  <p className={cn('text-[10px] font-medium leading-relaxed', isDark ? 'text-white/50' : 'text-slate-600')}>
                    {renderLine(line)}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export const PrivacyPolicy = ({ t }: { t: any }) => {
  const navigate = useNavigate();
  const { theme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  return (
    <div className={cn('min-h-screen pb-32', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>
      <Header title="Privacy Policy" showBack />

      <div className="pt-22 px-4 py-5 space-y-4">

        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#0D1520] to-[#051015] rounded-[2.5rem] p-6 border border-white/5 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute -right-6 -bottom-6 opacity-5">
            <Shield size={140} strokeWidth={0.5} />
          </div>
          <div className="relative z-10">
            <p className="text-white/40 text-[7px] font-black uppercase tracking-widest mb-1">AquaGrow · Data Policy</p>
            <h1 className="text-white text-xl font-black tracking-tight mb-2">Privacy Policy</h1>
            <p className="text-white/30 text-[9px] font-medium leading-relaxed max-w-[260px]">
              We are committed to protecting your farm data, ensuring transparency, and giving you full control over your personal information.
            </p>
            <div className="flex items-center gap-4 mt-5 pt-4 border-t border-white/5">
              {[
                { label: 'Last Updated', value: 'April 2026' },
                { label: 'Version', value: '2.0' },
                { label: 'Jurisdiction', value: 'India (DPDP)' },
              ].map((s, i) => (
                <div key={i}>
                  <p className="text-white/20 text-[6px] font-black uppercase tracking-widest">{s.label}</p>
                  <p className="text-white/70 text-[9px] font-black">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Commitment chips */}
        <div className="flex gap-2 flex-wrap">
          {[
            { icon: Lock, label: 'No Data Selling' },
            { icon: Shield, label: 'End-to-End Encrypted' },
            { icon: Trash2, label: 'Right to Delete' },
          ].map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.05 }}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[8px] font-black uppercase tracking-widest',
                isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              )}
            >
              <c.icon size={10} />
              {c.label}
            </motion.div>
          ))}
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {SECTIONS.map((section, i) => (
            <React.Fragment key={i}>
              <SectionCard section={section} isDark={isDark} index={i} />
            </React.Fragment>
          ))}
        </div>

        {/* Contact footer */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className={cn('rounded-[2rem] border p-5 text-center', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}
        >
          <p className={cn('text-[8px] font-black uppercase tracking-widest mb-1', isDark ? 'text-white/20' : 'text-slate-400')}>
            Questions or Concerns?
          </p>
          <p className={cn('text-[11px] font-black', isDark ? 'text-white' : 'text-slate-900')}>
            privacy@aquagrow.in
          </p>
          <p className={cn('text-[8px] font-medium mt-1', isDark ? 'text-white/30' : 'text-slate-500')}>
            Data Protection Officer · AquaGrow Technologies Pvt. Ltd.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 flex items-center gap-1.5 mx-auto text-[8px] font-black uppercase tracking-widest text-emerald-500"
          >
            <ChevronRight size={12} className="rotate-180" /> Back to Security Settings
          </button>
        </motion.div>
      </div>
    </div>
  );
};
