import { User, Pond, MarketPrice, Disease, WaterQualityRecord, Expert, GlobalTrend } from './types';

export const mockUser: User = {
  id: 'u1',
  name: 'Arjun Reddy',
  phoneNumber: '+91 9876543210',
  password: 'password123',
  location: 'Bhimavaram, AP',
  farmSize: 12.5,
  pondCount: 4,
  language: 'English',
  role: 'farmer',
  subscriptionStatus: 'free',
};

export const mockPonds: Pond[] = [
  {
    id: 'p1',
    userId: 'u1',
    name: 'Pond Alpha',
    size: 2,
    stockingDate: '2023-10-12',
    seedCount: 150000,
    plAge: 15,
    seedSource: 'CP Hatchery',
    species: 'Vannamei',
    status: 'active',
    waterType: 'canal',
    initialSalinity: 15,
    isStocked: true,
  },
  {
    id: 'p2',
    userId: 'u1',
    name: 'Pond Beta',
    size: 1.5,
    stockingDate: '2023-11-15',
    seedCount: 85000,
    plAge: 12,
    seedSource: 'Golden Hatchery',
    species: 'Tiger',
    status: 'active',
    waterType: 'borewell',
    initialSalinity: 12,
    isStocked: true,
  },
  {
    id: 'p3',
    userId: 'u1',
    name: 'Pond Gamma',
    size: 3,
    stockingDate: '2023-05-10',
    seedCount: 200000,
    plAge: 10,
    seedSource: 'CP Hatchery',
    species: 'Vannamei',
    status: 'harvested',
    waterType: 'canal',
    initialSalinity: 18,
    isStocked: true,
  },
  {
    id: 'p4',
    userId: 'u1',
    name: 'Pond Delta',
    size: 1.2,
    stockingDate: '2022-12-01',
    seedCount: 50000,
    plAge: 10,
    seedSource: 'Local Hatchery',
    species: 'Tiger',
    status: 'archive',
    waterType: 'creek',
    initialSalinity: 10,
    isStocked: true,
  },
];

export const mockMarketPrices: MarketPrice[] = [
  ...['Bhimavaram', 'Nellore', 'Vizag', 'Kakinada'].flatMap(loc => [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120].map(sz => {
    const basePrices: Record<number, number> = {
      20: 620, 30: 540, 40: 490, 50: 450, 60: 410, 
      70: 385, 80: 365, 90: 340, 100: 310, 110: 295, 120: 280
    };
    const locOffset = loc === 'Nellore' ? 5 : loc === 'Vizag' ? -3 : loc === 'Kakinada' ? 2 : 0;
    return {
       location: loc,
       shrimpSize: sz,
       price: basePrices[sz] + locOffset,
       date: '2024-03-17',
       demand: sz <= 40 ? 'HIGH' : 'STABLE' as any
    };
  }))
];

export const mockDiseases: Disease[] = [
  {
    name: 'White Spot Syndrome (WSSV)',
    symptoms: ['White spots on carapace', 'Reddish discoloration', 'Lethargy'],
    causes: 'Viral infection often triggered by temperature fluctuations',
    treatment: 'No direct cure. Emergency harvest or water quality optimization.',
    prevention: 'Biosecurity, seed screening, probiotics.',
  },
  {
    name: 'Early Mortality Syndrome (EMS)',
    symptoms: ['Pale hepatopancreas', 'Empty gut', 'Sudden mortality'],
    causes: 'Bacterial (Vibrio parahaemolyticus)',
    treatment: 'Antibiotics (if permitted), water exchange, probiotics.',
    prevention: 'Pond preparation, nursery management.',
  },
];

export const mockWaterRecords: WaterQualityRecord[] = [
  {
    id: 'w1',
    pondId: 'p1',
    date: '2024-03-17',
    ph: 7.8,
    salinity: 15,
    do: 5.2,
    ammonia: 0.04,
    alkalinity: 120,
    temperature: 28.5,
  }
];

export const mockExperts: Expert[] = [
  {
    id: 'e1',
    name: 'Dr. Sarah Chen',
    specialization: 'Bio-security & Viral Diseases',
    experience: '15+ Years',
    rating: 4.9,
    photo: 'https://picsum.photos/seed/expert1/200/200',
    available: true,
  },
  {
    id: 'e2',
    name: 'Prof. Ramesh Kumar',
    specialization: 'Water Quality & Probiotics',
    experience: '20+ Years',
    rating: 4.8,
    photo: 'https://picsum.photos/seed/expert2/200/200',
    available: true,
  },
  {
    id: 'e3',
    name: 'Dr. Linda Nguyen',
    specialization: 'Genetics & Seed Quality',
    experience: '12+ Years',
    rating: 4.7,
    photo: 'https://picsum.photos/seed/expert3/200/200',
    available: false,
  },
];

export const mockGlobalTrends: GlobalTrend[] = [
  { country: 'USA', price: 12.5, trend: 'UP', demand: 'HIGH' },
  { country: 'China', price: 9.8, trend: 'DOWN', demand: 'MEDIUM' },
  { country: 'Japan', price: 15.2, trend: 'STABLE', demand: 'HIGH' },
  { country: 'Vietnam', price: 7.5, trend: 'UP', demand: 'MEDIUM' },
  { country: 'Thailand', price: 8.2, trend: 'STABLE', demand: 'LOW' },
];
