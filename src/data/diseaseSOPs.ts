export interface DiseaseSOP {
  id: string;
  name: string;
  symptoms: string[];
  causes: string[];
  immediateActions: string[];
  protocol: {
    water: string[];
    feed: string[];
  };
  feedManagement: { day: number; quantity: string }[];
  waterQuality: { parameter: string; value: string }[];
  monitoring: string[];
  mistakes: string[];
  recoverySigns: string[];
}

export const DISEASE_SOPS: Record<string, DiseaseSOP> = {
  white_gut: {
    id: 'white_gut',
    name: 'White Gut Syndrome (WGD)',
    symptoms: [
      'White or pale gut visible in shrimp',
      'Sudden reduction in feed intake',
      'Uneaten feed in trays',
      'Sluggish movement',
      'White fecal strings floating in water'
    ],
    causes: [
      'Poor water quality',
      'Bacterial infection (commonly linked to Vibriosis)',
      'Overfeeding',
      'Lack of probiotics'
    ],
    immediateActions: [
      'Reduce feed by 30–50%',
      'Increase aeration (Run all aerators)',
      'Clean feed trays properly'
    ],
    protocol: {
      water: [
        'Probiotic (Bacillus-based): 1 kg / acre',
        'Zeolite: 10–15 kg / acre',
        'Mineral mix: 5 kg / acre'
      ],
      feed: [
        'Gut probiotic: 5–10 g per kg feed',
        'Liver tonic: 5 ml per kg feed',
        'Vitamin C: 2 g per kg feed',
        'Note: Use oil/binder for proper mixing'
      ]
    },
    feedManagement: [
      { day: 1, quantity: '50% of normal' },
      { day: 2, quantity: '60%' },
      { day: 3, quantity: '70%' },
      { day: 4, quantity: '80%' },
      { day: 5, quantity: 'Back to normal' }
    ],
    waterQuality: [
      { parameter: 'DO (Dissolved Oxygen)', value: '> 5 ppm' },
      { parameter: 'pH', value: '7.5 – 8.2' },
      { parameter: 'Ammonia', value: 'Low / controlled' }
    ],
    monitoring: [
      'Feed consumption',
      'Shrimp activity',
      'Gut color'
    ],
    mistakes: [
      'Overfeeding',
      'Sudden water exchange',
      'Excess chemical usage'
    ],
    recoverySigns: [
      'Gut returns to normal brown color',
      'Improved feeding response',
      'Active swimming'
    ]
  },
  wssv: {
    id: 'wssv',
    name: 'White Spot Syndrome (WSSV)',
    symptoms: [
      'White spots on carapace',
      'Reddish coloration of body',
      'Sudden high mortality',
      'Shrimp gathering at pond edges'
    ],
    causes: [
      'Viral infection (WSSV)',
      'Temperature fluctuations',
      'Low immunity'
    ],
    immediateActions: [
      'Stop water exchange immediately',
      'Isolate the pond',
      'Reduce feed significantly',
      'Maximize aeration'
    ],
    protocol: {
      water: [
        'Disinfect all equipment',
        'Calcium hydroxide for pH stability'
      ],
      feed: [
        'High-dose Vitamin C',
        'Immunity boosters'
      ]
    },
    feedManagement: [
      { day: 1, quantity: '30% of normal' },
      { day: 2, quantity: '30%' },
      { day: 3, quantity: 'Monitor strictly' }
    ],
    waterQuality: [
      { parameter: 'DO', value: '> 6 ppm' },
      { parameter: 'pH', value: '8.0 – 8.3 (Stable)' }
    ],
    monitoring: [
      'Mortality count daily',
      'Bird activity over pond',
      'Shrimp behavior at surface'
    ],
    mistakes: [
      'Draining water into common channels',
      'Moving equipment between ponds',
      'Late detection'
    ],
    recoverySigns: [
      'Mortality stops',
      'Feeding improves',
      'Normal shell colors return'
    ]
  }
};
