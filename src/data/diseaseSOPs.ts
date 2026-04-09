// ─────────────────────────────────────────────────────────────────────────────
// AquaGrow · Disease SOP Database
// 10 Major Shrimp Diseases — Full Expert Protocol per Disease
// ─────────────────────────────────────────────────────────────────────────────

export interface DiseaseSOP {
  id: string;
  name: string;
  shortName: string;
  category: 'bacterial' | 'viral' | 'nutritional' | 'environmental' | 'parasitic' | 'fungal' | 'mixed';
  dangerLevel: 'low' | 'moderate' | 'high' | 'critical';
  causedBy: string;
  docRisk: string;
  symptoms: string[];
  causes: string[];
  visualMarkers: string[];       // What AI / farmer should look for in a photo
  earlyWarnings: string[];       // Before confirmed disease
  immediateActions: string[];
  protocol: {
    water: string[];
    feed: string[];
  };
  feedManagement: { day: number; quantity: string; note?: string }[];
  waterQuality: { parameter: string; value: string; action?: string }[];
  monitoring: string[];
  mistakes: string[];
  recoverySigns: string[];
  preventionTips: string[];
}

export const DISEASE_SOPS: Record<string, DiseaseSOP> = {

  // ── 1. WHITE SPOT SYNDROME VIRUS (WSSV) ────────────────────────────────────
  wssv: {
    id: 'wssv',
    name: 'White Spot Disease (WSSV)',
    shortName: 'WSSV',
    category: 'viral',
    dangerLevel: 'critical',
    causedBy: 'Virus (White Spot Syndrome Virus)',
    docRisk: 'DOC 20–60',
    symptoms: [
      'White calcified spots (0.5–2 mm) on shell/carapace',
      'Shrimp swim slowly or gather at pond edges',
      'Sudden complete stop of feeding',
      'High mortality within 3–5 days',
      'Reddish-pink overall body coloration',
    ],
    causes: [
      'WSSV virus from infected water or wild shrimp',
      'Unverified seed from hatchery not PCR-tested',
      'Birds, crabs, equipment acting as carriers',
      'Sudden temperature drop below 25°C triggers outbreak',
    ],
    visualMarkers: [
      'Distinct white calcified circular spots under carapace — not removable',
      'Reddish or pinkish tinge across body',
      'Loose shell that peels easily from body',
      'Shrimp walking on pond bank or surfacing',
    ],
    earlyWarnings: [
      'Sudden feed reduction by 30% or more',
      'Shrimp clustering at pond edges in daytime',
      'Slow, lethargic movement',
    ],
    immediateActions: [
      '🚨 STOP all water exchange immediately — isolate the pond',
      '🚨 Block all inlet and outlet pipes completely',
      'Reduce feed to 30% or STOP completely',
      'Run all aerators at maximum power',
      'Contact an aquaculture disease expert within 24 hours',
      'Consider emergency harvest if DOC > 50 and size acceptable',
    ],
    protocol: {
      water: [
        'Calcium hydroxide (lime): 20 kg/acre — raise pH to > 8.3',
        'Disinfect all equipment with 5% bleach solution',
        'BKC (Benzalkonium Chloride): 500 ml/acre in evening',
        'Do NOT drain infected water into shared channels',
      ],
      feed: [
        'Vitamin C: 5–10 g/kg (immune support)',
        'Beta-glucan immunity booster: 2 g/kg',
        'No antibiotics — WSSV is viral, not bacterial',
      ],
    },
    feedManagement: [
      { day: 1, quantity: '30% or STOP',  note: 'Evaluate emergency harvest' },
      { day: 2, quantity: '30%',          note: 'Monitor mortality strictly' },
      { day: 3, quantity: 'Assess only',  note: 'Decide: continue or harvest' },
    ],
    waterQuality: [
      { parameter: 'DO',   value: '> 6 ppm',   action: 'Maximize aerators' },
      { parameter: 'pH',   value: '8.0 – 8.3', action: 'Apply lime for stability' },
      { parameter: 'Temp', value: '28 – 32°C', action: 'Protect from cold nights' },
    ],
    monitoring: ['Hourly mortality count', 'Bird/crab activity around pond', 'Shrimp behavior at surface'],
    mistakes: [
      'Draining infected water into common water channels',
      'Sharing nets or equipment between ponds',
      'Delaying isolation decision',
      'Late detection — not checking feed trays daily',
    ],
    recoverySigns: ['Mortality rate drops below 5/day', 'Feeding improves slightly', 'Normal shell pigment returns'],
    preventionTips: [
      'Source seed only from PCR-certified WSSV-free hatcheries',
      'Install bird netting over entire pond area',
      'Screen all water inlets with 200µm mesh',
      'PCR test at DOC 20 and 45 as routine check',
    ],
  },

  // ── 2. EMS / AHPND ─────────────────────────────────────────────────────────
  ems_ahpnd: {
    id: 'ems_ahpnd',
    name: 'Early Mortality Syndrome (EMS/AHPND)',
    shortName: 'EMS',
    category: 'bacterial',
    dangerLevel: 'critical',
    causedBy: 'Bacteria (Vibrio parahaemolyticus)',
    docRisk: 'DOC 7–30',
    symptoms: [
      'Sudden mass death within first 30 days of stocking',
      'Empty gut (no visible food/content inside)',
      'Pale or white hepatopancreas (liver near head)',
      'Soft and wrinkled shell',
      'Lethargic shrimp near surface',
    ],
    causes: [
      'Vibrio parahaemolyticus producing toxins (PirA/PirB)',
      'Infected or low-quality seed stock from hatchery',
      'Poor pond hygiene during preparation',
      'High organic matter promoting Vibrio growth',
    ],
    visualMarkers: [
      'Pale or white hepatopancreas near head — should be orange/brown',
      'Empty or near-empty gut line (transparent body)',
      'Soft, wrinkled carapace at early culture stage',
      'Shrimp accumulating dead at one corner',
    ],
    earlyWarnings: [
      'Rapid drop in feed consumption by DOC 10–15',
      'Dead shrimp at bottom of feed tray',
      'Shrimp surfacing in large groups',
    ],
    immediateActions: [
      '🚨 Remove dead shrimp immediately from pond',
      'Apply probiotic for competitive exclusion of Vibrio',
      'Increase aeration — keep DO > 5 ppm',
      'Reduce feed by 50% — remove trays',
      'Send water + shrimp sample to lab for Vibrio count',
    ],
    protocol: {
      water: [
        'Probiotic (Bacillus subtilis): 2 kg/acre immediately',
        'Organic acid: 1 L/acre to lower Vibrio load',
        'Zeolite: 10 kg/acre for ammonia reduction',
        'Chlorine dioxide (ClO₂): 0.3 ppm treatment if heavy mortality',
      ],
      feed: [
        'Stop feed for 24 hours on Day 1',
        'Organic acid in feed: 5 ml/kg for 7 days',
        'Liver tonic: 10 ml/kg',
        'Vitamin C: 3 g/kg',
        'Prebiotic (MOS/FOS): 2 g/kg',
      ],
    },
    feedManagement: [
      { day: 1, quantity: 'STOP',  note: 'Remove all feeding trays' },
      { day: 2, quantity: '30%',   note: 'Monitor closely' },
      { day: 3, quantity: '40%',   note: 'Add probiotic to feed' },
      { day: 5, quantity: '60%',   note: 'Reassess mortality' },
      { day: 7, quantity: '80%',   note: 'Resume if mortality stopped' },
    ],
    waterQuality: [
      { parameter: 'DO',      value: '> 5 ppm',   action: 'Priority aeration' },
      { parameter: 'pH',      value: '7.8 – 8.2', action: 'Add dolomite if dropping' },
      { parameter: 'Vibrio',  value: '< 10² CFU', action: 'Test water weekly' },
      { parameter: 'Ammonia', value: '< 0.1 ppm', action: 'Apply zeolite' },
    ],
    monitoring: ['Daily dead count at tray and edges', 'Hepatopancreas color check', 'Vibrio count from lab twice weekly'],
    mistakes: [
      'Ignoring early low mortality as "normal"',
      'Continuing high feed rates during outbreak',
      'Not testing Vibrio count before applying treatment',
    ],
    recoverySigns: ['No dead shrimp in tray for 3 consecutive days', 'Hepatopancreas returns to orange', 'Feed response resumes'],
    preventionTips: [
      'Bleach and dry pond floor for 10+ days before filling',
      'Treat incoming water with chlorine before stocking',
      'Add probiotics from Day 1 of stocking',
      'Use PCR-tested, certified seed from trusted hatchery',
    ],
  },

  // ── 3. BLACK GILL DISEASE ───────────────────────────────────────────────────
  black_gill: {
    id: 'black_gill',
    name: 'Black Gill Disease',
    shortName: 'BlackGill',
    category: 'mixed',
    dangerLevel: 'moderate',
    causedBy: 'Bacteria / Fungi / Poor water quality',
    docRisk: 'DOC 30–80',
    symptoms: [
      'Gills turn black or dark brown in color',
      'Weak swimming, shrimp appear tired',
      'Shrimp coming to pond surface for air',
      'Reduced growth rate despite normal feeding',
      'High mortality in heavily infected cases',
    ],
    causes: [
      'Detritus and sludge accumulation on gills',
      'High ammonia or hydrogen sulphide (H₂S)',
      'Algae bloom die-off fouling the water',
      'Bacterial or fungal colonization of gill tissue',
    ],
    visualMarkers: [
      'Dark or black gills visible under lifted carapace',
      'Brown/necrotic tissue around gill area',
      'Pale body with dark gill contrast',
    ],
    earlyWarnings: [
      'Shrimp surfacing in morning hours',
      'Water transparency decreasing suddenly',
      'Strong smell from pond bottom',
    ],
    immediateActions: [
      'Emergency water exchange — 20% volume immediately',
      'Run all aerators at maximum',
      'Apply zeolite: 15 kg/acre for ammonia',
      'Stop feeding for 12–24 hours',
    ],
    protocol: {
      water: [
        'Zeolite: 15–20 kg/acre',
        'Dolomite: 10 kg/acre at night for pH stability',
        'Potassium permanganate: 2 ppm for 1 hour (oxidize H₂S)',
        'Apply probiotic next morning after treatment',
      ],
      feed: [
        'Vitamin C: 3 g/kg for 5 days',
        'Liver tonic: 5 ml/kg',
        'Antifungal supplement if fungal infection confirmed',
      ],
    },
    feedManagement: [
      { day: 1, quantity: 'STOP',  note: 'Allow recovery 24 hrs' },
      { day: 2, quantity: '40%',   note: 'Resume cautiously' },
      { day: 3, quantity: '60%',   note: 'Check gill color' },
      { day: 5, quantity: '80%',   note: 'Ramp if gill recovered' },
    ],
    waterQuality: [
      { parameter: 'DO',        value: '> 5 ppm',    action: 'Emergency aeration' },
      { parameter: 'Ammonia',   value: '< 0.1 ppm',  action: 'Zeolite + water exchange' },
      { parameter: 'H₂S',       value: '< 0.02 ppm', action: 'KMnO₄ treatment' },
      { parameter: 'Turbidity', value: 'Clear',      action: 'Remove sludge' },
    ],
    monitoring: ['Gill color check every 3 days (lift 5 shrimp)', 'Bottom soil H₂S test weekly', 'DO at 3 AM, 6 AM, 2 PM'],
    mistakes: ['Turning off aerators at night to save power', 'Ignoring sludge accumulation', 'Skipping bottom soil testing'],
    recoverySigns: ['Gills return to pale pink/cream color', 'Shrimp stop surfacing', 'Feed consumption resumes normally'],
    preventionTips: [
      'Use bottom aeration tubes to prevent sludge buildup',
      'Test H₂S weekly with test kits from DOC 40',
      'Maintain water transparency 30–40 cm (Secchi disk)',
      'Apply bottom probiotics: 2 kg/acre biweekly',
    ],
  },

  // ── 4. WHITE GUT DISEASE (WGD) ─────────────────────────────────────────────
  white_gut: {
    id: 'white_gut',
    name: 'White Gut Disease (WGD)',
    shortName: 'WGD',
    category: 'bacterial',
    dangerLevel: 'moderate',
    causedBy: 'Bacteria (gut infection / Vibrio)',
    docRisk: 'DOC 20–50',
    symptoms: [
      'White or pale gut line visible through body',
      'White floating fecal strings in pond water',
      'Poor feed intake — uneaten feed remaining in trays',
      'Uneven body size (growth variation in pond)',
      'Sluggish or weak swimming behavior',
    ],
    causes: [
      'Vibrio spp. infection in the gut',
      'Overfeeding causing gut inflammation',
      'Low DO stress affecting gut immunity',
      'Absence of gut probiotics in feed',
    ],
    visualMarkers: [
      'Pale or white gut line (should be dark-brown/orange)',
      'Thread-like white fecal strings trailing from shrimp',
      'Swollen or inflamed mid-gut region',
    ],
    earlyWarnings: [
      'Feed consumption drops suddenly by 20% or more',
      'White strings visible in water near feeding area',
      'Shrimp scatter from feed tray within minutes of feeding',
    ],
    immediateActions: [
      'Reduce feed by 30–50% immediately',
      'Run all aerators — increase DO to > 5 ppm',
      'Clean feed trays thoroughly after each meal',
      'Apply water probiotic within 2 hours',
    ],
    protocol: {
      water: [
        'Probiotic (Bacillus-based): 1 kg/acre',
        'Zeolite: 10–15 kg/acre (ammonia reduction)',
        'Mineral mix: 5 kg/acre',
        'Dolomite: 5 kg/acre if pH < 7.5',
      ],
      feed: [
        'Gut probiotic: 5–10 g/kg feed',
        'Liver tonic: 5 ml/kg feed',
        'Vitamin C: 2 g/kg feed',
        'Organic acid blend: 3 ml/kg feed',
        'Use soy oil as binder before mixing supplements',
      ],
    },
    feedManagement: [
      { day: 1, quantity: '50%', note: 'Remove all uneaten feed' },
      { day: 2, quantity: '60%', note: 'Monitor tray residue' },
      { day: 3, quantity: '70%', note: 'Check gut color on 5 shrimp' },
      { day: 4, quantity: '80%', note: 'Add probiotics to feed' },
      { day: 5, quantity: 'Normal', note: 'Resume if gut recovered' },
    ],
    waterQuality: [
      { parameter: 'DO',       value: '> 5 ppm',    action: 'Run emergency aerators' },
      { parameter: 'pH',       value: '7.5 – 8.2',  action: 'Dolomite if < 7.5' },
      { parameter: 'Ammonia',  value: '< 0.1 ppm',  action: 'Zeolite if elevated' },
      { parameter: 'Salinity', value: '15 – 25 ppt', action: 'Avoid sudden change' },
    ],
    monitoring: ['Feed tray residue every meal', 'Gut color (check 5 shrimp/tray)', 'Morning DO levels'],
    mistakes: ['Overfeeding during recovery', 'Sudden water exchange > 20%', 'Using antibiotics without vet advice'],
    recoverySigns: ['Gut returns to dark/brown color', 'Feeding response improves by Day 3', 'Active swimming resumes'],
    preventionTips: [
      'Use gut probiotic in feed daily from DOC 10',
      'Maintain DO > 5 ppm at all times',
      'Follow tray monitoring strictly — check residue every meal',
      'Avoid feeding during very low DO periods (3–6 AM)',
    ],
  },

  // ── 5. RUNNING MORTALITY SYNDROME (RMS) ────────────────────────────────────
  rms: {
    id: 'rms',
    name: 'Running Mortality Syndrome (RMS)',
    shortName: 'RMS',
    category: 'mixed',
    dangerLevel: 'high',
    causedBy: 'Mixed — bacterial + environmental stress',
    docRisk: 'DOC 40–80',
    symptoms: [
      'Continuous low daily mortality (5–30 shrimp/day)',
      'Soft shell shrimp appearing regularly',
      'Lethargic, weak behavior across pond',
      'Poor growth rate despite adequate feeding',
      'Shrimp found weak or dying at pond edges',
    ],
    causes: [
      'Chronic Vibrio infection combined with water stress',
      'High ammonia or low DO over extended periods',
      'EHP co-infection reducing immune response',
      'Poor bottom condition — sludge accumulation',
      'Over-stocking density beyond pond carrying capacity',
    ],
    visualMarkers: [
      'Soft, wrinkled carapace in multiple shrimp',
      'Dull/pale body color instead of translucent',
      'Dead shrimp at edges with no external spots',
      'Uneven size distribution in same pond',
    ],
    earlyWarnings: [
      'Finding 5–10 dying shrimp daily near edges',
      'Mixed sizes in cast net check (stunted vs normal)',
      'FCR increasing beyond normal range for DOC',
    ],
    immediateActions: [
      'Reduce stocking stress — check for overcrowding',
      'Increase water exchange: 10–15%/day for 3 days',
      'Apply probiotic immediately',
      'Reduce feed by 20% and monitor tray residue',
      'Test water for Vibrio count and ammonia',
    ],
    protocol: {
      water: [
        'Probiotic (Bacillus): 2 kg/acre every 3 days',
        'Zeolite: 10 kg/acre (ammonia management)',
        'Mineral supplement: 5 kg/acre',
        'Dolomite: 5 kg/acre at night',
      ],
      feed: [
        'Liver tonic: 10 ml/kg for 7 days',
        'Vitamin C: 3 g/kg',
        'Organic acid: 5 ml/kg',
        'Gut probiotic: 5 g/kg',
        'Immune booster (beta-glucan): 1 g/kg',
      ],
    },
    feedManagement: [
      { day: 1, quantity: '80%',    note: 'Reduce slightly and monitor' },
      { day: 3, quantity: '80%',    note: 'Check mortality trend' },
      { day: 5, quantity: '85%',    note: 'If improving, hold' },
      { day: 7, quantity: '90%',    note: 'Resume slowly' },
      { day: 10, quantity: 'Normal', note: 'Only if mortality stopped' },
    ],
    waterQuality: [
      { parameter: 'DO',      value: '> 5 ppm',   action: 'Night aeration priority' },
      { parameter: 'Ammonia', value: '< 0.1 ppm', action: 'Zeolite + exchange' },
      { parameter: 'pH',      value: '7.8 – 8.2', action: 'Monitor daily' },
      { parameter: 'H₂S',     value: '< 0.02 ppm',action: 'Test pond bottom' },
    ],
    monitoring: ['Daily mortality count at 7 AM and 5 PM', 'Weekly ABW vs target', 'FCR tracking every 5 days'],
    mistakes: ['Increasing feed during ongoing mortality', 'Not testing water for root cause', 'Applying multiple chemicals at once'],
    recoverySigns: ['Daily mortality drops to < 3/day for 5 days', 'Shell becomes firm at cast net check', 'FCR normalizes'],
    preventionTips: [
      'Keep stocking density within pond capacity',
      'Maintain Vibrio count < 10² CFU/mL throughout culture',
      'Run bottom aeration from DOC 30 onwards',
      'Perform weekly cast net checks for size uniformity',
    ],
  },

  // ── 6. EHP ─────────────────────────────────────────────────────────────────
  ehp: {
    id: 'ehp',
    name: 'EHP (Enterocytozoon hepatopenaei)',
    shortName: 'EHP',
    category: 'parasitic',
    dangerLevel: 'high',
    causedBy: 'Microsporidian parasite (EHP)',
    docRisk: 'DOC 15–60',
    symptoms: [
      'Severely slow growth — major identifying sign',
      'Significant size variation within the same pond',
      'Normal survival rate but very low body weight',
      'White feces sometimes visible in water',
      'Normal behavior but stunted development',
    ],
    causes: [
      'Enterocytozoon hepatopenaei parasite in hepatopancreas',
      'Infected seed stock from hatchery (primary source)',
      'Cross-contamination from infected ponds or equipment',
      'No vaccine — prevention through clean seed only',
    ],
    visualMarkers: [
      'Unusually small body size for culture age (DOC)',
      'Pale or slightly white hepatopancreas near head',
      'Soft, undersized carapace for expected weight',
      'Size distribution extremely wide in same pond cohort',
    ],
    earlyWarnings: [
      'ABW at DOC 30 is below 50% of target size',
      'Very wide size variation in cast net sample',
      'FCR increasing but shrimp not gaining weight',
    ],
    immediateActions: [
      'Collect 10 shrimp for PCR lab test (confirm EHP)',
      'Reduce feed by 30% while waiting for results',
      'Apply probiotic — competitive exclusion support',
      'Increase water exchange 5–10%/day',
    ],
    protocol: {
      water: [
        'Probiotic (Bacillus subtilis): 2 kg/acre',
        'Organic acid (citric acid): 1 L/acre',
        'Avoid cross-contamination — close all shared inlets',
      ],
      feed: [
        'Organic acid in feed: 5 ml/kg for 10 days',
        'Liver tonic: 10 ml/kg',
        'Vitamin C: 3 g/kg',
        'Prebiotic (FOS): 2 g/kg',
        'No antibiotics effective — EHP is a parasite',
      ],
    },
    feedManagement: [
      { day: 1,  quantity: '70%',   note: 'Reduce pending PCR result' },
      { day: 3,  quantity: '70%',   note: 'Continue monitoring' },
      { day: 7,  quantity: '80%',   note: 'Adjust based on ABW' },
      { day: 14, quantity: '85%',   note: 'Reassess growth response' },
      { day: 21, quantity: 'Adjust', note: 'Based on weekly ABW data' },
    ],
    waterQuality: [
      { parameter: 'DO',     value: '> 5 ppm',   action: 'Consistent aeration' },
      { parameter: 'pH',     value: '7.8 – 8.2', action: 'Daily monitoring' },
      { parameter: 'Vibrio', value: 'Low count',  action: 'Test fortnightly' },
    ],
    monitoring: ['Weekly ABW vs standard growth curve', 'Hepatopancreas color every 10 days', 'Size variation tracking at cast net'],
    mistakes: ['Using sick pond equipment in healthy ponds', 'Ignoring slow growth as "normal feed issue"', 'Skipping PCR testing before stocking'],
    recoverySigns: ['ABW catches up toward standard curve', 'Hepatopancreas color returns to orange/brown', 'Size variation reduces in pond'],
    preventionTips: [
      'Use PCR-tested, EHP-negative certified seed',
      'Bleach and dry pond floor minimum 10 days before filling',
      'Avoid sharing equipment between ponds without disinfection',
      'Monitor ABW weekly from DOC 15 against target table',
    ],
  },

  // ── 7. VIBRIOSIS ───────────────────────────────────────────────────────────
  vibriosis: {
    id: 'vibriosis',
    name: 'Vibriosis (Luminescent)',
    shortName: 'Vibrio',
    category: 'bacterial',
    dangerLevel: 'high',
    causedBy: 'Vibrio bacteria (V. harveyi / V. alginolyticus)',
    docRisk: 'DOC 10–40',
    symptoms: [
      'Red or reddish coloration on body and legs',
      'Necrosis (black/brown tissue death) in tail or appendages',
      'Weak, slow-moving shrimp at pond edges',
      'Shrimp glowing / luminescent at night (V. harveyi)',
      'Reduced feeding response',
    ],
    causes: [
      'Vibrio harveyi or V. alginolyticus bacterial infection',
      'High organic load in pond promoting Vibrio growth',
      'Low salinity (< 10 ppt) increasing Vibrio dominance',
      'Poor biosecurity at stocking stage',
    ],
    visualMarkers: [
      'Reddish or blackish necrotic coloration on tail fins and legs',
      'Black spots at appendage joints — necrosis',
      'Cloudy or opaque body tissue instead of clear',
      'Glowing shrimp at night in water surface',
    ],
    earlyWarnings: [
      'Luminescence (glow) visible at night in pond water',
      'Redness developing on appendages',
      'Increased dead count especially near edges',
    ],
    immediateActions: [
      'Apply probiotic immediately — competitive exclusion',
      'Increase aeration — Vibrio thrives in low DO',
      'Reduce feed by 40%',
      'Test Vibrio count — target < 10² CFU/mL',
    ],
    protocol: {
      water: [
        'Chlorine dioxide (ClO₂): 0.5 ppm — 1 hr treatment, then aerator flush',
        'Probiotic (Bacillus): 2 kg/acre next evening',
        'Organic acid: 1 L/acre',
        'BKC: 200 ml/acre if heavy infection',
      ],
      feed: [
        'Antibacterial probiotic: 5 g/kg for 5 days',
        'Vitamin C: 3 g/kg',
        'Garlic extract: 5 ml/kg (natural Vibrio inhibitor)',
        'Prebiotics (FOS/MOS): 2 g/kg',
      ],
    },
    feedManagement: [
      { day: 1, quantity: '40%',  note: 'Stop if mortality is high' },
      { day: 2, quantity: '50%',  note: 'Continue probiotic' },
      { day: 3, quantity: '60%',  note: 'Check Vibrio count in water' },
      { day: 5, quantity: '80%',  note: 'Ramp if improving' },
    ],
    waterQuality: [
      { parameter: 'DO',         value: '> 5 ppm',    action: 'Maximize aeration' },
      { parameter: 'Salinity',   value: '15 – 25 ppt', action: 'Avoid low salinity' },
      { parameter: 'Vibrio CFU', value: '< 10² /mL',  action: 'Apply chlorine treatment' },
      { parameter: 'Turbidity',  value: 'Clear',      action: 'Reduce organic load' },
    ],
    monitoring: ['Nightly luminescence check', 'Vibrio plate count weekly (TCBS media)', 'Shrimp appendage inspection twice weekly'],
    mistakes: ['Using antibiotics without sensitivity test', 'Over-applying chlorine then killing probiotics', 'Late detection beyond DOC 30'],
    recoverySigns: ['No luminescence at night', 'Appendages healing, normal color', 'Feed response returning'],
    preventionTips: [
      'Apply probiotics from Day 1 of stocking',
      'Maintain DO > 5 ppm — Vibrio thrives in low oxygen',
      'Keep salinity > 15 ppt during early rearing',
      'Test Vibrio CFU fortnightly using TCBS media',
    ],
  },

  // ── 8. IHHNV ───────────────────────────────────────────────────────────────
  ihhnv: {
    id: 'ihhnv',
    name: 'IHHNV (Deformity Virus)',
    shortName: 'IHHNV',
    category: 'viral',
    dangerLevel: 'moderate',
    causedBy: 'Virus (Infectious Hypodermal Hematopoietic Necrosis Virus)',
    docRisk: 'DOC 20–90',
    symptoms: [
      'Deformed or bent body shape',
      'Rostrum (front horn) bent or kinked',
      'Severely slow growth compared to pond average',
      'Wide size variation in same cohort',
      'Rough or pitted carapace surface',
    ],
    causes: [
      'IHHNV virus — primarily from infected seed stock',
      'Transmitted horizontally through cannibalism',
      'Infected broodstock passing virus to seed',
    ],
    visualMarkers: [
      'Bent rostrum (clearly visible at front of head)',
      'Deformed or curved body — not straight',
      'Stunted shrimp significantly smaller than cohort peers',
      'Rough or pitted shell surface texture',
    ],
    earlyWarnings: [
      'Very wide size distribution at DOC 30 cast net check',
      'Deformed shrimp visible in cast net sample',
      'ABW significantly below target curve',
    ],
    immediateActions: [
      'Collect deformed shrimp for lab PCR confirmation',
      'Separate visually deformed shrimp from pond (if small scale)',
      'Avoid sharing pond water or equipment',
      'No direct cure — focus on pond health support',
    ],
    protocol: {
      water: [
        'Probiotic (general support): 1 kg/acre',
        'Mineral supplement: 5 kg/acre',
        'Maintain stable water quality — avoid any stress',
      ],
      feed: [
        'High-nutrition feed with high protein (> 35%)',
        'Vitamin C: 2 g/kg daily',
        'Amino acid supplement: 3 g/kg',
        'Liver tonic: 5 ml/kg',
      ],
    },
    feedManagement: [
      { day: 1,  quantity: '100%', note: 'Do not reduce — support nutrition' },
      { day: 7,  quantity: '100%', note: 'Monitor size uniformity' },
      { day: 14, quantity: 'Adjust', note: 'Based on ABW update' },
    ],
    waterQuality: [
      { parameter: 'DO',   value: '> 5 ppm',   action: 'Consistent aeration' },
      { parameter: 'pH',   value: '7.8 – 8.2', action: 'Monitor daily' },
      { parameter: 'Temp', value: '28 – 31°C', action: 'Avoid temperature swings' },
    ],
    monitoring: ['Weekly body shape check in cast net sample', 'ABW vs target weekly', 'Count deformed vs normal ratio'],
    mistakes: ['Expecting recovery — IHHNV has no cure', 'Continuing to stock from same hatchery batch', 'Ignoring deformities as "normal variation"'],
    recoverySigns: ['Growth improvement in non-deformed portion of pond', 'Feeding response remains strong', 'Deformed proportion stays stable not rising'],
    preventionTips: [
      'Demand PCR certificate for IHHNV from hatchery before buying',
      'Stocking density matters — do not overcrowd with mixed quality seed',
      'Quarantine new seed for 5 days before stocking in main pond',
    ],
  },

  // ── 9. SHELL DISEASE ───────────────────────────────────────────────────────
  shell_disease: {
    id: 'shell_disease',
    name: 'Shell Disease (Shell Rot)',
    shortName: 'ShellRot',
    category: 'bacterial',
    dangerLevel: 'low',
    causedBy: 'Bacteria / poor pond conditions',
    docRisk: 'DOC 40–90',
    symptoms: [
      'Black or brown spots on shell/carapace',
      'Rough, pitted, or eroded shell surface',
      'Difficulty in molting — shrimp get stuck',
      'Lesions spreading across multiple sections',
      'Occasional death during failed molting',
    ],
    causes: [
      'Bacterial chitinoclastic infection on shell surface',
      'Poor water quality — low pH, high ammonia',
      'Mechanical injury from over-stocking or crowding',
      'Mineral deficiency — low calcium/magnesium',
    ],
    visualMarkers: [
      'Irregular black or brown lesions on carapace',
      'Pitted, rough shell texture — not smooth like normal',
      'Erosion at shell edges or rostrum tip',
      'Mossy or discolored patches on body',
    ],
    earlyWarnings: [
      'Small dark spots appearing on 5–10% of cast net sample',
      'Shrimp found stuck mid-molt at edges',
      'Increased feed wastage without obvious disease',
    ],
    immediateActions: [
      'Apply lime (dolomite): 10 kg/acre to raise mineral content',
      'Reduce stocking stress — check for overcrowding',
      'Improve water exchange: 10%/day',
      'Add mineral supplement to feed',
    ],
    protocol: {
      water: [
        'Dolomite: 10 kg/acre for calcium + magnesium',
        'Zeolite: 5 kg/acre for water quality',
        'Probiotic (Bacillus): 1 kg/acre',
      ],
      feed: [
        'Calcium/mineral supplement: 3 g/kg',
        'Vitamin C: 2 g/kg',
        'Probiotic in feed: 3 g/kg',
        'High-protein feed — support post-molt',
      ],
    },
    feedManagement: [
      { day: 1,  quantity: '90%',    note: 'Slight reduction, add minerals' },
      { day: 3,  quantity: '95%',    note: 'Add calcium to feed' },
      { day: 7,  quantity: 'Normal', note: 'Monitor shell quality' },
    ],
    waterQuality: [
      { parameter: 'pH',       value: '7.8 – 8.2', action: 'Dolomite if dropping' },
      { parameter: 'Hardness', value: '> 100 ppm', action: 'Apply calcium supplement' },
      { parameter: 'Ammonia',  value: '< 0.1 ppm', action: 'Zeolite application' },
    ],
    monitoring: ['Shell condition check in weekly cast net', 'Molting success rate monitoring', 'pH and hardness daily'],
    mistakes: ['Ignoring early small spots as harmless', 'Overcrowding reducing molting space', 'Low calcium diet over extended period'],
    recoverySigns: ['New shell post-molt appears clean and smooth', 'Spots reducing in next cast net check', 'Successful molting resumes'],
    preventionTips: [
      'Maintain dolomite application: 5 kg/acre biweekly',
      'Use mineral-rich feed formula throughout culture',
      'Avoid overcrowding — follow stocking density guidelines',
      'Check water hardness monthly from DOC 30',
    ],
  },

  // ── 10. FOULING (External Parasites) ───────────────────────────────────────
  fouling: {
    id: 'fouling',
    name: 'Fouling (External Parasites)',
    shortName: 'Fouling',
    category: 'parasitic',
    dangerLevel: 'low',
    causedBy: 'Protozoa (Vorticella, Epistylis, Zoothamnium)',
    docRisk: 'DOC 30–100',
    symptoms: [
      'Visible dirt, algae, or fuzzy growth on shrimp body/gills',
      'Difficulty in swimming — shrimp appear heavy',
      'Reduced oxygen intake — coming to surface',
      'Gray or discolored body surface',
      'Slow growth and reduced feed response',
    ],
    causes: [
      'Protozoan attachment on shell and gills',
      'Poor water circulation and low dissolved oxygen',
      'High organic matter promoting protozoa growth',
      'Excessive algae bloom conditions',
    ],
    visualMarkers: [
      'Fuzzy, dirty white or grayish growth on shell or gill area',
      'Dusty or film-like coating on shrimp body surface',
      'Gills clogged with visible debris or organic matter',
    ],
    earlyWarnings: [
      'Gray or dusty appearance on shrimp in cast net',
      'Shrimp swimming with extra effort or surfacing',
      'Green algae visible on pond walls and bottom',
    ],
    immediateActions: [
      'Improve water circulation — increase aeration',
      'Water exchange: 15–20% immediately',
      'Apply formalin bath treatment (controlled dose)',
      'Reduce feed to lower organic load',
    ],
    protocol: {
      water: [
        'Formalin: 25–50 ppm for 30–60 minute bath (with strong aeration)',
        'Copper sulfate: 0.5 ppm if protozoa confirmed (with care)',
        'Increase water exchange: 15%/day for 5 days',
        'Probiotic next morning after treatment',
      ],
      feed: [
        'Vitamin C: 2 g/kg to boost immunity',
        'Mineral supplement: 2 g/kg',
        'Reduce feed quantity to lower waste in water',
      ],
    },
    feedManagement: [
      { day: 1, quantity: '60%',   note: 'Reduce organic load' },
      { day: 2, quantity: '70%',   note: 'Continue exchange' },
      { day: 3, quantity: '80%',   note: 'Check shrimp surface' },
      { day: 5, quantity: 'Normal', note: 'Resume if recovered' },
    ],
    waterQuality: [
      { parameter: 'DO',          value: '> 5 ppm',   action: 'Improve circulation' },
      { parameter: 'Turbidity',   value: 'Clear',     action: 'Reduce organic matter' },
      { parameter: 'Organic TSS', value: 'Low',       action: 'Increase exchange' },
    ],
    monitoring: ['Shrimp surface condition in weekly cast net', 'Water turbidity daily', 'Algae growth on pond walls'],
    mistakes: ['Over-applying formalin without aeration', 'Not increasing water exchange to reduce organic load', 'Ignoring early dusty appearance'],
    recoverySigns: ['Clean, smooth shrimp surface in cast net', 'Normal swimming and diving', 'Feed response improves'],
    preventionTips: [
      'Maintain water circulation with adequate aerators',
      'Weekly water exchange from DOC 20 onwards',
      'Keep organic matter low — monitor feed trays strictly',
      'Check cast net sample for fouling every 10 days',
    ],
  },
};

// ─── DISEASE CATALOG (for Knowledge Browser) ───────────────────────────────
export const DISEASE_CATALOG = Object.values(DISEASE_SOPS);

// ─── SYMPTOM → DISEASE SCORING MAPPER ──────────────────────────────────────
export const mapSymptomsToSOP = (symptoms: string[]): DiseaseSOP | null => {
  const lower = symptoms.map(s => s.toLowerCase());
  const score: Record<string, number> = {};

  for (const [key, sop] of Object.entries(DISEASE_SOPS)) {
    score[key] = 0;
    for (const symptom of sop.symptoms) {
      const shortKey = symptom.toLowerCase().slice(0, 20);
      if (lower.some(s => s.includes(shortKey.slice(0, 12)))) {
        score[key]++;
      }
    }
  }

  const sorted = Object.entries(score).sort((a, b) => b[1] - a[1]);
  if (!sorted.length || sorted[0][1] === 0) return null;
  return DISEASE_SOPS[sorted[0][0]];
};

// ─── AI DISEASE NAME → SOP MAPPER ──────────────────────────────────────────
export const mapAIResultToSOP = (diseaseName: string): DiseaseSOP | null => {
  const d = diseaseName.toLowerCase();
  if (d.includes('white gut') || d.includes('wgd') || d.includes('wfd') || d.includes('gut disease')) return DISEASE_SOPS.white_gut;
  if (d.includes('wssv') || d.includes('white spot')) return DISEASE_SOPS.wssv;
  if (d.includes('ems') || d.includes('ahpnd') || d.includes('early mortality')) return DISEASE_SOPS.ems_ahpnd;
  if (d.includes('ehp') || d.includes('hepatopenaei') || d.includes('slow growth')) return DISEASE_SOPS.ehp;
  if (d.includes('vibrio') || d.includes('luminescent') || d.includes('glowing')) return DISEASE_SOPS.vibriosis;
  if (d.includes('black gill') || d.includes('gill')) return DISEASE_SOPS.black_gill;
  if (d.includes('rms') || d.includes('running mortality')) return DISEASE_SOPS.rms;
  if (d.includes('ihhnv') || d.includes('deform') || d.includes('rostrum')) return DISEASE_SOPS.ihhnv;
  if (d.includes('shell') || d.includes('shell rot') || d.includes('spot on shell')) return DISEASE_SOPS.shell_disease;
  if (d.includes('foul') || d.includes('parasite') || d.includes('protozoa') || d.includes('vorticella')) return DISEASE_SOPS.fouling;
  return null;
};
