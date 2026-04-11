import React, { useState, useEffect, useContext, createContext } from 'react';
import { Preferences } from '@capacitor/preferences';
import { User, Pond, WaterQualityRecord, MarketPrice, FeedRecord, MedicineRecord } from '../types';
import { API_BASE_URL } from '../config';
import { translations } from '../translations';
import { mockMarketPrices, mockWaterRecords } from '../mockData';
import { generateReminders } from '../utils/reminderEngine';
import { sendHarvestStagePush } from '../services/harvestPushService';

interface DataContextType {
  user: User | null;
  loading: boolean;
  isSyncing: boolean;
  isOffline: boolean;
  serverError: boolean;
  theme: 'light' | 'dark';
  setAppTheme: (theme: 'light' | 'dark') => void;
  ponds: Pond[];
  marketPrices: MarketPrice[];
  waterRecords: WaterQualityRecord[];
  feedLogs: FeedRecord[];
  sopLogs: any[];
  roiEntries: any[];
  aeratorLogs: any[];
  expenses: any[];
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => Promise<boolean>;
  register: (user: Omit<User, 'id' | 'subscriptionStatus'>) => Promise<{ success: boolean; error?: string }>;
  login: (phoneNumber: string, password?: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  loginWithOtp: (phoneNumber: string, otp: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  addPond: (pond: Omit<Pond, 'id'>) => Promise<void>;
  updatePond: (id: string, updates: Partial<Pond>) => void;
  deletePond: (id: string) => Promise<void>;
  addFeedLog: (log: Omit<FeedRecord, 'id'>) => Promise<void>;
  addMedicineLog: (log: Omit<MedicineRecord, 'id'>) => Promise<void>;
  addWaterRecord: (record: Omit<WaterQualityRecord, 'id'>) => void;
  refreshData: () => void;
  subscription: any;
  isPro: boolean;
  hasAccess: (feature: string) => boolean;
  upgradePlan: (planName: string) => Promise<boolean>;
  reminders: any[];
  toggleReminder: (id: string) => void;
  medicineLogs: MedicineRecord[];
  apiFetch: (url: string, options?: any, retry?: boolean) => Promise<Response>;
  notifications: any[];
  addNotification: (title: string, body: string, type?: string) => void;
  markNotificationsRead: () => void;
  unreadCount: number;
  resetPassword: (phoneNumber: string, otp: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateHarvestRequest: (requestId: string, updates: any) => Promise<void>;
  sendHarvestMessage: (requestId: string, message: string, proposedPrice?: number) => Promise<any>;
  harvestRequests: any[];
}

const DataContext = createContext<DataContextType | null>(null);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [serverError, setServerError] = useState(false);
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('aqua_theme');
    if (stored === 'midnight' || stored === 'dark') return 'dark';
    return 'light';
  });
  
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const { value } = await Preferences.get({ key: 'aqua_theme' });
        if (value) {
          const mappedValue = (value === 'midnight' || value === 'oceanic' || value === 'dark') ? 'dark' : 'light';
          setThemeState(mappedValue);
          localStorage.setItem('aqua_theme', mappedValue);
        }
      } catch (e) {
        console.error('Failed to load theme from native storage:', e);
      }
    };
    loadTheme();
  }, []);
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [waterRecords, setWaterRecords] = useState<WaterQualityRecord[]>([]);
  const [feedLogs, setFeedLogs] = useState<FeedRecord[]>([]);
  const [medicineLogs, setMedicineLogs] = useState<MedicineRecord[]>([]);
  const [sopLogs, setSopLogs] = useState<any[]>([]);
  const [roiEntries, setRoiEntries] = useState<any[]>([]);
  const [aeratorLogs, setAeratorLogs] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [completedReminderIds, setCompletedReminderIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [harvestRequests, setHarvestRequests] = useState<any[]>([]);

  const [tokens, setTokens] = useState<{ access: string; refresh: string } | null>(() => {
    const saved = localStorage.getItem('aqua_tokens');
    return saved ? JSON.parse(saved) : null;
  });

  // singleton to hold active refresh request to avoid race condition/multiple simultaneous logout
  const refreshInProgress = React.useRef<Promise<any> | null>(null);

  const getAuthHeaders = (overrideTokens?: { access: string }) => {
    const headers: any = { 'Content-Type': 'application/json' };
    const activeToken = overrideTokens?.access || tokens?.access;
    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`;
    }
    return headers;
  };

  const isExpired = user?.subscriptionExpiry ? new Date(user.subscriptionExpiry) < new Date() : false;
  const isPro = !isExpired && (
                 user?.subscriptionStatus === 'pro' ||
                 user?.subscriptionStatus === 'pro_silver' || 
                 user?.subscriptionStatus === 'pro_gold' || 
                 user?.subscriptionStatus === 'pro_diamond'
                );

  const refreshAccessToken = async (providedRefreshToken?: string) => {
    const refreshToken = providedRefreshToken || tokens?.refresh;
    if (!refreshToken) return null;
    if (refreshInProgress.current) return refreshInProgress.current;

    refreshInProgress.current = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken })
        });
        if (response.ok) {
          const data = await response.json();
          // Crucial: preserve the refresh token if the response doesn't provide a new one
          const newTokens = { 
            access: data.access_token, 
            refresh: data.refresh_token || refreshToken 
          };
          setTokens(newTokens);
          localStorage.setItem('aqua_tokens', JSON.stringify(newTokens));
          refreshInProgress.current = null;
          return newTokens;
        }
      } catch (e) {
        console.error("Token refresh failed:", e);
      }
      refreshInProgress.current = null;
      // setUser(null); // Optional: don't force logout immediately on network failure, let 401 handle it
      return null;
    })();

    return refreshInProgress.current;
  };

  const apiFetch = async (url: string, options: any = {}, retry = true): Promise<Response> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000); // 12s timeout

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: { ...getAuthHeaders(options.overrideTokens), ...options.headers }
      });
      clearTimeout(timeout);

      if (response.status === 401 && retry) {
        const refreshToken = options.overrideTokens?.refresh || tokens?.refresh;
        if (refreshToken) {
          const newTokens = await refreshAccessToken(refreshToken);
          if (newTokens) {
            return fetch(url, {
              ...options,
              headers: { ...getAuthHeaders(newTokens), ...options.headers }
            });
          }
        }
      }
      return response;
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  };

  const fetchUserPonds = async (userId: string, overrideTokens?: any) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/user/${userId}/ponds`, { overrideTokens });
      if (response.ok) {
        const data = await response.json();
        setPonds(data.map((p: any) => ({ ...p, id: p._id || p.id })));
        setServerError(false);
      }
    } catch (error) {
      console.error("Error fetching ponds:", error);
      // Network failure (TypeError: Failed to fetch, AbortError timeout, etc.)
      setServerError(true);
    }
  };

  const fetchSubscription = async (userId: string, overrideTokens?: any) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/user/${userId}/subscription`, { overrideTokens });
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    }
  };

  const fetchFeedLogs = async (userId: string, overrideTokens?: any) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/user/${userId}/feed-logs`, { overrideTokens });
      if (response.ok) {
        const data = await response.json();
        setFeedLogs(data.map((l: any) => ({ ...l, id: l._id })));
      }
    } catch (error) {
      console.error("Error fetching feed logs:", error);
    }
  };

  const fetchMedicineLogs = async (userId: string, overrideTokens?: any) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/user/${userId}/medicine-logs`, { overrideTokens });
      if (response.ok) {
        const data = await response.json();
        setMedicineLogs(data.map((l: any) => ({ ...l, id: l._id })));
      }
    } catch (error) {
      console.error("Error fetching medicine logs:", error);
    }
  };
  
  const fetchWaterLogs = async (userId: string, overrideTokens?: any) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/user/${userId}/water-logs`, { overrideTokens });
      if (response.ok) {
        const data = await response.json();
        setWaterRecords(data.map((l: any) => ({ ...l, id: l._id || l.id })));
      }
    } catch (error) {
      console.error("Error fetching water logs:", error);
    }
  };

  const fetchSOPLogs = async (userId: string, overrideTokens?: any) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/user/${userId}/sop-logs`, { overrideTokens });
      if (response.ok) {
        const data = await response.json();
        setSopLogs(data.map((l: any) => ({ ...l, id: l._id || l.id })));
      }
    } catch (error) {
      console.error("Error fetching SOP logs:", error);
    }
  };

  const fetchROIEntries = async (userId: string, overrideTokens?: any) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/user/${userId}/roi-entries`, { overrideTokens });
      if (response.ok) {
        const data = await response.json();
        setRoiEntries(data.map((l: any) => ({ ...l, id: l._id || l.id })));
      }
    } catch (error) {
      console.error('Error fetching ROI entries:', error);
    }
  };

  const fetchAeratorLogs = async (userId: string, overrideTokens?: any) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/user/${userId}/aerator-logs`, { overrideTokens });
      if (response.ok) {
        const data = await response.json();
        setAeratorLogs(data.map((l: any) => ({ ...l, id: l._id || l.id })));
      }
    } catch (error) {
      console.error('Error fetching aerator logs:', error);
    }
  };

  const fetchExpenses = async (userId: string, overrideTokens?: any) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/user/${userId}/expenses`, { overrideTokens });
      if (response.ok) {
        const data = await response.json();
        setExpenses(data.map((l: any) => ({ ...l, id: l._id || l.id })));
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  };

  const fetchHarvestRequests = async (overrideTokens?: any) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/harvest-requests`, { overrideTokens });
      if (response.ok) {
        const data = await response.json();
        setHarvestRequests(data.map((r: any) => ({ ...r, id: r._id || r.id })));
      }
    } catch (error) {
      console.error("Error fetching harvest requests:", error);
    }
  };

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const savedUser = localStorage.getItem('aqua_user');
        if (savedUser && savedUser !== 'null') {
          const u = JSON.parse(savedUser);
          if (u) {
            setCompletedReminderIds(u.completedReminders || []);
            setNotifications(u.notificationHistory || []);
            const t = JSON.parse(localStorage.getItem('aqua_tokens') || 'null');
            
            // Re-generate tokens for preview user if missing
            let activeTokens = t;
            if (u.id === 'preview_user' && !activeTokens) {
              activeTokens = { access: 'mock_access_token', refresh: 'mock_refresh_token' };
              localStorage.setItem('aqua_tokens', JSON.stringify(activeTokens));
            }
            if (activeTokens) setTokens(activeTokens);

            // Fallback for existing pro users who don't have an expiry set yet
            if (u.subscriptionStatus !== 'free' && !u.subscriptionExpiry) {
              const exp = new Date();
              exp.setFullYear(exp.getFullYear() + 1);
              u.subscriptionExpiry = exp.toISOString();
              localStorage.setItem('aqua_user', JSON.stringify(u));
            }
            setUserState(u);
            // Only fetch farmer-specific data for farmers — providers don't need pond/feed/water logs
            if (u.role !== 'provider') {
              await Promise.all([
                fetchUserPonds(u.id || u._id, activeTokens),
                fetchSubscription(u.id || u._id, activeTokens),
                fetchFeedLogs(u.id || u._id, activeTokens),
                fetchMedicineLogs(u.id || u._id, activeTokens),
                fetchWaterLogs(u.id || u._id, activeTokens),
                fetchSOPLogs(u.id || u._id, activeTokens),
                fetchROIEntries(u.id || u._id, activeTokens),
                fetchAeratorLogs(u.id || u._id, activeTokens),
                fetchExpenses(u.id || u._id, activeTokens),
                fetchHarvestRequests(activeTokens)
              ]);
            } else {
              // For providers: just fetch subscription
              await fetchSubscription(u.id || u._id, activeTokens);
            }
          }
        } else {
          setUserState(null);
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setMarketPrices(mockMarketPrices);
        // waterRecords now loaded from localStorage in useState initializer
        setLoading(false);
      }
    };
    init();
  }, []);

  const setUser = (newUser: User | null, newTokens?: { access: string; refresh: string }) => {
    const isNewLogin = !user || (newUser && ((newUser.id || (newUser as any)._id) !== (user.id || (user as any)._id)));
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem('aqua_user', JSON.stringify(newUser));
      localStorage.removeItem('aqua_logged_out');
      if (newTokens) {
        setTokens(newTokens);
        localStorage.setItem('aqua_tokens', JSON.stringify(newTokens));
      }
      if (isNewLogin) {
        const uid = newUser.id || (newUser as any)._id;
        const currentTokens = newTokens || tokens;
        fetchUserPonds(uid, currentTokens);
        fetchSubscription(uid, currentTokens);
        fetchFeedLogs(uid, currentTokens);
        fetchWaterLogs(uid, currentTokens);
        fetchSOPLogs(uid, currentTokens);
        fetchROIEntries(uid, currentTokens);
        fetchAeratorLogs(uid, currentTokens);
        fetchExpenses(uid, currentTokens);
      }
    } else {
      localStorage.removeItem('aqua_user');
      localStorage.removeItem('aqua_tokens');
      localStorage.setItem('aqua_logged_out', 'true');
      setTokens(null);
      setSubscription(null);
      setPonds([]);
    }
  };

  const register = async (userData: Omit<User, 'id' | 'subscriptionStatus'>) => {
    setIsSyncing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userData.name,
          mobile: userData.phoneNumber,
          email: userData.email,
          password: userData.password,
          location: userData.location,
          role: userData.role,
          farmSize: userData.farmSize,
          pondCount: userData.pondCount,
          language: userData.language
        })
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }
      const registeredUser = { ...data.user, id: data.user._id || data.user.id };
      setUser(registeredUser, { access: data.access_token, refresh: data.refresh_token });
      setSubscription(data.subscription);
      return { success: true };
    } catch (error: any) {
      console.error("Registration error:", error);
      return { success: false, error: 'Cannot connect to server.' };
    } finally {
      setIsSyncing(false);
    }
  };

  const login = async (phoneNumber: string, password?: string, role?: string) => {
    setIsSyncing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: phoneNumber, password, role: role || 'farmer' })
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }
      const loggedUser = { ...data.user, id: data.user._id || data.user.id };
      localStorage.setItem('aqua_phone', phoneNumber);
      setUser(loggedUser, { access: data.access_token, refresh: data.refresh_token });
      setSubscription(data.subscription);
      return { success: true, user: loggedUser };
    } catch (error: any) {
      console.error("Login error:", error);
      return { success: false, error: 'Cannot connect to server.' };
    } finally {
      setIsSyncing(false);
    }
  };

  const loginWithOtp = async (phoneNumber: string, otp: string, role?: string) => {
    setIsSyncing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: phoneNumber, otp, role: role || 'farmer' })
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }
      const loggedUser = { ...data.user, id: data.user._id || data.user.id };
      localStorage.setItem('aqua_phone', phoneNumber);
      setUser(loggedUser, { access: data.access_token, refresh: data.refresh_token });
      setSubscription(data.subscription);
      return { success: true, user: loggedUser };
    } catch (error: any) {
      console.error("Login error:", error);
      return { success: false, error: 'Cannot connect to server.' };
    } finally {
      setIsSyncing(false);
    }
  };

  /** Login with a Firebase Phone Auth ID token (real OTP verified by Firebase) */
  const loginWithFirebaseToken = async (idToken: string, role: string) => {
    setIsSyncing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/firebase-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, role }),
      });
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.error || 'Login failed' };
      const loggedUser = { ...data.user, id: data.user._id || data.user.id };
      setUser(loggedUser, { access: data.access_token, refresh: data.refresh_token });
      setSubscription(data.subscription);
      return { success: true, user: loggedUser };
    } catch (e: any) {
      return { success: false, error: 'Cannot connect to server.' };
    } finally {
      setIsSyncing(false);
    }
  };

  /** Register with a Firebase Phone Auth ID token (real OTP verified by Firebase) */
  const registerWithFirebaseToken = async (idToken: string, payload: {
    name: string; role: string; location?: string; language?: string;
  }) => {
    setIsSyncing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/firebase-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, ...payload }),
      });
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.error || 'Registration failed' };
      const loggedUser = { ...data.user, id: data.user._id || data.user.id };
      setUser(loggedUser, { access: data.access_token, refresh: data.refresh_token });
      setSubscription(data.subscription);
      return { success: true, user: loggedUser };
    } catch (e: any) {
      return { success: false, error: 'Cannot connect to server.' };
    } finally {
      setIsSyncing(false);
    }
  };

  const resetPassword = async (phoneNumber: string, otp: string, newPassword: string) => {
    setIsSyncing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: phoneNumber, otp, newPassword })
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Reset failed' };
      }
      return { success: true };
    } catch (error: any) {
      console.error("Reset error:", error);
      return { success: false, error: 'Cannot connect to server.' };
    } finally {
      setIsSyncing(false);
    }
  };

  const getPondLimit = () => {
    if (!isPro) return 1;
    const status = user?.subscriptionStatus;
    if (status === 'pro_silver') return 3;
    if (status === 'pro_gold') return 6;
    if (status === 'pro_diamond') return 9;
    if (status === 'pro') return 3; // Legacy pro default
    return 1;
  };

  const addPond = async (pond: Omit<Pond, 'id'>) => {
    const limit = getPondLimit();
    const activePondsCount = ponds.filter(p => p.status === 'active').length;
    
    if (activePondsCount >= limit) {
      alert(`Capacity Reached! Your plan allows maximum ${limit} active ponds. Please upgrade to add more.`);
      return;
    }

    setIsSyncing(true);
    try {
      const response = await apiFetch(`${API_BASE_URL}/ponds`, {
        method: 'POST',
        body: JSON.stringify({ ...pond, userId: user?.id || (user as any)?._id })
      });
      if (response.ok) {
        const newPond = await response.json();
        setPonds(prev => [...prev, { ...newPond, id: newPond._id }]);
      }
    } catch (error) {
      console.error("Add pond error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const updatePond = async (id: string, updates: Partial<Pond>) => {
    // Optimistic UI update
    setPonds(prev => prev.map(p => {
       const pondId = p.id?.toString() || (p as any)._id?.toString();
       const targetId = id?.toString();
       return pondId === targetId ? { ...p, ...updates } : p;
    }));
    
    setIsSyncing(true);
    try {
      await apiFetch(`${API_BASE_URL}/ponds/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    } catch (error) {
       console.error("Update pond error:", error);
    } finally {
       setIsSyncing(false);
    }
  };

  const deletePond = async (id: string) => {
    // Optimistic UI Update ensures instant removal
    setPonds(prev => prev.filter(p => (p.id !== id && (p as any)._id !== id)));
    setIsSyncing(true);
    try {
      await apiFetch(`${API_BASE_URL}/ponds/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error("Delete pond error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const addFeedLog = async (log: Omit<FeedRecord, 'id'>) => {
    setIsSyncing(true);
    try {
      const response = await apiFetch(`${API_BASE_URL}/feed-logs`, {
        method: 'POST',
        body: JSON.stringify({ ...log, userId: user?.id || (user as any)?._id })
      });
      if (response.ok) {
        const newLog = await response.json();
        setFeedLogs(prev => [...prev, { ...newLog, id: newLog._id }]);
      }
    } catch (error) {
      console.error("Add feed log error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const addMedicineLog = async (log: Omit<MedicineRecord, 'id'>) => {
    setIsSyncing(true);
    try {
      const response = await apiFetch(`${API_BASE_URL}/medicine-logs`, {
        method: 'POST',
        body: JSON.stringify({ ...log, userId: user?.id || (user as any)?._id })
      });
      if (response.ok) {
        const newLog = await response.json();
        setMedicineLogs(prev => [...prev, { ...newLog, id: newLog._id }]);
      }
    } catch (error) {
      console.error("Add medicine log error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const addWaterRecord = async (record: Omit<WaterQualityRecord, 'id'>) => {
    setIsSyncing(true);
    try {
      const response = await apiFetch(`${API_BASE_URL}/water-logs`, {
        method: 'POST',
        body: JSON.stringify({ ...record, userId: user?.id || (user as any)?._id })
      });
      if (response.ok) {
        const newRecord = await response.json();
        setWaterRecords(prev => [{ ...newRecord, id: newRecord._id || newRecord.id }, ...prev]);
        // Clean up old localStorage for seamless migration
        localStorage.removeItem('aqua_water_records');
      }
    } catch (error) {
      console.error("Add water record error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const addSOPLog = async (log: any) => {
    setIsSyncing(true);
    try {
       const response = await apiFetch(`${API_BASE_URL}/sop-logs`, {
          method: 'POST',
          body: JSON.stringify({ ...log, userId: user?.id || (user as any)?._id })
       });
       if (response.ok) {
          const newLog = await response.json();
          setSopLogs(prev => [...prev, { ...newLog, id: newLog._id || newLog.id }]);
       }
    } catch (error) {
       console.error("Add SOP Log error:", error);
    } finally {
       setIsSyncing(false);
    }
  };

  const addHarvestRequest = async (request: any) => {
    setIsSyncing(true);
    try {
       const response = await apiFetch(`${API_BASE_URL}/harvest-requests`, {
          method: 'POST',
          body: JSON.stringify({ ...request, userId: user?.id || (user as any)?._id })
       });
       if (response.ok) {
          const newReq = await response.json();
          setHarvestRequests(prev => [...prev, { ...newReq, id: newReq._id || newReq.id }]);
       }
    } catch (error) {
       console.error("Add Harvest Request error:", error);
    } finally {
       setIsSyncing(false);
    }
  };

  const updateHarvestRequest = async (requestId: string, updates: any) => {
    setIsSyncing(true);
    // Optimistic UI Update ensures instant refresh when canceling
    setHarvestRequests(prev => {
      console.log("[Optimistic] Updating harvest request:", requestId);
      return prev.map(r => {
        const itemId = r.id?.toString() || r._id?.toString();
        const targetId = requestId?.toString();
        const match = itemId === targetId;
        if (match) console.log("[Optimistic] MATCH FOUND for", itemId);
        return match ? { ...r, ...updates } : r;
      });
    });

    try {
       const response = await apiFetch(`${API_BASE_URL}/harvest-requests/${requestId}`, {
          method: 'PUT',
          body: JSON.stringify(updates)
       });
       if (response.ok) {
          const updated = await response.json();
          setHarvestRequests(prev => prev.map(r => 
            (r.id === requestId || r._id === requestId) ? { ...r, ...updated, id: updated._id || updated.id } : r
          ));

          // ── Fire FCM push for every status transition ──
          if (updates.status) {
            const req = harvestRequests.find(r =>
              r.id?.toString() === requestId || r._id?.toString() === requestId
            );
            const pondId = req?.pondId || updated?.pondId || '';
            const pondName = ponds.find(p => p.id?.toString() === pondId?.toString())?.name || 'Your Pond';
            sendHarvestStagePush(String(pondId), pondName, requestId, updates.status);
          }
       }
    } catch (error) {
       console.error("Update Harvest Request error:", error);
    } finally {
       setIsSyncing(false);
    }
  };

  const addExpense = async (expense: any) => {
    setIsSyncing(true);
    try {
       const response = await apiFetch(`${API_BASE_URL}/expenses`, {
          method: 'POST',
          body: JSON.stringify({ ...expense, userId: user?.id || (user as any)?._id })
       });
       if (response.ok) {
          const newExp = await response.json();
          setExpenses(prev => [...prev, { ...newExp, id: newExp._id || newExp.id }]);
       }
    } catch (error) {
       console.error("Add Expense error:", error);
    } finally {
       setIsSyncing(false);
    }
  };

  const hasAccess = (feature: string) => {
    if (isPro) return true;
    if (!subscription) return false;
    return subscription.features.includes(feature);
  };

  const upgradePlan = async (planName: string) => {
    setIsSyncing(true);
    try {
      const response = await apiFetch(`${API_BASE_URL}/subscription/upgrade`, {
        method: 'POST',
        body: JSON.stringify({ userId: user?.id || (user as any)?._id, planName })
      });
      if (response.ok) {
        const data = await response.json();
        // Server returns the correctly-mapped subscriptionStatus (e.g. 'pro_diamond')
        const newStatus = data.subscriptionStatus || planName;

        setSubscription(data);

        if (user) {
          const currentExpiry = user.subscriptionExpiry ? new Date(user.subscriptionExpiry) : null;
          const baseDate = (currentExpiry && currentExpiry > new Date()) ? currentExpiry : new Date();
          const expiry = new Date(baseDate);
          expiry.setFullYear(expiry.getFullYear() + 1);

          const updatedUser = {
            ...user,
            subscriptionStatus: newStatus as any,
            subscriptionExpiry: expiry.toISOString()
          } as User;

          // Update local state + localStorage
          setUserState(updatedUser);
          localStorage.setItem('aqua_user', JSON.stringify(updatedUser));

          // Persist subscriptionStatus to MongoDB user doc
          const uid = user.id || (user as any)._id;
          await apiFetch(`${API_BASE_URL}/user/${uid}`, {
            method: 'PATCH',
            body: JSON.stringify({
              subscriptionStatus: newStatus,
              subscriptionExpiry: expiry.toISOString()
            })
          });
        }
        return true;
      } else {
        const err = await response.json().catch(() => ({}));
        console.error('Upgrade failed:', err);
      }
    } catch (error) {
      console.error('Upgrade error:', error);
    } finally {
      setIsSyncing(false);
    }
    return false;
  };

  const setAppTheme = async (t: 'light' | 'dark') => {
    setThemeState(t);
    localStorage.setItem('aqua_theme', t);
    try {
      await Preferences.set({ key: 'aqua_theme', value: t });
    } catch (e) {
      console.error('Failed to save to Capacitor Preferences:', e);
    }
  };

  const addNotification = (title: string, body: string, type: string = 'alert') => {
    const newNotif = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      body,
      type,
      date: new Date().toISOString(),
      isRead: false
    };
    const next = [newNotif, ...notifications].slice(0, 50);
    setNotifications(next);
    updateUser({ notificationHistory: next });
  };

  const markNotificationsRead = () => {
    const next = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(next);
    updateUser({ notificationHistory: next });
  };

  const unreadCount = React.useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const reminders = React.useMemo(() => {
    const lang = translations[user?.language || 'English'];
    const todayReminders = generateReminders(ponds, feedLogs, waterRecords, lang, new Date());
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowReminders = generateReminders(ponds, feedLogs, waterRecords, lang, tomorrow);

    return [...todayReminders, ...tomorrowReminders].map((r: any) => ({
      ...r,
      status: completedReminderIds.includes(r.id) ? 'completed' : r.status
    }));
  }, [ponds, feedLogs, waterRecords, user?.language, completedReminderIds]);

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    const uid = user.id || (user as any)._id;
    try {
      const response = await apiFetch(`${API_BASE_URL}/user/${uid}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      if (response.ok) {
        const updated = await response.json();
        const fullUser = { ...user, ...updated, id: updated._id || updated.id };
        setUser(fullUser);
        localStorage.setItem('aqua_user', JSON.stringify(fullUser));
        return true;
      }
    } catch (e) {
      console.error("Profile sync error:", e);
    }
    return false;
  };

  return (
    <DataContext.Provider value={{ 
      user, 
      loading, 
      isSyncing,
      isOffline,
      serverError,
      theme,
      setAppTheme,
      ponds, 
      marketPrices, 
      waterRecords, 
      feedLogs, 
      sopLogs,
      roiEntries,
      aeratorLogs,
      expenses,
      harvestRequests,
      setUser,
      updateUser,
      register: register as any,
      login: login as any,
      loginWithOtp: loginWithOtp as any,
      addPond,
      updatePond,
      deletePond,
      refreshData: () => {
        const uid = user?.id || (user as any)?._id;
        fetchUserPonds(uid);
        fetchWaterLogs(uid);
      },
      subscription,
      isPro,
      hasAccess,
      upgradePlan,
      addFeedLog,
      addMedicineLog,
      addWaterRecord,
      addSOPLog,
      addExpense,
      reminders,
      medicineLogs,
      apiFetch,
      notifications,
      addNotification,
      markNotificationsRead,
      unreadCount,
      resetPassword,
      loginWithFirebaseToken: loginWithFirebaseToken as any,
      registerWithFirebaseToken: registerWithFirebaseToken as any,
      addHarvestRequest,
      updateHarvestRequest,
      sendHarvestMessage: async (requestId: string, message: string, proposedPrice?: number) => {
        try {
          const msg = { message, proposedPrice };
          const res = await apiFetch(`${API_BASE_URL}/harvest-requests/${requestId}/messages`, {
            method: 'POST',
            body: JSON.stringify(msg)
          });
          if (res.ok) {
            const saved = await res.json();
            // Optimistic update — append new message to local state
            setHarvestRequests((prev: any[]) => prev.map((r: any) => {
              const rid = r.id?.toString() || r._id?.toString();
              if (rid === requestId?.toString()) {
                return { ...r, chatMessages: [...(r.chatMessages || []), saved] };
              }
              return r;
            }));
            return saved;
          }
        } catch (err) {
          console.error('[Chat] Failed to send message:', err);
        }
      },
      toggleReminder: (id: string) => {
        const next = completedReminderIds.includes(id) 
          ? completedReminderIds.filter(i => i !== id) 
          : [...completedReminderIds, id];
        setCompletedReminderIds(next);
        updateUser({ completedReminders: next });
      }
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
