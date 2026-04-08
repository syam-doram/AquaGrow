export const calculateDOC = (stockingDate?: string, asOfDate?: string) => {
  if (!stockingDate) return 0;
  try {
    const end = asOfDate ? new Date(asOfDate).getTime() : Date.now();
    const diff = end - new Date(stockingDate).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  } catch (e) {
    return 0;
  }
};

export const getGrowthPercentage = (doc: number) => {
  return Math.min(100, Math.floor((doc / 100) * 100)); // Assuming 100 days cycle for 100%
};

/**
 * Standard Expert Growth Model (Vannamei)
 * Starts at 0.2g (DOC 0) and follows a realistic non-linear scaling curve.
 */
export const calculateWeight = (doc: number): number => {
  if (doc <= 0) return 0.2;
  const w = 0.2 + (0.05 * doc) + (0.0031 * doc * doc);
  return Math.round(w * 10) / 10; // Round to 1 decimal
};
