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
  exportMarketTrends: string;
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
  allActivities: string;
  systemHealthOptimal: string;
  systemTestMessage: string;
  waterType: string;
  borewell: string;
  canal: string;
  creek: string;
  initialSalinity: string;
  released: string;
  needToRelease: string;
  preStockingPreparation: string;
  activeStocking: string;
  prepGuidance: string;
  activeGuidance: string;
  stockingGuidance: string;
  stockingStatus: string;

  // Greetings & Status
  systemLive: string;
  systemActive: string;
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;
  welcome: string;
  activePonds: string;
  planned: string;

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
  warning: string;
  targetLabel: string;
  viewTips: string;
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
  newPondEntry: string;
  primaryDetails: string;
  stockingAnalytics: string;
  operationalData: string;
  completePondEntry: string;
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
  email: string;
  startYourFirstPond: string;
  phoneOrEmail: string;
  changePassword: string;
  biometricLogin: string;
  privacyPolicy: string;
  dataExport: string;
  security: string;
  privacy: string;
  confirmStockingTitle: string;
  confirmStockingAction: string;
  editDate: string;

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
  totalPonds: string;
  totalArea: string;
  pendingAlerts: string;
  fcrRatio: string;
  feedBiomassGain: string;
  survivalEst: string;
  pondDocProgress: string;
  days: string;
  weather: string;
  feedPlanner: string;
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
  logDailyProtocol: string;
  timeToFeed: string;
  checkFeedTrays: string;
  aeratorNightOn: string;
  moonCycleAlert: string;
  reduceFeedAmavasya: string;
  addMineralsAshtami: string;
  applyLimePhLow: string;
  syncingData: string;
  harvestDetails: string;
  whatDidYouHarvest: string;
  investments: string;
  whatDidYouSpend: string;
  revenueEarned: string;
  whatDidYouReceive: string;
  profileSummary: string;
  yourROIAnalysis: string;
  roiProfileSaved: string;
  redirectingDashboard: string;
  postHarvestROI: string;
  totalHarvestWeight: string;
  countPerKgSize: string;
  survival: string;
  cultureDuration: string;
  gradeSplit: string;
  feedCostLabel: string;
  infrastructurePower: string;
  totalInvestment: string;
  totalSaleAmount: string;
  pricePerKgReceived: string;
  buyerCompanyName: string;
  subsidyGovtSupport: string;
  additionalNotes: string;
  netProfitLoss: string;
  breakEven: string;
  lossCycle: string;
  continue: string;
  liveCycleStats: string;
  liveCycle: string;
  projectRoi: string;
  forgotPassword: string;
  noWaterData: string;

  // Pond Status Labels
  statusActive: string;
  statusPlanned: string;
  statusSelling: string;
  statusHarvested: string;
  statusArchived: string;
  statusNotStarted: string;
  trustExcellent: string;
  trustGood: string;
  trustFair: string;
  trustNeedsWork: string;

  // Farm Overview
  farmOverview: string;
  myFarm: string;
  trustScore: string;
  activeAlerts: string;
  harvestReady: string;
  densityM2: string;
  estBiomass: string;
  estRevenue: string;
  pondRegistration: string;
  activeculture: string;
  liveYieldPreview: string;
  seedSource: string;
  estimatesNote: string;
  fillPondContinue: string;
  gotIt: string;
  logConditions: string;

  // Harvest Tracking Stages
  stageSelling: string;
  stageQualityCheck: string;
  stageWeightCheck: string;
  stageRateConfirm: string;
  stageHarvest: string;
  stagePayment: string;
  stageArchive: string;

  // Water Monitoring
  paramPh: string;
  paramDo: string;
  paramTemp: string;
  paramSalinity: string;
  paramAmmonia: string;
  paramAlkalinity: string;
  optimalRange: string;
  logConditionsBtn: string;
  waterHealth: string;
  waterHistory: string;
  harvestAnalysis: string;

  // Aerator Management
  aeratorManagement: string;
  aeratorOn: string;
  aeratorOff: string;
  aeratorAuto: string;
  addAerator: string;
  aeratorName: string;
  aeratorType: string;
  aeratorPower: string;

  // Pond Detail Sections
  pondOverview: string;
  pondTimeline: string;
  pondCertificate: string;
  pondAerators: string;
  growthMilestonesTitle: string;
  liveTrackingActive: string;
  marketSaleJourney: string;
  orderCancelled: string;
  harvestPrepDoc: string;
  highFcr: string;
  sopTarget: string;
  noWaterLogToday: string;
  tapToLogNow: string;
  waterQualitySection: string;
  liveCultureOversightLabel: string;
  revenueNotRecorded: string;
  selfHarvestReason: string;
  partialHarvestHistory: string;
  revenueLabel: string;
  auditCertificate: string;
  auditScore: string;
  cultureDays: string;
  verifiedBy: string;
  buyerTrustReady: string;
  certAfterDoc10: string;
  keepLoggingTrust: string;
  stopHarvest: string;
  deletionLocked: string;
  deletionLockedMsg: string;

  // Harvest Page
  harvestPond: string;
  harvestReadiness: string;
  sopComplianceCheck: string;
  finalCycle: string;
  finalizingHarvest: string;
  chooseHarvestMethod: string;
  marketSale: string;
  selfHarvest: string;
  marketSaleDesc: string;
  selfHarvestDesc: string;
  partialHarvest: string;
  fullHarvest: string;
  avgWeightG: string;
  biomassKg: string;
  targetRate: string;
  availableBuyers: string;
  liveQuotes: string;
  smartBroadcastActive: string;
  broadcastRadius: string;
  broadcastToMarket: string;
  broadcasting: string;
  selectHarvestReason: string;
  customReason: string;
  customReasonPlaceholder: string;
  auditRecordCreated: string;
  auditRecordDesc: string;
  pleaseSelectReason: string;
  confirmSelfHarvest: string;
  recordingHarvest: string;
  earlyHarvestRisk: string;

  // Harvest Tracking
  harvestCancelled: string;
  reasonGiven: string;
  noActiveHarvest: string;
  startHarvestFromPond: string;
  estRevenueLabel: string;
  ratePerKg: string;
  saleJourney: string;
  stageComplete: string;
  revenueBreakdown: string;
  buyerChat: string;
  retractBroadcast: string;
  pendingLabel: string;

  // Harvest Revenue Ledger
  feedingLog: string;
  settledAndVerified: string;
  payment: string;
  totalReceivedAmount: string;
  buyerEntity: string;
  saleDate: string;
  countSize: string;
  baseRate: string;
  closeLedger: string;
  harvestRevenue: string;
  yieldLedger: string;
  latestHarvestSettlement: string;
  totalNetEarnings: string;
  premiumMargin: string;
  settledDate: string;
  revenueComposition: string;
  baseBiomassSales: string;
  bonusSubsidies: string;
  settlementAudit: string;
  pdfStatement: string;
  settled: string;

  // Admin Dashboard
  adminControl: string;
  totalUsers: string;
  activeSubs: string;
  health: string;
  marketPrice: string;
  updatePrice: string;
  recentActivity: string;

  // Provider Module
  providerDashboard: string;
  totalSales: string;
  activeOrders: string;
  pending: string;
  shipped: string;
  addProduct: string;
  stock: string;
  viewDetails: string;
  // Disease Detection UI
  ddStepPreparation: string;
  ddStepScanOptions: string;
  ddStepSymptomChecker: string;
  ddStepAnalyzing: string;
  ddStepDiagnosticComplete: string;
  ddStepDiseaseLibrary: string;
  ddStepSopDetails: string;
  ddNewScan: string;
  ddFullSOP: string;
  ddAiScanned: string;
  ddDiagnosticVerdict: string;
  ddDetectedCondition: string;
  ddAiConfidence: string;
  ddSeverity: string;
  ddAffectedPart: string;
  ddSource: string;
  ddAiPhoto: string;
  ddSymptoms: string;
  ddRecommendedActions: string;
  ddLogTreatment: string;
  ddDailyAiLimit: string;
  ddGeminiFreeTier: string;
  ddQuotaMsg: string;
  ddSuggestedWait: string;
  ddTryAgain: string;
  ddPhotoTip1: string;
  ddPhotoTip2: string;
  ddPhotoTip3: string;
  ddPhotoTip4: string;
  ddPhotoTip5: string;
  ddRetakePhoto: string;
  ddSymptomCheckerTitle: string;
  ddSymptomCheckerDesc: string;
  ddRunDiagnosis: string;
  ddScansUsed: string;
  ddScansRemaining: string;
  ddMonthlyQuota: string;
  ddQuotaExhausted: string;
  ddQuotaResets: string;
  ddProFeatureRequired: string;
}

// Privacy Policy — English
const ppEnglish = {
  ppHeaderTitle: 'Privacy Policy',
  ppDataPolicy: 'Data Policy',
  ppHeroDesc: 'We are committed to protecting your farm data, ensuring transparency, and giving you full control over your personal information.',
  ppLastUpdated: 'Last Updated',
  ppVersion: 'Version',
  ppJurisdiction: 'Jurisdiction',
  ppChipNoSell: 'No Data Selling',
  ppChipEncrypted: 'End-to-End Encrypted',
  ppChipDelete: 'Right to Delete',
  ppContactQuestion: 'Questions or Concerns?',
  ppDPO: 'Data Protection Officer · AquaGrow Technologies Pvt. Ltd.',
  ppBackToSettings: 'Back to Security Settings',
  ppSec1Title: 'Data We Collect',
  ppSec1P1: '**Account Information:** Name, phone number, email address, farm name, and location (state/district) provided during registration.',
  ppSec1P2: '**Pond & Culture Data:** Pond dimensions, species (Vannamei/Monodon), stocking date, seed count, water quality readings (pH, DO, ammonia, temperature, salinity), feed logs, medicine schedules, and harvest records.',
  ppSec1P3: '**Device Information:** Device type, OS version, app version, and crash/error logs for support purposes.',
  ppSec1P4: '**Usage Data:** Pages visited, features used, and interaction timestamps to improve app performance.',
  ppSec1P5: '**Push Notification Tokens:** FCM tokens to deliver real-time farm alerts to your device.',
  ppSec2Title: 'How We Use Your Data',
  ppSec2P1: '**Farm Intelligence:** Your pond and water data drives our AI-powered SOP engine, disease detection alerts, feed adjustment recommendations, and harvest timing guidance.',
  ppSec2P2: '**Smart Alerts:** Water quality thresholds, lunar phase cautions, DOC-based reminders, and WSSV/EMS risk warnings are generated from your logged data.',
  ppSec2P3: '**ROI & Analytics:** Profit, cost, and yield calculations shown in the Finance module are computed locally from your entered data.',
  ppSec2P4: '**Notifications:** Alert preferences you set control what push and in-app notifications you receive.',
  ppSec2P5: '**Support & Improvement:** Anonymised usage patterns help us improve features and fix bugs.',
  ppSec3Title: 'Data Sharing',
  ppSec3P1: '**We do not sell your data.** Your farm records, pond data, and personal information are never sold to third parties.',
  ppSec3P2: '**Expert Consultations:** If you request an expert consultation, your pond summary (species, DOC, water quality) is shared only with the assigned expert.',
  ppSec3P3: '**Market Data:** Market price information displayed is sourced from public APIs and does not include your personal farm data.',
  ppSec3P4: '**Service Providers:** We use Firebase (Google) for authentication, notifications, and data storage, all governed by their enterprise privacy standards.',
  ppSec3P5: '**Legal Compliance:** We may disclose data if required by Indian law (IT Act 2000 / DPDP Act 2023) or valid legal process.',
  ppSec4Title: 'Data Storage & Security',
  ppSec4P1: '**Encryption:** All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption on Firebase infrastructure.',
  ppSec4P2: '**Authentication:** Account access is protected by password hashing (bcrypt) and optional biometric login (FaceID / Fingerprint).',
  ppSec4P3: '**Data Location:** Your data is stored on Google Firebase servers with regional data centres compliant with Indian data localisation guidelines.',
  ppSec4P4: '**Retention:** Active farm data is retained for the duration of your account. Archived pond records are kept for 3 years to preserve yield history.',
  ppSec4P5: '**Breach Protocol:** In case of a data breach, affected users will be notified within 72 hours with details of what was exposed and remediation steps.',
  ppSec5Title: 'Notifications & Tracking',
  ppSec5P1: '**Push Notifications:** You control which alert categories you receive (Water, Feed, Disease, Harvest, Market, Lunar) via Notification Settings.',
  ppSec5P2: '**No Ad Tracking:** AquaGrow does not use any advertising networks, pixels, or cross-site tracking technologies.',
  ppSec5P3: '**Analytics:** We use privacy-safe analytics (no personally identifiable information) to understand feature adoption and fix performance issues.',
  ppSec5P4: '**Camera / Gallery:** The Disease Detection and Water Test Scanner features use your camera only while those screens are active. No images are stored without your explicit save action.',
  ppSec6Title: 'Your Rights',
  ppSec6P1: '**Access:** You may request a full export of your personal data via Settings → Security & Privacy → Export Data.',
  ppSec6P2: '**Correction:** You can update your profile, farm name, pond details, and contact information at any time within the app.',
  ppSec6P3: '**Deletion:** You may request account deletion from Profile → Danger Zone. All personal data and pond records will be permanently removed within 30 days.',
  ppSec6P4: '**Opt-out:** You can disable all push notifications or revoke camera/location permissions from your device Settings at any time.',
  ppSec6P5: '**Grievance Redressal:** Contact our Data Protection Officer at privacy@aquagrow.in within 30 days for any data-related concerns.',
  ppSec7Title: 'Updates to This Policy',
  ppSec7P1: 'We may update this Privacy Policy as we add new features or comply with regulatory changes.',
  ppSec7P2: 'Significant changes will be notified via in-app alerts and email at least 14 days before they take effect.',
  ppSec7P3: 'Continued use of AquaGrow after the effective date constitutes acceptance of the updated policy.',
  ppSec7P4: 'This policy was last updated: **April 2026**. Effective from launch.',
};

const English: Translations = {
  ...ppEnglish,
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
  exportMarketTrends: 'Export Market Trends',
  backToDashboard: 'Back to Dashboard',
  backToDashboard_desc: 'Return to overview',
  settings: 'Settings',
  systemSettings: 'System Settings',
  logout: 'Logout',
  pondMonitor: 'Pond Monitor',
  missedActivities: 'Missed Activities',
  alertHistory: 'Cloud Alert History',
  expert: 'Expert',
  notifications: 'Intelligence Center',
  allActivities: 'Operations Feed',
  systemHealthOptimal: 'System Health: Optimal',
  systemTestMessage: 'Testing high-fidelity stylized alerts. AquaGrow Push Engine is now active and ready for your farm.',
  systemLive: 'System Live',
  systemActive: 'System Active',
  goodMorning: 'Good Morning,',
  goodAfternoon: 'Good Afternoon,',
  goodEvening: 'Good Evening,',
  welcome: 'Welcome,',
  activePonds: 'Active Ponds',
  planned: 'Planned',
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
  warning: 'Warning',
  targetLabel: 'Target',
  viewTips: 'Water Quality Tips',
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
  preStockingPreparation: 'Pre-Stocking (Preparation)',
  activeStocking: 'Stocking (Active)',
  prepGuidance: 'Guidance: Focus on Pond Drying, Liming and Water Treatment before stock.',
  activeGuidance: 'Guidance: Focus on Feed, Medicine and Molting management for growing crop.',
  stockingGuidance: 'Farmer Selection Guidance',
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
  email: "Email Address",
  startYourFirstPond: "Start Your First Pond",
  phoneOrEmail: "Phone or Email",
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
  timeToFeed: 'Time to Feed',
  checkFeedTrays: 'Check Feed Trays',
  aeratorNightOn: 'Aerator Night Mode ON',
  moonCycleAlert: 'Lunar Cycle Alert',
  reduceFeedAmavasya: 'Reduce Feed - Amavasya SOP',
  addMineralsAshtami: 'Apply Minerals - Ashtami Molting',
  applyLimePhLow: 'Apply Lime - Low pH Detected',
  cancel: 'Cancel',
  newPondEntry: 'New Pond Entry',
  primaryDetails: 'Primary Details',
  stockingAnalytics: 'Stocking Analytics',
  operationalData: 'Operational Data',
  completePondEntry: 'Complete Pond Entry',
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
  logDailyProtocol: 'Log Protocol',
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
  totalPonds: 'Total Ponds',
  totalArea: 'Total Area',
  pendingAlerts: 'Pending Alerts',
  fcrRatio: 'FCR Ratio',
  feedBiomassGain: 'Feed vs Biomass Gain',
  survivalEst: 'Survival Estimate',
  pondDocProgress: 'Pond DOC Progress',
  days: 'days',
  weather: 'Weather',
  feedPlanner: 'Feed Planner',
  criticalAlerts: 'Critical Alerts',
  feedEfficiency: 'AI Feed Adjustment',
  weatherAdj: 'Weather-Based Correction',
  forecast7Day: '7-Day Forecast',
  todaysTasks: "Today's Tasks",
  viewSchedule: 'View Schedule',
  inventory: 'Inventory',
  orders: 'Orders',

  // Disease Detection UI
  ddStepPreparation: 'Preparation',
  ddStepScanOptions: 'Scan Options',
  ddStepSymptomChecker: 'Symptom Checker',
  ddStepAnalyzing: 'AI Analyzing…',
  ddStepDiagnosticComplete: 'Diagnostic Complete',
  ddStepDiseaseLibrary: 'Disease Library',
  ddStepSopDetails: 'SOP Details',
  ddNewScan: 'New Scan',
  ddFullSOP: 'Full SOP',
  ddAiScanned: 'AI Scanned',
  ddDiagnosticVerdict: 'Diagnostic Verdict',
  ddDetectedCondition: 'Detected Condition',
  ddAiConfidence: 'AI Confidence',
  ddSeverity: 'Severity',
  ddAffectedPart: 'Affected Part',
  ddSource: 'Source',
  ddAiPhoto: 'AI Photo',
  ddSymptoms: 'Symptoms',
  ddRecommendedActions: 'Recommended Actions',
  ddLogTreatment: '+ Log Treatment Action',
  ddDailyAiLimit: 'Daily AI Limit Reached',
  ddGeminiFreeTier: 'Gemini Free Tier',
  ddQuotaMsg: 'The Gemini AI free-tier daily quota has been exhausted. This resets automatically every 24 hours.',
  ddSuggestedWait: 'Suggested wait time',
  ddTryAgain: '🔄 Try Again',
  ddPhotoTip1: 'Use natural daylight or bright indoor light',
  ddPhotoTip2: 'Hold shrimp flat — gills, shell or hepatopancreas visible',
  ddPhotoTip3: 'Place on dark wet cloth for contrast',
  ddPhotoTip4: 'Capture within 30 seconds of removing from pond',
  ddPhotoTip5: 'Avoid water glare — take photo out of the pond',
  ddRetakePhoto: 'Retake with Shrimp Body',
  ddSymptomCheckerTitle: 'Symptom Checker',
  ddSymptomCheckerDesc: 'Select visible symptoms for AI pattern matching',
  ddRunDiagnosis: 'Run AI Diagnosis',
  ddScansUsed: 'scans used',
  ddScansRemaining: 'remaining',
  ddMonthlyQuota: 'Monthly Quota',
  ddQuotaExhausted: 'Exhausted',
  ddQuotaResets: 'Your quota resets on the 1st of next month.',
  ddProFeatureRequired: 'AI Disease Detection requires an active Pro plan.',

  // Market Prices  blackTiger: 'Black Tiger',
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
  waterType: 'Water Source Type',
  borewell: 'Borewell Water',
  canal: 'Canal Water',
  creek: 'Creek / Penna Water',
  initialSalinity: 'Initial Salinity',
  released: 'Released (Stocked)',
  needToRelease: 'Need to Release (Planned)',
  stockingStatus: 'Stocking Status',
  syncingData: 'Syncing Farm Data',
  changePassword: 'Change Password',
  biometricLogin: 'Biometric Login',
  privacyPolicy: 'Privacy Policy',
  dataExport: 'Data Export',
  security: 'Security',
  privacy: 'Privacy',
  harvestDetails: 'Harvest Details',
  whatDidYouHarvest: 'What did you harvest?',
  investments: 'Investments',
  whatDidYouSpend: 'What did you spend?',
  revenueEarned: 'Revenue Earned',
  whatDidYouReceive: 'What did you receive?',
  profileSummary: 'Profile Summary',
  yourROIAnalysis: 'Your ROI Analysis',
  roiProfileSaved: 'ROI Profile Saved',
  redirectingDashboard: 'Redirecting to Dashboard...',
  postHarvestROI: 'Post-Harvest ROI',
  totalHarvestWeight: 'Total Harvest Weight',
  countPerKgSize: 'Count Per KG (Size)',
  survival: 'Survival',
  cultureDuration: 'Culture Duration',
  gradeSplit: 'Grade Split (%)',
  feedCostLabel: 'Feed Cost',
  infrastructurePower: 'Infrastructure & Power',
  totalInvestment: 'Total Investment',
  totalSaleAmount: 'Total Sale Amount',
  pricePerKgReceived: 'Price Per KG Received',
  buyerCompanyName: 'Buyer / Company Name',
  subsidyGovtSupport: 'Subsidy / Govt Support',
  additionalNotes: 'Additional Notes',
  netProfitLoss: 'Net Profit / Loss',
  breakEven: 'Break Even',
  lossCycle: 'Loss Cycle',
  continue: 'Continue',
  liveCycleStats: 'Live Cycle Stats',
  liveCycle: 'Live Cycle',
  projectRoi: 'Projected ROI',
  forgotPassword: 'Forgot Password?',
  noWaterData: 'No Data',
  confirmStockingTitle: 'Time to Stock',
  confirmStockingAction: 'YES, CONFIRM STOCKING',
  editDate: 'Reschedule Stocking',

  // Pond Status Labels
  statusActive: 'Active',
  statusPlanned: 'Planned',
  statusSelling: 'Selling',
  statusHarvested: 'Harvested',
  statusArchived: 'Archived',
  statusNotStarted: 'Not Started',
  trustExcellent: 'Excellent',
  trustGood: 'Good',
  trustFair: 'Fair',
  trustNeedsWork: 'Needs Work',

  // Farm Overview
  farmOverview: 'Farm Overview',
  myFarm: 'My Farm',
  trustScore: 'Trust',
  activeAlerts: 'Active Alerts',
  harvestReady: 'Harvest Ready',
  densityM2: 'Density/m²',
  estBiomass: 'Est. Biomass',
  estRevenue: 'Est. Revenue',
  pondRegistration: 'Pond Registration',
  activeculture: 'Active Culture',
  liveYieldPreview: 'Live Yield Preview',
  seedSource: 'Seed Source',
  estimatesNote: 'Estimates based on DOC 90 · 80% survival · 20g avg · ₹450/kg',
  fillPondContinue: 'Fill pond name and size to continue',
  gotIt: 'Got it',
  logConditions: 'Log Conditions',

  // Harvest Tracking Stages
  stageSelling: 'Selling',
  stageQualityCheck: 'Quality Check',
  stageWeightCheck: 'Weight Check',
  stageRateConfirm: 'Rate Confirm',
  stageHarvest: 'Harvest',
  stagePayment: 'Payment Released',
  stageArchive: 'Archive',

  // Water Monitoring
  paramPh: 'pH',
  paramDo: 'DO',
  paramTemp: 'Temp',
  paramSalinity: 'Salinity',
  paramAmmonia: 'Ammonia',
  paramAlkalinity: 'Alkalinity',
  optimalRange: 'Optimal Range',
  logConditionsBtn: 'Log Conditions',
  waterHealth: 'Health',
  waterHistory: 'History',
  harvestAnalysis: 'Harvest',

  // Aerator Management
  aeratorManagement: 'Aerator Management',
  aeratorOn: 'On',
  aeratorOff: 'Off',
  aeratorAuto: 'Auto',
  addAerator: 'Add Aerator',
  aeratorName: 'Aerator Name',
  aeratorType: 'Type',
  aeratorPower: 'Power (HP)',

  // Pond Detail Sections
  pondOverview: 'Overview',
  pondTimeline: 'Timeline',
  pondCertificate: 'Certificate',
  pondAerators: 'Aerators',
  growthMilestonesTitle: 'Growth Milestones',
  liveTrackingActive: 'Live Tracking Active',
  marketSaleJourney: 'Market Sale Journey',
  orderCancelled: 'Order Cancelled',
  harvestPrepDoc: 'Harvest Prep',
  highFcr: 'High FCR',
  sopTarget: 'SOP target ≤1.4. Reduce feed, check trays.',
  noWaterLogToday: 'No Water Log Today',
  tapToLogNow: 'Tap to log now - critical for SOP compliance',
  waterQualitySection: 'Water Quality',
  liveCultureOversightLabel: 'Live culture oversight',
  revenueNotRecorded: 'Revenue not recorded',
  selfHarvestReason: 'Self Harvest Reason',
  partialHarvestHistory: 'Partial Harvest History',
  revenueLabel: 'Revenue',
  auditCertificate: 'AquaGrow Audit Certificate',
  auditScore: 'Audit Score',
  cultureDays: 'Culture Days',
  verifiedBy: 'Verified by AquaGrow Intelligence',
  buyerTrustReady: 'Buyer Trust Ready',
  certAfterDoc10: 'Certificate Available After DOC 10',
  keepLoggingTrust: 'Keep logging daily to build your trust score',
  stopHarvest: 'Stop Harvest?',
  deletionLocked: 'Deletion Locked',
  deletionLockedMsg: 'Pond over DOC 7 cannot be deleted to preserve culture records.',

  // Harvest Page
  harvestPond: 'Harvest Pond',
  harvestReadiness: 'Harvest Readiness',
  sopComplianceCheck: 'SOP Compliance Check',
  finalCycle: 'Final Cycle',
  finalizingHarvest: 'Finalizing Harvest',
  chooseHarvestMethod: 'Choose Harvest Method',
  marketSale: 'Market Sale',
  selfHarvest: 'Self Harvest',
  marketSaleDesc: 'Broadcast your harvest to verified buyers within 150km. AquaGrow manages the sale journey, quality check, weighing and payment settlement.',
  selfHarvestDesc: 'You are harvesting independently — sold locally, contracted buyer, or for personal use. The pond will be marked as harvested with your recorded reason.',
  partialHarvest: 'Partial Harvest',
  fullHarvest: 'Full Harvest',
  avgWeightG: 'Avg Weight (g)',
  biomassKg: 'Biomass (kg)',
  targetRate: 'Target ₹/kg',
  availableBuyers: 'Available Buyers',
  liveQuotes: 'Live Quotes',
  smartBroadcastActive: 'Smart Broadcast Active',
  broadcastRadius: 'Order broadcasts to selected buyers + agents within 150km of your farm.',
  broadcastToMarket: 'Broadcast to Market',
  broadcasting: 'Broadcasting...',
  selectHarvestReason: 'Select Harvest Reason',
  customReason: 'Custom Reason (optional)',
  customReasonPlaceholder: 'Describe your harvest situation...',
  auditRecordCreated: 'Audit Record Created',
  auditRecordDesc: 'Your harvest reason and biomass data will be saved in the pond audit trail for ROI reporting and trust certificate generation.',
  pleaseSelectReason: 'Please select or enter a harvest reason before confirming.',
  confirmSelfHarvest: 'Confirm Self Harvest',
  recordingHarvest: 'Recording Harvest...',
  earlyHarvestRisk: 'Harvesting before DOC 90 may reduce market grade and cut revenue by up to 30%.',

  // Harvest Tracking
  harvestCancelled: 'Harvest Cancelled',
  reasonGiven: 'Reason Given',
  noActiveHarvest: 'No Active Harvest',
  startHarvestFromPond: 'Start a harvest order from your pond page',
  estRevenueLabel: 'Est. Revenue',
  ratePerKg: 'Rate /kg',
  saleJourney: 'Sale Journey',
  stageComplete: 'Stage complete',
  revenueBreakdown: 'Revenue Breakdown',
  buyerChat: 'Buyer Chat',
  retractBroadcast: 'Retract Broadcast?',
  pendingLabel: 'Pending',

  // Harvest Revenue Ledger
  feedingLog: 'Feeding Log',
  settledAndVerified: 'Settled & Verified',
  payment: 'Payment',
  totalReceivedAmount: 'Total Received',
  buyerEntity: 'Buyer / Company',
  saleDate: 'Sale Date',
  countSize: 'Count / Size',
  baseRate: 'Base Rate (₹/kg)',
  closeLedger: 'Close Ledger',
  harvestRevenue: 'Harvest Revenue',
  yieldLedger: 'Yield Ledger',
  latestHarvestSettlement: 'Latest Settlement',
  totalNetEarnings: 'Total Net Earnings',
  premiumMargin: 'Premium Margin',
  settledDate: 'Settled On',
  revenueComposition: 'Revenue Composition',
  baseBiomassSales: 'Base Biomass Sales',
  bonusSubsidies: 'Bonus & Subsidies',
  settlementAudit: 'Settlement Audit',
  pdfStatement: 'Download Statement',
  settled: 'Settled',

  // Admin Dashboard
  adminControl: 'Admin Control',
  totalUsers: 'Total Users',
  activeSubs: 'Active Subscriptions',
  health: 'Health',
  marketPrice: 'Market Price',
  updatePrice: 'Update Price',
  recentActivity: 'Recent Activity',

  // Provider Module
  providerDashboard: 'Provider Dashboard',
  totalSales: 'Total Sales',
  activeOrders: 'Active Orders',
  pending: 'Pending',
  shipped: 'Shipped',
  addProduct: 'Add Product',
  stock: 'Stock',
  viewDetails: 'View Details',
};

// Privacy Policy — Telugu
const ppTelugu = {
  ppHeaderTitle: 'గోప్యతా విధానం',
  ppDataPolicy: 'డేటా విధానం',
  ppHeroDesc: 'మీ ఫారం డేటాను రక్షించడానికి, పారదర్శకత నిర్ధారించడానికి మరియు మీ వ్యక్తిగత సమాచారంపై పూర్తి నియంత్రణ ఇవ్వడానికి మేము నిబద్ధులం.',
  ppLastUpdated: 'చివరిగా నవీకరించబడింది',
  ppVersion: 'వెర్షన్',
  ppJurisdiction: 'న్యాయాధికారం',
  ppChipNoSell: 'డేటా అమ్మకం లేదు',
  ppChipEncrypted: 'ఎండ్-టు-ఎండ్ ఎన్‌క్రిప్టెడ్',
  ppChipDelete: 'తొలగించే హక్కు',
  ppContactQuestion: 'ప్రశ్నలు లేదా సమస్యలు?',
  ppDPO: 'డేటా సంరక్షణ అధికారి · AquaGrow Technologies Pvt. Ltd.',
  ppBackToSettings: 'భద్రతా సెట్టింగ్‌లకు తిరిగి వెళ్ళండి',
  ppSec1Title: 'మేము సేకరించే డేటా',
  ppSec1P1: '**ఖాతా సమాచారం:** నమోదు సమయంలో అందించిన పేరు, ఫోన్ నంబర్, ఈమెయిల్ చిరునామా, ఫారం పేరు మరియు స్థానం (రాష్ట్రం/జిల్లా).',
  ppSec1P2: '**చెరువు & సాగు డేటా:** చెరువు కొలతలు, జాతులు (Vannamei/Monodon), స్టాకింగ్ తేదీ, విత్తన సంఖ్య, నీటి నాణ్యత రీడింగ్‌లు (pH, DO, అమ్మోనియా, ఉష్ణోగ్రత, ఉప్పదనం), మేత లాగ్‌లు, మందుల సమయపట్టిక మరియు పట్టివేత రికార్డులు.',
  ppSec1P3: '**పరికర సమాచారం:** మద్దతు కోసం పరికర రకం, OS వెర్షన్, యాప్ వెర్షన్ మరియు క్రాష్/ఎర్రర్ లాగ్‌లు.',
  ppSec1P4: '**వినియోగ డేటా:** యాప్ పనితీరు మెరుగుపరచడానికి సందర్శించిన పేజీలు, ఉపయోగించిన ఫీచర్లు మరియు ఇంటరాక్షన్ టైమ్‌స్టాంప్‌లు.',
  ppSec1P5: '**పుష్ నోటిఫికేషన్ టోకెన్లు:** మీ పరికరానికి రియల్-టైమ్ ఫారం హెచ్చరికలను అందించడానికి FCM టోకెన్లు.',
  ppSec2Title: 'మేము మీ డేటాను ఎలా ఉపయోగిస్తాము',
  ppSec2P1: '**ఫారం ఇంటెలిజెన్స్:** మీ చెరువు మరియు నీటి డేటా మా AI-ఆధారిత SOP ఇంజిన్, వ్యాధి గుర్తింపు హెచ్చరికలు, మేత సర్దుబాటు సిఫార్సులు మరియు పట్టివేత సమయ మార్గదర్శకత్వాన్ని నడిపిస్తుంది.',
  ppSec2P2: '**స్మార్ట్ హెచ్చరికలు:** నీటి నాణ్యత పరిమితులు, చంద్ర దశ జాగ్రత్తలు, DOC-ఆధారిత రిమైండర్లు మరియు WSSV/EMS ప్రమాద హెచ్చరికలు మీ లాగ్ చేసిన డేటా నుండి రూపొందించబడతాయి.',
  ppSec2P3: '**ROI & విశ్లేషణ:** ఫైనాన్స్ మాడ్యూల్‌లో చూపించే లాభం, ఖర్చు మరియు దిగుబడి లెక్కలు మీరు నమోదు చేసిన డేటా నుండి స్థానికంగా గణించబడతాయి.',
  ppSec2P4: '**నోటిఫికేషన్లు:** మీరు సెట్ చేసిన హెచ్చరిక ప్రాధాన్యతలు మీకు ఏ పుష్ మరియు ఇన్-యాప్ నోటిఫికేషన్లు వస్తాయో నియంత్రిస్తాయి.',
  ppSec2P5: '**మద్దతు & మెరుగుదల:** అనానిమైజ్ చేసిన వినియోగ నమూనాలు ఫీచర్లను మెరుగుపరచడానికి మరియు బగ్స్ పరిష్కరించడానికి సహాయపడతాయి.',
  ppSec3Title: 'డేటా భాగస్వామ్యం',
  ppSec3P1: '**మేము మీ డేటాను అమ్మము.** మీ ఫారం రికార్డులు, చెరువు డేటా మరియు వ్యక్తిగత సమాచారం ఎన్నడూ మూడవ పక్షాలకు అమ్మబడదు.',
  ppSec3P2: '**నిపుణుల సంప్రదింపులు:** మీరు నిపుణుల సంప్రదింపు అభ్యర్థిస్తే, మీ చెరువు సారాంశం (జాతులు, DOC, నీటి నాణ్యత) నియమించబడిన నిపుణుడితో మాత్రమే భాగస్వామ్యం చేయబడుతుంది.',
  ppSec3P3: '**మార్కెట్ డేటా:** ప్రదర్శించబడే మార్కెట్ ధర సమాచారం పబ్లిక్ APIల నుండి సేకరించబడుతుంది మరియు మీ వ్యక్తిగత ఫారం డేటాను కలిగి ఉండదు.',
  ppSec3P4: '**సేవా ప్రదాతలు:** మేము Firebase (Google)ను ప్రమాణీకరణ, నోటిఫికేషన్లు మరియు డేటా నిల్వ కోసం ఉపయోగిస్తాము, అన్నీ వారి ఎంటర్‌ప్రైజ్ గోప్యతా ప్రమాణాల ద్వారా నిర్వహించబడతాయి.',
  ppSec3P5: '**న్యాయ అనుపాలన:** భారత చట్టం (IT చట్టం 2000 / DPDP చట్టం 2023) లేదా చెల్లుబాటు అయ్యే న్యాయ ప్రక్రియ అవసరమైతే డేటాను వెల్లడించవచ్చు.',
  ppSec4Title: 'డేటా నిల్వ & భద్రత',
  ppSec4P1: '**ఎన్‌క్రిప్షన్:** Firebase మౌలిక సదుపాయాలపై TLS 1.3 ఉపయోగించి ట్రాన్సిట్‌లో మరియు AES-256 ఎన్‌క్రిప్షన్ ఉపయోగించి నిల్వలో అన్ని డేటా ఎన్‌క్రిప్ట్ చేయబడుతుంది.',
  ppSec4P2: '**ప్రమాణీకరణ:** పాస్‌వర్డ్ హాషింగ్ (bcrypt) మరియు ఐచ్ఛిక బయోమెట్రిక్ లాగిన్ (FaceID / వేలిముద్ర) ద్వారా ఖాతా యాక్సెస్ రక్షించబడుతుంది.',
  ppSec4P3: '**డేటా స్థానం:** మీ డేటా భారతీయ డేటా లోకలైజేషన్ మార్గదర్శకాలకు అనుగుణంగా ప్రాంతీయ డేటా కేంద్రాలతో Google Firebase సర్వర్లలో నిల్వ చేయబడుతుంది.',
  ppSec4P4: '**నిల్వ కాలం:** యాక్టివ్ ఫారం డేటా మీ ఖాతా వ్యవధి వరకు నిలుపుదల చేయబడుతుంది. ఆర్కైవ్ చేసిన చెరువు రికార్డులు దిగుబడి చరిత్రను సంరక్షించడానికి 3 సంవత్సరాల పాటు ఉంచబడతాయి.',
  ppSec4P5: '**ఉల్లంఘన నిర్వహణ:** డేటా ఉల్లంఘన జరిగిన సందర్భంలో, ప్రభావిత వినియోగదారులకు 72 గంటల్లోపు ఏం బహిర్గతమైందో మరియు పరిష్కార చర్యల వివరాలతో నోటిఫై చేయబడతారు.',
  ppSec5Title: 'నోటిఫికేషన్లు & ట్రాకింగ్',
  ppSec5P1: '**పుష్ నోటిఫికేషన్లు:** నోటిఫికేషన్ సెట్టింగ్‌ల ద్వారా మీరు ఏ హెచ్చరిక వర్గాలు స్వీకరించాలో (నీరు, మేత, వ్యాధి, పట్టివేత, మార్కెట్, చంద్రుడు) నియంత్రిస్తారు.',
  ppSec5P2: '**యాడ్ ట్రాకింగ్ లేదు:** AquaGrow ఏ విజ్ఞాపన నెట్‌వర్క్‌లు, పిక్సెల్‌లు లేదా క్రాస్-సైట్ ట్రాకింగ్ సాంకేతికతలను ఉపయోగించదు.',
  ppSec5P3: '**విశ్లేషణ:** ఫీచర్ అడాప్షన్ అర్థం చేసుకోవడానికి మరియు పనితీరు సమస్యలు పరిష్కరించడానికి మేము గోప్యత-సురక్షిత విశ్లేషణ (వ్యక్తిగతంగా గుర్తించదగిన సమాచారం లేదు) ఉపయోగిస్తాము.',
  ppSec5P4: '**కెమెరా / గ్యాలరీ:** వ్యాధి గుర్తింపు మరియు వాటర్ టెస్ట్ స్కానర్ ఫీచర్లు ఆయా స్క్రీన్‌లు యాక్టివ్‌గా ఉన్నప్పుడు మాత్రమే మీ కెమెరాను ఉపయోగిస్తాయి. మీ స్పష్టమైన సేవ్ చర్య లేకుండా చిత్రాలు నిల్వ చేయబడవు.',
  ppSec6Title: 'మీ హక్కులు',
  ppSec6P1: '**యాక్సెస్:** సెట్టింగ్‌లు → భద్రత & గోప్యత → డేటా ఎగుమతి ద్వారా మీ వ్యక్తిగత డేటా పూర్తి ఎగుమతిని అభ్యర్థించవచ్చు.',
  ppSec6P2: '**సరిదిద్దుకోవడం:** మీరు ఎప్పుడైనా యాప్‌లో మీ ప్రొఫైల్, ఫారం పేరు, చెరువు వివరాలు మరియు సంప్రదింపు సమాచారాన్ని నవీకరించవచ్చు.',
  ppSec6P3: '**తొలగింపు:** ప్రొఫైల్ → డేంజర్ జోన్ నుండి ఖాతా తొలగింపు అభ్యర్థించవచ్చు. అన్ని వ్యక్తిగత డేటా మరియు చెరువు రికార్డులు 30 రోజుల్లోపు శాశ్వతంగా తొలగించబడతాయి.',
  ppSec6P4: '**నిరాకరణ:** మీరు మీ పరికర సెట్టింగ్‌ల నుండి ఎప్పుడైనా అన్ని పుష్ నోటిఫికేషన్లను నిలిపివేయవచ్చు లేదా కెమెరా/లొకేషన్ అనుమతులను రద్దు చేయవచ్చు.',
  ppSec6P5: '**ఫిర్యాదు పరిష్కారం:** డేటా సంబంధిత ఆందోళనల కోసం 30 రోజుల్లోపు privacy@aquagrow.in లో మా డేటా సంరక్షణ అధికారిని సంప్రదించండి.',
  ppSec7Title: 'ఈ విధానానికి నవీకరణలు',
  ppSec7P1: 'మేము కొత్త ఫీచర్లు జోడించినప్పుడు లేదా నియంత్రణ మార్పులకు అనుగుణంగా ఉన్నప్పుడు ఈ గోప్యతా విధానాన్ని నవీకరించవచ్చు.',
  ppSec7P2: 'ముఖ్యమైన మార్పులు అమలులోకి రావడానికి కనీసం 14 రోజుల ముందు ఇన్-యాప్ హెచ్చరికలు మరియు ఈమెయిల్ ద్వారా నోటిఫై చేయబడతాయి.',
  ppSec7P3: 'అమలు తేదీ తర్వాత AquaGrowని నిరంతరం ఉపయోగించడం నవీకరించబడిన విధానాన్ని అంగీకరించడంగా పరిగణించబడుతుంది.',
  ppSec7P4: 'ఈ విధానం చివరిగా నవీకరించబడింది: **ఏప్రిల్ 2026**. లాంచ్ నుండి అమలు.',
};

const Telugu: Translations = {
  ...ppTelugu,
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
  exportMarketTrends: 'ఎగుమతి మార్కెట్ పోకడలు',
  backToDashboard: 'డాష్‌బోర్డ్‌కు వెనుకకు',
  backToDashboard_desc: 'డాష్‌బోర్డ్‌కు తిరిగి వెళ్ళండి',
  settings: 'సెట్టింగ్‌లు',
  systemSettings: 'సిస్టమ్ సెట్టింగ్‌లు',
  logout: 'లాగ్ అవుట్',
  pondMonitor: 'చెరువు పర్యవేక్షణ',
  missedActivities: 'తప్పిపోయిన కార్యకలాపాలు',
  alertHistory: 'క్లౌడ్ హెచ్చరికల చరిత్ర',
  expert: 'నిపుణుల సంప్రదింపులు',
  notifications: 'నోటిఫికేషన్లు',
  allActivities: 'కార్యకలాపాలు',
  systemLive: 'సిస్టమ్ లైవ్',
  systemActive: 'సిస్టమ్ యాక్టివ్',
  goodMorning: 'శుభోదయం,',
  goodAfternoon: 'శుభ మధ్యాహ్నం,',
  goodEvening: 'శుభ సాయంత్రం,',
  welcome: 'స్వాగతం,',
  activePonds: 'క్రియాశీల చెరువులు',
  planned: 'ప్రణాళికాబద్ధం',
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
  warning: 'హెచ్చరిక',
  targetLabel: 'లక్ష్యం',
  viewTips: 'నీటి నాణ్యత చిట్కాలు',
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
  preStockingPreparation: 'ముందస్తు తయారీ (ప్రె-స్టాకింగ్)',
  activeStocking: 'పెంపకం దశ (యాక్టివ్)',
  prepGuidance: 'సూచన: విత్తనం వేసే ముందు చెరువు ఎండబెట్టడం మరియు నీటి శుద్ధిపై దృష్టి పెట్టండి.',
  activeGuidance: 'సూచన: మేత, మందులు మరియు మొల్టింగ్ మేనేజ్మెంట్ పై దృష్టి పెట్టండి.',
  stockingGuidance: 'రైతు ఎంపిక మార్గదర్శకం',
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
  harvest: 'పట్టివేత',
  addPond: 'చెరువును జోడించండి',
  addFirstPond: 'మొదటి చెరువును జోడించండి',
  addFirstPondDesc: 'ట్రాకింగ్ ప్రారంభించడానికి మీ మొదటి చెరువును జోడించండి.',
  save: 'సేవ్ చేయండి',
  cancel: 'రద్దు చేయండి',
  waterType: 'నీటి మూల రకం',
  borewell: 'బోరు బావి నీరు',
  canal: 'కాలువ నీరు',
  creek: 'క్రీక్ / పెన్నా నీరు',
  newPondEntry: 'కొత్త చెరువు ఎంట్రీ',
  primaryDetails: 'ప్రాథమిక వివరాలు',
  stockingAnalytics: 'స్టాకింగ్ విశ్లేషణలు',
  email: 'ఈమెయిల్ చిరునామా',
  phoneOrEmail: 'ఫోన్ లేదా ఈమెయిల్',
  operationalData: 'నిర్వహణ డేటా',
  completePondEntry: 'చెరువు ఎంట్రీని పూర్తి చేయండి',
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
  harvestHistory: 'పట్టివేత చరిత్ర',
  noRoiProfiles: 'ఇంకా ROI ప్రొఫైల్‌లు లేవు',
  logFirstHarvest: '+ మొదటి పట్టివేతను నమోదు చేయండి',
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
  feedPlanner: 'మేత ప్లానర్',
  criticalAlerts: 'ముఖ్యమైన హెచ్చరికలు',
  feedEfficiency: 'AI మేత సర్దుబాటు',
  weatherAdj: 'వాతావరణ ఆధారిత సర్దుబాటు',
  forecast7Day: '7-రోజుల వాతావరణం',
  todaysTasks: 'నేటి పనులు',
  viewSchedule: 'షెడ్యూల్ చూడండి',
  inventory: 'స్టాక్/ఇన్వెంటరీ',
  orders: 'ఆర్డర్లు',

  // Disease Detection UI — Telugu
  ddStepPreparation: 'సన్నద్ధత',
  ddStepScanOptions: 'స్కాన్ ఎంపికలు',
  ddStepSymptomChecker: 'లక్షణ పరీక్ష',
  ddStepAnalyzing: 'AI విశ్లేషిస్తోంది…',
  ddStepDiagnosticComplete: 'రోగ నిర్ధారణ పూర్తైంది',
  ddStepDiseaseLibrary: 'వ్యాధి గ్రంథాలయం',
  ddStepSopDetails: 'SOP వివరాలు',
  ddNewScan: 'కొత్త స్కాన్',
  ddFullSOP: 'పూర్తి SOP',
  ddAiScanned: 'AI స్కాన్ చేసింది',
  ddDiagnosticVerdict: 'రోగ నిర్ధారణ తీర్పు',
  ddDetectedCondition: 'గుర్తించిన స్థితి',
  ddAiConfidence: 'AI విశ్వసనీయత',
  ddSeverity: 'తీవ్రత',
  ddAffectedPart: 'ప్రభావిత భాగం',
  ddSource: 'మూలం',
  ddAiPhoto: 'AI ఫోటో',
  ddSymptoms: 'లక్షణాలు',
  ddRecommendedActions: 'సిఫార్సు చేయబడిన చర్యలు',
  ddLogTreatment: '+ చికిత్స నమోదు చేయండి',
  ddDailyAiLimit: 'రోజువారీ AI పరిమితి చేరుకుంది',
  ddGeminiFreeTier: 'Gemini ఉచిత వినియోగం',
  ddQuotaMsg: 'Gemini AI ఉచిత-వినియోగ రోజువారీ కోటా అయిపోయింది. ఇది ప్రతి 24 గంటలకు స్వయంచాలకంగా రీసెట్ అవుతుంది.',
  ddSuggestedWait: 'వేచి ఉండాల్సిన సమయం',
  ddTryAgain: '🔄 మళ్ళీ ప్రయత్నించండి',
  ddPhotoTip1: 'సహజ లేదా ప్రకాశవంతమైన కాంతిలో ఫోటో తీయండి',
  ddPhotoTip2: 'రొయ్యను పరుపుగా పెట్టి — చెవులు, పొట్టు లేదా హెపాటోపాంక్రియాస్ కనిపించేలా ఉంచండి',
  ddPhotoTip3: 'తేడా కోసం తడి నల్ల గుడ్డపై పెట్టండి',
  ddPhotoTip4: 'చెరువు నుండి తీసిన 30 సెకన్లలోపు ఫోటో తీయండి',
  ddPhotoTip5: 'నీటి మెరుపులు నివారించండి — చెరువు వెలుపల ఫోటో తీయండి',
  ddRetakePhoto: 'రొయ్య శరీరంతో మళ్ళీ ఫోటో తీయండి',
  ddSymptomCheckerTitle: 'లక్షణ పరీక్ష',
  ddSymptomCheckerDesc: 'AI నమూనా సరిపోలిక కోసం కనిపించే లక్షణాలను ఎంచుకోండి',
  ddRunDiagnosis: 'AI రోగ నిర్ధారణ నడపండి',
  ddScansUsed: 'స్కాన్లు వాడారు',
  ddScansRemaining: 'మిగిలాయి',
  ddMonthlyQuota: 'నెలవారీ కోటా',
  ddQuotaExhausted: 'అయిపోయింది',
  ddQuotaResets: 'మీ కోటా వచ్చే నెల 1వ తేదీన రీసెట్ అవుతుంది.',
  ddProFeatureRequired: 'AI వ్యాధి గుర్తింపుకు యాక్టివ్ ప్రో ప్లాన్ అవసరం.',
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
  harvestLabel: 'పట్టివేత',
  harvestAdvice: 'పట్టివేత సలహా',

  // Additional Common Keys
  archive: 'ఆర్కైవ్',
  noEntries: 'ఎంట్రీలు ఏవీ లేవు',
  phLevel: 'pH స్థాయి',
  investmentBreakdown: 'పెట్టుబడి వివరాలు',
  profitCalculator: 'లాభాల కాలిక్యులేటర్',
  upgradeToPro: 'ప్రోకు అప్‌గ్రేడ్ అవ్వండి',
  logEntry: 'విశ్లేషణలను చూడటానికి మీ మొదటి పట్టివేతను నమోదు చేయండి.',
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
  timeToFeed: 'మేత సమయం',
  checkFeedTrays: 'మేత ట్రేలను తనిఖీ చేయండి',
  aeratorNightOn: 'నైట్ మోడ్ ఎరేటర్ ఆన్',
  moonCycleAlert: 'చంద్ర చక్ర హెచ్చరిక',
  reduceFeedAmavasya: 'మేత తగ్గించండి - అమావాస్య SOP',
  addMineralsAshtami: 'ఖనిజాలను అన్వయించండి - అష్టమి ఘటం',
  applyLimePhLow: 'సున్నం అన్వయించండి - తక్కువ pH',
  initialSalinity: 'ప్రారంభ ఉప్పదనం (Salinity)',
  released: 'విడుదల చేయబడింది (Stocked)',
  needToRelease: 'విడుదల చేయాలి (Planned)',
  stockingStatus: 'స్టాకింగ్ స్థితి',
  syncingData: 'ఫామ్ డేటాను సమకాలీకరిస్తోంది',
  changePassword: 'పాస్‌వర్డ్ మార్చండి',
  biometricLogin: 'బయోమెట్రిక్ లాగిన్',
  privacyPolicy: 'గోప్యతా విధానం',
  dataExport: 'డేటా ఎగుమతి',
  security: 'భద్రత',
  privacy: 'గోప్యత',
  forgotPassword: 'పాస్‌వర్డ్ మర్చిపోయారా?',
  noWaterData: 'డేటా లేదు',
  confirmStockingTitle: 'స్టాకింగ్ సమయం',
  confirmStockingAction: 'అవును, స్టాకింగ్ ధృవీకరించు',
  editDate: 'తేదీని మార్చు',

  // Lunar Alerts
  amavasyaWarning: 'అమావాస్య (నూతన చంద్రుడు) - అధిక ప్రమాద కాలం',
  ashtamiWarning: 'అష్టమి / నవమి - మధ్యస్థ ప్రమాద రోజులు',
  moonPhaseTitle: 'చంద్ర చక్ర హెచ్చరిక',
  massMoltingRisk: 'నేడు రాత్రి సామూహిక మొల్టింగ్ మరియు DO తగ్గే ప్రమాదం ఎక్కువగా ఉంది.',
  newMoonDay: 'అమావాస్య రోజు',
  fullAerationNight: 'రాత్రి పూట పూర్తి వాయు సరఫరా (Full Night)',
  reduceFeedBy30: 'నేడు రాత్రి మేతను 20-30% తగ్గించండి.',
  immunityBoosterVitaminC: 'విటమిన్ C / రోగ నిరోధక బూస్టర్ జోడించండి.',
  lunarPlanApplied: 'చంద్ర నిర్వహణ ప్రణాళిక అన్వయించబడింది',

  // SOP & Medicine
  expertMentor: 'నిపుణుడు మార్గదర్శి',
  todayTask: 'నేటి SOP పని',
  sopDescription: 'SOP వివరణ',
  medicineBrand: 'మందు / బ్రాండ్',
  recommendedDose: 'సిఫార్సు చేసిన మోతాదు',
  viewChecklist: 'చెక్‌లిస్ట్ చూడండి',
  complianceRule: 'నమ్మకమైన నియమం',
  criticalStageAlert: 'కీలక దశ హెచ్చరిక',
  stage5g: '5గ్రా పెరుగుదల',
  stage15g: '15గ్రా పెరుగుదల',
  stage25g: '25గ్రా పెరుగుదల',
  stage35g: '35గ్రా పెరుగుదల',
  daysTaken: 'తీసుకున్న రోజులు',
  sinceStocking: 'స్టాకింగ్ నుండి',

  // Daily Log Checklist
  dailyLogTitle: 'రోజువారీ SOP లాగ్',
  acclimatizationDone: 'అక్లైమేటైజేషన్ పూర్తయిందా?',
  probioticApplied: 'ప్రోబయోటిక్ అన్వయించారా?',
  aerationLevel: 'వాయు స్థాయి',
  mineralsApplied: 'ఖనిజాలు అన్వయించారా?',
  gutProbioticMixed: 'గట్ ప్రోబయోటిక్ కలిపారా?',
  zeoliteApplied: 'జియోలైట్ అన్వయించారా?',
  sludgeChecked: 'స్లడ్జ్ తనిఖీ చేశారా?',
  vibriosisSigns: 'విబ్రియోసిస్ లక్షణాలు ఉన్నాయా?',
  feedTrayCheck: 'మేత ట్రే తనిఖీ చేశారా?',
  immunityBoostersAdded: 'రోగ నిరోధక బూస్టర్లు జోడించారా?',
  aerator24h: 'ఎరేటర్లు 24 గంటలు నడుస్తున్నాయా?',
  pondBottomCleaned: 'చెరువు అడుగు శుభ్రం చేశారా?',
  waterExchangeDone: 'నీటి మార్పు పూర్తయిందా?',
  targetSizeAchieved: 'లక్ష్య పరిమాణం సాధించారా?',

  // Culture SOP
  cultureSOP: 'సాగు SOP',
  stockingDensity: 'స్టాకింగ్ సాంద్రత',
  aeratorRequirement: 'ఎరేటర్ అవసరాలు',
  cultureSchedule: 'సాగు షెడ్యూల్',
  medicinesPlan: 'మందుల ప్రణాళిక',
  warningSigns: 'హెచ్చరిక సంకేతాలు',
  productionExpectation: 'దిగుబడి అంచనా',
  logMedication: 'మందులు నమోదు చేయండి',
  logDailyProtocol: 'నిత్య నిబంధన నమోదు',
  dailySOP: 'రోజువారీ SOP ట్రాకర్',

  // Harvest ROI
  harvestDetails: 'పట్టివేత వివరాలు',
  whatDidYouHarvest: 'మీరు ఏమి కోశారు?',
  investments: 'పెట్టుబడులు',
  whatDidYouSpend: 'మీరు ఎంత ఖర్చు చేశారు?',
  revenueEarned: 'సంపాదించిన ఆదాయం',
  whatDidYouReceive: 'మీకు ఎంత వచ్చింది?',
  profileSummary: 'ప్రొఫైల్ సారాంశం',
  yourROIAnalysis: 'మీ ROI విశ్లేషణ',
  roiProfileSaved: 'ROI ప్రొఫైల్ సేవ్ అయింది',
  redirectingDashboard: 'డాష్‌బోర్డ్‌కు మళ్ళిస్తోంది...',
  postHarvestROI: 'పట్టివేత తరువాత ROI',
  totalHarvestWeight: 'మొత్తం పట్టివేత బరువు',
  countPerKgSize: 'కిలో/కౌంట్ పరిమాణం',
  survival: 'బతికిన రొయ్యలు',
  cultureDuration: 'సాగు వ్యవధి',
  gradeSplit: 'గ్రేడ్ విభజన (%)',
  feedCostLabel: 'మేత ఖర్చు',
  infrastructurePower: 'మౌలిక సదుపాయాలు & విద్యుత్',
  totalInvestment: 'మొత్తం పెట్టుబడి',
  totalSaleAmount: 'మొత్తం అమ్మకం',
  pricePerKgReceived: 'సాధించిన కిలో ధర',
  buyerCompanyName: 'కొనుగోలుదారు / కంపెనీ పేరు',
  subsidyGovtSupport: 'రాయితీ / ప్రభుత్వ మద్దతు',
  additionalNotes: 'అదనపు నోట్స్',
  netProfitLoss: 'నికర లాభం / నష్టం',
  breakEven: 'బ్రేక్ ఈవన్',
  lossCycle: 'నష్ట సాగు',
  continue: 'కొనసాగించు',
  liveCycleStats: 'ప్రత్యక్ష సాగు గణాంకాలు',
  liveCycle: 'ప్రత్యక్ష సాగు',
  projectRoi: 'అంచనా ROI',

  // System
  systemHealthOptimal: 'సిస్టమ్ ఆరోగ్యం: అద్భుతం',
  systemTestMessage: 'AquaGrow పుష్ ఇంజిన్ ఇప్పుడు మీ ఫామ్‌కు సిద్ధంగా ఉంది.',

  // Pond Status Labels
  statusActive: 'క్రియాశీలం',
  statusPlanned: 'ప్రణాళికాబద్ధం',
  statusSelling: 'అమ్మకం జరుగుతోంది',
  statusHarvested: 'పట్టివేత పూర్తి',
  statusArchived: 'ఆర్కైవ్ చేయబడింది',
  statusNotStarted: 'ప్రారంభించలేదు',
  trustExcellent: 'అద్భుతం',
  trustGood: 'మంచిది',
  trustFair: 'సాధారణం',
  trustNeedsWork: 'మెరుగు చేయాలి',

  // Farm Overview
  farmOverview: 'ఫామ్ అవలోకనం',
  myFarm: 'నా ఫామ్',
  trustScore: 'నమ్మకం స్కోర్',
  activeAlerts: 'క్రియాశీల హెచ్చరికలు',
  harvestReady: 'పట్టివేతకు సిద్ధం',
  densityM2: 'సాంద్రత/మీ²',
  estBiomass: 'అంచనా బయోమాస్',
  estRevenue: 'అంచనా ఆదాయం',
  pondRegistration: 'చెరువు నమోదు',
  activeculture: 'క్రియాశీల సాగు',
  liveYieldPreview: 'ప్రత్యక్ష దిగుబడి అంచనా',
  seedSource: 'విత్తన మూలం',
  estimatesNote: 'DOC 90 · 80% జీవితం · 20గ్రా సగటు · ₹450/కిలో ఆధారంగా అంచనా',
  fillPondContinue: 'కొనసాగడానికి చెరువు పేరు మరియు పరిమాణం నమోదు చేయండి',
  gotIt: 'సరే',
  logConditions: 'పరిస్థితులు నమోదు చేయండి',

  // Harvest Tracking Stages
  stageSelling: 'అమ్మకం',
  stageQualityCheck: 'నాణ్యత తనిఖీ',
  stageWeightCheck: 'బరువు తనిఖీ',
  stageRateConfirm: 'రేటు నిర్ధారణ',
  stageHarvest: 'పట్టివేత',
  stagePayment: 'చెల్లింపు విడుదల',
  stageArchive: 'ఆర్కైవ్',

  // Water Monitoring
  paramPh: 'pH',
  paramDo: 'DO',
  paramTemp: 'ఉష్ణో.',
  paramSalinity: 'ఉప్పదనం',
  paramAmmonia: 'అమ్మోనియా',
  paramAlkalinity: 'ఆల్కలినిటీ',
  optimalRange: 'సరైన పరిధి',
  logConditionsBtn: 'పరిస్థితులు నమోదు',
  waterHealth: 'ఆరోగ్యం',
  waterHistory: 'చరిత్ర',
  harvestAnalysis: 'పట్టివేత',

  // Aerator Management
  aeratorManagement: 'ఎరేటర్ నిర్వహణ',
  aeratorOn: 'ఆన్',
  aeratorOff: 'ఆఫ్',
  aeratorAuto: 'ఆటో',
  addAerator: 'ఎరేటర్ జోడించండి',
  aeratorName: 'ఎరేటర్ పేరు',
  aeratorType: 'రకం',
  aeratorPower: 'శక్తి (HP)',

  // Pond Detail Sections
  pondOverview: 'అవలోకనం',
  pondTimeline: 'టైమ్‌లైన్',
  pondCertificate: 'సర్టిఫికేట్',
  pondAerators: 'ఎరేటర్లు',
  growthMilestonesTitle: 'పెరుగుదల మైలురాళ్ళు',
  liveTrackingActive: 'ప్రత్యక్ష ట్రాకింగ్ చురుకుగా ఉంది',
  marketSaleJourney: 'మార్కెట్ అమ్మకపు ప్రయాణం',
  orderCancelled: 'ఆర్డర్ రద్దయింది',
  harvestPrepDoc: 'పట్టివేత తయారీ',
  highFcr: 'అధిక FCR',
  sopTarget: 'SOP లక్ష్యం ≤1.4. మేత తగ్గించండి, ట్రే తనిఖీ చేయండి.',
  noWaterLogToday: 'నేడు నీటి లాగ్ లేదు',
  tapToLogNow: 'ఇప్పుడే నమోదు చేయడానికి నొక్కండి - SOP సమ్మతికి అవసరం',
  waterQualitySection: 'నీటి నాణ్యత',
  liveCultureOversightLabel: 'ప్రత్యక్ష సాగు పర్యవేక్షణ',
  revenueNotRecorded: 'ఆదాయం నమోదు కాలేదు',
  selfHarvestReason: 'స్వంత పట్టివేత కారణం',
  partialHarvestHistory: 'పాక్షిక పట్టివేత చరిత్ర',
  revenueLabel: 'ఆదాయం',
  auditCertificate: 'అక్వాగ్రో ఆడిట్ సర్టిఫికేట్',
  auditScore: 'ఆడిట్ స్కోర్',
  cultureDays: 'సాగు రోజులు',
  verifiedBy: 'అక్వాగ్రో ఇంటెలిజెన్స్ ద్వారా ధృవీకరించబడింది',
  buyerTrustReady: 'కొనుగోలుదారు నమ్మకానికి సిద్ధం',
  certAfterDoc10: 'DOC 10 తర్వాత సర్టిఫికేట్ అందుబాటులో ఉంటుంది',
  keepLoggingTrust: 'ట్రస్ట్ స్కోర్ నిర్మించడానికి రోజూ నమోదు చేయండి',
  stopHarvest: 'పట్టివేత ఆపాలా?',
  deletionLocked: 'తొలగింపు నిరోధించబడింది',
  deletionLockedMsg: 'DOC 7 దాటిన చెరువు సాగు రికార్డులు భద్రపరచడానికి తొలగించలేము.',

  // Harvest Page
  harvestPond: 'చెరువు పట్టివేత',
  harvestReadiness: 'పట్టివేత సంసిద్ధత',
  sopComplianceCheck: 'SOP సమ్మతి తనిఖీ',
  finalCycle: 'చివరి సాగు',
  finalizingHarvest: 'పట్టివేత ఖరారు చేస్తోంది',
  chooseHarvestMethod: 'పట్టివేత పద్ధతి ఎంచుకోండి',
  marketSale: 'మార్కెట్ అమ్మకం',
  selfHarvest: 'స్వంత కపట్టివేత',
  marketSaleDesc: '150km పరిధిలోని ధృవీకరించిన కొనుగోలుదారులకు మీ పట్టివేతను ప్రసారం చేయండి. అమ్మకపు ప్రయాణం, నాణ్యత తనిఖీ, తూకం మరియు చెల్లింపు అక్వాగ్రో నిర్వహిస్తుంది.',
  selfHarvestDesc: 'మీరు స్వతంత్రంగా కోస్తున్నారు — స్థానిక అమ్మకం, కాంట్రాక్ట్ కొనుగోలు, లేదా వ్యక్తిగత వినియోగం. ఆడిట్ కోసం నమోదు చేసిన కారణంతో చెరువు కోయబడినట్లు గుర్తించబడుతుంది.',
  partialHarvest: 'పాక్షిక పట్టివేత',
  fullHarvest: 'పూర్తి పట్టివేత',
  avgWeightG: 'సగటు బరువు (గ్రా)',
  biomassKg: 'బయోమాస్ (కిలో)',
  targetRate: 'లక్ష్య ₹/కిలో',
  availableBuyers: 'అందుబాటులో ఉన్న కొనుగోలుదారులు',
  liveQuotes: 'ప్రత్యక్ష ధరలు',
  smartBroadcastActive: 'స్మార్ట్ బ్రాడ్‌కాస్ట్ చురుకుగా ఉంది',
  broadcastRadius: 'ఎంచుకున్న కొనుగోలుదారులకు + 150km పరిధిలో ఏజెంట్లకు పంపబడుతుంది.',
  broadcastToMarket: 'మార్కెట్‌కు ప్రసారం చేయండి',
  broadcasting: 'ప్రసారం అవుతోంది...',
  selectHarvestReason: 'పట్టివేత కారణం ఎంచుకోండి',
  customReason: 'అనుకూల కారణం (ఐచ్ఛికం)',
  customReasonPlaceholder: 'మీ పట్టివేత పరిస్థితి వివరించండి...',
  auditRecordCreated: 'ఆడిట్ రికార్డ్ సృష్టించబడింది',
  auditRecordDesc: 'మీ పట్టివేత కారణం మరియు బయోమాస్ డేటా ROI నివేదిక మరియు ట్రస్ట్ సర్టిఫికేట్ కోసం చెరువు ఆడిట్ ట్రైల్‌లో సేవ్ చేయబడుతుంది.',
  pleaseSelectReason: 'ధృవీకరించే ముందు పట్టివేత కారణం ఎంచుకోండి లేదా నమోదు చేయండి.',
  confirmSelfHarvest: 'స్వంత పట్టివేత ధృవీకరించండి',
  recordingHarvest: 'పట్టివేత నమోదు అవుతోంది...',
  earlyHarvestRisk: 'DOC 90 ముందు కోయడం మార్కెట్ గ్రేడ్ తగ్గించవచ్చు మరియు ఆదాయాన్ని 30% పట్టివేత వేయవచ్చు.',

  // Harvest Tracking
  harvestCancelled: 'పట్టివేత రద్దయింది',
  reasonGiven: 'ఇచ్చిన కారణం',
  noActiveHarvest: 'క్రియాశీల పట్టివేత లేదు',
  startHarvestFromPond: 'మీ చెరువు పేజీ నుండి పట్టివేత ఆర్డర్ ప్రారంభించండి',
  estRevenueLabel: 'అంచనా ఆదాయం',
  ratePerKg: 'రేటు /కిలో',
  saleJourney: 'అమ్మకపు ప్రయాణం',
  stageComplete: 'దశ పూర్తి',
  revenueBreakdown: 'ఆదాయ విభజన',
  buyerChat: 'కొనుగోలుదారు చాట్',
  retractBroadcast: 'ప్రసారం వెనక్కి తీసుకోనా?',
  pendingLabel: 'పెండింగ్',

  // Harvest Revenue Ledger
  feedingLog: 'ఫీడింగ్ లాగ్',
  settledAndVerified: 'పరిష్కారం & ధృవీకరించబడింది',
  payment: 'చెల్లింపు',
  totalReceivedAmount: 'మొత్తం అందిన మొత్తం',
  buyerEntity: 'కొనుగోలుదారు / సంస్థ',
  saleDate: 'అమ్మకపు తేదీ',
  countSize: 'కౌంట్ / సైజు',
  baseRate: 'బేస్ రేటు (₹/కిలో)',
  closeLedger: 'లెడ్జర్ మూసివేయండి',
  harvestRevenue: 'పట్టివేత ఆదాయం',
  yieldLedger: 'దిగుబడి లెడ్జర్',
  latestHarvestSettlement: 'తాజా పరిష్కారం',
  totalNetEarnings: 'మొత్తం నికర ఆదాయం',
  premiumMargin: 'ప్రీమియం మార్జిన్',
  settledDate: 'పరిష్కారం తేదీ',
  revenueComposition: 'ఆదాయ కూర్పు',
  baseBiomassSales: 'బేస్ బయోమాస్ అమ్మకాలు',
  bonusSubsidies: 'బోనస్ & సబ్సిడీలు',
  settlementAudit: 'పరిష్కార ఆడిట్',
  pdfStatement: 'స్టేట్‌మెంట్ డౌన్‌లోడ్',
  settled: 'పరిష్కారం',

  // Admin Dashboard
  adminControl: 'అడ్మిన్ కంట్రోల్',
  totalUsers: 'మొత్తం వినియోగదారులు',
  activeSubs: 'చురుకు సబ్‌స్క్రిప్షన్లు',
  health: 'ఆరోగ్యం',
  marketPrice: 'మార్కెట్ ధర',
  updatePrice: 'ధర నవీకరించండి',
  recentActivity: 'ట్ తత్కాలిక కార్యాచరణ',

  // Provider Module
  providerDashboard: 'ప్రొవైడర్ డాష్‌బోర్డ్',
  totalSales: 'మొత్తం అమ్మకాలు',
  activeOrders: 'చురుకు ఆర్డర్లు',
  pending: 'పెండింగ్',
  shipped: 'పంపబడింది',
  addProduct: 'ఉత్పత్తి జోడించండి',
  stock: 'స్టాక్',
  viewDetails: 'వివరాలు చూడండి',
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




