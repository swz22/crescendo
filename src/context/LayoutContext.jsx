import React, { createContext, useContext } from "react";
import { useIsMobile, useIsTablet, useIsDesktop } from "../hooks/useMediaQuery";

const LayoutContext = createContext({});

export const LayoutProvider = ({ children }) => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();

  const value = {
    isMobile,
    isTablet,
    isDesktop,
    breakpoint: isMobile ? "mobile" : isTablet ? "tablet" : "desktop",
  };

  return (
    <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within LayoutProvider");
  }
  return context;
};
