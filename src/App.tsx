import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { DataProvider, useData } from './context/DataContext';
import { translations } from './translations';
import { Language, User } from './types';
import { ErrorBoundary } from './components/ErrorBoundary';

// Capacitor Plugins
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen as CapSplash } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';

// Components
import { BottomNav } from './components/BottomNav';
import { ProviderBottomNav } from './components/ProviderBottomNav';
import { PushSyncManager } from './components/PushSyncManager';
import { GlobalAlertCenter } from './components/GlobalAlertCenter';

// Pages
import { Dashboard } from './pages/dashboard/Dashboard';
import { PondManagement } from './pages/ponds/PondManagement';
import { PondEntry } from './pages/ponds/PondEntry';
import { PondDetail } from './pages/ponds/PondDetail';
import { WaterMonitoring } from './pages/monitoring/WaterMonitoring';
import { MarketPrices } from './pages/market/MarketPrices';
import { Profile } from './pages/profile/Profile';
import { EditProfile } from './pages/profile/EditProfile';
import { SecurityPrivacy } from './pages/profile/SecurityPrivacy';
import { SubscriptionPlan } from './pages/profile/SubscriptionPlan';
import { SystemSettings } from './pages/profile/SystemSettings';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { SplashScreen } from './pages/auth/SplashScreen';
import { OnboardingScreen } from './pages/auth/OnboardingScreen';
import { FeedManagement } from './pages/management/FeedManagement';
import { DiseaseDetection } from './pages/monitoring/DiseaseDetection';
import { LiveMonitor } from './pages/monitoring/LiveMonitor';
import { SubscriptionScreen } from './pages/profile/SubscriptionScreen';
import { ExpertConsultations } from './pages/tools/ExpertConsultations';
import { LanguageSettings } from './pages/profile/LanguageSettings';
import { MedicineSchedule } from './pages/management/MedicineSchedule';
import { WeatherFeedAlert } from './pages/tools/WeatherFeedAlert';
import { LearningCenter } from './pages/tools/LearningCenter';
import { Notifications } from './pages/tools/Notifications';
import { ProfitROI } from './pages/finance/ProfitROI';
import { ExportMarketTrends } from './pages/market/ExportMarketTrends';
import { AdminDashboard } from './pages/dashboard/AdminDashboard';
import { PondMonitor } from './pages/ponds/PondMonitor';
import { PondFeedingLog } from './pages/ponds/PondFeedingLog';
import { CultureSOP } from './pages/logs/CultureSOP';
import { DailySOPLog } from './pages/logs/DailySOPLog';
import { DailyConditionsLog } from './pages/logs/DailyConditionsLog';
import { DailyExpenseLog } from './pages/logs/DailyExpenseLog';
import { WaterLogDetail } from './pages/monitoring/WaterLogDetail';
import { HarvestRevenue } from './pages/finance/HarvestRevenue';
import { ExpenseReport } from './pages/finance/ExpenseReport';
import { ROIEntry } from './pages/finance/ROIEntry';

// Provider Pages
import { ProviderDashboard } from './pages/provider/ProviderDashboard';
import { ProviderInventory } from './pages/provider/ProviderInventory';
import { ProviderOrders } from './pages/provider/ProviderOrders';

export default function App() {
  return (
    <ErrorBoundary>
      <DataProvider>
        <Router>
          <AppContent />
        </Router>
      </DataProvider>
    </ErrorBoundary>
  );
}

const AppContent = () => {
  const { user, loading, isSyncing } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('aqua_lang') as Language) || 'English';
  });
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const t = translations[lang];

  const handleLanguageChange = (l: Language) => {
    setLang(l);
    localStorage.setItem('aqua_lang', l);
  };

  useEffect(() => {
    if (user?.language) {
      handleLanguageChange(user.language);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && user && location.pathname === '/') {
      navigate(user.role === 'provider' ? '/provider/dashboard' : '/dashboard');
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
      <div className="min-h-screen bg-[#FFFDF5] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#C78200] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }


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
  ].some(path => location.pathname.startsWith(path));

  const showProviderNav = isProvider && location.pathname.startsWith('/provider/');

  return (
    <div className="w-full sm:max-w-[420px] mx-auto bg-paper min-h-[100dvh] relative sm:shadow-[0_0_100px_rgba(0,0,0,0.1)] overflow-x-hidden font-sans border-x border-black/[0.02]">
      {/* ── GLOBAL MESH GRADIENT ACCENTS ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-20%] w-[120%] h-[50%] bg-emerald-100/30 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[30%] right-[-30%] w-[100%] h-[40%] bg-blue-50/40 rounded-full blur-[150px]" />
        <div className="absolute bottom-[15%] left-[-15%] w-[80%] h-[35%] bg-purple-50/30 rounded-full blur-[110px]" />
        <div className="absolute bottom-[-15%] right-[-20%] w-[130%] h-[55%] bg-emerald-50/20 rounded-full blur-[130px]" />
      </div>
      {!user ? (
        <Routes>
          <Route path="/login" element={<Login t={t} lang={lang} onLanguageChange={handleLanguageChange} />} />
          <Route path="/register" element={<Register t={t} lang={lang} onLanguageChange={handleLanguageChange} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <div className="relative z-10 w-full min-h-[100dvh] flex flex-col">
          <PushSyncManager />
          <GlobalAlertCenter t={t} />
          
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
                
                {/* Floating Badge (Already defined but now part of AnimatePresence) */}
                {isSyncing && (
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
          </AnimatePresence>

          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 0.15, 
                ease: "linear"
              }}
              className="w-full min-h-[100dvh] relative z-10 overflow-x-hidden"
            >
              <Routes location={location}>
                {/* Farmer Routes */}
                <Route path="/dashboard" element={
                  <>
                    <PushSyncManager />
                    <GlobalAlertCenter t={t} />
                    <Dashboard user={user} t={t} onMenuClick={() => navigate('/profile')} />
                  </>
                } />
                <Route path="/ponds" element={<PondManagement t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/ponds/new" element={<PondEntry t={t} />} />
                <Route path="/ponds/:id" element={<PondDetail t={t} />} />
                <Route path="/ponds/:id/sop" element={<CultureSOP t={t} />} />
                <Route path="/ponds/:id/entry" element={<DailySOPLog t={t} />} />
                <Route path="/ponds/:id/monitor" element={<PondMonitor t={t} />} />
                <Route path="/ponds/:id/water-log/:date?" element={<DailyConditionsLog t={t} />} />
                <Route path="/ponds/:id/feeding" element={<PondFeedingLog t={t} />} />
                <Route path="/monitor" element={<WaterMonitoring t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/market" element={<MarketPrices t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/profile" element={<Profile t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/profile/edit" element={<EditProfile user={user as User} t={t} />} />
                <Route path="/profile/security" element={<SecurityPrivacy t={t} />} />
                <Route path="/profile/subscription" element={<SubscriptionPlan t={t} />} />
                <Route path="/profile/language" element={<LanguageSettings t={t} onLanguageChange={handleLanguageChange} />} />
                <Route path="/profile/settings" element={<SystemSettings t={t} />} />
                <Route path="/roi" element={<ProfitROI t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/export-trends" element={<ExportMarketTrends user={user} t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/disease-detection" element={<DiseaseDetection user={user} t={t} />} />
                <Route path="/live-monitor" element={<LiveMonitor user={user} t={t} />} />
                <Route path="/subscription" element={<SubscriptionScreen t={t} />} />
                <Route path="/expert-consultations" element={<ExpertConsultations user={user} t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/feed" element={<FeedManagement t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/medicine" element={<MedicineSchedule t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/weather" element={<WeatherFeedAlert t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/learn" element={<LearningCenter t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/notifications" element={<Notifications t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/water-logs/:pondId/:date" element={<WaterLogDetail t={t} />} />
                <Route path="/harvest-revenue" element={<HarvestRevenue t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/expense-report" element={<ExpenseReport t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/roi-entry" element={<ROIEntry t={t} />} />
                <Route path="/daily-expense" element={<DailyExpenseLog t={t} />} />
                <Route path="/admin" element={<AdminDashboard t={t} onMenuClick={() => navigate('/profile')} />} />

                {/* Provider Routes */}
                <Route path="/provider/dashboard" element={<ProviderDashboard t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/provider/inventory" element={<ProviderInventory t={t} onMenuClick={() => navigate('/profile')} />} />
                <Route path="/provider/orders" element={<ProviderOrders t={t} onMenuClick={() => navigate('/profile')} />} />

                <Route path="*" element={<Navigate to={isProvider ? "/provider/dashboard" : "/dashboard"} replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>

          {/* Persistent Navigation */}
          {showProviderNav && (
            <ProviderBottomNav t={t} onMenuClick={() => navigate('/profile')} />
          )}
          {showFarmerNav && (
            <BottomNav t={t} onMenuClick={() => navigate('/profile')} />
          )}
        </div>
      )}
    </div>
  );
};
