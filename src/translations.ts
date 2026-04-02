import { Language } from './types';

export interface Translations {
  // Navigation & Headers
  dashboard: string;
  home: string;
  ponds: string;
  feed: string;
  medicine: string;
  roi: string;
  monitor: string;
  market: string;
  profile: string;
  backToDashboard: string;
  backToDashboard_desc: string;
  settings: string;
  systemSettings: string;
  logout: string;

  // Greetings & Status
  systemLive: string;
  systemActive: string;
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;
  welcome: string;
  activePonds: string;

  // Feed & ROI Metrics
  nextFeed: string;
  fcrCalculator: string;
  feedConversionRatio: string;
  currentFCR: string;
  biomassEst: string;
  recalculateRatio: string;
  todaysConsumption: string;
  seeHistory: string;
  logFeedEntry: string;
  brand: string;
  qty: string;
  scheduledFor: string;
  heatStress: string;
  warmDay: string;
  rainEvent: string;
  highWind: string;
  amavasyaFactor: string;
  lowDOAdjustment: string;
  kgPerSlot: string;
  fcrEfficiency: string;
  mealsPerDay: string;
  feedReductionApplied: string;
  adjustmentsActive: string;
  dose: string;
  fcrHighMessage: string;
  fcrOptimalMessage: string;
  efficiency: string;
  super: string;
  optimal: string;
  high: string;
  medium: string;
  low: string;
  avgMealsDay: string;
  performanceInsight: string;
  biomass: string;
  grossKg: string;
  baseKg: string;
  formula: string;
  rate: string;
  fixed: string;
  netPerDay: string;
  todaysSequence: string;
  dailyExecutionRules: string;
  applicationFormula: string;
  pondStockingProfile: string;
  doc: string;
  lakh: string;
  estSurvivingCount: string;
  estimatedBiomass: string;
  survivalRate_short: string;
  monitorTrays: string;
  blindFeedingActive: string;
  applyAction: string;
  adjustNextSlot: string;
  totalFeed: string;
  noActivePonds: string;
  humidity: string;
  wind: string;
  hrs: string;
  min: string;

  // System Settings & Profile
  smartFarmAlerts: string;
  measurementUnit: string;
  units: string;
  appTheme: string;
  notifications: string;
  waterQualityAlerts: string;
  feedingReminders: string;
  scheduleSync: string;
  docFeedPlan: string;
  metricsFcr: string;
  aiDiagnostics: string;
  aiServiceStatus: string;
  secureCloudManaged: string;
  region: string;
  editProfile: string;
  securityPrivacy: string;
  subscriptionPlan: string;
  saveChanges: string;
  fullName: string;
  phoneNumber: string;
  emailAddress: string;
  experience: string;
  language: string;
  selectLanguage: string;
  farmDetails: string;
  pondName: string;
  pondSize: string;
  stockingDate: string;
  seedCount: string;
  species: string;
  plAge: string;
  status: string;
  waterQuality: string;
  feedManagement: string;
  healthCheck: string;
  harvest: string;
  addPond: string;
  addFirstPond: string;
  addFirstPondDesc: string;
  save: string;
  cancel: string;
  kg: string;
  acres: string;
  hectares: string;
  revenue: string;
  netProfit: string;
  totalInvested: string;
  costPerKg: string;
  pricePerKgLabel: string;
  profitPerKg: string;
  back: string;
  next: string;
  close: string;
  loading: string;
  error: string;
  success: string;
  proFeature: string;
  unlockPro: string;
  subscription: string;
  premiumModel: string;
  projectedEfficiency: string;
  diseaseAlert: string;
  diagnoseNow: string;
  opaqueMuscleSign: string;
  softShellSign: string;
  surfaceBubbleSign: string;
  harvestHistory: string;
  noRoiProfiles: string;
  logFirstHarvest: string;
  compilingReport: string;
  aggregatingDatasets: string;
  recentCyclePerformance: string;
  pondPerformance: string;
  cyclesLogged: string;
  annualFiscalReport: string;
  investedVsRevenue: string;
  netMargin: string;
  opexInvested: string;
  totalReceipts: string;
  gradeAYield: string;
  gradeBYield: string;
  marketSubsidy: string;
  saveROIProfile: string;
  good: string;
  fair: string;
  poor: string;
  excellent: string;
  stable: string;
  urgent: string;
  dailyFeedCost: string;
  estFeedCostPerKg: string;
  allTasksDone: string;
  viewAllPonds: string;
  disease: string;
  learn: string;
  sop: string;
  growthStage: string;
  count: string;
  ultraHigh: string;
  liveMarketRates: string;

  // Auth & Registration
  login: string;
  register: string;
  enterOtp: string;
  verifyOtp: string;
  location: string;
  pondCount: string;
  otpSent: string;
  invalidOtp: string;
  totalAcres: string;
  numberOfPonds: string;
  farmLocation: string;
  english: string;
  telugu: string;
  bengali: string;
  odia: string;
  gujarati: string;
  tamil: string;
  malayalam: string;
  loginFailed: string;
  fillAllFields: string;
  otpVerified: string;
  resendOtp: string;
  alreadyHaveAccount: string;
  dontHaveAccount: string;
  farmer: string;
  provider: string;
  password: string;
  ecosystemForFarmers: string;
  registrationFailed: string;
  verifyAndJoin: string;
  getVerified: string;
  signInPrompt: string;

  // Lunar & Water
  amavasyaWarning: string;
  ashtamiWarning: string;
  moonPhaseTitle: string;
  massMoltingRisk: string;
  newMoonDay: string;
  fullAerationNight: string;
  reduceFeedBy30: string;
  immunityBoosterVitaminC: string;
  lunarPlanApplied: string;
  expertMentor: string;
  todayTask: string;
  sopDescription: string;
  medicineBrand: string;
  recommendedDose: string;
  viewChecklist: string;
  complianceRule: string;
  criticalStageAlert: string;
  stage5g: string;
  stage15g: string;
  stage25g: string;
  stage35g: string;
  daysTaken: string;
  sinceStocking: string;
  dailyLogTitle: string;
  acclimatizationDone: string;
  probioticApplied: string;
  aerationLevel: string;
  mineralsApplied: string;
  gutProbioticMixed: string;
  zeoliteApplied: string;
  sludgeChecked: string;
  vibriosisSigns: string;
  feedTrayCheck: string;
  immunityBoostersAdded: string;
  aerator24h: string;
  pondBottomCleaned: string;
  waterExchangeDone: string;
  targetSizeAchieved: string;
  cultureSOP: string;
  stockingDensity: string;
  aeratorRequirement: string;
  cultureSchedule: string;
  medicinesPlan: string;
  warningSigns: string;
  productionExpectation: string;
  logMedication: string;
  dailySOP: string;
  temperature: string;
  salinity: string;
  ammonia: string;
  dissolvedO2: string;
  pondNotFound: string;
  deletePondConfirm: string;
  growthMilestones: string;
  weightLabel: string;
  currentConditions: string;
  fullMarket: string;
  logTodaysConditions: string;
  notLogged: string;
  checklist: string;
  sopTasks: string;
  scanShrimpDesc: string;
  liveCultureOversight: string;
  protectedMode: string;
  cultureTimeline: string;
  dailyStats: string;
  today: string;
  notLoggedYet: string;
  goldenRulesSchedule: string;
  waterLog: string;
  morning1: string;
  morning2: string;
  afternoon: string;
  evening1: string;
  evening2: string;
  pondPerformance_short: string;
  feedLogs: string;
  sopEngineAlert: string;
  autoEngineAlert: string;
  startYourFirstPond: string;
  totalPonds: string;
  totalArea: string;
  pendingAlerts: string;
  fcrRatio: string;
  feedBiomassGain: string;
  survivalEst: string;
  pondDocProgress: string;
  days: string;
  weather: string;
  todaysTasks: string;
  viewSchedule: string;
  inventory: string;
  orders: string;
  
  // Market Prices & Locations
  blackTiger: string;
  scampi: string;
  bhimavaram: string;
  nellore: string;
  vizag: string;
  kakinada: string;
  marketSnapshot: string;
  dailyExportPriceIndex: string;
  exportDemand: string;
  festiveSeason: string;
  stockAccumulation: string;
  premium: string;
  standard: string;
  priceUp: string;
  priceDown: string;
  priceHistory: string;
  profitMargin: string;
  recommendationStatus: string;
  harvestLabel: string;
  harvestAdvice: string;

  // Additional Common Keys
  archive: string;
  noEntries: string;
  phLevel: string;
  investmentBreakdown: string;
  profitCalculator: string;
  upgradeToPro: string;
  logEntry: string;
}

const English: Translations = {
  dashboard: 'Dashboard',
  home: 'Home',
  ponds: 'Ponds',
  feed: 'Feed',
  medicine: 'Medicine',
  roi: 'ROI',
  monitor: 'Monitor',
  market: 'Market',
  profile: 'Profile',
  backToDashboard: 'Back to Dashboard',
  backToDashboard_desc: 'Return to overview',
  settings: 'Settings',
  systemSettings: 'System Settings',
  logout: 'Logout',
  systemLive: 'System Live',
  systemActive: 'System Active',
  goodMorning: 'Good Morning,',
  goodAfternoon: 'Good Afternoon,',
  goodEvening: 'Good Evening,',
  welcome: 'Welcome,',
  activePonds: 'Active Ponds',
  nextFeed: 'Next Feed',
  fcrCalculator: 'FCR Calculator',
  feedConversionRatio: 'Feed Conversion Ratio',
  currentFCR: 'Current FCR',
  biomassEst: 'Biomass Est.',
  recalculateRatio: 'Recalculate Ratio',
  todaysConsumption: "Today's Consumption",
  seeHistory: 'See History',
  logFeedEntry: 'Log Feed Entry',
  brand: 'Brand',
  qty: 'Qty (kg)',
  scheduledFor: 'Scheduled',
  heatStress: 'Heat Stress',
  warmDay: 'Warm Day',
  rainEvent: 'Rain Event',
  highWind: 'High Wind',
  amavasyaFactor: 'Amavasya',
  lowDOAdjustment: 'Low DO',
  kgPerSlot: 'kg per slot',
  fcrEfficiency: 'FCR Efficiency',
  mealsPerDay: 'meals per day',
  feedReductionApplied: 'Feed Reduction Applied',
  adjustmentsActive: 'Adjustments Active',
  dose: 'dose',
  fcrHighMessage: 'FCR is high. Monitor feed trays and reduce wasted feed.',
  fcrOptimalMessage: 'FCR is within optimal range. Maintaining good growth.',
  efficiency: 'Efficiency',
  super: 'Super',
  optimal: 'Optimal',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  avgMealsDay: 'Avg Meals/Day',
  performanceInsight: 'Performance Insight',
  biomass: 'Biomass',
  grossKg: 'Gross KG',
  baseKg: 'Base KG',
  formula: 'Formula',
  rate: 'Rate',
  fixed: 'Fixed',
  netPerDay: 'Net Per Day',
  todaysSequence: "Today's Sequence",
  dailyExecutionRules: 'Daily Execution Rules',
  applicationFormula: 'Application Formula',
  pondStockingProfile: 'Pond Stocking Profile',
  doc: 'DOC',
  lakh: 'Lakh',
  estSurvivingCount: 'Est. Surviving Count',
  estimatedBiomass: 'Estimated Biomass',
  survivalRate_short: 'Survival',
  monitorTrays: 'Monitor check-trays closely',
  blindFeedingActive: 'Blind feeding active (DOC < 10)',
  applyAction: 'Apply',
  adjustNextSlot: 'Adjust next slot based on trays',
  totalFeed: 'Total Feed',
  noActivePonds: 'No Active Ponds',
  humidity: 'Humidity',
  wind: 'Wind',
  hrs: 'hrs',
  min: 'min',
  smartFarmAlerts: 'Smart Farm Alerts',
  measurementUnit: 'Measurement Unit',
  units: 'Units',
  appTheme: 'App Theme',
  notifications: 'Notifications',
  waterQualityAlerts: 'Water Quality Alerts',
  feedingReminders: 'Feeding Reminders',
  scheduleSync: 'Schedule Sync',
  docFeedPlan: 'DOC Feed Plan',
  metricsFcr: 'FCR Metrics',
  aiDiagnostics: 'AI & Diagnostics',
  aiServiceStatus: 'AI Service Status',
  secureCloudManaged: 'Secure Cloud Managed',
  region: 'Region',
  editProfile: 'Edit Profile',
  securityPrivacy: 'Security & Privacy',
  subscriptionPlan: 'Subscription Plan',
  saveChanges: 'Save Changes',
  fullName: 'Full Name',
  phoneNumber: 'Phone Number',
  emailAddress: 'Email Address',
  experience: 'Experience',
  language: 'Language',
  selectLanguage: 'Select Language',
  farmDetails: 'Farm Details',
  pondName: 'Pond Name',
  pondSize: 'Pond Size',
  stockingDate: 'Stocking Date',
  seedCount: 'Seed Count',
  species: 'Species',
  plAge: 'PL Age',
  status: 'Status',
  waterQuality: 'Water Quality',
  feedManagement: 'Feed Management',
  healthCheck: 'Health Check',
  harvest: 'Harvest',
  addPond: 'Add Pond',
  addFirstPond: 'Add First Pond',
  addFirstPondDesc: 'Add your first pond to begin tracking.',
  save: 'Save',
  cancel: 'Cancel',
  kg: 'kg',
  acres: 'Acres',
  hectares: 'Hectares',
  revenue: 'Revenue',
  netProfit: 'Net Profit',
  totalInvested: 'Total Invested',
  costPerKg: 'Cost/kg',
  pricePerKgLabel: 'Price/kg',
  profitPerKg: 'Profit/kg',
  back: 'Back',
  next: 'Next',
  close: 'Close',
  loading: 'Loading...',
  error: 'Error',
  success: 'Success',
  proFeature: 'Pro Feature',
  unlockPro: 'Unlock Pro Access',
  subscription: 'Subscription',
  premiumModel: 'Premium Model',
  projectedEfficiency: 'Projected Efficiency',
  diseaseAlert: 'Disease Alert',
  diagnoseNow: 'Diagnose Now',
  opaqueMuscleSign: 'Opaque Muscle',
  softShellSign: 'Soft Shell',
  surfaceBubbleSign: 'Surface Bubble',
  harvestHistory: 'Harvest History',
  noRoiProfiles: 'No ROI Profiles Yet',
  logFirstHarvest: '+ Log First Harvest',
  compilingReport: 'Compiling Report...',
  aggregatingDatasets: 'Aggregating all P&L datasets',
  recentCyclePerformance: 'Recent Cycle Performance',
  pondPerformance: 'Pond Performance',
  cyclesLogged: 'Cycles Logged',
  annualFiscalReport: 'Annual Fiscal Report',
  investedVsRevenue: 'Invested vs Revenue',
  netMargin: 'Net Margin',
  opexInvested: 'OpEx Invested',
  totalReceipts: 'Total Receipts',
  gradeAYield: 'Grade-A Yield (%)',
  gradeBYield: 'Grade-B Yield (%)',
  marketSubsidy: 'Market Subsidy',
  saveROIProfile: 'Save ROI Profile',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
  excellent: 'Excellent',
  stable: 'Stable',
  urgent: 'Urgent',
  dailyFeedCost: 'Daily Feed Cost',
  estFeedCostPerKg: '@ ₹55/kg est.',
  allTasksDone: 'All tasks completed',
  viewAllPonds: 'View All Ponds',
  disease: 'Disease',
  learn: 'Learn',
  sop: 'SOP',
  growthStage: 'Growth Stage',
  count: 'Count',
  ultraHigh: 'Ultra High',
  liveMarketRates: 'Live Market Rates',
  login: 'Login',
  register: 'Register',
  enterOtp: 'Enter OTP',
  verifyOtp: 'Verify OTP',
  location: 'Location',
  pondCount: 'Pond Count',
  otpSent: 'OTP Sent',
  invalidOtp: 'Invalid OTP',
  totalAcres: 'Total Acres',
  numberOfPonds: 'Number of Ponds',
  farmLocation: 'Farm Location',
  english: 'English',
  telugu: 'Telugu',
  bengali: 'Bengali',
  odia: 'Odia',
  gujarati: 'Gujarati',
  tamil: 'Tamil',
  malayalam: 'Malayalam',
  loginFailed: 'Login Failed',
  fillAllFields: 'Please fill all fields',
  otpVerified: 'OTP Verified',
  resendOtp: 'Resend OTP',
  alreadyHaveAccount: 'Already have an account? Sign In',
  dontHaveAccount: "Don't have an account? Get Verified",
  farmer: 'Farmer',
  provider: 'Service Provider',
  password: 'Password',
  ecosystemForFarmers: 'ELITE ECOSYSTEM FOR AQUA FARMERS',
  registrationFailed: 'Registration Failed. Please try again.',
  verifyAndJoin: 'VERIFY & JOIN',
  getVerified: 'GET VERIFIED',
  signInPrompt: 'SIGN IN',
  amavasyaWarning: 'Amavasya (New Moon) - High Risk Period',
  ashtamiWarning: 'Ashtami / Navami - Moderate Risk Days',
  moonPhaseTitle: 'Lunar Cycle Alert',
  massMoltingRisk: 'High risk of mass molting and DO drop tonight.',
  newMoonDay: 'Amavasya Day',
  fullAerationNight: 'Strong aeration at night (Full Night)',
  reduceFeedBy30: 'Reduce feed by 20-30% tonight.',
  immunityBoosterVitaminC: 'Add Vitamin C / Immunity booster.',
  lunarPlanApplied: 'Lunar Management Plan Applied',
  expertMentor: 'Expert Mentor',
  todayTask: "Today's SOP Task",
  sopDescription: 'SOP Description',
  medicineBrand: 'Medicine / Brand',
  recommendedDose: 'Recommended Dose',
  viewChecklist: 'View Checklist',
  complianceRule: 'Compliance Rule',
  criticalStageAlert: 'CRITICAL STAGE ALERT',
  stage5g: '5g Growth',
  stage15g: '15g Growth',
  stage25g: '25g Growth',
  stage35g: '35g Growth',
  daysTaken: 'Days Taken',
  sinceStocking: 'Since Stocking',
  dailyLogTitle: 'Daily SOP Log',
  acclimatizationDone: 'Acclimatization Done?',
  probioticApplied: 'Probiotic Applied?',
  aerationLevel: 'Aeration Level',
  mineralsApplied: 'Minerals Applied?',
  gutProbioticMixed: 'Gut Probiotic Mixed?',
  zeoliteApplied: 'Zeolite Applied?',
  sludgeChecked: 'Sludge Checked?',
  vibriosisSigns: 'Vibriosis Signs?',
  feedTrayCheck: 'Feed Tray Checked?',
  immunityBoostersAdded: 'Immunity Boosters Added?',
  aerator24h: 'Aerators running 24h?',
  pondBottomCleaned: 'Pond Bottom Cleaned?',
  waterExchangeDone: 'Water Exchange Done?',
  targetSizeAchieved: 'Target Size Achieved?',
  cultureSOP: 'Culture SOP',
  stockingDensity: 'Stocking Density',
  aeratorRequirement: 'Aerator Needs',
  cultureSchedule: 'Culture Schedule',
  medicinesPlan: 'Medicine Plan',
  warningSigns: 'Warning Signs',
  productionExpectation: 'Yield Forecast',
  logMedication: 'Log Medication',
  dailySOP: 'Daily SOP Tracker',
  temperature: 'Temperature',
  salinity: 'Salinity',
  ammonia: 'Ammonia',
  dissolvedO2: 'Dissolved O2',
  pondNotFound: 'Pond not found',
  deletePondConfirm: 'Are you sure you want to delete this pond? All data will be lost.',
  growthMilestones: 'Growth Milestones',
  weightLabel: 'Target Weight (g)',
  currentConditions: 'Current Conditions',
  fullMarket: 'Full Market',
  logTodaysConditions: "Log Today's Conditions",
  notLogged: 'Not Logged',
  checklist: 'Checklist',
  sopTasks: 'SOP Tasks',
  scanShrimpDesc: 'Scan shrimp for early signs of disease',
  liveCultureOversight: 'Live Culture Oversight',
  protectedMode: 'Protected Mode',
  cultureTimeline: 'Culture Timeline',
  dailyStats: 'Daily Statistics',
  today: 'Today',
  notLoggedYet: 'Not logged yet',
  goldenRulesSchedule: 'Golden Rules & Schedule',
  waterLog: 'Water Log',
  morning1: 'Slot 1',
  morning2: 'Slot 2',
  afternoon: 'Slot 3',
  evening1: 'Slot 4',
  evening2: 'Slot 5',
  pondPerformance_short: 'Perf',
  feedLogs: 'Feed Logs',
  sopEngineAlert: 'SOP Engine Alert',
  autoEngineAlert: 'Automated Engine Alert',
  startYourFirstPond: 'Start Your First Pond',
  totalPonds: 'Total Ponds',
  totalArea: 'Total Area',
  pendingAlerts: 'Pending Alerts',
  fcrRatio: 'FCR Ratio',
  feedBiomassGain: 'Feed vs Biomass Gain',
  survivalEst: 'Survival Estimate',
  pondDocProgress: 'Pond DOC Progress',
  days: 'days',
  weather: 'Weather',
  todaysTasks: "Today's Tasks",
  viewSchedule: 'View Schedule',
  inventory: 'Inventory',
  orders: 'Orders',

  // Market Prices & Locations
  blackTiger: 'Black Tiger',
  scampi: 'Scampi',
  bhimavaram: 'Bhimavaram',
  nellore: 'Nellore',
  vizag: 'Vizag',
  kakinada: 'Kakinada',
  marketSnapshot: 'Market Snapshot',
  dailyExportPriceIndex: 'Daily Export Price Index',
  exportDemand: 'Strong Export Demand',
  festiveSeason: 'Festive Season High',
  stockAccumulation: 'Local Stock Accumulation',
  premium: 'Premium',
  standard: 'Standard',
  priceUp: 'Price Up',
  priceDown: 'Price Down',
  priceHistory: 'Price History',
  profitMargin: 'Profit Margin',
  recommendationStatus: 'Rec. Status',
  harvestLabel: 'HARVEST',
  harvestAdvice: 'Harvest Advice',

  // Additional Common Keys
  archive: 'Archive',
  noEntries: 'No Entries Found',
  phLevel: 'pH Level',
  investmentBreakdown: 'Investment Breakdown',
  profitCalculator: 'Profit Calculator',
  upgradeToPro: 'Upgrade to Pro',
  logEntry: 'Log your first harvest to see analytics here.',
};

const Telugu: Translations = {
  ...English,
  dashboard: 'అక్వాగ్రో',
  home: 'హోమ్',
  ponds: 'చెరువులు',
  feed: 'మేత నిర్వహణ',
  medicine: 'మందుల షెడ్యూల్',
  roi: 'లాభం & ROI',
  monitor: 'పర్యవేక్షణ',
  market: 'మార్కెట్',
  profile: 'ప్రొఫైల్',
  backToDashboard: 'డాష్‌బోర్డ్‌కు వెనుకకు',
  backToDashboard_desc: 'డాష్‌బోర్డ్‌కు తిరిగి వెళ్ళండి',
  settings: 'సెట్టింగ్‌లు',
  systemSettings: 'సిస్టమ్ సెట్టింగ్‌లు',
  logout: 'లాగ్ అవుట్',
  systemLive: 'సిస్టమ్ లైవ్',
  systemActive: 'సిస్టమ్ యాక్టివ్',
  goodMorning: 'శుభోదయం,',
  goodAfternoon: 'శుభ మధ్యాహ్నం,',
  goodEvening: 'శుభ సాయంత్రం,',
  welcome: 'స్వాగతం,',
  activePonds: 'క్రియాశీల చెరువులు',
  nextFeed: 'తదుపరి మేత',
  fcrCalculator: 'FCR కాలిక్యులేటర్',
  feedConversionRatio: 'మేత మార్పిడి నిష్పత్తి',
  currentFCR: 'ప్రస్తుత FCR',
  biomassEst: 'బయోమాస్ అంచనా',
  recalculateRatio: 'నిష్పత్తిని తిరిగి లెక్కించండి',
  todaysConsumption: 'నేటి వినియోగం',
  seeHistory: 'చరిత్రను చూడండి',
  logFeedEntry: 'మేత నమోదు చేయండి',
  brand: 'బ్రాండ్',
  qty: 'పరిమాణం (కిలోలు)',
  scheduledFor: 'షెడ్యూల్ చేయబడింది',
  heatStress: 'తీవ్ర ఉష్ణోగ్రత',
  warmDay: 'వేడి రోజు',
  rainEvent: 'వర్షం',
  highWind: 'గాలులు',
  amavasyaFactor: 'అమావాస్య',
  lowDOAdjustment: 'తక్కువ DO',
  kgPerSlot: 'స్లాట్‌కు కిలోలు',
  fcrEfficiency: 'FCR సామర్థ్యం',
  mealsPerDay: 'రోజుకు మేతలు',
  feedReductionApplied: 'మేత తగ్గింపు అన్వయించబడింది',
  adjustmentsActive: 'సర్దుబాట్లు అమలులో ఉన్నాయి',
  dose: 'మోతాదు',
  fcrHighMessage: 'FCR ఎక్కువగా ఉంది. వ్యర్థాలను తగ్గించడానికి మేత ట్రేలను పర్యవేక్షించండి.',
  fcrOptimalMessage: 'FCR సరైన పరిధిలో ఉంది. పెరుగుదల బాగుంది.',
  efficiency: 'సామర్థ్యం',
  super: 'సూపర్',
  optimal: 'సరైనది',
  high: 'అధికం',
  medium: 'మధ్యస్థం',
  low: 'తక్కువ',
  avgMealsDay: 'సగటు మేతలు/రోజు',
  performanceInsight: 'పనితీరు అంతర్దృష్టి',
  biomass: 'బయోమాస్',
  grossKg: 'మొత్తం కిలోలు',
  baseKg: 'బేస్ కిలోలు',
  formula: 'ఫార్ములా',
  rate: 'రేటు',
  fixed: 'స్థిరమైన',
  netPerDay: 'రోజుకు నికర మేత',
  todaysSequence: 'నేటి క్రమం',
  dailyExecutionRules: 'రోజువారీ అమలు నియమాలు',
  applicationFormula: 'అన్వయ ఫార్ములా',
  pondStockingProfile: 'చెరువు స్టాకింగ్ ప్రొఫైల్',
  doc: 'రోజు (DOC)',
  lakh: 'లక్ష',
  estSurvivingCount: 'అంచనా వేసిన రొయ్యల సంఖ్య',
  estimatedBiomass: 'అంచనా వేసిన బయోమాస్',
  survivalRate_short: 'జీవితకాలం',
  monitorTrays: 'మేత ట్రేలను జాగ్రత్తగా పర్యవేక్షించండి',
  blindFeedingActive: 'బ్లైండ్ ఫీడింగ్ (DOC < 10)',
  applyAction: 'అన్వయించండి',
  adjustNextSlot: 'ట్రేల ఆధారంగా తదుపరి స్లాట్‌ను సర్దుబాటు చేయండి',
  totalFeed: 'మొత్తం మేత',
  noActivePonds: 'క్రియాశీల చెరువులు లేవు',
  humidity: 'తేమ',
  wind: 'గాలి',
  hrs: 'గంటలు',
  min: 'నిమిషాలు',
  smartFarmAlerts: 'స్మార్ట్ ఫామ్ హెచ్చరికలు',
  measurementUnit: 'కొలత యూనిట్',
  units: 'యూనిట్లు',
  appTheme: 'యాప్ థీమ్',
  notifications: 'నోటిఫికేషన్‌లు',
  waterQualityAlerts: 'నీటి నాణ్యత హెచ్చరికలు',
  feedingReminders: 'మేత రిమైండర్లు',
  scheduleSync: 'షెడ్యూల్ సమకాలీకరణ',
  docFeedPlan: 'DOC మేత ప్రణాళిక',
  metricsFcr: 'FCR గణాంకాలు',
  aiDiagnostics: 'AI & డయాగ్నోస్టిక్స్',
  aiServiceStatus: 'AI సర్వీస్ స్థితి',
  secureCloudManaged: 'సురక్షిత క్లౌడ్ మేనేజ్డ్',
  region: 'ప్రాంతం',
  editProfile: 'ప్రొఫైల్ సవరించండి',
  securityPrivacy: 'భద్రత & గోప్యత',
  subscriptionPlan: 'సబ్‌స్క్రిప్షన్ ప్లాన్',
  saveChanges: 'మార్పులను సేవ్ చేయండి',
  fullName: 'పూర్తి పేరు',
  phoneNumber: 'ఫోన్ నంబర్',
  emailAddress: 'ఈమెయిల్ చిరునామా',
  experience: 'అనుభవం',
  language: 'భాష',
  selectLanguage: 'భాషను ఎంచుకోండి',
  farmDetails: 'ఫామ్ వివరాలు',
  pondName: 'చెరువు పేరు',
  pondSize: 'చెరువు పరిమాణం',
  stockingDate: 'స్టాకింగ్ తేదీ',
  seedCount: 'విత్తనాల సంఖ్య',
  species: 'జాతులు',
  plAge: 'PL వయస్సు',
  status: 'స్థితి',
  waterQuality: 'నీటి నాణ్యత',
  feedManagement: 'మేత నిర్వహణ',
  healthCheck: 'ఆరోగ్య తనిఖీ',
  harvest: 'కోత',
  addPond: 'చెరువును జోడించండి',
  addFirstPond: 'మొదటి చెరువును జోడించండి',
  addFirstPondDesc: 'ట్రాకింగ్ ప్రారంభించడానికి మీ మొదటి చెరువును జోడించండి.',
  save: 'సేవ్ చేయండి',
  cancel: 'రద్దు చేయండి',
  kg: 'కిలోలు',
  acres: 'ఎకరాలు',
  hectares: 'హెక్టార్లు',
  revenue: 'ఆదాయం',
  netProfit: 'నికర లాభం',
  totalInvested: 'మొత్తం పెట్టుబడి',
  costPerKg: 'కిలో ఖర్చు',
  pricePerKgLabel: 'కిలో ధర',
  profitPerKg: 'కిలో లాభం',
  back: 'వెనుకకు',
  next: 'తరువాత',
  close: 'మూసివేయండి',
  loading: 'లోడ్ అవుతోంది...',
  error: 'లోపం',
  success: 'విజయం',
  proFeature: 'ప్రో ఫీచర్',
  unlockPro: 'ప్రో యాక్సెస్‌ను అన్‌లాక్ చేయండి',
  subscription: 'సబ్‌స్క్రిప్షన్',
  premiumModel: 'ప్రీమియం మోడల్',
  projectedEfficiency: 'అంచనా వేసిన సామర్థ్యం',
  diseaseAlert: 'వ్యాధి హెచ్చరిక',
  diagnoseNow: 'ఇప్పుడే పరీక్షించండి',
  opaqueMuscleSign: 'అపారదర్శక కండరము',
  softShellSign: 'మెత్తని పొట్టు',
  surfaceBubbleSign: 'ఉపరితల బుడగలు',
  harvestHistory: 'కోత చరిత్ర',
  noRoiProfiles: 'ఇంకా ROI ప్రొఫైల్‌లు లేవు',
  logFirstHarvest: '+ మొదటి కోతను నమోదు చేయండి',
  compilingReport: 'నివేదికను రూపొందిస్తోంది...',
  aggregatingDatasets: 'అన్ని P&L డేటాను సేకరిస్తోంది',
  recentCyclePerformance: 'ఇటీవలి సాగు పనితీరు',
  pondPerformance: 'చెరువు పనితీరు',
  cyclesLogged: 'నమోదు చేసిన సాగులు',
  annualFiscalReport: 'వార్షిక ఆర్థిక నివేదిక',
  investedVsRevenue: 'పెట్టుబడి vs ఆదాయం',
  netMargin: 'నికర మార్జిన్',
  opexInvested: 'పెట్టుబడి పెట్టిన వ్యయం',
  totalReceipts: 'మొత్తం రసీదులు',
  gradeAYield: 'గ్రేడ్-A దిగుబడి (%)',
  gradeBYield: 'గ్రేడ్-B దిగుబడి (%)',
  marketSubsidy: 'మార్కెట్ రాయితీ',
  saveROIProfile: 'ROI ప్రొఫైల్‌ను సేవ్ చేయండి',
  good: 'మంచిది',
  fair: 'సాధారణం',
  poor: 'తక్కువ',
  excellent: 'అద్భుతం',
  stable: 'స్థిరంగా ఉంది',
  urgent: 'అవసరం',
  dailyFeedCost: 'రోజువారీ మేత ఖర్చు',
  estFeedCostPerKg: '@ ₹55/కిలో అంచనా',
  allTasksDone: 'అన్ని పనులు పూర్తయ్యాయి',
  viewAllPonds: 'అన్ని చెరువులను చూడండి',
  disease: 'వ్యాధి',
  learn: 'నేర్చుకోండి',
  sop: 'SOP',
  growthStage: 'పెరుగుదల దశ',
  count: 'కౌంట్',
  ultraHigh: 'అత్యంత అధికం',
  liveMarketRates: 'ప్రత్యక్ష మార్కెట్ ధరలు',
  login: 'లాగిన్',
  register: 'నమోదు',
  enterOtp: 'OTPని నమోదు చేయండి',
  verifyOtp: 'OTPని ధృవీకరించండి',
  location: 'స్థానం',
  pondCount: 'చెరువుల సంఖ్య',
  otpSent: 'OTP పంపబడింది',
  invalidOtp: 'తప్పు OTP',
  totalAcres: 'మొత్తం ఎకరాలు',
  numberOfPonds: 'చెరువుల సంఖ్య',
  farmLocation: 'ఫారం స్థానం',
  english: 'ఇంగ్లీష్',
  telugu: 'తెలుగు',
  bengali: 'బెంగాలీ',
  odia: 'ఒడియా',
  gujarati: 'గుజరాతీ',
  tamil: 'తమిళం',
  malayalam: 'మలయాళం',
  loginFailed: 'లాగిన్ విఫలమైంది',
  fillAllFields: 'దయచేసి అన్ని విభాగాలను పూరించండి',
  otpVerified: 'OTP ధృవీకరించబడింది',
  resendOtp: 'మళ్ళీ OTP పంపండి',
  alreadyHaveAccount: 'ముందే ఖాతా ఉందా? లాగిన్ చేయండి',
  dontHaveAccount: 'ఖాతా లేదా? ధృవీకరణ పొందండి',
  farmer: 'రైతు',
  provider: 'సేవా ప్రదాత',
  password: 'పాస్‌వర్డ్',
  ecosystemForFarmers: 'ఆక్వా రైతులకు ప్రతిష్టాష్టాత్మక వేదిక',
  registrationFailed: 'నమోదు విఫలమైంది. మళ్ళీ ప్రయత్నించండి.',
  verifyAndJoin: 'ధృవీకరించండి & చేరండి',
  getVerified: 'ధృవీకరణ పొందండి',
  signInPrompt: 'లాగిన్ చేయండి',
  temperature: 'ఉష్ణోగ్రత',
  salinity: 'ఉప్పు సాంద్రత',
  ammonia: 'అమ్మోనియా',
  dissolvedO2: 'కరిగిన ఆక్సిజన్',
  pondNotFound: 'చెరువు కనుగొనబడలేదు',
  deletePondConfirm: 'మీరు ఈ చెరువును తొలగించాలనుకుంటున్నారా? మొత్తం డేటా పోతుంది.',
  growthMilestones: 'పెరుగుదల మైలురాళ్ళు',
  weightLabel: 'లక్ష్య బరువు (గ్రా)',
  currentConditions: 'ప్రస్తుత పరిస్థితులు',
  fullMarket: 'పూర్తి మార్కెట్',
  logTodaysConditions: 'నేటి పరిస్థితులను నమోదు చేయండి',
  notLogged: 'నమోదు చేయలేదు',
  checklist: 'చెక్లిస్ట్',
  sopTasks: 'SOP పనులు',
  scanShrimpDesc: 'వ్యాధి లక్షణాల కోసం రొయ్యలను స్కాన్ చేయండి',
  liveCultureOversight: 'ప్రత్యక్ష సాగు పర్యవేక్షణ',
  protectedMode: 'రక్షిత మోడ్',
  cultureTimeline: 'సాగు టైమ్‌లైన్',
  dailyStats: 'రోజువారీ గణాంకాలు',
  today: 'నేడు',
  notLoggedYet: 'ఇంకా నమోదు చేయలేదు',
  goldenRulesSchedule: 'గోల్డెన్ రూల్స్ & షెడ్యూల్',
  waterLog: 'నీటి లాగ్',
  morning1: 'స్లాట్ 1',
  morning2: 'స్లాట్ 2',
  afternoon: 'స్లాట్ 3',
  evening1: 'స్లాట్ 4',
  evening2: 'స్లాట్ 5',
  pondPerformance_short: 'పనితీరు',
  feedLogs: 'మేత లాగ్‌లు',
  sopEngineAlert: 'SOP ఇంజిన్ హెచ్చరిక',
  autoEngineAlert: 'ఆటోమేటెడ్ ఇంజిన్ హెచ్చరిక',
  startYourFirstPond: 'మీ మొదటి చెరువును ప్రారంభించండి',
  totalPonds: 'మొత్తం చెరువులు',
  totalArea: 'మొత్తం వైశాల్యం',
  pendingAlerts: 'పెండింగ్ హెచ్చరికలు',
  fcrRatio: 'FCR నిష్పత్తి',
  feedBiomassGain: 'మేత vs బయోమాస్ పెరుగుదల',
  survivalEst: 'జీవితకాల అంచనా',
  pondDocProgress: 'చెరువు DOC పురోగతి',
  days: 'రోజులు',
  weather: 'వాతావరణం',
  todaysTasks: 'నేటి పనులు',
  viewSchedule: 'షెడ్యూల్ చూడండి',
  inventory: 'స్టాక్/ఇన్వెంటరీ',
  orders: 'ఆర్డర్లు',

  // Market Prices & Locations
  blackTiger: 'బ్లాక్ టైగర్',
  scampi: 'స్కామ్పి',
  bhimavaram: 'భీమవరం',
  nellore: 'నెల్లూరు',
  vizag: 'వైజాగ్',
  kakinada: 'కాకినాడ',
  marketSnapshot: 'మార్కెట్ స్నాప్‌షాట్',
  dailyExportPriceIndex: 'రోజువారీ ఎగుమతి ధర సూచిక',
  exportDemand: 'ఎగుమతి డిమాండ్ ఎక్కువగా ఉంది',
  festiveSeason: 'పండుగ సీజన్ రద్దీ',
  stockAccumulation: 'స్థానిక నిల్వలు పెరిగాయి',
  premium: 'ప్రీమియం',
  standard: 'స్టాండర్డ్',
  priceUp: 'ధర పెరిగింది',
  priceDown: 'ధర తగ్గింది',
  priceHistory: 'ధర చరిత్ర',
  profitMargin: 'లాభాల మార్జిన్',
  recommendationStatus: 'సిఫార్సు స్థితి',
  harvestLabel: 'కోత',
  harvestAdvice: 'కోత సలహా',

  // Additional Common Keys
  archive: 'ఆర్కైవ్',
  noEntries: 'ఎంట్రీలు ఏవీ లేవు',
  phLevel: 'pH స్థాయి',
  investmentBreakdown: 'పెట్టుబడి వివరాలు',
  profitCalculator: 'లాభాల కాలిక్యులేటర్',
  upgradeToPro: 'ప్రోకు అప్‌గ్రేడ్ అవ్వండి',
  logEntry: 'విశ్లేషణలను చూడటానికి మీ మొదటి కోతను నమోదు చేయండి.',
};

export const translations: Record<Language, Translations> = {
  English,
  Telugu,
  Bengali: English,
  Odia: English,
  Gujarati: English,
  Tamil: English,
  Malayalam: English,
};
