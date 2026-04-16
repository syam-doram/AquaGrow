import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, Users, Send, Hash, TrendingUp,
  Pill, Utensils, Droplets, Wind,
  ThumbsUp, Heart, Search,
  X, Pin, RefreshCw, AlertCircle, Loader2,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';
import { API_BASE_URL } from '../../config';

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

// ─── MESSAGE TYPE ──────────────────────────────────────────────────────────────
interface CommunityMessage {
  id: string;
  author: string;
  loc: string;
  text: string;
  time: string;
  likes: number;
  hearts: number;
  isPinned?: boolean;
  createdAt?: string;
}

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
  const { user, theme, apiFetch } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  const [activeChannel, setActiveChannel] = useState<ChannelId>('general');
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [likedMessages, setLikedMessages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentChannel = CHANNELS.find(c => c.id === activeChannel)!;

  // ─── Fetch messages from API ───────────────────────────────────────────────
  const fetchMessages = useCallback(async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/community/messages?channel=${activeChannel}&limit=60`);
      if (Array.isArray(data?.messages)) {
        setMessages(data.messages);
      }
      if (typeof data?.onlineCount === 'number') {
        setOnlineCount(data.onlineCount);
      }
    } catch (err: any) {
      setError('Could not load messages. Check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, [activeChannel, apiFetch]);

  // Load messages when channel changes
  useEffect(() => {
    setMessages([]);
    fetchMessages(true);
  }, [activeChannel]);

  // Poll every 8 seconds for new messages
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => fetchMessages(false), 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchMessages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeChannel]);

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    return messages.filter(m =>
      m.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.author.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [messages, searchQuery]);

  // ─── Send message ──────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !user || isSending) return;
    setIsSending(true);

    // Optimistic insert
    const tempId = `temp-${Date.now()}`;
    const optimistic: CommunityMessage = {
      id: tempId,
      text,
      author: user.name || 'Farmer',
      loc: (user as any).location || 'My Farm',
      time: 'now',
      likes: 0,
      hearts: 0,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setInputText('');

    try {
      await apiFetch('/community/messages', {
        method: 'POST',
        body: JSON.stringify({
          channel: activeChannel,
          text,
          author: user.name || 'Farmer',
          loc: (user as any).location || 'My Farm',
        }),
      });
      // Refresh to get server-assigned ID + timestamp
      fetchMessages(false);
    } catch {
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInputText(text); // restore text
      setError('Failed to send. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // ─── Like a message ────────────────────────────────────────────────────────
  const toggleLike = async (msgId: string) => {
    const alreadyLiked = likedMessages.has(msgId);
    setLikedMessages(prev => {
      const next = new Set(prev);
      alreadyLiked ? next.delete(msgId) : next.add(msgId);
      return next;
    });
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, likes: m.likes + (alreadyLiked ? -1 : 1) } : m
    ));
    try {
      await apiFetch(`/community/messages/${msgId}/like`, {
        method: alreadyLiked ? 'DELETE' : 'POST',
      });
    } catch { /* optimistic — ignore */ }
  };

  const pinnedMsg = filteredMessages.find(m => m.isPinned);

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
                {onlineCount > 0 ? `${onlineCount.toLocaleString()} farmers online` : 'Live Community'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <motion.button whileTap={{ scale: 0.88 }} onClick={() => fetchMessages(true)}
              className={cn('w-9 h-9 rounded-xl flex items-center justify-center border',
                isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-white border-slate-200 text-slate-500 shadow-sm')}>
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            </motion.button>
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
            {messages.length} messages · discuss freely
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

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={cn('rounded-2xl border px-3 py-2.5 flex items-center gap-2.5 mb-2',
                isDark ? 'bg-red-500/8 border-red-500/20' : 'bg-red-50 border-red-200')}>
              <AlertCircle size={12} className="text-red-500 flex-shrink-0" />
              <p className={cn('text-[8px] font-medium flex-1', isDark ? 'text-red-400' : 'text-red-600')}>{error}</p>
              <button onClick={() => setError(null)}
                className={cn('text-[7px] font-black uppercase', isDark ? 'text-red-400' : 'text-red-500')}>✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading skeleton */}
        {isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 size={24} className="text-emerald-500 animate-spin" />
            <p className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>
              Loading #{currentChannel.label}...
            </p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && messages.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <div className="text-3xl">{currentChannel.emoji}</div>
            <p className={cn('text-[10px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>
              No messages yet
            </p>
            <p className={cn('text-[8px] font-medium', isDark ? 'text-white/15' : 'text-slate-300')}>
              Be the first to start the conversation!
            </p>
          </div>
        )}

        {/* Pinned message */}
        {pinnedMsg && !searchQuery && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className={cn('rounded-2xl border px-3 py-2.5 flex items-center gap-2.5 mb-3',
              isDark ? 'bg-amber-500/8 border-amber-500/20' : 'bg-amber-50 border-amber-200')}>
            <Pin size={11} className="text-amber-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-amber-400/60' : 'text-amber-600')}>
                Pinned · {pinnedMsg.author}
              </p>
              <p className={cn('text-[8.5px] font-medium leading-snug truncate', isDark ? 'text-white/60' : 'text-slate-600')}>
                {pinnedMsg.text}
              </p>
            </div>
          </motion.div>
        )}

        {/* Messages */}
        <AnimatePresence>
          {filteredMessages.map((msg, i) => {
            const isMe = msg.author === (user?.name || 'Farmer') && (msg.id?.startsWith('temp-') || false);
            const avatarColor = getAvatarColor(msg.author);
            const initials = msg.author.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
            const isLiked = likedMessages.has(msg.id);
            const isTemp = msg.id?.startsWith('temp-');

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i < 5 ? i * 0.02 : 0 }}
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
                      {msg.loc && (
                        <span className={cn('text-[6.5px] font-medium', isDark ? 'text-white/20' : 'text-slate-400')}>
                          📍 {msg.loc}
                        </span>
                      )}
                      <span className={cn('text-[6.5px]', isDark ? 'text-white/15' : 'text-slate-300')}>· {msg.time}</span>
                    </div>
                  )}

                  {/* Bubble */}
                  <div className={cn(
                    'rounded-2xl px-3.5 py-2.5 shadow-sm relative',
                    isMe
                      ? 'bg-emerald-500 text-white rounded-tr-sm'
                      : isDark
                        ? 'bg-white/[0.07] border border-white/8 rounded-tl-sm'
                        : 'bg-white border border-slate-100 rounded-tl-sm',
                    isTemp ? 'opacity-70' : ''
                  )}>
                    <p className={cn('text-[9px] font-medium leading-relaxed',
                      isMe ? 'text-white' : isDark ? 'text-white/80' : 'text-slate-700')}>
                      {msg.text}
                    </p>

                    {isTemp && (
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
                          {msg.likes}
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
