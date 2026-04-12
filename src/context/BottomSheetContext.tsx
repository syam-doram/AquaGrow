import React, { createContext, useContext, useState, useCallback } from 'react';

interface BottomSheetContextType {
  isBottomSheetOpen: boolean;
  openBottomSheet: () => void;
  closeBottomSheet: () => void;
}

const BottomSheetContext = createContext<BottomSheetContextType>({
  isBottomSheetOpen: false,
  openBottomSheet: () => {},
  closeBottomSheet: () => {},
});

export const BottomSheetProvider = ({ children }: { children: React.ReactNode }) => {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  const openBottomSheet  = useCallback(() => setIsBottomSheetOpen(true), []);
  const closeBottomSheet = useCallback(() => setIsBottomSheetOpen(false), []);

  return (
    <BottomSheetContext.Provider value={{ isBottomSheetOpen, openBottomSheet, closeBottomSheet }}>
      {children}
    </BottomSheetContext.Provider>
  );
};

/** Call openBottomSheet() when your sheet opens, closeBottomSheet() when it closes */
export const useBottomSheet = () => useContext(BottomSheetContext);
