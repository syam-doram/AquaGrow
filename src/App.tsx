import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { DataProvider, useData } from './context/DataContext';
import { BottomSheetProvider, useBottomSheet } from './context/BottomSheetContext';
import { translations } from './translations';
import { Language, User } from './types';
import { ErrorBoundary } from './components/ErrorBoundary';

// Capacitor Plugins
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen as CapSplash } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';
import { cn } from './utils/cn';

// Components (always needed — keep static)
import { BottomNav } from './components/BottomNav';
import { ProviderBottomNav } from './components/ProviderBottomNav';
import { PushSyncManager } from './components/PushSyncManager';
import { GlobalAlertCenter } from './components/GlobalAlertCenter';
import { WifiOff, Wifi } from 'lucide-react';
import { useAppUpdate } from './hooks/useAppUpdate';
import { AppUpdateModal } from './components/AppUpdateModal';

// Auth pages (needed on first load — keep static)
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { SplashScreen } from './pages/auth/SplashScreen';
import { OnboardingScreen } from './pages/auth/OnboardingScreen';
import { ForgotPassword } from './pages/auth/ForgotPassword';

// Core pages (keep static — used immediately after login)
import { Dashboard } from './pages/dashboard/Dashboard';

// ── Lazy-loaded pages ─────────────────────────────────────────────────────────
const PondManagement    = lazy(() => import('./pages/ponds/PondManagement').then(m => ({ default: m.PondManagement })));
const PondEntry         = lazy(() => import('./pages/ponds/PondEntry').then(m => ({ default: m.PondEntry })));
const PondDetail        = lazy(() => import('./pages/ponds/PondDetail').then(m => ({ default: m.PondDetail })));
const PondMonitor       = lazy(() => import('./pages/ponds/PondMonitor').then(m => ({ default: m.PondMonitor })));
const PondHarvest       = lazy(() => import('./pages/ponds/PondHarvest').then(m => ({ default: m.PondHarvest })));
const HarvestTracking   = lazy(() => import('./pages/ponds/HarvestTracking').then(m => ({ default: m.HarvestTracking })));
const PondFeedingLog    = lazy(() => import('./pages/ponds/PondFeedingLog').then(m => ({ default: m.PondFeedingLog })));

const WaterMonitoring   = lazy(() => import('./pages/monitoring/WaterMonitoring').then(m => ({ default: m.WaterMonitoring })));
const DiseaseDetection  = lazy(() => import('./pages/monitoring/DiseaseDetection').then(m => ({ default: m.DiseaseDetection })));
const LiveMonitor       = lazy(() => import('./pages/monitoring/LiveMonitor').then(m => ({ default: m.LiveMonitor })));
const WaterTestScanner  = lazy(() => import('./pages/monitoring/WaterTestScanner').then(m => ({ default: m.WaterTestScanner })));
const WaterReportScanner= lazy(() => import('./pages/monitoring/WaterReportScanner').then(m => ({ default: m.WaterReportScanner })));
const WaterLogDetail    = lazy(() => import('./pages/monitoring/WaterLogDetail').then(m => ({ default: m.WaterLogDetail })));
const WaterReportDetail = lazy(() => import('./pages/monitoring/WaterReportDetail').then(m => ({ default: m.WaterReportDetail })));

const MarketPrices      = lazy(() => import('./pages/market/MarketPrices').then(m => ({ default: m.MarketPrices })));
const ExportMarketTrends= lazy(() => import('./pages/market/ExportMarketTrends').then(m => ({ default: m.ExportMarketTrends })));

const Profile           = lazy(() => import('./pages/profile/Profile').then(m => ({ default: m.Profile })));
const EditProfile       = lazy(() => import('./pages/profile/EditProfile').then(m => ({ default: m.EditProfile })));
const SecurityPrivacy   = lazy(() => import('./pages/profile/SecurityPrivacy').then(m => ({ default: m.SecurityPrivacy })));
const PrivacyPolicy     = lazy(() => import('./pages/profile/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const BankPayment       = lazy(() => import('./pages/profile/BankPayment').then(m => ({ default: m.BankPayment })));
const SubscriptionPlan  = lazy(() => import('./pages/profile/SubscriptionPlan').then(m => ({ default: m.SubscriptionPlan })));
const SystemSettings    = lazy(() => import('./pages/profile/SystemSettings').then(m => ({ default: m.SystemSettings })));
const SubscriptionScreen= lazy(() => import('./pages/profile/SubscriptionScreen').then(m => ({ default: m.SubscriptionScreen })));
const LanguageSettings  = lazy(() => import('./pages/profile/LanguageSettings').then(m => ({ default: m.LanguageSettings })));

const FeedManagement    = lazy(() => import('./pages/management/FeedManagement').then(m => ({ default: m.FeedManagement })));
const MedicineSchedule  = lazy(() => import('./pages/management/MedicineSchedule').then(m => ({ default: m.MedicineSchedule })));
const SOPLibrary        = lazy(() => import('./pages/management/SOPLibrary').then(m => ({ default: m.SOPLibrary })));

const ExpertConsultations= lazy(() => import('./pages/tools/ExpertConsultations').then(m => ({ default: m.ExpertConsultations })));
const WeatherFeedAlert  = lazy(() => import('./pages/tools/WeatherFeedAlert').then(m => ({ default: m.WeatherFeedAlert })));
const WeatherAlerts     = lazy(() => import('./pages/tools/WeatherAlerts').then(m => ({ default: m.WeatherAlerts })));
const LearningCenter    = lazy(() => import('./pages/tools/LearningCenter').then(m => ({ default: m.LearningCenter })));
const Notifications     = lazy(() => import('./pages/tools/Notifications').then(m => ({ default: m.Notifications })));
const AquaCalc          = lazy(() => import('./pages/tools/AquaCalc').then(m => ({ default: m.AquaCalc })));
const SmartFarmHub      = lazy(() => import('./pages/tools/SmartFarmHub').then(m => ({ default: m.SmartFarmHub })));

const ProfitROI         = lazy(() => import('./pages/finance/ProfitROI').then(m => ({ default: m.ProfitROI })));
const ROIOverview       = lazy(() => import('./pages/finance/ROIOverview').then(m => ({ default: m.ROIOverview })));
const ROIPondWise       = lazy(() => import('./pages/finance/ROIPondWise').then(m => ({ default: m.ROIPondWise })));
const ROIYearWise       = lazy(() => import('./pages/finance/ROIYearWise').then(m => ({ default: m.ROIYearWise })));
const HarvestRevenue    = lazy(() => import('./pages/finance/HarvestRevenue').then(m => ({ default: m.HarvestRevenue })));
const ExpenseReport     = lazy(() => import('./pages/finance/ExpenseReport').then(m => ({ default: m.ExpenseReport })));
const ROIEntry          = lazy(() => import('./pages/finance/ROIEntry').then(m => ({ default: m.ROIEntry })));

const CultureSOP        = lazy(() => import('./pages/logs/CultureSOP').then(m => ({ default: m.CultureSOP })));
const DailySOPLog       = lazy(() => import('./pages/logs/DailySOPLog').then(m => ({ default: m.DailySOPLog })));
const DailyConditionsLog= lazy(() => import('./pages/logs/DailyConditionsLog').then(m => ({ default: m.DailyConditionsLog })));
const DailyExpenseLog   = lazy(() => import('./pages/logs/DailyExpenseLog').then(m => ({ default: m.DailyExpenseLog })));

const AquaShop          = lazy(() => import('./pages/shop/AquaShop').then(m => ({ default: m.AquaShop })));
const FarmerOrders      = lazy(() => import('./pages/orders/FarmerOrders').then(m => ({ default: m.FarmerOrders })));
const FarmerCommunity   = lazy(() => import('./pages/community/FarmerCommunity').then(m => ({ default: m.FarmerCommunity })));
const AdminDashboard    = lazy(() => import('./pages/dashboard/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

// Provider Pages (lazy — only loaded by provider accounts)
const ProviderDashboard = lazy(() => import('./pages/provider/ProviderDashboard').then(m => ({ default: m.ProviderDashboard })));
const ProviderInventory = lazy(() => import('./pages/provider/ProviderInventory').then(m => ({ default: m.ProviderInventory })));
const ProviderOrders    = lazy(() => import('./pages/provider/ProviderOrders').then(m => ({ default: m.ProviderOrders })));
const ProviderRates     = lazy(() => import('./pages/provider/ProviderRates').then(m => ({ default: m.ProviderRates })));
const ProviderChat      = lazy(() => import('./pages/provider/ProviderChat').then(m => ({ default: m.ProviderChat })));
const ProviderLedger    = lazy(() => import('./pages/provider/ProviderLedger').then(m => ({ default: m.ProviderLedger })));
const ProviderFarmers   = lazy(() => import('./pages/provider/ProviderFarmers').then(m => ({ default: m.ProviderFarmers })));

// Lazy-load fallback spinner
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-paper">
    <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
  </div>
);



export default function App() {
  return (
    <ErrorBoundary>
      <DataProvider>
        <BottomSheetProvider>
          <Router>
            <AppContent />
          </Router>
        </BottomSheetProvider>
      </DataProvider>
    </ErrorBoundary>
  );
}

const AppContent = () => {
  const { user, loading, isSyncing, isOffline, serverError, refreshData, theme } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('aqua_lang') as Language) || 'English';
  });
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showReconnectToast, setShowReconnectToast] = useState(false);
  const [showServerBanner, setShowServerBanner] = useState(false);
  const prevOfflineRef = React.useRef(isOffline);
  const t = translations[lang];
  const appUpdate = useAppUpdate();
  const isDark = theme === 'dark' || theme === 'midnight';

  // Hide native splash immediately when React mounts — prevents white screen
  // between native splash timeout and React SplashScreen rendering
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Small delay ensures our React SplashScreen is painted before native hides
      const timer = setTimeout(() => {
        CapSplash.hide({ fadeOutDuration: 400 });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleLanguageChange = (l: Language) => {
    setLang(l);
    localStorage.setItem('aqua_lang', l);
  };

  // Show a "Back Online" toast when transitioning from offline → online
  useEffect(() => {
    if (prevOfflineRef.current && !isOffline) {
      // Was offline, now online
      setShowReconnectToast(true);
      const t = setTimeout(() => setShowReconnectToast(false), 3500);
      return () => clearTimeout(t);
    }
    prevOfflineRef.current = isOffline;
  }, [isOffline]);

  // Auto-show / auto-dismiss server error banner
  useEffect(() => {
    if (serverError && !isOffline) {
      setShowServerBanner(true);
      const t = setTimeout(() => setShowServerBanner(false), 8000);
      return () => clearTimeout(t);
    } else {
      setShowServerBanner(false);
    }
  }, [serverError, isOffline]);

  useEffect(() => {
    if (user?.language) {
      handleLanguageChange(user.language);
    }
  }, [user]);

  useEffect(() => {
    // ── THEME & STATUS BAR SYNC ──
    const root = document.documentElement;
    root.classList.remove('dark');
    
    if (theme === 'dark') root.classList.add('dark');

    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light });
    }
  }, [theme]);

  // ── AUTO IDLE TIMEOUT ──
  // Navigates the user back to the main dashboard after 3 minutes of zero interaction
  useEffect(() => {
    if (!user) return;
    
    let idleTimeout: ReturnType<typeof setTimeout>;
    
    const resetTimer = () => {
      clearTimeout(idleTimeout);
      idleTimeout = setTimeout(() => {
        const homePath = user.role === 'provider' ? '/provider/dashboard' : '/dashboard';
        if (location.pathname !== homePath && !location.pathname.startsWith('/auth')) {
          navigate(homePath, { replace: true });
        }
      }, 3 * 60 * 1000); // 3 minutes
    };

    const events = ['touchstart', 'mousemove', 'keydown', 'scroll', 'click'];
    events.forEach(event => document.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(idleTimeout);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [user, location.pathname, navigate]);

  useEffect(() => {
    if (loading || !user) return;

    const path = location.pathname;
    const isProviderUser = user.role === 'provider';

    // ─── Root path: redirect to correct home ───────────────────────────────
    if (path === '/') {
      navigate(isProviderUser ? '/provider/dashboard' : '/dashboard', { replace: true });
      return;
    }

    // ─── Provider on farmer route: push back to provider hub ──────────────
    const farmerOnlyPaths = [
      '/dashboard', '/ponds', '/monitor', '/feed', '/medicine',
      '/roi', '/harvest-revenue', '/expense-report', '/roi-entry',
      '/daily-expense', '/market', '/live-monitor', '/water-test-scanner',
      '/disease-detection', '/aqua-calc', '/sop-library', '/smart-farm', '/community',
    ];
    if (isProviderUser && farmerOnlyPaths.some(p => path.startsWith(p))) {
      navigate('/provider/dashboard', { replace: true });
      return;
    }

    // ─── Farmer on provider route: push back to farmer hub ───────────────
    if (!isProviderUser && path.startsWith('/provider/')) {
      navigate('/dashboard', { replace: true });
      return;
    }
  }, [loading, user, location.pathname, navigate]);

  useEffect(() => {
    // ─── ANDROID / MOBILE SYSTEM SETUP ───
    if (Capacitor.isNativePlatform()) {
      const backListener = CapApp.addListener('backButton', ({ canGoBack }: any) => {
        if (!canGoBack || location.pathname === '/dashboard' || location.pathname === '/provider/dashboard' || !user) {
          CapApp.exitApp();
        } else {
          window.history.back();
        }
      });

      // ── Firebase reCAPTCHA deep-link guard ─────────────────────────────────
      // When browser-based reCAPTCHA completes, Chrome redirects back via the
      // custom scheme:  com.aquagrow.app://__/auth/handler?...
      // Capacitor fires appUrlOpen for every incoming URL.  Without an explicit
      // handler, the bridge would dispatch this as a WebView navigation, which
      // triggers React Router's catch-all → /login redirect — unmounting the
      // Login/Register component and destroying the in-memory OTP session
      // (confirmationRef.current = null).  That's why every code entered after
      // reCAPTCHA shows "invalid or expired".
      //
      // Solution: Swallow all Firebase auth deep links silently here.
      // The Firebase Capacitor plugin already processes the intent via
      // onNewIntent() in MainActivity — we just block the React Router side.
      const urlOpenListener = CapApp.addListener('appUrlOpen', (data: { url: string }) => {
        const url = data?.url ?? '';
        // Firebase Phone Auth reCAPTCHA callback URL pattern
        if (
          url.includes('/__/auth/') ||
          url.startsWith('com.aquagrow.app://__/auth') ||
          url.includes('firebaseapp.com/__/auth')
        ) {
          // Silently swallow — Firebase native plugin handles the token internally.
          // DO NOT navigate or reload.
          console.log('[AppUrlOpen] Firebase auth deep link intercepted — suppressed navigation:', url);
          return;
        }
        // For any other deep links, handle normally (future use)
      });

      // ――― Dynamic Status Bar Matching ―――
      const updateStatusBar = async () => {
        const isAuth = !user || location.pathname === '/' || location.pathname === '/onboarding';
        if (isAuth) {
           // Light Theme for Auth/Onboarding (White BG, Dark Icons)
           await StatusBar.setStyle({ style: Style.Light });
           await StatusBar.setBackgroundColor({ color: '#FFFDF5' });
        } else {
           // Emerald Theme for Main Interface (Dark Green BG, Light Icons)
           await StatusBar.setStyle({ style: Style.Dark });
           await StatusBar.setBackgroundColor({ color: '#012B1D' });
        }
      };

      updateStatusBar();

      return () => {
        backListener.then(l => l.remove());
        urlOpenListener.then(l => l.remove());
      };
    }
  }, [location.pathname, user]);

  if (showSplash) {
    return (
      <SplashScreen
        onComplete={() => {
          setShowSplash(false);
          // Hide native Android splash now that our React splash has finished
          if (Capacitor.isNativePlatform()) {
            CapSplash.hide({ fadeOutDuration: 300 });
          }
          // Show onboarding only once (first install) and ONLY if not already logged in
          const seen = localStorage.getItem('aquagrow_onboarded');
          const isLoggedOut = localStorage.getItem('aqua_logged_out');
          const hasUser = localStorage.getItem('aqua_user');
          // If a user exists (auto-login), bypass onboarding completely
          if (!seen && (!hasUser || isLoggedOut === 'true')) {
            setShowOnboarding(true);
          }
        }}
      />
    );
  }

  if (showOnboarding) {
    return (
      <OnboardingScreen
        onComplete={() => {
          localStorage.setItem('aquagrow_onboarded', '1');
          setShowOnboarding(false);
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }


  const { isBottomSheetOpen } = useBottomSheet();
  const isProvider = user?.role === 'provider';
  const isFarmer = user?.role === 'farmer';

  // Determine if BottomNav should be shown based on path
  const showFarmerNav = isFarmer && [
    '/dashboard',
    '/ponds',
    '/monitor',
    '/feed',
    '/medicine',
    '/roi',
    '/harvest-revenue',
    '/expense-report',
    '/roi-entry',
    '/roi/overview',
    '/roi/pond-wise',
    '/roi/year-wise',
    '/smart-farm',
  ].some(path => location.pathname.startsWith(path));

  const showProviderNav = isProvider && location.pathname.startsWith('/provider/');

  return (
    <div className={cn(
      "w-full sm:max-w-[420px] mx-auto bg-paper min-h-[100dvh] relative sm:shadow-[0_0_100px_rgba(0,0,0,0.1)] overflow-x-hidden font-sans border-x border-card-border transition-all duration-700",
      theme === 'dark' && "dark"
    )}>
      {/* ── GLOBAL MESH GRADIENT ACCENTS ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className={cn("absolute top-[-10%] left-[-20%] w-[120%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-pulse", theme === 'dark' && "bg-glow-primary/20")} />
        <div className={cn("absolute top-[30%] right-[-30%] w-[100%] h-[40%] bg-accent/5 rounded-full blur-[150px]", theme === 'dark' && "bg-primary/5")} />
        <div className={cn("absolute bottom-[15%] left-[-15%] w-[80%] h-[35%] bg-primary-light/5 rounded-full blur-[110px]", theme === 'dark' && "bg-glow-primary/10")} />
        <div className={cn("absolute bottom-[-15%] right-[-20%] w-[130%] h-[55%] bg-primary/10 rounded-full blur-[130px]", theme === 'dark' && "bg-accent/5")} />
      </div>
      {!user ? (
        <Routes>
          <Route path="/login" element={<Login t={t} lang={lang} onLanguageChange={handleLanguageChange} />} />
          <Route path="/register" element={<Register t={t} lang={lang} onLanguageChange={handleLanguageChange} />} />
          <Route path="/forgot-password" element={<ForgotPassword t={t} lang={lang} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <div className="relative z-10 w-full min-h-[100dvh] flex flex-col">
          <PushSyncManager />
          <GlobalAlertCenter t={t} />

          {/* ── APP UPDATE MODAL ── */}
          {user && appUpdate.hasUpdate && !appUpdate.dismissed && (
            <AppUpdateModal
              updateInfo={appUpdate.updateInfo!}
              isDark={isDark}
              onDismiss={appUpdate.dismiss}
            />
          )}
          {/* ── GLOBAL API HANDSHAKE INDICATOR ── */}
          <AnimatePresence>
            {(isSyncing || loading) && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed top-0 left-0 right-0 z-[1000] pointer-events-none"
              >
                {/* Slim Top Bar */}
                <div className="h-0.5 bg-emerald-500/10 w-full overflow-hidden">
                  <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="h-full w-1/3 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  />
                </div>
                
                {/* Floating Badge (Syncing) */}
                {isSyncing && !isOffline && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -20 }}
                    className="fixed top-8 left-1/2 -translate-x-1/2 bg-[#02130F]/90 backdrop-blur-md border border-emerald-500/30 rounded-full px-4 py-1.5 flex items-center gap-2 shadow-2xl pointer-events-auto"
                  >
                    <div className="w-3 h-3 border-[1.5px] border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest mt-px">Syncing</span>
                  </motion.div>
                )}
              </motion.div>
            )}
            
            {/* ── OFFLINE STATUS BAR ── */}
            {isOffline && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-24 left-4 right-4 z-[1000] pointer-events-none flex justify-center"
              >
                <div className="bg-red-500/90 backdrop-blur-xl border border-red-400/30 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-[0_20px_40px_rgba(239,68,68,0.3)] pointer-events-auto">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <WifiOff className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white text-[11px] font-black uppercase tracking-wider leading-none">Offline Mode</h3>
                    <p className="text-white/70 text-[10px] mt-0.5">Please check your internet connection</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── BACK ONLINE TOAST ── */}
            {showReconnectToast && !isOffline && (
              <motion.div
                key="reconnect-toast"
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="fixed bottom-24 left-4 right-4 z-[1000] pointer-events-none flex justify-center"
              >
                <div className="bg-emerald-600/95 backdrop-blur-xl border border-emerald-400/30 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-[0_20px_40px_rgba(16,185,129,0.3)]">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Wifi className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white text-[11px] font-black uppercase tracking-wider leading-none">Back Online</h3>
                    <p className="text-white/80 text-[9.5px] mt-0.5">Syncing latest data from server…</p>
                  </div>
                  <div className="w-3.5 h-3.5 border-2 border-white/60 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                </div>
              </motion.div>
            )}

            {/* ── SERVER ERROR BANNER ── */}
            {showServerBanner && !isOffline && !showReconnectToast && (
              <motion.div
                key="server-error-banner"
                initial={{ opacity: 0, y: -24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ type: 'spring', damping: 22, stiffness: 320 }}
                className="fixed top-[calc(env(safe-area-inset-top)+0.3rem)] left-3 right-3 z-[990] max-w-[420px] mx-auto"
              >
                <div className="bg-[#7f1d1d]/95 backdrop-blur-xl border border-red-500/30 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-[0_8px_32px_rgba(239,68,68,0.30)]">
                  {/* Warning icon */}
                  <div className="w-9 h-9 rounded-xl bg-red-500/25 flex items-center justify-center flex-shrink-0">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  </div>
                  {/* Message */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-[10px] font-black uppercase tracking-wider leading-none">Server Unreachable</p>
                    <p className="text-red-200/80 text-[8.5px] mt-0.5 leading-snug">Could not reach AquaGrow server. Showing cached data.</p>
                  </div>
                  {/* Retry */}
                  <button
                    onClick={() => { setShowServerBanner(false); refreshData(); }}
                    className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-white/15 active:bg-white/25 active:scale-95 transition-all rounded-xl text-white text-[8px] font-black uppercase tracking-widest border border-white/15"
                  >
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 4 23 10 17 10"/>
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                    </svg>
                    Retry
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main App Routes */}
          <div className="w-full min-h-[100dvh] relative z-10 overflow-x-hidden">
            {user && (
              <>
                <PushSyncManager />
                <GlobalAlertCenter t={t} />
              </>
            )}
            <Suspense fallback={<PageLoader />}>
              <Routes location={location}>
                {/* Farmer Routes */}
                <Route path="/dashboard" element={<Dashboard user={user} t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/ponds" element={<PondManagement t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/ponds/new" element={<PondEntry t={t} />} />
                <Route path="/ponds/:id" element={<PondDetail t={t} />} />
                <Route path="/ponds/:id/sop" element={<CultureSOP t={t} />} />
                <Route path="/ponds/:id/entry" element={<DailySOPLog t={t} />} />
                <Route path="/ponds/:id/monitor" element={<PondMonitor t={t} />} />
                <Route path="/ponds/:id/water-log/:date?" element={<DailyConditionsLog t={t} />} />
                <Route path="/ponds/:id/feeding" element={<PondFeedingLog t={t} />} />
                <Route path="/ponds/:id/harvest" element={<PondHarvest t={t} />} />
                <Route path="/ponds/:id/tracking" element={<HarvestTracking t={t} />} />
                <Route path="/monitor" element={<WaterMonitoring t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/market" element={<MarketPrices t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/profile" element={<Profile t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/profile/edit" element={<EditProfile user={user as User} t={t} />} />
                <Route path="/profile/security" element={<SecurityPrivacy t={t} />} />
                <Route path="/profile/privacy-policy" element={<PrivacyPolicy t={t} />} />
                <Route path="/profile/bank" element={<BankPayment t={t} />} />
                <Route path="/profile/subscription" element={<SubscriptionPlan t={t} />} />
                <Route path="/profile/language" element={<LanguageSettings t={t} onLanguageChange={handleLanguageChange} />} />
                <Route path="/profile/settings" element={<SystemSettings t={t} />} />
                <Route path="/roi" element={<ProfitROI t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/roi/overview"  element={<ROIOverview  t={t} />} />
                <Route path="/roi/pond-wise" element={<ROIPondWise  t={t} />} />
                <Route path="/roi/year-wise" element={<ROIYearWise  t={t} />} />
                <Route path="/export-trends" element={<ExportMarketTrends user={user} t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/disease-detection" element={<DiseaseDetection user={user} t={t} />} />
                <Route path="/live-monitor" element={<LiveMonitor user={user} t={t} />} />
                <Route path="/water-test-scanner" element={<WaterTestScanner />} />
                <Route path="/subscription" element={<SubscriptionScreen t={t} />} />
                <Route path="/expert-consultations" element={<ExpertConsultations user={user} t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/feed" element={<FeedManagement t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/medicine" element={<MedicineSchedule t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/sop-library" element={<SOPLibrary />} />
                <Route path="/weather" element={<WeatherAlerts t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/weather-feed" element={<WeatherFeedAlert t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/learn" element={<LearningCenter t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/notifications" element={<Notifications t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/water-logs/:pondId/:date" element={<WaterLogDetail t={t} />} />
                <Route path="/monitor/scan" element={<WaterReportScanner t={t} />} />
                <Route path="/monitor/report/:pondId/:date" element={<WaterReportDetail />} />
                <Route path="/harvest-revenue" element={<HarvestRevenue t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/expense-report" element={<ExpenseReport t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/roi-entry" element={<ROIEntry t={t} />} />
                <Route path="/daily-expense" element={<DailyExpenseLog t={t} />} />
                <Route path="/aqua-calc" element={<AquaCalc />} />
                <Route path="/shop" element={<AquaShop />} />
                <Route path="/orders" element={<FarmerOrders />} />
                <Route path="/smart-farm" element={<SmartFarmHub t={t} />} />
                <Route path="/community" element={<FarmerCommunity />} />
                <Route path="/admin" element={<AdminDashboard t={t} onMenuClick={() => navigate('/profile')} />} />

                {/* Provider Routes */}
                <Route path="/provider/dashboard" element={<ProviderDashboard t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/provider/inventory" element={<ProviderInventory t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/provider/orders"    element={<ProviderOrders t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/provider/rates"     element={<ProviderRates t={t} />} />
                <Route path="/provider/chat"      element={<ProviderChat t={t} />} />
                <Route path="/provider/ledger"    element={<ProviderLedger t={t} />} />
                <Route path="/provider/farmers"   element={<ProviderFarmers t={t} />} />

                <Route path="*" element={<Navigate to={isProvider ? "/provider/dashboard" : "/dashboard"} replace />} />
              </Routes>
            </Suspense>
          </div>

          {/* Persistent Navigation — hidden when any bottom sheet is open */}
          <AnimatePresence>
            {showProviderNav && !isBottomSheetOpen && (
              <motion.div
                key="provider-nav"
                initial={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                <ProviderBottomNav t={t} onMenuClick={() => navigate('/profile')} />
              </motion.div>
            )}
            {showFarmerNav && !isBottomSheetOpen && (
              <motion.div
                key="farmer-nav"
                initial={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                <BottomNav t={t} onMenuClick={() => navigate('/profile')} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
