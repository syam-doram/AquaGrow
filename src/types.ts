export type Language = 'English' | 'Telugu' | 'Bengali' | 'Odia' | 'Gujarati' | 'Tamil' | 'Malayalam';
export type SubscriptionStatus = 'free' | 'pro' | 'pro_silver' | 'pro_gold' | 'pro_diamond';

export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  password?: string;
  location: string;
  farmSize: number;
  language: Language;
  role: 'farmer' | 'admin' | 'provider';
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiry?: string;
  email?: string;
  experience?: string;
  fcmToken?: string;
  notifications?: {
    water: boolean;
    feed: boolean;
    market: boolean;
  };
}

export interface Pond {
  id: string;
  userId: string;
  name: string;
  size: number; // acres
  stockingDate: string;
  seedCount: number;
  plAge: number; // Age of PL at stocking (e.g. 10, 15)
  seedSource: string;
  species: 'Vannamei' | 'Tiger';
  status: 'active' | 'harvested' | 'archive';
  sensorId?: string; // Unique IoT Node ID assigned to this pond
  currentWeight?: number;
  history?: PondLog[];
}

export interface PondLog {
  date: string;
  weight: number;
  feed: number;
  mortality?: number;
  doc: number;
  sopComplied: boolean;
}

export interface WaterQualityRecord {
  id: string;
  pondId: string;
  date: string;
  ph: number;
  salinity: number;
  do: number; // Dissolved Oxygen
  ammonia: number;
  alkalinity: number;
  temperature: number;
}

export interface FeedRecord {
  id: string;
  pondId: string;
  date: string;
  time: string;
  brand: string;
  quantity: number; // kg
  weight?: number; // average weight recorded at this time
}

export interface MedicineRecord {
  id: string;
  pondId: string;
  date: string;
  name: string;
  dosage: string;
  doc: number;
}

export interface MarketPrice {
  location: string;
  shrimpSize: number; // count per kg
  price: number;
  date: string;
  demand: 'HIGH' | 'STABLE' | 'LOW';
}

export interface Disease {
  name: string;
  symptoms: string[];
  causes: string;
  treatment: string;
  prevention: string;
}

export interface Expert {
  id: string;
  name: string;
  specialization: string;
  experience: string;
  rating: number;
  photo: string;
  available: boolean;
}

export interface GlobalTrend {
  country: string;
  price: number; // USD/kg
  trend: 'UP' | 'DOWN' | 'STABLE';
  demand: 'HIGH' | 'MEDIUM' | 'LOW';
}
