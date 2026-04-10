import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Send, Phone, MoreVertical, Circle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';

interface Message { id: string; from: 'me' | 'them'; text: string; time: string; read: boolean; }

const INITIAL_THREADS = [
  {
    id: 'c1', farmer: 'Ravi Kumar', location: 'Nellore', phone: '9876543210', online: true,
    messages: [
      { id: 'm1', from: 'them' as const, text: 'Hello sir, vannamei seed available?',       time: '9:10 AM', read: true },
      { id: 'm2', from: 'me'   as const, text: 'Yes, SPF L1 available. PL12 quality.',      time: '9:12 AM', read: true },
      { id: 'm3', from: 'them' as const, text: 'Rate kya hai abhi?',                         time: '9:14 AM', read: true },
      { id: 'm4', from: 'me'   as const, text: '₹0.45/PL. 50k minimum order.',              time: '9:15 AM', read: true },
      { id: 'm5', from: 'them' as const, text: 'When will the seed arrive after order?',    time: '9:40 AM', read: false },
      { id: 'm6', from: 'them' as const, text: 'Please confirm delivery time sir.',         time: '9:41 AM', read: false },
    ],
  },
  {
    id: 'c2', farmer: 'Suresh Rao', location: 'Bhimavaram', phone: '9845012345', online: false,
    messages: [
      { id: 'm1', from: 'me'   as const, text: 'Feed stock available. HiPro 40kg?',         time: 'Yesterday', read: true },
      { id: 'm2', from: 'them' as const, text: 'Yes please, need 10 bags',                  time: 'Yesterday', read: true },
      { id: 'm3', from: 'me'   as const, text: 'Confirmed. Total ₹8500. Shipping tomorrow.', time: 'Yesterday', read: true },
      { id: 'm4', from: 'them' as const, text: 'Feed quality is excellent 👍',              time: '1 hr ago',  read: false },
    ],
  },
  {
    id: 'c3', farmer: 'Lakshmi Devi', location: 'Kakinada', phone: '9912344567', online: true,
    messages: [
      { id: 'm1', from: 'them' as const, text: 'Can you post today\'s medicine rates?',     time: '2 hr ago',  read: false },
    ],
  },
];

const QUICK_REPLIES = [
  'Noted, will update shortly.',
  '₹0.45/PL today. Delivery 2 days.',
  'Stock available. Place order.',
  'Our team will contact you soon.',
  'Quality is guaranteed SPF certified.',
];

export const ProviderChat = ({ t }: { t: any }) => {
  const navigate = useNavigate();
  const { theme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  const [threads, setThreads] = useState(INITIAL_THREADS);
  const [active, setActive]   = useState<string | null>(null);
  const [input, setInput]     = useState('');
  const [showQuick, setShowQuick] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const thread = threads.find(t => t.id === active);
  const unreadTotal = threads.reduce((a, t) => a + t.messages.filter(m => !m.read && m.from === 'them').length, 0);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [active, thread?.messages.length]);

  const sendMsg = (text?: string) => {
    const msg = text || input.trim();
    if (!msg || !active) return;
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    setThreads(prev => prev.map(t => t.id === active
      ? { ...t, messages: [...t.messages, { id: Date.now().toString(), from: 'me', text: msg, time: now, read: true }] }
      : t));
    setInput('');
    setShowQuick(false);
  };

  const markRead = (threadId: string) => {
    setThreads(prev => prev.map(t => t.id === threadId
      ? { ...t, messages: t.messages.map(m => ({ ...m, read: true })) }
      : t));
  };

  const openThread = (id: string) => { setActive(id); markRead(id); };
  const closeThread = () => setActive(null);

  // ── Thread List ──
  if (!active) return (
    <div className={cn('min-h-screen pb-40', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>
      <div className={cn('fixed top-0 left-0 right-0 z-40 pt-12 pb-3 px-4 max-w-[420px] mx-auto',
        isDark ? 'bg-[#070D12]/95 backdrop-blur-xl' : 'bg-[#F0F4F8]/95 backdrop-blur-xl')}>
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/provider/dashboard')}
            className={cn('w-9 h-9 rounded-xl flex items-center justify-center', isDark ? 'bg-white/8 text-white/60' : 'bg-white text-slate-500 shadow-sm')}>
            <ArrowLeft size={16} />
          </button>
          <div className="text-center">
            <p className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>Messages</p>
            {unreadTotal > 0 && <p className="text-[7px] font-black text-red-500">{unreadTotal} unread</p>}
          </div>
          <div className="w-9" />
        </div>
      </div>

      <div className="pt-20 px-4 max-w-[420px] mx-auto space-y-2.5 py-4">
        {threads.map((th, i) => {
          const unread = th.messages.filter(m => !m.read && m.from === 'them').length;
          const last   = th.messages[th.messages.length - 1];
          return (
            <motion.button key={th.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openThread(th.id)}
              className={cn('w-full text-left rounded-[1.8rem] border p-4 flex items-center gap-3 transition-all',
                isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-100 shadow-sm',
                unread > 0 ? isDark ? 'border-indigo-500/20' : 'border-indigo-200' : '')}>
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-base font-black">
                  {th.farmer[0]}
                </div>
                {th.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className={cn('text-[11px] font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>{th.farmer}</p>
                  <p className={cn('text-[7.5px] font-bold', isDark ? 'text-white/25' : 'text-slate-400')}>{last.time}</p>
                </div>
                <p className={cn('text-[8.5px] font-medium truncate', isDark ? 'text-white/35' : 'text-slate-500',
                  unread > 0 ? isDark ? '!text-white/70 !font-black' : '!text-slate-700 !font-bold' : '')}>
                  {last.from === 'me' ? '✓ ' : ''}{last.text}
                </p>
                <p className={cn('text-[7px] font-medium', isDark ? 'text-white/20' : 'text-slate-300')}>{th.location}</p>
              </div>
              {unread > 0 && (
                <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[7px] font-black text-white flex-shrink-0">
                  {unread}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );

  // ── Active Chat View ──
  return (
    <div className={cn('min-h-screen flex flex-col', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>
      {/* Chat header */}
      <div className={cn('fixed top-0 left-0 right-0 z-40 pt-10 pb-3 px-4 max-w-[420px] mx-auto border-b',
        isDark ? 'bg-[#070D12]/95 backdrop-blur-xl border-white/5' : 'bg-white/95 backdrop-blur-xl border-slate-100')}>
        <div className="flex items-center gap-3">
          <button onClick={closeThread}
            className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', isDark ? 'bg-white/8 text-white/60' : 'bg-slate-100 text-slate-500')}>
            <ArrowLeft size={16} />
          </button>
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-black text-base">
              {thread?.farmer[0]}
            </div>
            {thread?.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn('text-[11px] font-black', isDark ? 'text-white' : 'text-slate-900')}>{thread?.farmer}</p>
            <p className={cn('text-[8px]', isDark ? 'text-white/30' : 'text-slate-400')}>
              {thread?.online ? '🟢 Online' : thread?.location}
            </p>
          </div>
          <a href={`tel:${thread?.phone}`}
            className={cn('w-9 h-9 rounded-xl flex items-center justify-center', isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600')}>
            <Phone size={15} />
          </a>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pt-28 pb-36 px-4 max-w-[420px] mx-auto w-full space-y-2">
        {thread?.messages.map((msg, i) => (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className={cn('flex', msg.from === 'me' ? 'justify-end' : 'justify-start')}>
            <div className={cn('max-w-[78%] rounded-[1.3rem] px-3.5 py-2.5 shadow-sm',
              msg.from === 'me'
                ? 'bg-indigo-500 text-white rounded-br-none'
                : isDark ? 'bg-white/8 text-white rounded-bl-none' : 'bg-white text-slate-800 rounded-bl-none shadow-md')}>
              <p className="text-[11px] font-medium leading-relaxed">{msg.text}</p>
              <p className={cn('text-[6.5px] font-black mt-1', msg.from === 'me' ? 'text-white/50 text-right' : isDark ? 'text-white/25' : 'text-slate-400')}>
                {msg.time}
              </p>
            </div>
          </motion.div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Quick replies */}
      <AnimatePresence>
        {showQuick && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className={cn('fixed bottom-20 left-0 right-0 px-4 pb-2 max-w-[420px] mx-auto', isDark ? 'bg-[#070D12]/95' : 'bg-[#F0F4F8]/95')}>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {QUICK_REPLIES.map((r, i) => (
                <button key={i} onClick={() => sendMsg(r)}
                  className={cn('px-3 py-2 rounded-2xl text-[8px] font-black whitespace-nowrap flex-shrink-0 border',
                    isDark ? 'bg-indigo-500/12 border-indigo-500/20 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700')}>
                  {r}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className={cn('fixed bottom-0 left-0 right-0 px-4 pt-3 pb-6 max-w-[420px] mx-auto border-t',
        isDark ? 'bg-[#070D12]/95 backdrop-blur-xl border-white/5' : 'bg-white/95 backdrop-blur-xl border-slate-100')}>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowQuick(q => !q)}
            className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
              showQuick
                ? isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
                : isDark ? 'bg-white/8 text-white/40' : 'bg-slate-100 text-slate-400')}>
            <Circle size={14} />
          </button>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMsg()}
            placeholder="Type a message…"
            className={cn('flex-1 rounded-2xl px-4 py-2.5 text-[12px] font-medium outline-none border',
              isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-300')} />
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => sendMsg()}
            disabled={!input.trim()}
            className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
              input.trim() ? 'bg-indigo-500 text-white shadow-lg' : isDark ? 'bg-white/5 text-white/20' : 'bg-slate-100 text-slate-300')}>
            <Send size={14} />
          </motion.button>
        </div>
      </div>
    </div>
  );
};
