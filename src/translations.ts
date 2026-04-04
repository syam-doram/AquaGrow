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
  liveMonitor: string;
  market: string;
  profile: string;
  backToDashboard: string;
  backToDashboard_desc: string;
  settings: string;
  systemSettings: string;
  logout: string;
  pondMonitor: string;
  missedActivities: string;
  alertHistory: string;
  expert: string;
  notifications: string;
  systemHealthOptimal: string;
  systemTestMessage: string;

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
  waterQualityAlerts: string;
  feedingReminders: string;
  scheduleSync: string;
  docFeedPlan: string;
  metricsFcr: string;
  aiDiagnostics: string;
  analysisError: string;
  scanShrimp: string;
  uploadPhotoDesc: string;
  openCamera: string;
  uploadPhoto: string;
  photoInstructions: string;
  deepAIAnalysis: string;
  scanningHealthMarkers: string;
  analysisResult: string;
  confidence: string;
  severity: string;
  correctiveActions: string;
  scanAgain: string;
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
  aiDisease: string;
  learningCenter: string;
  expertConsultations: string;
  expertConsultationsDesc: string;
  priorityAccess: string;
  connectExpertTitle: string;
  expertSubDesc: string;
  availableExperts: string;
  bookCall: string;
  chatNow: string;
  maybeLater: string;
  proSubscriptionRequired: string;
  elevateYield: string;
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
  criticalAlerts: string;
  feedEfficiency: string;
  weatherAdj: string;
  forecast7Day: string;
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
  profitForecasting: string;
  globalPriceAlerts: string;
  realTimeHealthMonitoring: string;
  currentPlan: string;
  expiryDate: string;
  termsPrivacyPolicy: string;
  paymentSuccess: string;
  processingPayment: string;
  doNotRefresh: string;
  payNow: string;
  transactionHistory: string;
  viewReceipt: string;
  paymentDate: string;
  amountPaid: string;
  transactionId: string;
  refundDetails: string;
  paymentGlitch: string;
  supportContact: string;
  refundPolicy: string;
  alkalinity: string;
  turbidity: string;
  mortality: string;
  earlyStage: string;
  highRiskPeriod: string;
  finalStage: string;
  processingEntry: string;
  saveEntry: string;
  pelletFeed: string;
  medicineProbiotics: string;
  dieselFuel: string;
  gridPowerBill: string;
  laborWages: string;
  otherTesting: string;
  expenseLogged: string;
  updatingFinancialTrajectory: string;
  added: string;
  dailyTraj: string;
  logLiveExpense: string;
  dailyOpexEntry: string;
  operatingExpense: string;
  dailyTracker: string;
  totalAmount: string;
  outflow: string;
  selectCulturePond: string;
  date: string;
  total: string;
  expenseCategory: string;
  purchased: string;
  calculatedUnitPrice: string;
  merchantNotes: string;
  merchantNotesPlaceholder: string;
  submitExpense: string;
  activeCycleAudit: string;
  liveTracking: string;
  totalCycleSpend: string;
  avgRunRate: string;
  forecastTarget: string;
  onBudget: string;
  fourteenDayTrajectory: string;
  dailyExpenses: string;
  live: string;
  cost: string;
  dashedLineRunRate: string;
  categoryBreakdown: string;
  pctOfTotalSpend: string;
  seedPlsCost: string;
  majorExpenses: string;
  viewPdfLog: string;
  logDailyExpense: string;
}

const English: Translations = {
  dashboard: 'Dashboard',
  home: 'Home',
  ponds: 'Ponds',
  feed: 'Feed',
  medicine: 'Medicine',
  roi: 'ROI',
  monitor: 'Monitor',
  liveMonitor: 'Live Monitor',
  market: 'Market',
  profile: 'Profile',
  backToDashboard: 'Back to Dashboard',
  backToDashboard_desc: 'Return to overview',
  settings: 'Settings',
  systemSettings: 'System Settings',
  logout: 'Logout',
  pondMonitor: 'Pond Monitor',
  missedActivities: 'Missed Activities',
  alertHistory: 'Cloud Alert History',
  expert: 'Expert',
  notifications: 'Notifications',
  systemHealthOptimal: 'System Health: Optimal',
  systemTestMessage: 'Testing high-fidelity stylized alerts. AquaGrow Push Engine is now active and ready for your farm.',
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
  waterQualityAlerts: 'Water Quality Alerts',
  feedingReminders: 'Feeding Reminders',
  scheduleSync: 'Schedule Sync',
  docFeedPlan: 'DOC Feed Plan',
  metricsFcr: 'FCR Metrics',
  aiDiagnostics: 'AI & Diagnostics',
  analysisError: 'Analysis Error',
  scanShrimp: 'Scan Shrimp',
  uploadPhotoDesc: 'Upload a clear photo for high-accuracy disease detection',
  openCamera: 'Open Camera',
  uploadPhoto: 'Upload from Gallery',
  photoInstructions: 'Photo Instructions',
  deepAIAnalysis: 'Analyzing Pathogens...',
  scanningHealthMarkers: 'Checking bio-markers',
  analysisResult: 'Analysis Result',
  confidence: 'AI Confidence',
  severity: 'Status',
  correctiveActions: 'Treatment SOP',
  scanAgain: 'New Analysis',
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
  alkalinity: 'Alkalinity',
  turbidity: 'Turbidity',
  mortality: 'Mortality',
  sop: 'SOP',
  growthStage: 'Growth Stage',
  count: 'Count',
  ultraHigh: 'Ultra High',
  liveMarketRates: 'Live Market Rates',
  aiDisease: 'AI Disease Detect',
  learningCenter: 'Learning Center',
  expertConsultations: 'Expert Consultations',
  expertConsultationsDesc: 'Get instant advice on disease control, water quality, and yield optimization.',
  priorityAccess: 'Priority Access',
  connectExpertTitle: 'Connect with Global Bio-Experts',
  expertSubDesc: 'Connect with certified professionals for real-time guidance on your farm\'s health and productivity.',
  availableExperts: 'Available Experts',
  bookCall: 'Book Call',
  chatNow: 'Chat Now',
  maybeLater: 'Maybe Later',
  proSubscriptionRequired: 'is only available for AquaGrow Pro subscribers.',
  elevateYield: 'Elevate your yield with AquaGrow Pro',
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
  earlyStage: 'Early Stage (DOC 1-10)',
  highRiskPeriod: 'High Risk Period (DOC 11-45)',
  finalStage: 'Final Growth Stage (DOC 46+)',
  processingEntry: 'Processing Entry...',
  saveEntry: 'Save Daily Log',
  pelletFeed: 'Pellet Feed',
  medicineProbiotics: 'Medicine & Probiotics',
  dieselFuel: 'Diesel Fuel',
  gridPowerBill: 'Electricity / Power',
  laborWages: 'Labor Wages',
  otherTesting: 'Lab & Testing',
  expenseLogged: 'Expense Logged!',
  updatingFinancialTrajectory: 'UPDATING FINANCIAL TRAJECTORY',
  added: 'Added',
  dailyTraj: 'Daily Run-Rate',
  logLiveExpense: 'Log Daily Expense',
  dailyOpexEntry: 'DAILY OPEX ENTRY',
  operatingExpense: 'Operating Expense',
  dailyTracker: 'Daily Tracker',
  totalAmount: 'Total Amount',
  outflow: 'Outflow',
  selectCulturePond: 'Select Culture Pond',
  date: 'Date',
  total: 'Total',
  expenseCategory: 'Expense Category',
  purchased: 'Purchased',
  calculatedUnitPrice: 'Calculated Unit Price',
  merchantNotes: 'Merchant Notes',
  merchantNotesPlaceholder: 'Invoice details, vendor name...',
  submitExpense: 'Submit Expense',
  activeCycleAudit: 'Active Cycle Audit',
  liveTracking: 'Live Tracking',
  totalCycleSpend: 'Total Cycle Spend',
  avgRunRate: 'Avg Run-Rate',
  forecastTarget: 'Forecast Target',
  onBudget: 'On Budget',
  fourteenDayTrajectory: '14-Day Trajectory',
  dailyExpenses: 'Daily Expenses',
  live: 'Live',
  cost: 'Cost',
  dashedLineRunRate: 'Dashed line = Avg. Daily Run-Rate',
  categoryBreakdown: 'Category Breakdown',
  pctOfTotalSpend: '% of total spend',
  seedPlsCost: 'Seed / PLs Cost',
  majorExpenses: 'Major Expenses',
  viewPdfLog: 'View PDF Log',
  logDailyExpense: 'Log Daily Expense',
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
  morning1: 'Early Morning',
  morning2: 'Morning',
  afternoon: 'Afternoon',
  evening1: 'Evening',
  evening2: 'Late Evening',
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
  criticalAlerts: 'Critical Alerts',
  feedEfficiency: 'AI Feed Adjustment',
  weatherAdj: 'Weather-Based Correction',
  forecast7Day: '7-Day Forecast',
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
  upgradeToPro: 'Upgrade To Pro',
  logEntry: 'Log your first harvest to see analytics here.',
  profitForecasting: 'Profit Forecasting',
  globalPriceAlerts: 'Global Price Alerts',
  realTimeHealthMonitoring: 'Real-time Health Monitoring',
  currentPlan: 'Current Plan',
  expiryDate: 'Expiry Date',
  termsPrivacyPolicy: 'By upgrading, you agree to our Terms of Service and Privacy Policy.',
  paymentSuccess: 'Payment Successful',
  processingPayment: 'Processing Payment',
  doNotRefresh: 'Please do not refresh or close this window',
  payNow: 'Pay Now',
  transactionHistory: 'Transaction History',
  viewReceipt: 'View Receipt',
  paymentDate: 'Payment Date',
  amountPaid: 'Amount Paid',
  transactionId: 'Transaction ID',
  refundDetails: 'Refund Details',
  paymentGlitch: 'Facing a payment glitch?',
  supportContact: 'Contact Support',
  refundPolicy: 'Refund Policy',
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
  liveMonitor: 'ప్రత్యక్ష పర్యవేక్షణ',
  market: 'మార్కెట్',
  profile: 'ప్రొఫైల్',
  backToDashboard: 'డాష్‌బోర్డ్‌కు వెనుకకు',
  backToDashboard_desc: 'డాష్‌బోర్డ్‌కు తిరిగి వెళ్ళండి',
  settings: 'సెట్టింగ్‌లు',
  systemSettings: 'సిస్టమ్ సెట్టింగ్‌లు',
  logout: 'లాగ్ అవుట్',
  pondMonitor: 'చెరువు పర్యవేక్షణ',
  missedActivities: 'తప్పిపోయిన కార్యకలాపాలు',
  alertHistory: 'క్లౌడ్ హెచ్చరికల చరిత్ర',
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
  notifications: 'ప్రకటనలు',
  systemHealthOptimal: 'సిస్టమ్ ఆరోగ్యం: అద్భుతంగా ఉంది',
  systemTestMessage: 'స్టైలిష్ అలర్ట్‌లను పరీక్షిస్తున్నాము. ఆక్వాగ్రో పుష్ ఇంజిన్ ఇప్పుడు మీ ఫామ్ కోసం యాక్టివ్‌గా ఉంది.',
  waterQualityAlerts: 'నీటి నాణ్యత హెచ్చరికలు',
  feedingReminders: 'మేత రిమైండర్లు',
  scheduleSync: 'షెడ్యూల్ సమకాలీకరణ',
  docFeedPlan: 'DOC మేత ప్రణాళిక',
  metricsFcr: 'FCR గణాంకాలు',
  aiDiagnostics: 'AI & డయాగ్నోస్టిక్స్',
  analysisError: 'విశ్లేషణ లోపం',
  scanShrimp: 'రొయ్యలను స్కాన్ చేయండి',
  uploadPhotoDesc: 'ఖచ్చితమైన వ్యాధి గుర్తింపు కోసం స్పష్టమైన ఫోటోను అప్‌లోడ్ చేయండి',
  openCamera: 'కెమెరా తెరవండి',
  uploadPhoto: 'గ్యాలరీ నుండి అప్‌లోడ్ చేయండి',
  photoInstructions: 'ఫోటో సూచనలు',
  deepAIAnalysis: 'వ్యాధికారకాలను విశ్లేషిస్తోంది...',
  scanningHealthMarkers: 'బయో-మార్కర్లను తనిఖీ చేస్తోంది',
  analysisResult: 'విశ్లేషణ ఫలితం',
  confidence: 'AI విశ్వసనీయత',
  severity: 'స్థితి',
  correctiveActions: 'చికిత్స SOP',
  scanAgain: 'కొత్త విశ్లేషణ',
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
  alkalinity: 'ఆల్కలినిటీ',
  turbidity: 'టర్బిడిటీ',
  mortality: 'మరణాలు',
  sop: 'SOP',
  growthStage: 'పెరుగుదల దశ',
  count: 'కౌంట్',
  ultraHigh: 'అత్యంత అధికం',
  liveMarketRates: 'ప్రత్యక్ష మార్కెట్ ధరలు',
  aiDisease: 'AI వ్యాధి గుర్తింపు',
  learningCenter: 'లెర్నింగ్ సెంటర్',
  expertConsultations: 'నిపుణుల సంప్రదింపులు',
  expertConsultationsDesc: 'వ్యాధి నియంత్రణ, నీటి నాణ్యత మరియు దిగుబడి ఆప్టిమైజేషన్‌పై తక్షణ సలహా తీసుకోండి.',
  priorityAccess: 'ప్రాధాన్యత యాక్సెస్',
  connectExpertTitle: 'గ్లోబల్ బయో-నిపుణులతో కనెక్ట్ అవ్వండి',
  expertSubDesc: 'మీ ఫామ్ ఆరోగ్యం మరియు ఉత్పాదకతపై నిజ-సమయ మార్గదర్శకత్వం కోసం సర్టిఫైడ్ ప్రొఫెషనల్స్‌తో కనెక్ట్ అవ్వండి.',
  availableExperts: 'అందుబాటులో ఉన్న నిపుణులు',
  bookCall: 'కాల్ బుక్ చేయండి',
  chatNow: 'ఇప్పుడే చాట్ చేయండి',
  maybeLater: 'తర్వాత చూద్దాం',
  proSubscriptionRequired: 'ఆక్వాగ్రో ప్రో సభ్యులకు మాత్రమే అందుబాటులో ఉన్నాయి.',
  elevateYield: 'అక్వాగ్రో ప్రోతో మీ దిగుబడిని పెంచుకోండి',
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
  morning1: 'వేకువజామున (Early)',
  morning2: 'ఉదయం (Morning)',
  afternoon: 'మధ్యాహ్నం (Afternoon)',
  evening1: 'సాయంత్రం (Evening)',
  evening2: 'రాత్రి (Late Evening)',
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
  criticalAlerts: 'ముఖ్యమైన హెచ్చరికలు',
  feedEfficiency: 'AI మేత సర్దుబాటు',
  weatherAdj: 'వాతావరణ ఆధారిత సర్దుబాటు',
  forecast7Day: '7-రోజుల వాతావరణం',
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
  profitForecasting: 'లాభాల అంచనా',
  globalPriceAlerts: 'గ్లోబల్ ధర హెచ్చరికలు',
  realTimeHealthMonitoring: 'రియల్ టైమ్ హెల్త్ మానిటరింగ్',
  currentPlan: 'ప్రస్తుత ప్లాన్',
  expiryDate: 'ముగింపు తేదీ',
  termsPrivacyPolicy: 'అప్‌గ్రేడ్ చేయడం ద్వారా, మీరు మా సేవా నిబంధనలు మరియు గోప్యతా విధానానికి అంగీకరిస్తున్నారు.',
  paymentSuccess: 'చెల్లింపు విజయవంతమైంది',
  processingPayment: 'చెల్లింపు ప్రాసెస్ చేయబడుతోంది',
  doNotRefresh: 'దయచేసి ఈ విండోను రిఫ్రెష్ చేయవద్దు లేదా మూసివేయవద్దు',
  payNow: 'ఇప్పుడే చెల్లించండి',
  transactionHistory: 'లావాదేవీల చరిత్ర',
  viewReceipt: 'రశీదు చూడండి',
  paymentDate: 'చెల్లింపు తేదీ',
  amountPaid: 'చెల్లించిన మొత్తం',
  transactionId: 'లావాదేవీ ID',
  refundDetails: 'రీఫండ్ వివరాలు',
  paymentGlitch: 'చెల్లింపులో సమస్య ఎదురవుతుందా?',
  supportContact: 'మద్దతును సంప్రదించండి',
  refundPolicy: 'రీఫండ్ విధానం',
  earlyStage: 'ప్రారంభ దశ (DOC 1-10)',
  highRiskPeriod: 'అధిక ప్రమాద కాలం (DOC 11-45)',
  finalStage: 'చివరి పెరుగుదల దశ (DOC 46+)',
  processingEntry: 'ప్రాసెస్ చేయబడుతోంది...',
  saveEntry: 'రోజువారీ లాగ్‌ను సేవ్ చేయండి',
  pelletFeed: 'పెల్లెట్ ఫీడ్',
  medicineProbiotics: 'మందులు & ప్రోబయోటిక్స్',
  dieselFuel: 'డీజిల్ ఇంధనం',
  gridPowerBill: 'విద్యుత్ బిల్లు',
  laborWages: 'కూలీ ఖర్చులు',
  otherTesting: 'ల్యాబ్ & టెస్టింగ్',
  expenseLogged: 'ఖర్చు నమోదైంది!',
  updatingFinancialTrajectory: 'ఆర్థిక అంచనా అప్‌డేట్ అవుతోంది',
  added: 'జోడించబడింది',
  dailyTraj: 'రోజువారీ ఖర్చు రేటు',
  logLiveExpense: 'రోజువారీ ఖర్చును నమోదు చేయండి',
  dailyOpexEntry: 'రోజువారీ OPEX ఎంట్రీ',
  operatingExpense: 'నిర్వహణ ఖర్చు',
  dailyTracker: 'రోజువారీ ట్రాకర్',
  totalAmount: 'మొత్తం ధర',
  outflow: 'ఖర్చు',
  selectCulturePond: 'చెరువును ఎంచుకోండి',
  date: 'తేదీ',
  total: 'మొత్తం',
  expenseCategory: 'ఖర్చు కేటగిరీ',
  purchased: 'కొనుగోలు చేయబడింది',
  calculatedUnitPrice: 'లెక్కించిన యూనిట్ ధర',
  merchantNotes: 'మర్చంట్ నోట్స్',
  merchantNotesPlaceholder: 'ఇన్వాయిస్ వివరాలు, విక్రేత పేరు...',
  submitExpense: 'ఖర్చును సమర్పించండి',
  activeCycleAudit: 'యాక్టివ్ సైకిల్ ఆడిట్',
  liveTracking: 'లైవ్ ట్రాకింగ్',
  totalCycleSpend: 'మొత్తం సైకిల్ ఖర్చు',
  avgRunRate: 'సగటు రోజువారీ ఖర్చు',
  forecastTarget: 'బడ్జెట్ లక్ష్యం',
  onBudget: 'బడ్జెట్‌లో ఉంది',
  fourteenDayTrajectory: '14-రోజుల బాట',
  dailyExpenses: 'రోజువారీ ఖర్చులు',
  live: 'లైవ్',
  cost: 'ఖర్చు',
  dashedLineRunRate: 'చుక్కల లైన్ = సగటు రోజువారీ ఖర్చు',
  categoryBreakdown: 'కేటగిరీ విభజన',
  pctOfTotalSpend: 'మొత్తం ఖర్చులో %',
  seedPlsCost: 'విత్తనం / PLs ఖర్చు',
  majorExpenses: 'ప్రధాన ఖర్చులు',
  viewPdfLog: 'PDF లాగ్ చూడండి',
  logDailyExpense: 'రోజువారీ ఖర్చును నమోదు చేయండి',
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
