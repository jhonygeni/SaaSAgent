
import { useState, useEffect } from "react";

export function useThemeDetector() {
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  
  useEffect(() => {
    const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDarkTheme(darkThemeMq.matches);
    
    const mqListener = (e: MediaQueryListEvent) => {
      setIsDarkTheme(e.matches);
    };
    
    darkThemeMq.addEventListener('change', mqListener);
    return () => darkThemeMq.removeEventListener('change', mqListener);
  }, []);
  
  return isDarkTheme;
}
