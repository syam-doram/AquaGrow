import { Language } from './types';

export interface Translations {
  // Feed & ROI Basics
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
  
  // Greetings & Status
  systemLive: string;
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;
  welcome: string;

  // Lunar & SOP
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
  
  // Dashboard Sections
  todaysTasks: string;
  viewSchedule: string;
  activePonds: string;
  marketPrice: string;
  weather: string;
  aiDisease: string;
  profitCalculator: string;
  learningCenter: string;
  community: string;
  support: string;
  upgradeToPro: string;
  proBadge: string;
  language: string;
  selectLanguage: string;
  
  // Pond & Farm Details
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
  
  // Units & Economics
  kg: string;
  acres: string;
  hectares: string;
  lakh: string;
  revenue: string;
  netProfit: string;
  totalInvested: string;
  costPerKg: string;
  pricePerKgLabel: string;
  profitPerKg: string;
  
  // Generic
  back: string;
  next: string;
  close: string;
  loading: string;
  error: string;
  success: string;
  
  // Pro Features
  proFeature: string;
  unlockPro: string;
  subscription: string;
  premiumModel: string;
  projectedEfficiency: string;
  
  // Disease
  diseaseAlert: string;
  diagnoseNow: string;
  opaqueMuscleSign: string;
  softShellSign: string;
  surfaceBubbleSign: string;
  
  // History & ROI Detail
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
  high: string;
  medium: string;
  low: string;
  urgent: string;
  efficiency: string;
  performanceInsight: string;
  fcrHighMessage: string;
  fcrOptimalMessage: string;
  dailyFeedCost: string;
  estFeedCostPerKg: string;
  allTasksDone: string;
  viewAllPonds: string;
  disease: string;
  learn: string;
  sop: string;
  doc: string;
  growthStage: string;
  count: string;
  ultraHigh: string;
  liveMarketRates: string;
  mealsPerDay: string;
  monitorTrays: string;
  blindFeedingActive: string;
  adjustNextSlot: string;
  todaysSequence: string;
  netPerDay: string;
  totalFeed: string;
  avgMealsDay: string;
  super: string;
  applyAction: string;
  estimatedBiomass: string;
  estSurvivingCount: string;
  survivalRate_short: string;
  applicationFormula: string;
  baseKg: string;
  rate: string;
  grossKg: string;
  fixed: string;
  dailyExecutionRules: string;
  pondStockingProfile: string;
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
  logout: string;
  systemActive: string;
  loginFailed: string;
  fillAllFields: string;
  otpVerified: string;
  resendOtp: string;
  alreadyHaveAccount: string;
  dontHaveAccount: string;
  farmer: string;
  provider: string;
  fullName: string;
  phoneNumber: string;
  password: string;
  ecosystemForFarmers: string;
  registrationFailed: string;
  verifyAndJoin: string;
  getVerified: string;
  signInPrompt: string;
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
  optimal: string;
  pondPerformance_short: string;
  feedLogs: string;
  backToDashboard_desc: string;
}

const English: Translations = {
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
  systemLive: 'System Live',
  goodMorning: 'Good Morning,',
  goodAfternoon: 'Good Afternoon,',
  goodEvening: 'Good Evening,',
  welcome: 'Welcome,',
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
  todaysTasks: "Today's Tasks",
  viewSchedule: 'View Schedule',
  activePonds: 'Active Ponds',
  marketPrice: 'Market Price',
  weather: 'Weather',
  aiDisease: 'AI Disease Detection',
  profitCalculator: 'Profit Calculator',
  learningCenter: 'Learning Center',
  community: 'Community',
  support: 'Support',
  upgradeToPro: 'Upgrade to Pro',
  proBadge: 'Pro',
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
  lakh: 'Lakh',
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
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  urgent: 'Urgent',
  efficiency: 'Efficiency',
  performanceInsight: 'Performance Insight',
  fcrHighMessage: 'FCR is higher than normal. Check feed trays.',
  fcrOptimalMessage: 'FCR is in optimal range.',
  dailyFeedCost: 'Daily Feed Cost',
  estFeedCostPerKg: '@ ₹55/kg est.',
  allTasksDone: 'All tasks completed',
  viewAllPonds: 'View All Ponds',
  disease: 'Disease',
  learn: 'Learn',
  sop: 'SOP',
  doc: 'DOC',
  growthStage: 'Growth Stage',
  count: 'Count',
  ultraHigh: 'Ultra High',
  liveMarketRates: 'Live Market Rates',
  mealsPerDay: 'Meals Per Day',
  monitorTrays: 'Monitor Trays',
  blindFeedingActive: 'Blind Feeding Active',
  adjustNextSlot: 'Adjust Next Slot',
  todaysSequence: "Today's Sequence",
  netPerDay: 'Net Per Day',
  totalFeed: 'Total Feed',
  avgMealsDay: 'Avg Meals/Day',
  super: 'Super',
  applyAction: 'Apply Action',
  estimatedBiomass: 'Estimated Biomass',
  estSurvivingCount: 'Est. Surviving Count',
  survivalRate_short: 'SR',
  applicationFormula: 'Application Formula',
  baseKg: 'Base Kg',
  rate: 'Rate',
  grossKg: 'Gross Kg',
  fixed: 'Fixed',
  dailyExecutionRules: 'Daily Execution Rules',
  pondStockingProfile: 'Pond Stocking Profile',
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
  logout: 'Logout',
  systemActive: 'System Active',
  loginFailed: 'Login Failed',
  fillAllFields: 'Please fill all fields',
  otpVerified: 'OTP Verified',
  resendOtp: 'Resend OTP',
  alreadyHaveAccount: 'Already have an account? Sign In',
  dontHaveAccount: "Don't have an account? Get Verified",
  farmer: 'Farmer',
  provider: 'Service Provider',
  fullName: 'Full Name',
  phoneNumber: 'Phone Number',
  password: 'Password',
  ecosystemForFarmers: 'ELITE ECOSYSTEM FOR AQUA FARMERS',
  registrationFailed: 'Registration Failed. Please try again.',
  verifyAndJoin: 'VERIFY & JOIN',
  getVerified: 'GET VERIFIED',
  signInPrompt: 'SIGN IN',
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
  optimal: 'Optimal',
  pondPerformance_short: 'Perf',
  feedLogs: 'Feed Logs',
  backToDashboard_desc: 'Return to overview',
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
  systemLive: 'సిస్టమ్ లైవ్',
  goodMorning: 'శుభోదయం,',
  goodAfternoon: 'శుభ మధ్యాహ్నం,',
  goodEvening: 'శుభ సాయంత్రం,',
  welcome: 'స్వాగతం,',
  activePonds: 'క్రియాశీల చెరువులు',
  marketPrice: 'మార్కెట్ ధర',
  weather: 'వాతావరణం',
  aiDisease: 'AI వ్యాధి గుర్తింపు',
  profitCalculator: 'లాభం & ROI',
  learningCenter: 'లెర్నింగ్ సెంటర్',
  community: 'కమ్యూనిటీ',
  support: 'మద్దతు',
  upgradeToPro: 'ప్రోకి అప్‌గ్రేడ్ చేయండి',
  proBadge: 'ప్రో',
  language: 'భాష',
  selectLanguage: 'భాషను ఎంచుకోండి',
  english: 'ఇంగ్లీష్',
  telugu: 'తెలుగు',
  bengali: 'బెంగాలీ',
  odia: 'ఒడియా',
  gujarati: 'గుజరాతీ',
  tamil: 'తమిళం',
  malayalam: 'మలయాళం',
  logout: 'లాగ్ అవుట్',
  farmDetails: 'ఫామ్ వివరాలు',
  pondSize: 'చెరువు పరిమాణం',
  stockingDate: 'స్టాకింగ్ తేదీ',
  seedCount: 'విత్తనాల సంఖ్య',
  species: 'జాతులు',
  status: 'స్థితి',
  waterQuality: 'నీటి నాణ్యత',
  feedManagement: 'మేత నిర్వహణ',
  healthCheck: 'ఆరోగ్య తనిఖీ',
  harvest: 'కోత',
  addPond: 'చెరువును జోడించండి',
  save: 'సేవ్ చేయండి',
  cancel: 'రద్దు చేయండి',
  back: 'వెనుకకు',
  next: 'తరువాత',
  todaysTasks: 'నేటి పనులు',
  viewSchedule: 'షెడ్యూల్ చూడండి',
  kg: 'కిలోలు',
  acres: 'ఎకరాలు',
  lakh: 'లక్ష',
  revenue: 'ఆదాయం',
  netProfit: 'నికర లాభం',
  location: 'స్థానం',
  pondCount: 'చెరువుల సంఖ్య',
  verifyOtp: 'OTPని ధృవీకరించండి',
  enterOtp: 'OTPని నమోదు చేయండి',
  otpSent: 'OTP పంపబడింది',
  invalidOtp: 'తప్పు OTP',
  totalAcres: 'మొత్తం ఎకరాలు',
  numberOfPonds: 'చెరువుల సంఖ్య',
  farmLocation: 'ఫారం స్థానం',
  systemActive: 'సిస్టమ్ యాక్టివ్',
  loginFailed: 'లాగిన్ విఫలమైంది',
  fillAllFields: 'దయచేసి అన్ని విభాగాలను పూరించండి',
  otpVerified: 'OTP ధృవీకరించబడింది',
  resendOtp: 'మళ్ళీ OTP పంపండి',
  alreadyHaveAccount: 'ముందే ఖాతా ఉందా? లాగిన్ చేయండి',
  dontHaveAccount: 'ఖాతా లేదా? ధృవీకరించండి',
  farmer: 'రైతు',
  provider: 'సేవా ప్రదాత',
  fullName: 'పూర్తి పేరు',
  phoneNumber: 'ఫోన్ నంబర్',
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
  optimal: 'సరైనది',
  pondPerformance_short: 'పనితీరు',
  feedLogs: 'మేత లాగ్‌లు',
  backToDashboard_desc: 'డాష్‌బోర్డ్‌కు తిరిగి వెళ్ళండి',
  doc: 'రోజు (DOC)',
  growthStage: 'పెరుగుదల దశ',
  count: 'కౌంట్',
  ultraHigh: 'అత్యంత అధికం',
  liveMarketRates: 'ప్రత్యక్ష మార్కెట్ ధరలు',
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
