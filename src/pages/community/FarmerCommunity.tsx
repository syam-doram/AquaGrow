import React, { useState, useEffect, useRef, useMemo, useLayoutEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, Users, Send, Hash, TrendingUp,
  Pill, Utensils, Droplets, Wind,
  ThumbsUp, Search, X, Pin, Loader2, AlertCircle, Camera as CameraIcon,
} from 'lucide-react';
import {
  collection, addDoc, query, orderBy, limit,
  onSnapshot, serverTimestamp, updateDoc, doc,
  increment, Timestamp,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { API_BASE_URL } from '../../config';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
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

interface CommunityMessage {
  id: string;
  text: string;
  author: string;
  authorId: string;
  loc: string;
  likes: number;
  isPinned?: boolean;
  imageUrl?: string;
  createdAt: Timestamp | null;
}

const AVATAR_COLORS = [
  '#10B981','#3B82F6','#8B5CF6','#EF4444','#F59E0B',
  '#EC4899','#06B6D4','#84CC16','#F97316','#6366F1',
];
const getAvatarColor = (name: string) =>
  AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const fmtTime = (ts: Timestamp | null): string => {
  if (!ts) return 'now';
  const d = ts.toDate();
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// ─── CHAT SOUND (Web Audio API — no file needed) ──────────────────────────────
let audioCtx: AudioContext | null = null;

const getAudioCtx = (): AudioContext => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

// Warm up on first touch so receive sounds work without a direct gesture
if (typeof window !== 'undefined') {
  const warmUp = () => {
    try {
      const ctx = getAudioCtx();
      if (ctx.state === 'suspended') ctx.resume();
    } catch { /* ignore */ }
  };
  window.addEventListener('touchstart', warmUp, { once: true, passive: true });
  window.addEventListener('click', warmUp, { once: true });
}

const playChatSound = async (type: 'receive' | 'send' = 'receive') => {
  try {
    const ctx = getAudioCtx();
    // Always resume before playing — required on Android after autoplay policy suspends context
    if (ctx.state === 'suspended') await ctx.resume();

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'receive') {
      // Soft ascending ting
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.28);
    } else {
      // Soft send pop
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(620, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);
    }
  } catch { /* AudioContext not available — silent */ }
};


// ─── COMPONENT ────────────────────────────────────────────────────────────────
export const FarmerCommunity = () => {
  const navigate = useNavigate();
  const { user, theme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  const [activeChannel, setActiveChannel] = useState<ChannelId>('general');
  const [messages, setMessages]   = useState<CommunityMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch]   = useState(false);
  const [likedMsgIds, setLikedMsgIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('community_liked') || '[]')); }
    catch { return new Set(); }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError]         = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Track visible viewport height (shrinks when keyboard opens on Android)
  const [vhPx, setVhPx] = useState(() => window.visualViewport?.height ?? window.innerHeight);

  // Height measurement refs (unused now but kept for ResizeObserver on search toggle)
  const topRef      = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLDivElement>(null);
  const textInputRef= useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unsubRef          = useRef<(() => void) | null>(null);
  const prevCountRef       = useRef(0);
  const initialLoadDoneRef = useRef(false); // prevents sound on first batch load
  const fileInputRef       = useRef<HTMLInputElement>(null);

  // ─── Track visualViewport to handle keyboard open/close ───────────────────
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setVhPx(vv.height);
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => { vv.removeEventListener('resize', update); vv.removeEventListener('scroll', update); };
  }, []);

  const currentChannel = CHANNELS.find(c => c.id === activeChannel)!;

  // ─── Real-time Firestore listener ─────────────────────────────────────────
  useEffect(() => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    setIsLoading(true);
    setMessages([]);
    setError(null);
    prevCountRef.current = 0;
    initialLoadDoneRef.current = false; // reset for new channel

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
            id: d.id, ...d.data(),
          } as CommunityMessage));

          // Play sound ONLY for new messages after initial load
          if (initialLoadDoneRef.current && msgs.length > prevCountRef.current) {
            const newest = msgs[msgs.length - 1];
            const myId = (user as any)?._id || (user as any)?.id;
            if (newest?.authorId !== myId) playChatSound('receive');
          }
          prevCountRef.current = msgs.length;

          setMessages(msgs);
          setIsLoading(false);
          setError(null);
          // Mark initial load done AFTER first snapshot
          initialLoadDoneRef.current = true;
        },
        (err: any) => {
          console.error('[Community] Firestore error code:', err?.code, err);
          if (err?.code === 'permission-denied') {
            setError('Chat not activated yet. Update Firestore Rules in Firebase Console.');
          } else if (err?.code === 'unauthenticated') {
            setError('Session expired. Please log out and log back in.');
          } else {
            setError(`Chat error (${err?.code || 'unknown'}). Check Firebase Console.`);
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

  // Auto-scroll to bottom
  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    }
  }, [messages.length, isLoading]);

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(m => m.text?.toLowerCase().includes(q) || m.author?.toLowerCase().includes(q));
  }, [messages, searchQuery]);

  // ─── Send ─────────────────────────────────────────────────────────────────
  const handleSend = async (textOverride?: string, urlOverride?: string) => {
    const text     = (textOverride !== undefined ? textOverride : inputText).trim();
    const imageUrl = urlOverride ?? null;   // null is safe in Firestore; undefined is NOT

    if ((!text && !imageUrl) || isSending) return;
    setIsSending(true);
    if (textOverride === undefined) setInputText('');
    playChatSound('send');

    try {
      const msgData: Record<string, any> = {
        text,
        author:   user?.name || 'Farmer',
        authorId: (user as any)?._id || (user as any)?.id || 'anon',
        loc:      (user as any)?.location || 'My Farm',
        likes: 0,
        isPinned: false,
        createdAt: serverTimestamp(),
      };
      if (imageUrl) msgData.imageUrl = imageUrl;   // only add when present

      await addDoc(
        collection(db, 'community_messages', activeChannel, 'messages'),
        msgData,
      );
    } catch (err: any) {
      console.error('[Community] Send error:', err?.code, err?.message);
      if (textOverride === undefined) setInputText(text);
      if (err?.code === 'permission-denied') {
        setError('Permission denied. Please update Firestore Security Rules.');
      } else {
        setError('Message not sent. Check your connection and try again.');
      }
    } finally {
      setIsSending(false);
      textInputRef.current?.focus();
    }
  };

  // ─── Platform detection ────────────────────────────────────────────────────
  const isNative = typeof (window as any).Capacitor !== 'undefined' &&
    (window as any).Capacitor?.isNativePlatform?.();

  // ─── Camera button handler ─────────────────────────────────────────────────
  // NATIVE (Android): Capacitor Camera → file:// URI → Blob → Firebase Storage direct
  // WEB (Vercel):     <input type=file> → base64 → server proxy (bypasses CORS)
  const handleCameraButton = async () => {
    if (isNative) {
      try {
        const photo = await Camera.getPhoto({
          quality: 75,
          allowEditing: false,
          resultType: CameraResultType.Uri,   // gives file:// or blob: URI
          source: CameraSource.Prompt,         // shows Camera / Gallery sheet
          width: 1280,
        });

        const imageUri = photo.webPath || photo.path;
        if (!imageUri) { setError('Could not get image path.'); return; }

        setIsUploading(true);
        setUploadProgress(20);
        setError(null);

        // Convert file:// URI → Blob (fetch works in Capacitor WebView)
        const fetchResp = await fetch(imageUri);
        const blob = await fetchResp.blob();
        const mimeType = blob.type || 'image/jpeg';

        if (blob.size > 8 * 1024 * 1024) {
          setError('Image too large (max 8 MB).');
          setIsUploading(false);
          return;
        }

        // Upload directly to Firebase Storage — no CORS on native WebView!
        const ext = mimeType.split('/')[1] || 'jpg';
        const filePath = `community_images/${activeChannel}/${Date.now()}.${ext}`;
        const sRef = storageRef(storage, filePath);

        setUploadProgress(50);
        await uploadBytes(sRef, blob, { contentType: mimeType });
        setUploadProgress(85);

        const downloadURL = await getDownloadURL(sRef);
        const capturedText = inputText.trim();
        setIsUploading(false);
        setUploadProgress(0);
        setInputText('');
        handleSend(capturedText, downloadURL);

      } catch (err: any) {
        // User tapped cancel — silent exit
        if (err?.message?.includes('cancel') || err?.message?.includes('dismiss')) {
          setIsUploading(false);
          return;
        }
        console.error('[Community] Native upload error:', err);
        setError(`Upload failed: ${err.message || 'Unknown error'}`);
        setIsUploading(false);
        setUploadProgress(0);
      }
    } else {
      // Web — trigger file input
      fileInputRef.current?.click();
    }
  };

  // ─── Web: file input handler → server proxy ───────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Only image files are supported.'); return; }
    if (file.size > 8 * 1024 * 1024) { setError('Image too large (max 8 MB).'); return; }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const blob = new Blob([new Uint8Array(arrayBuffer)], { type: file.type });
      uploadViaProxy(blob, file.type);
    } catch {
      setError('Could not read the selected image.');
    }
  };

  const uploadViaProxy = async (blob: Blob, mimeType: string) => {
    if (isUploading) return;
    setIsUploading(true);
    setUploadProgress(10);
    setError(null);
    try {
      const reader = new FileReader();
      const base64: string = await new Promise((resolve, reject) => {
        reader.onload  = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(blob);
      });
      setUploadProgress(40);

      const token = localStorage.getItem('token');
      const resp = await fetch(`${API_BASE_URL}/community/upload-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ base64Image: base64, channel: activeChannel, mimeType }),
      });
      setUploadProgress(90);

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData?.error || `Server error ${resp.status}`);
      }
      const { url } = await resp.json();
      if (!url) throw new Error('No URL returned from server');

      const capturedText = inputText.trim();
      setIsUploading(false);
      setUploadProgress(0);
      setInputText('');
      handleSend(capturedText, url);
    } catch (err: any) {
      console.error('[Community] Proxy upload error:', err);
      setError(`Upload failed: ${err.message || 'Unknown error'}`);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };


  // ─── Like ─────────────────────────────────────────────────────────────────
  const toggleLike = async (msgId: string) => {
    const alreadyLiked = likedMsgIds.has(msgId);
    const next = new Set(likedMsgIds);
    alreadyLiked ? next.delete(msgId) : next.add(msgId);
    setLikedMsgIds(next);
    localStorage.setItem('community_liked', JSON.stringify([...next]));
    try {
      await updateDoc(doc(db, 'community_messages', activeChannel, 'messages', msgId), {
        likes: increment(alreadyLiked ? -1 : 1),
      });
    } catch { /* optimistic */ }
  };

  const pinnedMsg = filteredMessages.find(m => m.isPinned);

  return (
    // Root: uses visualViewport height so it always equals visible area (keyboard-aware)
    <div
      className={cn('fixed top-0 left-0 right-0 flex flex-col font-sans overflow-hidden', isDark ? 'bg-[#060A10]' : 'bg-[#F0F4FF]')}
      style={{ height: vhPx }}
    >

      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className={cn('absolute -top-20 -right-20 w-80 h-80 rounded-full blur-[160px]', isDark ? 'bg-emerald-600/10' : 'bg-emerald-400/12')} />
        <div className={cn('absolute bottom-20 -left-20 w-64 h-64 rounded-full blur-[140px]', isDark ? 'bg-indigo-500/8' : 'bg-blue-400/8')} />
      </div>

      {/* ══════════════════════════════════════════════════════════
          TOP SECTION — fixed at top, keyboard cannot touch it
         ══════════════════════════════════════════════════════════ */}
      <div ref={topRef} className={cn(
        'flex-shrink-0 z-40 relative',
        isDark ? 'bg-[#060A10]' : 'bg-white'
      )}>

        {/* HEADER */}
        <div className={cn(
          'px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-3 border-b',
          isDark ? 'border-white/5' : 'border-slate-100 shadow-sm'
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
                <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search messages or farmers..."
                  className={cn('w-full px-3 py-2 rounded-xl border text-[9px] font-medium outline-none',
                    isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/25' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400')} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CHANNEL TABS */}
        <div className={cn('border-b', isDark ? 'border-white/5' : 'border-slate-100')}>
          <div className="flex gap-1.5 overflow-x-auto px-4 py-2.5 no-scrollbar">
            {CHANNELS.map(ch => {
              const isActive = activeChannel === ch.id;
              return (
                <motion.button key={ch.id} whileTap={{ scale: 0.95 }}
                  onClick={() => { setActiveChannel(ch.id as ChannelId); setSearchQuery(''); setShowSearch(false); }}
                  className={cn('flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-[8px] font-black uppercase tracking-widest transition-all',
                    isActive ? 'text-white' : isDark ? 'bg-white/5 text-white/40 border-white/8' : 'bg-white text-slate-500 border-slate-100 shadow-sm')}
                  style={isActive ? { background: ch.color, borderColor: ch.color, boxShadow: `0 4px 14px ${ch.color}40` } : {}}>
                  <span>{ch.emoji}</span>{ch.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* CHANNEL INFO */}
        <div className={cn('flex items-center gap-3 px-4 py-2 border-b', isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50/80 border-slate-100')}>
          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-sm" style={{ background: `${currentChannel.color}20` }}>{currentChannel.emoji}</div>
          <div className="flex-1 min-w-0">
            <p className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/70' : 'text-slate-800')}>#{currentChannel.label}</p>
            <p className={cn('text-[7px] font-medium', isDark ? 'text-white/25' : 'text-slate-400')}>{messages.length} messages · real-time</p>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-xl" style={{ background: `${currentChannel.color}15` }}>
            <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: currentChannel.color }} />
            <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: currentChannel.color }}>Live</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          MESSAGES — flex-1 + min-h-0 required so overflow-y-auto
          actually constrains the height and enables scrolling
         ══════════════════════════════════════════════════════════ */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pt-3 pb-3 space-y-2 relative z-10">

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className={cn('rounded-2xl border px-3.5 py-3 mb-4 space-y-1.5',
                isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200')}>
              <div className="flex items-center gap-2.5">
                <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                <p className={cn('text-[9px] font-black uppercase tracking-widest flex-1', isDark ? 'text-red-400' : 'text-red-700')}>
                  Upload Error
                </p>
                <button onClick={() => setError(null)} className="text-[8px] font-black text-red-400">✕</button>
              </div>
              <p className={cn('text-[9.5px] font-medium leading-relaxed', isDark ? 'text-red-300' : 'text-red-600')}>{error}</p>
              {error.includes('Permission') && (
                <p className={cn('text-[7.5px] font-bold uppercase tracking-[0.05em] py-1 px-2 rounded-lg', isDark ? 'bg-red-500/20 text-red-200' : 'bg-red-100 text-red-800')}>
                  Tip: Enable "Storage" in Firebase Console and set rules to public.
                </p>
              )}
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

        {/* Messages */}
        {!isLoading && filteredMessages.map(msg => {
          const isMe = msg.authorId === ((user as any)?._id || (user as any)?.id);
          const avatarColor = getAvatarColor(msg.author || '?');
          const initials = (msg.author || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
          const isLiked = likedMsgIds.has(msg.id);
          return (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn('flex gap-2.5', isMe ? 'flex-row-reverse' : 'flex-row')}>
              {!isMe && (
                <div className="w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1 text-[9px] font-black text-white shadow-sm"
                  style={{ background: avatarColor }}>{initials}</div>
              )}
              <div className={cn('max-w-[78%] space-y-1', isMe ? 'items-end flex flex-col' : '')}>
                {!isMe && (
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[8px] font-black" style={{ color: avatarColor }}>{msg.author}</span>
                    {msg.loc && <span className={cn('text-[6.5px] font-medium', isDark ? 'text-white/20' : 'text-slate-400')}>📍 {msg.loc}</span>}
                    <span className={cn('text-[6px]', isDark ? 'text-white/15' : 'text-slate-300')}>· {fmtTime(msg.createdAt)}</span>
                  </div>
                )}
                <div className={cn('rounded-2xl shadow-sm overflow-hidden',
                  isMe ? 'bg-emerald-500 rounded-tr-sm' : isDark ? 'bg-white/[0.07] border border-white/8 rounded-tl-sm' : 'bg-white border border-slate-100 rounded-tl-sm')}>
                  {msg.imageUrl && (
                    <motion.img
                      src={msg.imageUrl}
                      alt="photo"
                      loading="lazy"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => setLightboxUrl(msg.imageUrl!)}
                      className="w-full max-w-[240px] max-h-48 object-cover cursor-pointer active:opacity-75 transition-opacity block"
                      style={{ borderRadius: msg.text ? '16px 16px 0 0' : '16px' }}
                    />
                  )}
                  {msg.text && (
                    <p className={cn('text-[9.5px] font-medium leading-relaxed break-words px-3.5 py-2.5',
                      isMe ? 'text-white' : isDark ? 'text-white/80' : 'text-slate-700')}>
                      {msg.text}
                    </p>
                  )}
                  {!msg.text && isMe && <p className="text-[6px] text-white/50 text-right px-3 pb-2">{fmtTime(msg.createdAt)}</p>}
                  {msg.text && isMe && <p className="text-[6px] text-white/50 text-right px-3.5 pb-2 -mt-1">{fmtTime(msg.createdAt)}</p>}
                </div>
                {!isMe && (
                  <motion.button whileTap={{ scale: 0.85 }} onClick={() => toggleLike(msg.id)}
                    className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full border text-[7px] font-black transition-all',
                      isLiked ? 'bg-blue-500/15 border-blue-500/30 text-blue-500'
                        : isDark ? 'bg-white/5 border-white/8 text-white/25' : 'bg-slate-50 border-slate-100 text-slate-400')}>
                    <ThumbsUp size={8} className={isLiked ? 'fill-current' : ''} />
                    {(msg.likes || 0) > 0 ? msg.likes : ''}
                  </motion.button>
                )}
              </div>
            </motion.div>
          );
        })}

        {!isLoading && filteredMessages.length === 0 && searchQuery && (
          <div className="flex flex-col items-center py-10">
            <Search size={24} className={isDark ? 'text-white/15' : 'text-slate-300'} />
            <p className={cn('text-[9px] font-black mt-2', isDark ? 'text-white/25' : 'text-slate-400')}>No results for "{searchQuery}"</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div ref={inputRef} className={cn(
        'flex-shrink-0 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 border-t z-40',
        isDark ? 'bg-[#060A10] border-white/5' : 'bg-white border-slate-100 shadow-sm'
      )}>
        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileSelect} />

        {/* Progress Bar */}
        <AnimatePresence>
          {isUploading && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-3">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="text-[7.5px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1.5">
                  <Loader2 size={10} className="animate-spin" /> Uploading Photo...
                </span>
                <span className="text-[8px] font-black text-emerald-500">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="h-1.5 w-full bg-emerald-500/10 rounded-full overflow-hidden">
                <motion.div className="h-full bg-emerald-500" initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={cn('flex items-center gap-2 rounded-[1.6rem] border px-2 py-2',
          isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200')}>

          <motion.button whileTap={{ scale: 0.88 }} onClick={handleCameraButton}
            disabled={isUploading}
            className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all border',
              isUploading
                ? 'opacity-40 cursor-not-allowed'
                : isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-white border-slate-100 text-slate-400')}>
            {isUploading ? <Loader2 size={13} className="animate-spin text-emerald-500" /> : <CameraIcon size={14} />}
          </motion.button>

          <input ref={textInputRef} value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={`Message #${currentChannel.label}...`}
            className={cn('flex-1 bg-transparent text-[9.5px] font-medium outline-none py-1',
              isDark ? 'text-white placeholder:text-white/20' : 'text-slate-800 placeholder:text-slate-400')} />

        <motion.button whileTap={{ scale: 0.88 }} onClick={() => handleSend()}
            disabled={(!inputText.trim()) || isSending}
            className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
              (inputText.trim() && !isSending) ? 'text-white shadow-lg' : isDark ? 'bg-white/5 text-white/15' : 'bg-slate-100 text-slate-300')}
            style={(inputText.trim() && !isSending) ? { background: currentChannel.color, boxShadow: `0 4px 12px ${currentChannel.color}40` } : {}}>
            {isSending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          </motion.button>
        </div>
        <p className={cn('text-center text-[6.5px] font-black uppercase tracking-widest mt-2',
          isDark ? 'text-white/10' : 'text-slate-300')}>
          🤝 Community discussion · Be respectful · No misleading advice
        </p>
      </div>

      {/* ── Full-screen Image Lightbox ──────────────────────────────────────── */}
      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxUrl(null)}
            className="fixed inset-0 z-[999] flex items-center justify-center p-6"
            style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)' }}
          >
            {/* Close button */}
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              onClick={() => setLightboxUrl(null)}
              className="absolute top-12 right-4 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center z-10 backdrop-blur-sm"
            >
              <X size={18} className="text-white" />
            </motion.button>

            {/* Image */}
            <motion.img
              src={lightboxUrl}
              alt="Full view"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              onClick={e => e.stopPropagation()}
              className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl select-none"
              style={{ boxShadow: '0 30px 80px rgba(0,0,0,0.9)' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

};
