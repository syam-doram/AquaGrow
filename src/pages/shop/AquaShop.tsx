import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingCart, Search, ChevronLeft, ChevronRight, Star,
  Package, Pill, Utensils, Droplets, Phone, MessageCircle,
  Tag, Sparkles, ShieldCheck, Truck, Clock, X, Plus, Minus,
  CheckCircle2, ArrowRight, Filter, Zap,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';

// ── Product catalogue ──────────────────────────────────────────────────────────
const PRODUCTS = [
  // MEDICINES
  { id: 'm1', category: 'medicine', name: 'Bioclean Aqua Plus', brand: 'Biostadt', desc: 'Premium water probiotic for pathogen control and water quality maintenance.', price: 850, unit: '500g', rating: 4.8, reviews: 312, tag: 'BESTSELLER', color: '#8B5CF6', emoji: '🦠' },
  { id: 'm2', category: 'medicine', name: 'WSSV Shield Tonic', brand: 'Inve Aqua', desc: 'Immunity booster for DOC 31–45 critical stage. Reduces WSSV mortality risk.', price: 1200, unit: '1L', rating: 4.9, reviews: 189, tag: 'CRITICAL STAGE', color: '#EF4444', emoji: '🛡️' },
  { id: 'm3', category: 'medicine', name: 'Dolomite Lime', brand: 'AgriStar', desc: 'Soil and water pH stabilizer. Apply 500 kg/acre during pond preparation.', price: 320, unit: '50kg bag', rating: 4.5, reviews: 540, tag: 'ESSENTIAL', color: '#0EA5E9', emoji: '🪨' },
  { id: 'm4', category: 'medicine', name: 'Vitamin C + Betaine Booster', brand: 'Skan Aqua', desc: 'Stress reducer for DOC 1–3. Helps post-stocking survival and immunity.', price: 680, unit: '500g', rating: 4.7, reviews: 224, tag: 'POST-STOCKING', color: '#10B981', emoji: '💊' },
  { id: 'm5', category: 'medicine', name: 'Mineral Mix Supreme', brand: 'Agrobiotics', desc: 'Comprehensive mineral supplement. Apply 15–20 kg/acre for peak growth.', price: 540, unit: '25kg', rating: 4.6, reviews: 310, tag: 'GROWTH', color: '#F59E0B', emoji: '⚗️' },
  { id: 'm6', category: 'medicine', name: 'Liver Tonic Pro', brand: 'Veto Aqua', desc: 'Hepatopancreas health tonic for DOC 50. Improves feed conversion.', price: 920, unit: '1L', rating: 4.8, reviews: 156, tag: 'FCR BOOST', color: '#A855F7', emoji: '🫀' },
  { id: 'm7', category: 'medicine', name: 'Chlorine (TCC 90%)', brand: 'HiMedia', desc: 'Disinfectant for pond preparation. Apply 30 ppm to eliminate pathogens.', price: 480, unit: '1kg', rating: 4.4, reviews: 420, tag: 'PREP PHASE', color: '#06B6D4', emoji: '🧪' },
  { id: 'm8', category: 'medicine', name: 'Anti-Stress Tonic', brand: 'CP Aqua', desc: 'Reduces molt stress in DOC 30–35. Electrolyte balance formula.', price: 760, unit: '500ml', rating: 4.6, reviews: 178, tag: 'STRESS RELIEF', color: '#EC4899', emoji: '💉' },

  // FEEDS
  { id: 'f1', category: 'feed', name: 'CP Vannamei Starter 0.3mm', brand: 'Charoen Pokphand', desc: 'Micro-pellet feed for DOC 1–15. 42% crude protein for early establishment.', price: 2800, unit: '25kg', rating: 4.9, reviews: 892, tag: 'BESTSELLER', color: '#10B981', emoji: '🌾' },
  { id: 'f2', category: 'feed', name: 'Grow-Out Pellet 1.5mm', brand: 'Avanti Feeds', desc: 'High energy grow-out feed for DOC 21–60. Balanced amino acid profile.', price: 2200, unit: '25kg', rating: 4.8, reviews: 654, tag: 'GROWTH STAGE', color: '#F59E0B', emoji: '🐚' },
  { id: 'f3', category: 'feed', name: 'Finisher Premium 2.0mm', brand: 'Godrej Agrovet', desc: 'Pre-harvest finisher feed for DOC 70–90. Maximizes body weight and FCR.', price: 2500, unit: '25kg', rating: 4.7, reviews: 423, tag: 'HARVEST PREP', color: '#C78200', emoji: '🏆' },
  { id: 'f4', category: 'feed', name: 'Gut Probiotic Premix', brand: 'ADM Animal Nutrition', desc: 'Mix 5g/kg feed. Improves digestion, feed absorption and FCR by up to 15%.', price: 1400, unit: '1kg', rating: 4.8, reviews: 298, tag: 'FCR BOOST', color: '#8B5CF6', emoji: '🧬' },
  { id: 'f5', category: 'feed', name: 'S0 Larvae Feed 0.1mm', brand: 'Inve Belgium', desc: 'Micro-particle for PL 1–5 nursery stage. 60% protein, highly digestible.', price: 4200, unit: '1kg', rating: 4.9, reviews: 112, tag: 'NURSERY', color: '#0EA5E9', emoji: '🔬' },
  { id: 'f6', category: 'feed', name: 'Feeding Attractant Powder', brand: 'Norel Aqua', desc: 'Betaine-based attractant. Increases feed intake and reduces feed waste.', price: 890, unit: '500g', rating: 4.6, reviews: 203, tag: 'FEED BOOST', color: '#EF4444', emoji: '🌶️' },
];

const CATEGORIES = [
  { key: 'all',      label: 'All Products', icon: Package,  color: '#C78200' },
  { key: 'medicine', label: 'Medicines',    icon: Pill,     color: '#8B5CF6' },
  { key: 'feed',     label: 'Feed',         icon: Utensils, color: '#10B981' },
];

const OFFERS = [
  { id: 1, title: '🎉 Grand Opening Sale', sub: 'Up to 20% off on all medicines', from: '#7c3aed', to: '#4f46e5', cta: 'Shop Now', badge: 'LIMITED' },
  { id: 2, title: '🌾 Bulk Feed Deal', sub: 'Buy 10 bags, get 1 FREE! Starter & Grow-Out.', from: '#059669', to: '#047857', cta: 'Claim Offer', badge: 'HOT' },
  { id: 3, title: '🚚 Free Delivery', sub: 'On orders above ₹2,000. Same-day dispatch.', from: '#0284c7', to: '#0369a1', cta: 'Order Now', badge: 'FREE' },
  { id: 4, title: '🛡️ WSSV Kit', sub: 'Complete 31–45 DOC protection bundle at ₹2,499', from: '#dc2626', to: '#991b1b', cta: 'View Kit', badge: '25% OFF' },
];

interface CartItem { id: string; name: string; price: number; qty: number; unit: string; emoji: string; }

export const AquaShop = () => {
  const navigate = useNavigate();
  const { theme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [orderedId, setOrderedId] = useState<string | null>(null);

  const filtered = useMemo(() => PRODUCTS.filter(p => {
    if (activeCategory !== 'all' && p.category !== activeCategory) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.brand.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [activeCategory, search]);

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const addToCart = (p: typeof PRODUCTS[0]) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === p.id);
      if (existing) return prev.map(c => c.id === p.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { id: p.id, name: p.name, price: p.price, qty: 1, unit: p.unit, emoji: p.emoji }];
    });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.reduce<CartItem[]>((acc, c) => {
    if (c.id !== id) return [...acc, c];
    if (c.qty > 1) return [...acc, { ...c, qty: c.qty - 1 }];
    return acc;
  }, []));

  const getQty = (id: string) => cart.find(c => c.id === id)?.qty ?? 0;

  const handleOrder = () => {
    const msg = `Hi! I'd like to order from AquaGrow Shop:\n\n${cart.map(c => `• ${c.emoji} ${c.name} (${c.unit}) × ${c.qty} = ₹${(c.price * c.qty).toLocaleString('en-IN')}`).join('\n')}\n\n*Total: ₹${totalPrice.toLocaleString('en-IN')}*\n\nPlease confirm availability and delivery.`;
    window.open(`https://wa.me/919999999999?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className={cn('min-h-screen pb-28 font-sans', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>

      {/* ── STICKY HEADER ── */}
      <header className={cn(
        'sticky top-0 z-50 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 border-b backdrop-blur-xl',
        isDark ? 'bg-[#070D12]/90 border-white/5' : 'bg-white/90 border-slate-100'
      )}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate(-1)} className={cn('w-10 h-10 rounded-2xl flex items-center justify-center', isDark ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-700')}>
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <h1 className={cn('text-sm font-black tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>AquaGrow Shop</h1>
            <p className={cn('text-[8px] font-black uppercase tracking-widest', isDark ? 'text-white/30' : 'text-slate-400')}>Medicines & Feed Delivery</p>
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="relative w-10 h-10 rounded-2xl bg-[#C78200]/15 flex items-center justify-center text-[#C78200]"
          >
            <ShoppingCart size={18} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[7px] font-black rounded-full flex items-center justify-center">{totalItems}</span>
            )}
          </button>
        </div>

        {/* Search bar */}
        <div className={cn('flex items-center gap-2 rounded-2xl px-3 py-2 border', isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200')}>
          <Search size={14} className={isDark ? 'text-white/30' : 'text-slate-400'} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search medicines, feeds, brands..."
            className={cn('flex-1 bg-transparent text-[11px] font-medium outline-none', isDark ? 'text-white placeholder:text-white/25' : 'text-slate-900 placeholder:text-slate-400')}
          />
          {search && <button onClick={() => setSearch('')}><X size={12} className="text-slate-400" /></button>}
        </div>
      </header>

      <div className="px-4 pt-4 space-y-5">

        {/* ── OFFER BANNERS (horizontal scroll) ── */}
        <div>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar snap-x">
            {OFFERS.map((o, i) => (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex-shrink-0 snap-start w-[75vw] max-w-[280px] rounded-[1.8rem] p-4 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                style={{ background: `linear-gradient(135deg, ${o.from}, ${o.to})` }}
              >
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full" />
                <div className="absolute -right-2 bottom-2 w-16 h-16 bg-white/5 rounded-full" />
                <span className="inline-block text-[7px] font-black px-2 py-0.5 bg-white/25 text-white rounded-full mb-2 uppercase tracking-widest">{o.badge}</span>
                <h3 className="text-white font-black text-[13px] tracking-tight leading-snug mb-0.5">{o.title}</h3>
                <p className="text-white/70 text-[9px] font-medium leading-snug mb-3">{o.sub}</p>
                <span className="inline-flex items-center gap-1 text-[8px] font-black text-white bg-white/20 px-2.5 py-1 rounded-full">
                  {o.cta} <ArrowRight size={9} />
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {[
            { icon: Truck,       label: '1–2 Day Delivery', color: '#10B981' },
            { icon: ShieldCheck, label: 'Genuine Products',  color: '#0EA5E9' },
            { icon: Clock,       label: 'Order by 6PM',      color: '#C78200' },
            { icon: Tag,         label: 'Best Prices',       color: '#8B5CF6' },
          ].map((b, i) => (
            <div key={i} className={cn('flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[8px] font-black', isDark ? 'bg-white/5 border-white/8 text-white/60' : 'bg-white border-slate-100 text-slate-600')}>
              <b.icon size={10} style={{ color: b.color }} />
              {b.label}
            </div>
          ))}
        </div>

        {/* ── CATEGORY TABS ── */}
        <div className="flex gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all',
                activeCategory === cat.key
                  ? 'text-white border-transparent shadow-lg'
                  : isDark ? 'bg-white/5 border-white/8 text-white/40' : 'bg-white border-slate-200 text-slate-500'
              )}
              style={activeCategory === cat.key ? { backgroundColor: cat.color, boxShadow: `0 8px 20px ${cat.color}40` } : {}}
            >
              <cat.icon size={11} /> {cat.label}
            </button>
          ))}
        </div>

        {/* ── PRODUCT GRID ── */}
        <div className="grid grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((p, i) => {
              const qty = getQty(p.id);
              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn(
                    'rounded-[1.8rem] border overflow-hidden flex flex-col',
                    isDark ? 'bg-[#0D1520] border-white/8' : 'bg-white border-slate-100 shadow-sm'
                  )}
                >
                  {/* Product image area */}
                  <div
                    className="h-24 flex items-center justify-center relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${p.color}15, ${p.color}05)` }}
                  >
                    <span className="text-5xl">{p.emoji}</span>
                    {p.tag && (
                      <span
                        className="absolute top-2 left-2 text-[6px] font-black px-1.5 py-0.5 rounded-full text-white uppercase tracking-widest"
                        style={{ backgroundColor: p.color }}
                      >{p.tag}</span>
                    )}
                    {/* Stars */}
                    <div className="absolute bottom-2 right-2 flex items-center gap-0.5">
                      <Star size={8} className="text-amber-400 fill-amber-400" />
                      <span className={cn('text-[7px] font-black', isDark ? 'text-white/50' : 'text-slate-500')}>{p.rating}</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3 flex flex-col flex-1">
                    <p className={cn('text-[8px] font-black uppercase tracking-widest mb-0.5', isDark ? 'text-white/30' : 'text-slate-400')}>{p.brand}</p>
                    <h3 className={cn('text-[11px] font-black tracking-tight leading-snug mb-1', isDark ? 'text-white' : 'text-slate-900')}>{p.name}</h3>
                    <p className={cn('text-[7px] font-medium leading-snug flex-1 mb-2', isDark ? 'text-white/35' : 'text-slate-500')} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {p.desc}
                    </p>

                    {/* Price row */}
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className={cn('text-[13px] font-black leading-none', isDark ? 'text-white' : 'text-slate-900')}>₹{p.price.toLocaleString('en-IN')}</p>
                        <p className={cn('text-[7px] font-medium', isDark ? 'text-white/25' : 'text-slate-400')}>{p.unit}</p>
                      </div>
                      <div className={cn('text-[7px] font-bold', isDark ? 'text-white/25' : 'text-slate-400')}>{p.reviews} reviews</div>
                    </div>

                    {/* Add to cart */}
                    {qty === 0 ? (
                      <button
                        onClick={() => addToCart(p)}
                        className="w-full py-2 rounded-xl text-[9px] font-black text-white flex items-center justify-center gap-1"
                        style={{ backgroundColor: p.color }}
                      >
                        <Plus size={10} /> Add to Cart
                      </button>
                    ) : (
                      <div className="flex items-center justify-between rounded-xl overflow-hidden border" style={{ borderColor: p.color + '40' }}>
                        <button onClick={() => removeFromCart(p.id)} className="w-9 h-8 flex items-center justify-center" style={{ backgroundColor: p.color + '15', color: p.color }}>
                          <Minus size={11} />
                        </button>
                        <span className={cn('text-[12px] font-black flex-1 text-center', isDark ? 'text-white' : 'text-slate-900')}>{qty}</span>
                        <button onClick={() => addToCart(p)} className="w-9 h-8 flex items-center justify-center" style={{ backgroundColor: p.color, color: 'white' }}>
                          <Plus size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <span className="text-5xl">🔍</span>
            <p className={cn('font-black text-sm mt-4', isDark ? 'text-white/30' : 'text-slate-400')}>No products found</p>
          </div>
        )}

        {/* ── CONTACT SECTION ── */}
        <div className={cn('rounded-[2rem] border p-5', isDark ? 'bg-white/[0.03] border-white/8' : 'bg-white border-slate-100 shadow-sm')}>
          <h3 className={cn('font-black text-sm tracking-tight mb-1', isDark ? 'text-white' : 'text-slate-900')}>Need Help?</h3>
          <p className={cn('text-[9px] font-medium mb-4', isDark ? 'text-white/35' : 'text-slate-500')}>
            Talk to our aquaculture expert for the right medicine and feed recommendation for your pond.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => window.open('tel:+919999999999')}
              className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest"
            >
              <Phone size={12} /> Call Expert
            </button>
            <button
              onClick={() => window.open('https://wa.me/919999999999')}
              className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest border"
              style={{ borderColor: '#25D366', color: '#25D366', backgroundColor: '#25D36615' }}
            >
              <MessageCircle size={12} /> WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* ── FLOATING CART BUTTON ── */}
      <AnimatePresence>
        {totalItems > 0 && !showCart && (
          <motion.button
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={() => setShowCart(true)}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 rounded-[2rem] text-white shadow-2xl z-40"
            style={{ background: 'linear-gradient(135deg, #C78200, #92400E)', boxShadow: '0 20px 40px rgba(199,130,0,0.4)' }}
          >
            <ShoppingCart size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">{totalItems} item{totalItems > 1 ? 's' : ''}</span>
            <span className="text-[10px] font-black">· ₹{totalPrice.toLocaleString('en-IN')}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── CART BOTTOM SHEET ── */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCart(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className={cn('fixed bottom-0 left-0 right-0 z-50 rounded-t-[2.5rem] max-h-[80vh] overflow-y-auto', isDark ? 'bg-[#0D1520]' : 'bg-white')}
            >
              {/* Sheet handle */}
              <div className="flex justify-center pt-3 pb-1"><div className={cn('w-10 h-1 rounded-full', isDark ? 'bg-white/20' : 'bg-slate-200')} /></div>

              <div className="px-5 pb-8">
                <div className="flex items-center justify-between mb-5">
                  <h2 className={cn('font-black text-base', isDark ? 'text-white' : 'text-slate-900')}>Your Cart</h2>
                  <button onClick={() => setShowCart(false)} className={cn('w-8 h-8 rounded-full flex items-center justify-center', isDark ? 'bg-white/10 text-white/60' : 'bg-slate-100 text-slate-500')}>
                    <X size={14} />
                  </button>
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-5xl">🛒</span>
                    <p className={cn('font-black text-sm mt-4', isDark ? 'text-white/30' : 'text-slate-400')}>Cart is empty</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-5">
                      {cart.map(item => (
                        <div key={item.id} className={cn('flex items-center gap-3 p-3 rounded-2xl border', isDark ? 'bg-white/5 border-white/8' : 'bg-slate-50 border-slate-100')}>
                          <span className="text-2xl">{item.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-[11px] font-black truncate', isDark ? 'text-white' : 'text-slate-900')}>{item.name}</p>
                            <p className={cn('text-[8px]', isDark ? 'text-white/30' : 'text-slate-400')}>{item.unit} · ₹{(item.price * item.qty).toLocaleString('en-IN')}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => removeFromCart(item.id)} className={cn('w-6 h-6 rounded-lg flex items-center justify-center', isDark ? 'bg-white/10 text-white' : 'bg-slate-200 text-slate-700')}>
                              <Minus size={10} />
                            </button>
                            <span className={cn('text-[11px] font-black w-4 text-center', isDark ? 'text-white' : 'text-slate-900')}>{item.qty}</span>
                            <button onClick={() => { const p = PRODUCTS.find(x => x.id === item.id)!; addToCart(p); }} className="w-6 h-6 rounded-lg bg-[#C78200] text-white flex items-center justify-center">
                              <Plus size={10} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order total */}
                    <div className={cn('rounded-2xl p-4 mb-4 border', isDark ? 'bg-white/5 border-white/8' : 'bg-slate-50 border-slate-100')}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/40' : 'text-slate-500')}>Subtotal</span>
                        <span className={cn('text-[12px] font-black', isDark ? 'text-white' : 'text-slate-900')}>₹{totalPrice.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/40' : 'text-slate-500')}>Delivery</span>
                        <span className="text-[10px] font-black text-emerald-500">{totalPrice >= 2000 ? 'FREE' : '₹99'}</span>
                      </div>
                      {totalPrice < 2000 && (
                        <p className="text-[7px] font-medium text-amber-500 mt-1.5">Add ₹{(2000 - totalPrice).toLocaleString('en-IN')} more for free delivery</p>
                      )}
                    </div>

                    <button
                      onClick={handleOrder}
                      className="w-full py-4 rounded-2xl text-white font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #C78200, #92400E)', boxShadow: '0 12px 30px rgba(199,130,0,0.35)' }}
                    >
                      <MessageCircle size={16} />
                      Order via WhatsApp
                    </button>
                    <p className={cn('text-center text-[7px] font-medium mt-2', isDark ? 'text-white/20' : 'text-slate-400')}>
                      Order confirms via WhatsApp. Cash on delivery available.
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
