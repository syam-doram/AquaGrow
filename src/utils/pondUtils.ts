export const calculateDOC = (stockingDate?: string, asOfDate?: string) => {
  if (!stockingDate) return 0;
  try {
    const end = asOfDate ? new Date(asOfDate).getTime() : Date.now();
    const diff = end - new Date(stockingDate).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  } catch (e) {
    return 0;
  }
};

export const getGrowthPercentage = (doc: number) => {
  return Math.min(100, Math.floor((doc / 100) * 100)); // Assuming 100 days cycle for 100%
};
