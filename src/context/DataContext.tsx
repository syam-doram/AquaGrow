import React, { useState, useEffect, useContext, createContext } from 'react';
import { User, Pond, WaterQualityRecord, MarketPrice, FeedRecord, MedicineRecord } from '../types';
import { API_BASE_URL } from '../config';
import { translations } from '../translations';
import { mockMarketPrices, mockWaterRecords } from '../mockData';
import { generateReminders } from '../utils/reminderEngine';

interface DataContextType {
  user: User | null;
  loading: boolean;
  isSyncing: boolean;
  ponds: Pond[];
  marketPrices: MarketPrice[];
  waterRecords: WaterQualityRecord[];
  feedLogs: FeedRecord[];
  setUser: (user: User | null) => void;
  register: (user: Omit<User, 'id' | 'subscriptionStatus'>) => Promise<{ success: boolean; error?: string }>;
  login: (phoneNumber: string, password?: string) => Promise<{ success: boolean; user?: User; error?: string }>;
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
}

const DataContext = createContext<DataContextType | null>(null);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [waterRecords, setWaterRecords] = useState<WaterQualityRecord[]>(() => {
    const saved = localStorage.getItem('aqua_water_records');
    return saved ? JSON.parse(saved) : mockWaterRecords;
  });
  const [feedLogs, setFeedLogs] = useState<FeedRecord[]>([]);
  const [medicineLogs, setMedicineLogs] = useState<MedicineRecord[]>([]);
  const [completedReminderIds, setCompletedReminderIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('completed_reminders');
    return saved ? JSON.parse(saved) : [];
  });

  const [tokens, setTokens] = useState<{ access: string; refresh: string } | null>(() => {
    const saved = localStorage.getItem('aqua_tokens');
    return saved ? JSON.parse(saved) : null;
  });

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

  const refreshAccessToken = async () => {
    if (!tokens?.refresh) return null;
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: tokens.refresh })
      });
      if (response.ok) {
        const data = await response.json();
        const newTokens = { ...tokens, access: data.access_token };
        setTokens(newTokens);
        localStorage.setItem('aqua_tokens', JSON.stringify(newTokens));
        return newTokens;
      }
    } catch (e) {
      console.error("Token refresh failed:", e);
    }
    setUser(null); // Force logout if refresh fails
    return null;
  };

  const apiFetch = async (url: string, options: any = {}, retry = true): Promise<Response> => {
    const response = await fetch(url, {
      ...options,
      headers: { ...getAuthHeaders(options.overrideTokens), ...options.headers }
    });

    if (response.status === 401 && retry && tokens?.refresh) {
      const newTokens = await refreshAccessToken();
      if (newTokens) {
        return fetch(url, {
          ...options,
          headers: { ...getAuthHeaders(newTokens), ...options.headers }
        });
      }
    }
    return response;
  };

  const fetchUserPonds = async (userId: string, overrideTokens?: any) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/user/${userId}/ponds`, { overrideTokens });
      if (response.ok) {
        const data = await response.json();
        setPonds(data.map((p: any) => ({ ...p, id: p._id || p.id })));
      }
    } catch (error) {
      console.error("Error fetching ponds:", error);
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

  useEffect(() => {
    const init = async () => {
      const savedUser = localStorage.getItem('aqua_user');
      if (savedUser && savedUser !== 'null') {
        const u = JSON.parse(savedUser);
        if (u) {
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
          await Promise.all([
            fetchUserPonds(u.id || u._id, activeTokens),
            fetchSubscription(u.id || u._id, activeTokens),
            fetchFeedLogs(u.id || u._id, activeTokens),
            fetchMedicineLogs(u.id || u._id, activeTokens)
          ]);
        }
      } else {
        setUserState(null);
      }
      
      setMarketPrices(mockMarketPrices);
      // waterRecords now loaded from localStorage in useState initializer
      setLoading(false);
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

  const login = async (phoneNumber: string, password?: string) => {
    setIsSyncing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: phoneNumber, password })
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }
      const loggedUser = { ...data.user, id: data.user._id || data.user.id };
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

  const updatePond = (id: string, updates: Partial<Pond>) => {
    setPonds(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
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

  const addWaterRecord = (record: Omit<WaterQualityRecord, 'id'>) => {
    const newRecord: WaterQualityRecord = {
      ...record,
      id: `w_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    };
    setWaterRecords(prev => {
      const updated = [newRecord, ...prev];
      localStorage.setItem('aqua_water_records', JSON.stringify(updated));
      return updated;
    });
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
        setSubscription(data);
        if (user) {
          const currentExpiry = user.subscriptionExpiry ? new Date(user.subscriptionExpiry) : null;
          const baseDate = (currentExpiry && currentExpiry > new Date()) ? currentExpiry : new Date();
          
          const expiry = new Date(baseDate);
          expiry.setFullYear(expiry.getFullYear() + 1);
          
          const updatedUser = { 
            ...user, 
            subscriptionStatus: planName,
            subscriptionExpiry: expiry.toISOString()
          } as User;
          setUser(updatedUser);
        }
        return true;
      }
    } catch (error) {
      console.error("Upgrade error:", error);
    } finally {
      setIsSyncing(false);
    }
    return false;
  };
  const reminders = React.useMemo(() => {
    return generateReminders(ponds, feedLogs, waterRecords, translations[user?.language || 'English']).map((r: any) => ({
      ...r,
      status: completedReminderIds.includes(r.id) ? 'completed' : r.status
    }));
  }, [ponds, feedLogs, waterRecords, user?.language, completedReminderIds]);

  return (
    <DataContext.Provider value={{ 
      user, 
      loading, 
      isSyncing,
      ponds, 
      marketPrices, 
      waterRecords, 
      feedLogs, 
      setUser,
      register: register as any,
      login: login as any,
      addPond,
      updatePond,
      deletePond,
      refreshData: () => fetchUserPonds(user?.id || (user as any)?._id),
      subscription,
      isPro,
      hasAccess,
      upgradePlan,
      addFeedLog,
      addMedicineLog,
      addWaterRecord,
      reminders,
      medicineLogs,
      toggleReminder: (id: string) => {
        setCompletedReminderIds(prev => {
          const next = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
          localStorage.setItem('completed_reminders', JSON.stringify(next));
          return next;
        });
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
