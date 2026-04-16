import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, Users, Send, Hash, TrendingUp,
  Pill, Utensils, Droplets, Wind,
  ThumbsUp, Search, X, Pin, Loader2, AlertCircle,
} from 'lucide-react';
import {
  collection, addDoc, query, orderBy, limit,
  onSnapshot, serverTimestamp, updateDoc, doc,
  increment, Timestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';

// ─── CHANNEL CONFIG ────────────────────────────────────────────────────────────
const CHANNELS = [
  { id: 'general',  label: 'General',       icon: Hash,       color: '#10B981', emoji: '💬' },
  { id: 'market',   label: 'Market Rates',  icon: TrendingUp, color: '#F59E0B', emoji: '📈' },
  { id: 'medicine', label: 'Medicine',      icon: Pill,       color: '#8B5CF6', emoji: '💊' },
  { id: 'feed',     label: 'Feed & SOP',    icon: Utensils,   color: '#EF4444', emoji: '🌾' },
  { id: 'water',    label: 'Water Quality', icon: Droplets,   color: '#0EA5E9', emoji: '💧' },
  { id: 'aerator',  label: 'Aerators',      icon: Wind,       color: '#06B6D4', emoji: '🌀' },
] as const;
type ChannelId = typeof CHANNELS[number]['id'];

// ─── TYPES ─────────────────────────────────────────────────────────────────────
interface CommunityMessage {
  id: string;
  text: string;
  author: string;
  authorId: string;
  loc: string;
  likes: number;
  isPinned?: boolean;
  createdAt: Timestamp | null;
}

// ─── AVATAR COLORS ────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  '#10B981','#3B82F6','#8B5CF6','#EF4444','#F59E0B',
  '#EC4899','#06B6D4','#84CC16','#F97316','#6366F1',
];
const getAvatarColor = (name: string) =>
  AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const fmtTime = (ts: Timestamp | null): string => {
  if (!ts) return 'now';
  const d = ts.toDate();
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export const FarmerCommunity = () => {
  const navigate = useNavigate();
  const { user, theme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  const [activeChannel, setActiveChannel] = useState<ChannelId>('general');
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [likedMsgIds, setLikedMsgIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('community_liked') || '[]')); }
    catch { return new Set(); }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  const currentChannel = CHANNELS.find(c => c.id === activeChannel)!;

  // ─── Real-time Firestore listener ─────────────────────────────────────────
  useEffect(() => {
    // Unsubscribe previous channel listener
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    setIsLoading(true);
    setMessages([]);
    setError(null);

    try {
      const q = query(
        collection(db, 'community_messages', activeChannel, 'messages'),
        orderBy('createdAt', 'asc'),
        limit(80),
      );

      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const msgs: CommunityMessage[] = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
          } as CommunityMessage));
          setMessages(msgs);
          setIsLoading(false);
          setError(null);
        },
        (err: any) => {
          console.error('[Community] Firestore error code:', err?.code, err);
          if (err?.code === 'permission-denied' || err?.code === 'PERMISSION_DENIED') {
            setError('Chat not activated yet. Go to Firebase Console → Firestore → Rules and add the community_messages rule.');
          } else if (err?.code === 'unauthenticated') {
            setError('Login session expired. Please log out and log back in.');
          } else if (err?.code === 'unavailable') {
            setError('Firestore service is temporarily unavailable. Try again in a moment.');
          } else {
            setError(`Chat error (${err?.code || 'unknown'}). Check console for details.`);
          }
          setIsLoading(false);
        }
      );

      unsubRef.current = unsub;
    } catch (err) {
      setError('Failed to initialize chat. Please try again.');
      setIsLoading(false);
    }

    return () => { if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; } };
  }, [activeChannel]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [messages.length, isLoading]);

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(m =>
      m.text?.toLowerCase().includes(q) || m.author?.toLowerCase().includes(q)
    );
  }, [messages, searchQuery]);

  // ─── Send Message ──────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setInputText('');

    try {
      await addDoc(
        collection(db, 'community_messages', activeChannel, 'messages'),
        {
          text,
          author: user?.name || 'Farmer',
          authorId: (user as any)?._id || (user as any)?.id || 'anon',
          loc: (user as any)?.location || 'My Farm',
          likes: 0,
          isPinned: false,
          createdAt: serverTimestamp(),
        }
      );
    } catch (err) {
      console.error('[Community] Send error:', err);
      setInputText(text);
      setError('Message not sent. Please try again.');
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // ─── Like / Unlike ─────────────────────────────────────────────────────────
  const toggleLike = async (msgId: string) => {
    const alreadyLiked = likedMsgIds.has(msgId);
    const next = new Set(likedMsgIds);
    alreadyLiked ? next.delete(msgId) : next.add(msgId);
    setLikedMsgIds(next);
    localStorage.setItem('community_liked', JSON.stringify([...next]));

    try {
      await updateDoc(
        doc(db, 'community_messages', activeChannel, 'messages', msgId),
        { likes: increment(alreadyLiked ? -1 : 1) }
      );
    } catch { /* optimistic — ignore */ }
  };

  const pinnedMsg = filteredMessages.find(m => m.isPinned);

  return (
    <div className={cn(
      'flex flex-col h-[100dvh] font-sans relative overflow-hidden overscroll-none transition-colors duration-500',
      isDark ? 'bg-[#060A10]' : 'bg-[#F0F4FF]'
    )}>
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className={cn('absolute -top-20 -right-20 w-80 h-80 rounded-full blur-[160px]', isDark ? 'bg-emerald-600/10' : 'bg-emerald-400/12')} />
        <div className={cn('absolute bottom-20 -left-20 w-64 h-64 rounded-full blur-[140px]', isDark ? 'bg-indigo-500/8' : 'bg-blue-400/8')} />
      </div>

      {/* ─── HEADER ─── */}
      <header className={cn(
        'flex-shrink-0 px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-3 z-30 relative border-b backdrop-blur-xl',
        isDark ? 'bg-[#060A10]/90 border-white/5' : 'bg-white/95 border-slate-100 shadow-sm'
      )}>
        <div className="flex items-center justify-between">
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => navigate('/dashboard')}
            className={cn('w-9 h-9 rounded-xl flex items-center justify-center border',
              isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-white border-slate-200 text-slate-500 shadow-sm')}>
            <ChevronLeft size={16} />
          </motion.button>

          <div className="text-center">
            <h1 className={cn('text-[11px] font-black tracking-widest uppercase flex items-center gap-1.5 justify-center', isDark ? 'text-white' : 'text-slate-900')}>
              <Users size={11} className="text-emerald-500" /> Farmer Community
            </h1>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className={cn('text-[7.5px] font-black uppercase tracking-[0.2em]', isDark ? 'text-emerald-400/70' : 'text-emerald-600')}>
                Live Chat · All Farmers
              </p>
            </div>
          </div>

          <motion.button whileTap={{ scale: 0.88 }}
            onClick={() => { setShowSearch(s => !s); if (showSearch) setSearchQuery(''); }}
            className={cn('w-9 h-9 rounded-xl flex items-center justify-center border',
              showSearch
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-white border-slate-200 text-slate-500 shadow-sm')}>
            {showSearch ? <X size={14} /> : <Search size={14} />}
          </motion.button>
        </div>

        <AnimatePresence>
          {showSearch && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-2">
              <input
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search messages or farmers..."
                className={cn('w-full px-3 py-2 rounded-xl border text-[9px] font-medium outline-none transition-all',
                  isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-emerald-500/40' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-emerald-400')} />
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ─── CHANNEL TABS ─── */}
      <div className={cn('flex-shrink-0 border-b z-20 relative', isDark ? 'bg-[#060A10]/80 border-white/5' : 'bg-white/90 border-slate-100')}>
        <div className="flex gap-1.5 overflow-x-auto px-4 py-2.5 no-scrollbar">
          {CHANNELS.map(ch => {
            const isActive = activeChannel === ch.id;
            return (
              <motion.button key={ch.id} whileTap={{ scale: 0.95 }}
                onClick={() => { setActiveChannel(ch.id as ChannelId); setSearchQuery(''); setShowSearch(false); }}
                className={cn(
                  'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-[8px] font-black uppercase tracking-widest transition-all duration-200',
                  isActive ? 'text-white shadow-lg' : isDark ? 'bg-white/5 text-white/40 border-white/8' : 'bg-white text-slate-500 border-slate-100 shadow-sm'
                )}
                style={isActive ? { background: ch.color, borderColor: ch.color, boxShadow: `0 4px 16px ${ch.color}40` } : {}}>
                <span>{ch.emoji}</span>{ch.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ─── CHANNEL INFO STRIP ─── */}
      <div className={cn('flex-shrink-0 flex items-center gap-3 px-4 py-2 border-b z-10 relative',
        isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50/80 border-slate-100')}>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-sm" style={{ background: `${currentChannel.color}20` }}>
          {currentChannel.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/70' : 'text-slate-800')}>#{currentChannel.label}</p>
          <p className={cn('text-[7px] font-medium', isDark ? 'text-white/25' : 'text-slate-400')}>{messages.length} messages · real-time</p>
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-xl" style={{ background: `${currentChannel.color}15` }}>
          <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: currentChannel.color }} />
          <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: currentChannel.color }}>Live</span>
        </div>
      </div>

      {/* ─── MESSAGES ─── */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-2 relative z-10">

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={cn('rounded-2xl border px-3 py-2.5 flex items-center gap-2.5 mb-2',
                isDark ? 'bg-red-500/8 border-red-500/20' : 'bg-red-50 border-red-200')}>
              <AlertCircle size={12} className="text-red-500 flex-shrink-0" />
              <p className={cn('text-[8px] font-medium flex-1', isDark ? 'text-red-400' : 'text-red-600')}>{error}</p>
              <button onClick={() => setError(null)} className="text-[7px] font-black text-red-400">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 size={24} className="text-emerald-500 animate-spin" />
            <p className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>
              Connecting to #{currentChannel.label}...
            </p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && messages.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <div className="text-4xl">{currentChannel.emoji}</div>
            <p className={cn('text-[11px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>No messages yet</p>
            <p className={cn('text-[8px] font-medium', isDark ? 'text-white/15' : 'text-slate-300')}>Start the conversation 👇</p>
          </div>
        )}

        {/* Pinned */}
        {pinnedMsg && !searchQuery && (
          <div className={cn('rounded-2xl border px-3 py-2 flex items-center gap-2 mb-2',
            isDark ? 'bg-amber-500/8 border-amber-500/20' : 'bg-amber-50 border-amber-200')}>
            <Pin size={10} className="text-amber-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className={cn('text-[6.5px] font-black uppercase tracking-widest', isDark ? 'text-amber-400/60' : 'text-amber-600')}>Pinned · {pinnedMsg.author}</p>
              <p className={cn('text-[8px] font-medium truncate', isDark ? 'text-white/60' : 'text-slate-600')}>{pinnedMsg.text}</p>
            </div>
          </div>
        )}

        {/* Message list */}
        {!isLoading && filteredMessages.map((msg) => {
          const isMe = msg.authorId === ((user as any)?._id || (user as any)?.id);
          const avatarColor = getAvatarColor(msg.author || '?');
          const initials = (msg.author || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
          const isLiked = likedMsgIds.has(msg.id);

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn('flex gap-2.5', isMe ? 'flex-row-reverse' : 'flex-row')}
            >
              {/* Avatar */}
              {!isMe && (
                <div className="w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1 text-[9px] font-black text-white shadow-sm"
                  style={{ background: avatarColor }}>
                  {initials}
                </div>
              )}

              <div className={cn('max-w-[82%] space-y-1', isMe ? 'items-end flex flex-col' : '')}>
                {/* Author row */}
                {!isMe && (
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[8px] font-black" style={{ color: avatarColor }}>{msg.author}</span>
                    {msg.loc && <span className={cn('text-[6.5px] font-medium', isDark ? 'text-white/20' : 'text-slate-400')}>📍 {msg.loc}</span>}
                    <span className={cn('text-[6px]', isDark ? 'text-white/15' : 'text-slate-300')}>· {fmtTime(msg.createdAt)}</span>
                  </div>
                )}

                {/* Bubble */}
                <div className={cn(
                  'rounded-2xl px-3.5 py-2.5 shadow-sm',
                  isMe
                    ? 'bg-emerald-500 text-white rounded-tr-sm'
                    : isDark ? 'bg-white/[0.07] border border-white/8 rounded-tl-sm' : 'bg-white border border-slate-100 rounded-tl-sm'
                )}>
                  <p className={cn('text-[9px] font-medium leading-relaxed',
                    isMe ? 'text-white' : isDark ? 'text-white/80' : 'text-slate-700')}>
                    {msg.text}
                  </p>
                  {isMe && (
                    <p className="text-[6px] text-white/50 text-right mt-0.5">{fmtTime(msg.createdAt)}</p>
                  )}
                </div>

                {/* Like reaction */}
                {!isMe && (
                  <motion.button whileTap={{ scale: 0.85 }}
                    onClick={() => toggleLike(msg.id)}
                    className={cn(
                      'flex items-center gap-1 px-2 py-0.5 rounded-full border text-[7px] font-black transition-all',
                      isLiked
                        ? 'bg-blue-500/15 border-blue-500/30 text-blue-500'
                        : isDark ? 'bg-white/5 border-white/8 text-white/25' : 'bg-slate-50 border-slate-100 text-slate-400'
                    )}>
                    <ThumbsUp size={8} className={isLiked ? 'fill-current' : ''} />
                    {(msg.likes || 0) > 0 ? msg.likes : ''}
                  </motion.button>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Search empty */}
        {!isLoading && filteredMessages.length === 0 && searchQuery && (
          <div className="flex flex-col items-center py-10">
            <Search size={24} className={isDark ? 'text-white/15' : 'text-slate-300'} />
            <p className={cn('text-[9px] font-black mt-2', isDark ? 'text-white/25' : 'text-slate-400')}>No results for "{searchQuery}"</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── INPUT BAR ─── */}
      <div className={cn(
        'flex-shrink-0 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 border-t z-30 relative',
        isDark ? 'bg-[#060A10]/95 border-white/5 backdrop-blur-xl' : 'bg-white/98 border-slate-100 shadow-sm'
      )}>
        <div className={cn('flex items-end gap-2 rounded-[1.6rem] border px-3 py-2',
          isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200')}>

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
              'flex-1 bg-transparent text-[9.5px] font-medium outline-none py-1',
              isDark ? 'text-white placeholder:text-white/20' : 'text-slate-800 placeholder:text-slate-400'
            )}
          />

          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleSend}
            disabled={!inputText.trim() || isSending}
            className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
              inputText.trim() && !isSending
                ? 'text-white shadow-lg'
                : isDark ? 'bg-white/5 text-white/15' : 'bg-slate-100 text-slate-300'
            )}
            style={inputText.trim() && !isSending ? { background: currentChannel.color, boxShadow: `0 4px 12px ${currentChannel.color}40` } : {}}>
            {isSending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          </motion.button>
        </div>

        <p className={cn('text-center text-[6.5px] font-black uppercase tracking-widest mt-2',
          isDark ? 'text-white/10' : 'text-slate-300')}>
          🤝 Community discussion · Be respectful · No misleading advice
        </p>
      </div>
    </div>
  );
};
