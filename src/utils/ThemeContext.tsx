import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ThemeContextType {
  accentPalette: string;
  setAccentPalette: (palette: string) => void;
  iconColor: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [accentPalette, setAccentPalette] = useState("blue");

  const iconColor = accentPalette === "white" ? "#000000" : 
                    accentPalette === "gray" ? "#ffffff" : "#ffffff";

  const value = {
    accentPalette,
    setAccentPalette,
    iconColor
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
