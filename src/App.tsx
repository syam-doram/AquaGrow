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
import { Drawer } from './components/Drawer';
import { BottomNav } from './components/BottomNav';
import { ProviderBottomNav } from './components/ProviderBottomNav';
import { PushSyncManager } from './components/PushSyncManager';

// Pages
import { Dashboard } from './pages/Dashboard';
import { PondManagement } from './pages/PondManagement';
import { PondEntry } from './pages/PondEntry';
import { PondDetail } from './pages/PondDetail';
import { WaterMonitoring } from './pages/WaterMonitoring';
import { MarketPrices } from './pages/MarketPrices';
import { Profile } from './pages/Profile';
import { EditProfile } from './pages/EditProfile';
import { SecurityPrivacy } from './pages/SecurityPrivacy';
import { SubscriptionPlan } from './pages/SubscriptionPlan';
import { SystemSettings } from './pages/SystemSettings';
import { AuthScreen } from './pages/AuthScreen';
import { SplashScreen } from './pages/SplashScreen';
import { OnboardingScreen } from './pages/OnboardingScreen';
import { FeedManagement } from './pages/FeedManagement';
import { DiseaseDetection } from './pages/DiseaseDetection';
import { LiveMonitor } from './pages/LiveMonitor';
import { SubscriptionScreen } from './pages/SubscriptionScreen';
import { ExpertConsultations } from './pages/ExpertConsultations';
import { MedicineSchedule } from './pages/MedicineSchedule';
import { WeatherFeedAlert } from './pages/WeatherFeedAlert';
import { LearningCenter } from './pages/LearningCenter';
import { Notifications } from './pages/Notifications';
import { ProfitROI } from './pages/ProfitROI';
import { ExportMarketTrends } from './pages/ExportMarketTrends';
import { AdminDashboard } from './pages/AdminDashboard';
import { PondMonitor } from './pages/PondMonitor';
import { PondFeedingLog } from './pages/PondFeedingLog';
import { CultureSOP } from './pages/CultureSOP';
import { DailySOPLog } from './pages/DailySOPLog';
import { DailyConditionsLog } from './pages/DailyConditionsLog';
import { DailyExpenseLog } from './pages/DailyExpenseLog';
import { WaterLogDetail } from './pages/WaterLogDetail';
import { HarvestRevenue } from './pages/HarvestRevenue';
import { ExpenseReport } from './pages/ExpenseReport';
import { ROIEntry } from './pages/ROIEntry';

// Provider Pages
import { ProviderDashboard } from './pages/ProviderDashboard';
import { ProviderInventory } from './pages/ProviderInventory';
import { ProviderOrders } from './pages/ProviderOrders';

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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [lang, setLang] = useState<Language>('English');
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const t = translations[lang];

  useEffect(() => {
    if (user?.language) {
      setLang(user.language);
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
    <div className="w-full max-w-md mx-auto bg-[#FFFDF5] min-h-[100dvh] relative sm:shadow-2xl overflow-x-hidden font-sans border-x border-black/5 sm:border-none">
      {/* ── GLOBAL MESH GRADIENT ACCENTS ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-5%] left-[-10%] w-[70%] h-[40%] bg-emerald-100/40 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute top-[20%] right-[-10%] w-[60%] h-[35%] bg-blue-50/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] left-[10%] w-[50%] h-[30%] bg-purple-50/40 rounded-full blur-[90px]" />
        <div className="absolute bottom-[-10%] right-[0%] w-[80%] h-[40%] bg-emerald-50/30 rounded-full blur-[110px]" />
      </div>
      {!user ? (
        <AuthScreen t={t} onLanguageChange={setLang} />
      ) : (
        <div className="relative z-10 w-full min-h-[100dvh] flex flex-col">
          <PushSyncManager />
          <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} user={user} t={t} />
          
          <AnimatePresence>
            {isSyncing && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] bg-[#02130F]/90 backdrop-blur-md border border-emerald-500/30 rounded-full px-4 py-1.5 flex items-center gap-2 shadow-2xl"
              >
                <div className="w-3 h-3 border-[1.5px] border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest mt-px">Syncing</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24, ease: [0.33, 1, 0.68, 1] }}
              className="w-full min-h-screen relative z-10"
            >
              <Routes location={location}>
                {/* Farmer Routes */}
                <Route path="/dashboard" element={<Dashboard user={user} t={t} onMenuClick={() => setIsDrawerOpen(true)} />} />
            <Route path="/ponds" element={<PondManagement t={t} onMenuClick={() => setIsDrawerOpen(true)} />} />
            <Route path="/ponds/new" element={<PondEntry t={t} />} />
            <Route path="/ponds/:id" element={<PondDetail t={t} />} />
            <Route path="/ponds/:id/sop" element={<CultureSOP t={t} />} />
            <Route path="/ponds/:id/entry" element={<DailySOPLog t={t} />} />
            <Route path="/ponds/:id/monitor" element={<PondMonitor t={t} />} />
            <Route path="/ponds/:id/water-log/:date?" element={<DailyConditionsLog t={t} />} />
            <Route path="/ponds/:id/feeding" element={<PondFeedingLog t={t} />} />
            <Route path="/monitor" element={<WaterMonitoring t={t} onMenuClick={() => setIsDrawerOpen(true)} />} />
            <Route path="/market" element={<MarketPrices t={t} onMenuClick={() => setIsDrawerOpen(true)} />} />
            <Route path="/profile" element={<Profile t={t} onMenuClick={() => setIsDrawerOpen(true)} />} />
            <Route path="/profile/edit" element={<EditProfile user={user as User} t={t} />} />
            <Route path="/profile/security" element={<SecurityPrivacy t={t} />} />
            <Route path="/profile/subscription" element={<SubscriptionPlan t={t} />} />
            <Route path="/profile/settings" element={<SystemSettings t={t} />} />
            <Route path="/roi" element={<ProfitROI t={t} onMenuClick={() => setIsDrawerOpen(true)} />} />
            <Route path="/export-trends" element={<ExportMarketTrends user={user} t={t} onMenuClick={() => setIsDrawerOpen(true)} />} />
            <Route path="/disease-detection" element={<DiseaseDetection user={user} t={t} />} />
            <Route path="/live-monitor" element={<LiveMonitor user={user} t={t} />} />
            <Route path="/subscription" element={<SubscriptionScreen t={t} />} />
            <Route path="/expert-consultations" element={<ExpertConsultations user={user} t={t} onMenuClick={() => setIsDrawerOpen(true)} />} />
            <Route path="/feed" element={<FeedManagement t={t} onMenuClick={() => setIsDrawerOpen(true)} />} />
            <Route path="/medicine" element={<MedicineSchedule t={t} onMenuClick={() => setIsDrawerOpen(true)} />} />
            <Route path="/weather" element={<WeatherFeedAlert t={t} onMenuClick={() => setIsDrawerOpen(true)} />} />
            <Route path="/learn" element={<LearningCenter t={t} onMenuClick={() => setIsDrawerOpen(true)} />} />
            <Route path="/notifications" element={<Notifications t={t} onMenuClick={() => setIsDrawerOpen(true)} />} />
            <Route path="/water-logs/:pondId/:date" element={<WaterLogDetail t={t} />} />
            <Route path="/harvest-revenue" element={<HarvestRevenue t={t} onMenuClick={() => setIsDrawerOpen(true)} />} />
            <Route path="/expense-report" element={<ExpenseReport t={t} onMenuClick={() => setIsDrawerOpen(true)} />} />
            <Route path="/roi-entry" element={<ROIEntry t={t} />} />
            <Route path="/daily-expense" element={<DailyExpenseLog t={t} />} />
            <Route path="/admin" element={<AdminDashboard t={t} onMenuClick={() => setIsDrawerOpen(true)} />} />

            {/* Provider Routes */}
            <Route path="/provider/dashboard" element={<ProviderDashboard t={t} onMenuClick={() => setIsDrawerOpen(true)} />} />
            <Route path="/provider/inventory" element={<ProviderInventory t={t} onMenuClick={() => setIsDrawerOpen(true)} />} />
            <Route path="/provider/orders" element={<ProviderOrders t={t} onMenuClick={() => setIsDrawerOpen(true)} />} />

            <Route path="*" element={<Navigate to={isProvider ? "/provider/dashboard" : "/dashboard"} replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>

      {/* Persistent Navigation */}
      {showProviderNav && (
        <ProviderBottomNav t={t} onMenuClick={() => setIsDrawerOpen(true)} />
      )}
      {showFarmerNav && (
        <BottomNav t={t} onMenuClick={() => setIsDrawerOpen(true)} />
      )}
        </div>
      )}
    </div>
  );
};
