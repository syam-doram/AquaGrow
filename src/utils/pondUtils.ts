export const calculateDOC = (date?: string) => {
  if (!date) return 0;
  try {
    const diff = Date.now() - new Date(date).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  } catch (e) {
    return 0;
  }
};

export const getGrowthPercentage = (doc: number) => {
  return Math.min(100, Math.floor((doc / 100) * 100)); // Assuming 100 days cycle for 100%
};
