import { createContext, useContext, useState, ReactNode } from "react";

const COMPONENTS_HOST =
  "https://embedded.smartmedialabs.io/fifasandbox.beta/components/dev";
const VIEWER_HOST = "https://embedded.smartmedialabs.io/fifasandbox.beta";

interface AppContextType {
  language: string;
  setLanguage: (language: string) => void;
  componentsHost: string;
  viewerHost: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [language, setLanguage] = useState("en");

  const value: AppContextType = {
    language,
    setLanguage,
    componentsHost: COMPONENTS_HOST,
    viewerHost: VIEWER_HOST,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
