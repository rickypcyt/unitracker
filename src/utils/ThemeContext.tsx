import React, { createContext, useContext, useState } from 'react';

interface ThemeContextType {
  accentPalette: string;
  setAccentPalette: (palette: string) => void;
  iconColor: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accentPalette, setAccentPalette] = useState("blue");

  const iconColor = accentPalette === "white" ? "#000000" : 
                    accentPalette === "gray" ? "#ffffff" : "#ffffff";

  return (
    <ThemeContext.Provider value={{ accentPalette, setAccentPalette, iconColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
