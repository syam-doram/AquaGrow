import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, Users, Send, Hash, TrendingUp,
  Pill, Utensils, Droplets, Wind,
  ThumbsUp, Heart, Search,
  X, Pin,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';

// ─── CHANNEL CONFIG ────────────────────────────────────────────────────────────
const CHANNELS = [
  { id: 'general',  label: 'General',      icon: Hash,       color: '#10B981', emoji: '💬' },
  { id: 'market',   label: 'Market Rates', icon: TrendingUp, color: '#F59E0B', emoji: '📈' },
  { id: 'medicine', label: 'Medicine',     icon: Pill,       color: '#8B5CF6', emoji: '💊' },
  { id: 'feed',     label: 'Feed & SOP',   icon: Utensils,   color: '#EF4444', emoji: '🌾' },
  { id: 'water',    label: 'Water Quality',icon: Droplets,   color: '#0EA5E9', emoji: '💧' },
  { id: 'aerator',  label: 'Aerators',     icon: Wind,       color: '#06B6D4', emoji: '🌀' },
] as const;
type ChannelId = typeof CHANNELS[number]['id'];

// ─── SEEDED REALISTIC DEMO MESSAGES ───────────────────────────────────────────
const DEMO_MESSAGES: Record<ChannelId, Array<{
  id: string; author: string; loc: string; text: string; time: string;
  likes: number; hearts: number; isPinned?: boolean;
}>> = {
  general: [
    { id: 'g1', author: 'Ravi Kumar', loc: 'Nellore', text: 'Andaru ela unnaru? Meeru DOC ela manage chestunnaru? 👋', time: '2h', likes: 4, hearts: 2 },
    { id: 'g2', author: 'Suresh Reddy', loc: 'Vijayawada', text: 'Nenu DOC 35 lo unna. Water quality chala kashtanga undi. Salinity crash aindi. Eppudu idi recover avutundo? 😔', time: '1h 45m', likes: 2, hearts: 5 },
    { id: 'g3', author: 'Lakshmi Naidu', loc: 'Bhimavaram', text: 'Mineral mix apply cheyyandi. Zeolite 50 kg/acre evening lo. Rendu rojula lo recover avutundi. 👍', time: '1h 30m', likes: 9, hearts: 3 },
    { id: 'g4', author: 'Ramesh Varma', loc: 'Kakinada', text: 'Nenu annual harvest plan chesukunnanu. This year FCR 1.4 vasindi. Chala happy 🎉', time: '45m', likes: 12, hearts: 8, isPinned: true },
    { id: 'g5', author: 'Srinivas Rao', loc: 'Bapatla', text: 'Congratulations Ramesh bhai! Meeru ela manage chesaru? Feed brand enti?', time: '30m', likes: 3, hearts: 1 },
    { id: 'g6', author: 'Ramesh Varma', loc: 'Kakinada', text: 'CP Prima use chestunnanu. Tray la 3-4% residue maintain chesanu. DOC 50 nunchi biomass sampling every week chesanu.', time: '28m', likes: 7, hearts: 4 },
    { id: 'g7', author: 'Nagarjuna Goud', loc: 'Guntur', text: 'Enni acres meeru farm chestunnaru? Maa farm 5 acres undi. Oka season lo 8 tons target pettukunnamu.', time: '10m', likes: 2, hearts: 0 },
  ],
  market: [
    { id: 'm1', author: 'Prasad Yadav', loc: 'Nellore', text: '🔴 Nellore market today: 40 count — ₹220/kg. 50 count — ₹190/kg. 60 count — ₹165/kg. Market down ga undi.', time: '3h', likes: 18, hearts: 5, isPinned: true },
    { id: 'm2', author: 'Venkat Rao', loc: 'Vijayawada', text: 'Vijayawada centre: 50 count ₹195 vasindi. Export demand pickup avutundi ani agents cheptunnaru. Next week improve avutundo?', time: '2h 30m', likes: 11, hearts: 2 },
    { id: 'm3', author: 'Balu Reddy', loc: 'Bhimavaram', text: 'Bhimavaram APMC: 40 count ₹225 ki settle aindi. Export buyers direct ga vacharu. Good sign! 📊', time: '2h', likes: 15, hearts: 7 },
    { id: 'm4', author: 'Krishna Murthy', loc: 'Amalapuram', text: 'Mana shrimp quality chala important. Residue testing cheyyandi. Export market lo certification demand penchindi.', time: '1h', likes: 8, hearts: 3 },
    { id: 'm5', author: 'Chandu Verma', loc: 'Gudivada', text: 'Bangalore market lo 50 count ₹210 ki pampinchamu. Transport ₹15/kg poyindi. Net ₹195 vasindi. 🚚', time: '40m', likes: 6, hearts: 2 },
    { id: 'm6', author: 'Satyam Naik', loc: 'Tadepalligudem', text: 'Local market vs export market — mee experience share cheyyandi. Ela decide chestaru?', time: '15m', likes: 4, hearts: 1 },
  ],
  medicine: [
    { id: 'med1', author: 'Dr. Suresh Kiran', loc: 'Nellore Vet', text: '⚕️ DOC 25 lo mandatory immunity booster reminder: Beta-glucan + Vitamin C combo today give cheyyandi. WSSV window start avutundi.', time: '4h', likes: 24, hearts: 9, isPinned: true },
    { id: 'med2', author: 'Govind Sharma', loc: 'Bapatla', text: 'Gut probiotic enta dose use chestunnaru? Nenu 5g/kg feed use chestunaanu. Correct aa?', time: '3h', likes: 6, hearts: 2 },
    { id: 'med3', author: 'Padma Rana', loc: 'Krishna Dist', text: 'Yes! 5g/kg correct. Water probiotic separate ga 250g/acre every 5 days use cheyyandi. Water colour maintain avutundi.', time: '2h 45m', likes: 14, hearts: 6 },
    { id: 'med4', author: 'Anil Pasupati', loc: 'Guntur', text: 'Maa pond lo DOC 35 lo shrimp tails redness vasindi. Emi cheyyali? Vibriosis ani doubt ga undi. 😰', time: '1h 30m', likes: 3, hearts: 5 },
    { id: 'med5', author: 'Dr. Suresh Kiran', loc: 'Nellore Vet', text: '@Anil - Turant feed 30% teeyandi. Water exchange 15% ipping cheyyandi. Water probiotic (pathogen control) 400g/acre tonight. Probiotic + Vitamin C morning lo give cheyyandi. 2 rojula lo monitor cheyyandi.', time: '1h 20m', likes: 31, hearts: 15 },
    { id: 'med6', author: 'Anil Pasupati', loc: 'Guntur', text: 'Thank you Doctor garu! Follow chesamu. Improvement vasindi 🙏', time: '10m', likes: 8, hearts: 6 },
  ],
  feed: [
    { id: 'f1', author: 'Kishore Babu', loc: 'Nellore', text: 'Tray management tips share cheyyandi. Nenu 4 trays/acre use chestunnaanu. Feeding slots: 6AM, 9AM, 12PM, 3PM, 6PM, 9PM.', time: '5h', likes: 19, hearts: 7, isPinned: true },
    { id: 'f2', author: 'Jagan Reddy', loc: 'Ongole', text: '20% residue tray lo untే emi cheyyali?', time: '4h', likes: 5, hearts: 2 },
    { id: 'f3', author: 'Kishore Babu', loc: 'Nellore', text: 'Next feeding slot skip cheyyandi. DO check cheyyandi. 4 mg/L kinda unte aerators full run cheyyandi. Overfeeding biggest loss.', time: '3h 45m', likes: 22, hearts: 11 },
    { id: 'f4', author: 'Sirisha Devi', loc: 'West Godavari', text: 'CP Prima vs Growel — meeru eentoni better ani cheptunnaru? Price difference chala undi. 🤔', time: '2h', likes: 9, hearts: 3 },
    { id: 'f5', author: 'Hari Narayana', loc: 'Rajahmundry', text: 'CP Prima quality better. Pellet size uniform. Water stability chala good. Slightly expensive kani FCR improve avutundi. Worth it.', time: '1h 30m', likes: 17, hearts: 5 },
    { id: 'f6', author: 'Manohar Lal', loc: 'Srikakulam', text: 'Amavasya/Pournami nights lo feed teeyatam mandatory ani nenu feel avutunnanu. Meeru emi chestunnaru?', time: '45m', likes: 8, hearts: 4 },
    { id: 'f7', author: 'Kishore Babu', loc: 'Nellore', text: '100% correct! Lunar nights lo 25-30% feed reduce cheyyandi + maximum aeration. Molting time shrimp digest cheyyadam taggutundi.', time: '30m', likes: 13, hearts: 8 },
  ],
  water: [
    { id: 'w1', author: 'Madhavi Reddy', loc: 'Krishna Dist', text: '📊 Daily morning readings track cheyyatam mandatory — DO min 5 mg/L. pH 7.8-8.2. Ammonia 0.05 below. Intraday variations chudandi.', time: '6h', likes: 28, hearts: 12, isPinned: true },
    { id: 'w2', author: 'Chandra Sekhar', loc: 'Bhimavaram', text: 'Maa pond lo ammonia 0.12 vasindi. Emi cheyyali? Shrimp stress ga unnayye 😟', time: '4h', likes: 4, hearts: 6 },
    { id: 'w3', author: 'Madhavi Reddy', loc: 'Krishna Dist', text: '@Chandra - Zeolite 60 kg/acre immediately apply cheyyandi. Feed 30% teeyandi. Partial water exchange (20%) afternoon cheyyandi. Probiotic evening lo add cheyyandi.', time: '3h 45m', likes: 19, hearts: 8 },
    { id: 'w4', author: 'Ranga Rao', loc: 'Palakol', text: 'Salinity sudden ga drop aindi rain valla. 8 ppt ki vasindi. Mineral mix enta dose?', time: '2h', likes: 7, hearts: 3 },
    { id: 'w5', author: 'Annapurna Devi', loc: 'Eluru', text: 'Light rain: 15 kg mineral mix/acre immediately. Heavy rain: 20-25 kg. 2-3 days lo stabilize avutundi. Feed teeyandi ammavaram lo.', time: '1h 45m', likes: 16, hearts: 7 },
    { id: 'w6', author: 'Naresh Kumar', loc: 'Narsapur', text: 'DO afternoon lo chala taggipotundi (3.5 to 4.0). Night aerators full run cheystunaanu. Normal aa?', time: '30m', likes: 5, hearts: 2 },
    { id: 'w7', author: 'Madhavi Reddy', loc: 'Krishna Dist', text: 'Afternoon DO drop normal — photosynthesis peak time. But 3.5 low. Add 1 more aerator afternoon only. Morning 6AM and 6PM mandatory check.', time: '15m', likes: 11, hearts: 4 },
  ],
  aerator: [
    { id: 'a1', author: 'Venkatesh Babu', loc: 'Guntur', text: '⚡ Stage 2 aerator update (DOC 21-40): Base 4 aerators/acre. Increase 25%. My 5 acre pond = 25 aerators minimum. 1HP each at poles + 2HP center.', time: '8h', likes: 22, hearts: 9, isPinned: true },
    { id: 'a2', author: 'Pavan Kumar', loc: 'Tenali', text: 'Chinese aerators vs Indian brands — meeru eentoni long-lasting ani experience undi?', time: '5h', likes: 11, hearts: 3 },
    { id: 'a3', author: 'Venkatesh Babu', loc: 'Guntur', text: 'Indian brands (Kirloskar, etc.) motor quality better. Chinese paddlewheel design good but maintenance problem. Mix recommend chestanu — Indian motor + Chinese paddle.', time: '4h 30m', likes: 18, hearts: 7 },
    { id: 'a4', author: 'Sudhakar Rao', loc: 'Repalle', text: 'Power consumption enta unnaadu? Generator vs EB connection comparison share cheyyandi.', time: '3h', likes: 8, hearts: 2 },
    { id: 'a5', author: 'Rajendra Prasad', loc: 'Narasaraopet', text: 'EB direct best. Generator diesel cost = ₹8/unit approx. EB cost = ₹4-5/unit (agriculture tariff). Night 8PM-6AM lo EB load shedding risk manage cheyyali.', time: '2h', likes: 14, hearts: 5 },
    { id: 'a6', author: 'Mahesh Nair', loc: 'Chirala', text: 'Solar aerator feasible aa? Initial cost chala undi kaabeetti long term savings cheyyadama?', time: '1h', likes: 9, hearts: 4 },
    { id: 'a7', author: 'Venkatesh Babu', loc: 'Guntur', text: 'Solar viable only for < 2HP per unit. Larger ponds need grid. Hybrid system (solar + EB backup) best for small farmers. ₹3-4L setup, 5yr payback.', time: '20m', likes: 16, hearts: 6 },
  ],
};

// ─── AVATAR COLORS ────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  '#10B981','#3B82F6','#8B5CF6','#EF4444','#F59E0B',
  '#EC4899','#06B6D4','#84CC16','#F97316','#6366F1',
];
const getAvatarColor = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export const FarmerCommunity = () => {
  const navigate = useNavigate();
  const { user, theme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  const [activeChannel, setActiveChannel] = useState<ChannelId>('general');
  const [messages, setMessages] = useState(DEMO_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showChannelDrawer, setShowChannelDrawer] = useState(false);
  const [likedMessages, setLikedMessages] = useState<Set<string>>(new Set());
  const [sendingId, setSendingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentChannel = CHANNELS.find(c => c.id === activeChannel)!;
  const currentMessages = messages[activeChannel] || [];

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChannel, currentMessages.length]);

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return currentMessages;
    return currentMessages.filter(m =>
      m.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.author.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [currentMessages, searchQuery]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || !user) return;
    const id = Date.now().toString();
    setSendingId(id);
    const newMsg = {
      id, text,
      author: user.name || 'Farmer',
      loc: (user as any).location || 'My Farm',
      time: 'now',
      likes: 0, hearts: 0,
    };
    setMessages(prev => ({
      ...prev,
      [activeChannel]: [...prev[activeChannel], newMsg],
    }));
    setInputText('');
    setTimeout(() => setSendingId(null), 800);
  };

  const toggleLike = (msgId: string) => {
    setLikedMessages(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
    setMessages(prev => ({
      ...prev,
      [activeChannel]: prev[activeChannel].map(m =>
        m.id === msgId
          ? { ...m, likes: likedMessages.has(msgId) ? m.likes - 1 : m.likes + 1 }
          : m
      ),
    }));
  };

  const totalOnline = 847 + Math.floor(Math.random() * 50);

  return (
    <div className={cn('flex flex-col h-[100dvh] font-sans relative overflow-hidden transition-colors duration-500',
      isDark ? 'bg-[#060A10]' : 'bg-[#F0F4FF]')}>

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className={cn('absolute -top-20 -right-20 w-80 h-80 rounded-full blur-[160px]',
          isDark ? 'bg-emerald-600/10' : 'bg-emerald-400/12')} />
        <div className={cn('absolute bottom-20 -left-20 w-64 h-64 rounded-full blur-[140px]',
          isDark ? 'bg-indigo-500/8' : 'bg-blue-400/8')} />
      </div>

      {/* ─── HEADER ─── */}
      <header className={cn(
        'flex-shrink-0 px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-3 z-30 relative',
        'border-b backdrop-blur-xl',
        isDark ? 'bg-[#060A10]/90 border-white/5' : 'bg-white/95 border-slate-100 shadow-sm'
      )}>
        <div className="flex items-center justify-between">
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate('/dashboard')}
            className={cn('w-9 h-9 rounded-xl flex items-center justify-center border',
              isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-white border-slate-200 text-slate-500 shadow-sm')}>
            <ChevronLeft size={16} />
          </motion.button>

          <div className="text-center">
            <h1 className={cn('text-[11px] font-black tracking-widest uppercase flex items-center gap-1.5 justify-center',
              isDark ? 'text-white' : 'text-slate-900')}>
              <Users size={11} className="text-emerald-500" />
              Farmer Community
            </h1>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className={cn('text-[7.5px] font-black uppercase tracking-[0.2em]',
                isDark ? 'text-emerald-400/70' : 'text-emerald-600')}>
                {totalOnline.toLocaleString()} farmers online
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <motion.button whileTap={{ scale: 0.88 }}
              onClick={() => { setShowSearch(s => !s); if (showSearch) setSearchQuery(''); }}
              className={cn('w-9 h-9 rounded-xl flex items-center justify-center border',
                showSearch
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-white border-slate-200 text-slate-500 shadow-sm')}>
              {showSearch ? <X size={14} /> : <Search size={14} />}
            </motion.button>
          </div>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-2">
              <input
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search messages or farmers..."
                className={cn('w-full px-3 py-2 rounded-xl border text-[9px] font-medium outline-none transition-all',
                  isDark
                    ? 'bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-emerald-500/40'
                    : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-emerald-400')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ─── CHANNEL PILL TABS ─── */}
      <div className={cn('flex-shrink-0 border-b z-20 relative',
        isDark ? 'bg-[#060A10]/80 border-white/5' : 'bg-white/90 border-slate-100')}>
        <div className="flex gap-1.5 overflow-x-auto px-4 py-2.5 no-scrollbar">
          {CHANNELS.map(ch => {
            const isActive = activeChannel === ch.id;
            return (
              <motion.button key={ch.id} whileTap={{ scale: 0.95 }}
                onClick={() => { setActiveChannel(ch.id as ChannelId); setSearchQuery(''); setShowSearch(false); }}
                className={cn(
                  'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-[8px] font-black uppercase tracking-widest transition-all duration-200',
                  isActive
                    ? 'text-white shadow-lg'
                    : isDark ? 'bg-white/5 text-white/40 border-white/8 hover:text-white/70' : 'bg-white text-slate-500 border-slate-100 shadow-sm hover:text-slate-800'
                )}
                style={isActive ? { background: ch.color, borderColor: ch.color, boxShadow: `0 4px 16px ${ch.color}40` } : {}}>
                <span>{ch.emoji}</span>
                {ch.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ─── CHANNEL HEADER STRIP ─── */}
      <div className={cn('flex-shrink-0 flex items-center gap-3 px-4 py-2.5 border-b z-20 relative',
        isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50/80 border-slate-100')}>
        <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm"
          style={{ background: `${currentChannel.color}20` }}>
          {currentChannel.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/70' : 'text-slate-800')}>
            #{currentChannel.label}
          </p>
          <p className={cn('text-[7px] font-medium', isDark ? 'text-white/25' : 'text-slate-400')}>
            {currentMessages.length} messages · discuss freely
          </p>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-xl"
          style={{ background: `${currentChannel.color}15` }}>
          <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: currentChannel.color }} />
          <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: currentChannel.color }}>
            Live
          </span>
        </div>
      </div>

      {/* ─── MESSAGES ─── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 relative z-10">
        {/* Pinned message */}
        {(() => {
          const pinned = filteredMessages.find(m => m.isPinned);
          if (!pinned) return null;
          return (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className={cn('rounded-2xl border px-3 py-2.5 flex items-center gap-2.5 mb-3',
                isDark ? 'bg-amber-500/8 border-amber-500/20' : 'bg-amber-50 border-amber-200')}>
              <Pin size={11} className="text-amber-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-amber-400/60' : 'text-amber-600')}>
                  Pinned · {pinned.author}
                </p>
                <p className={cn('text-[8.5px] font-medium leading-snug truncate', isDark ? 'text-white/60' : 'text-slate-600')}>
                  {pinned.text}
                </p>
              </div>
            </motion.div>
          );
        })()}

        <AnimatePresence>
          {filteredMessages.map((msg, i) => {
            const isMe = msg.author === (user?.name || 'Farmer') && msg.time === 'now';
            const avatarColor = getAvatarColor(msg.author);
            const initials = msg.author.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
            const isLiked = likedMessages.has(msg.id);
            const isSending = sendingId === msg.id;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i < 4 ? i * 0.03 : 0 }}
                className={cn('flex gap-2.5', isMe ? 'flex-row-reverse' : 'flex-row')}
              >
                {/* Avatar */}
                {!isMe && (
                  <div className="w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1 text-[9px] font-black text-white shadow-sm"
                    style={{ background: avatarColor }}>
                    {initials}
                  </div>
                )}

                <div className={cn('max-w-[82%] space-y-1', isMe ? 'items-end' : 'items-start')}>
                  {/* Author + time */}
                  {!isMe && (
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[8px] font-black" style={{ color: avatarColor }}>{msg.author}</span>
                      <span className={cn('text-[6.5px] font-medium', isDark ? 'text-white/20' : 'text-slate-400')}>
                        📍 {msg.loc}
                      </span>
                      <span className={cn('text-[6.5px]', isDark ? 'text-white/15' : 'text-slate-300')}>· {msg.time}</span>
                    </div>
                  )}

                  {/* Bubble */}
                  <div className={cn(
                    'rounded-2xl px-3.5 py-2.5 shadow-sm relative',
                    msg.isPinned && !isMe ? 'ring-1' : '',
                    isMe
                      ? 'bg-emerald-500 text-white rounded-tr-sm'
                      : isDark
                        ? 'bg-white/[0.07] border border-white/8 rounded-tl-sm'
                        : 'bg-white border border-slate-100 rounded-tl-sm'
                  )}
                    style={msg.isPinned && !isMe ? { ringColor: currentChannel.color } : {}}
                  >
                    <p className={cn('text-[9px] font-medium leading-relaxed',
                      isMe ? 'text-white' : isDark ? 'text-white/80' : 'text-slate-700')}>
                      {msg.text}
                    </p>

                    {isSending && (
                      <div className="flex items-center gap-1 mt-1">
                        {[0, 0.15, 0.3].map((delay, i) => (
                          <motion.div key={i} className="w-1 h-1 rounded-full bg-white/60"
                            animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                            transition={{ repeat: Infinity, duration: 0.8, delay }} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reactions */}
                  {!isMe && (msg.likes > 0 || msg.hearts > 0) && (
                    <div className="flex items-center gap-1.5 px-1">
                      {msg.likes > 0 && (
                        <motion.button whileTap={{ scale: 0.85 }}
                          onClick={() => toggleLike(msg.id)}
                          className={cn(
                            'flex items-center gap-1 px-2 py-0.5 rounded-full border text-[7px] font-black transition-all',
                            isLiked
                              ? 'bg-blue-500/15 border-blue-500/30 text-blue-500'
                              : isDark ? 'bg-white/5 border-white/8 text-white/30' : 'bg-slate-50 border-slate-100 text-slate-400'
                          )}>
                          <ThumbsUp size={8} className={isLiked ? 'fill-current' : ''} />
                          {msg.likes + (isLiked && !likedMessages.has(msg.id) ? 1 : 0)}
                        </motion.button>
                      )}
                      {msg.hearts > 0 && (
                        <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full border text-[7px] font-black',
                          isDark ? 'bg-white/5 border-white/8 text-white/30' : 'bg-slate-50 border-slate-100 text-slate-400')}>
                          <Heart size={8} />
                          {msg.hearts}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredMessages.length === 0 && searchQuery && (
          <div className="flex flex-col items-center justify-center py-12">
            <Search size={28} className={isDark ? 'text-white/15' : 'text-slate-300'} />
            <p className={cn('text-[10px] font-black mt-3', isDark ? 'text-white/30' : 'text-slate-400')}>
              No results for "{searchQuery}"
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── INPUT BAR ─── */}
      <div className={cn(
        'flex-shrink-0 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 border-t z-30 relative',
        isDark ? 'bg-[#060A10]/95 border-white/5 backdrop-blur-xl' : 'bg-white/98 border-slate-100 backdrop-blur-xl shadow-sm'
      )}>
        <div className={cn('flex items-end gap-2 rounded-[1.6rem] border px-3 py-2',
          isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200')}>

          {/* Channel emoji */}
          <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
            style={{ background: `${currentChannel.color}20` }}>
            {currentChannel.emoji}
          </div>

          <input
            ref={inputRef}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={`Message #${currentChannel.label}...`}
            className={cn(
              'flex-1 bg-transparent text-[9.5px] font-medium outline-none resize-none leading-relaxed py-1',
              isDark ? 'text-white placeholder:text-white/20' : 'text-slate-800 placeholder:text-slate-400'
            )}
          />

          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleSend}
            disabled={!inputText.trim()}
            className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
              inputText.trim()
                ? 'text-white shadow-lg'
                : isDark ? 'bg-white/5 text-white/15' : 'bg-slate-100 text-slate-300'
            )}
            style={inputText.trim() ? { background: currentChannel.color, boxShadow: `0 4px 12px ${currentChannel.color}40` } : {}}>
            <Send size={13} />
          </motion.button>
        </div>

        {/* Community disclaimer */}
        <p className={cn('text-center text-[6.5px] font-black uppercase tracking-widest mt-2',
          isDark ? 'text-white/10' : 'text-slate-300')}>
          🤝 Community discussion · Be respectful · No misleading advice
        </p>
      </div>
    </div>
  );
};
