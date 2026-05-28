import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import type { BridgedIframeHandle } from "../components/BridgedIframe";

export type Tenant = "fifasandboxsmt" | "fifasandbox" | "localhost";

export type TenantConfig = {
  label: string;
  disabled?: boolean;
  smartComponentsHost: string;
  legacyComponentsHost: string;
  embeddedViewerHost?: string;
};

export const TENANTS: Record<Tenant, TenantConfig> = {
  fifasandboxsmt: {
    label: "FIFA (Sandbox) - SMT",
    smartComponentsHost:
      "https://embedded.smartmedialabs.io/fifasandbox.beta/components/dev",
    legacyComponentsHost:
      "https://embedded.smartmedialabs.io/fifasandbox.beta/components/dev",
    embeddedViewerHost:
      "https://embedded.smartmedialabs.io/fifasandbox.beta",
  },
  fifasandbox: {
    label: "FIFA (Sandbox)",
    smartComponentsHost: "https://embedded.smtwallet.app/fifa/sandbox/components",
    legacyComponentsHost: "https://embedded.smtwallet.app/fifa/sandbox/components",
  },
  localhost: {
    label: "Localhost (for development)",
    smartComponentsHost: "https://localhost:3001",
    legacyComponentsHost: "https://localhost:1234/components",
    embeddedViewerHost: "https://localhost:1234",
  }
};

export type MapComponentConfig = {
  theme?: {
    mode?: "light" | "dark";
    colors?: {
      accent?: string;
      locationButtonBackground?: string;
      locationButtonForeground?: string;
      pickupRadiusFill?: string;
    };
  };
};

const MAP_THEMES: Record<"light" | "dark", MapComponentConfig> = {
  light: {
    theme: {
      mode: "light",
      colors: {
        accent: "#0057ff",
        locationButtonBackground: "#0057ff",
        locationButtonForeground: "#ffffff",
        pickupRadiusFill: "#a8ddff",
      },
    },
  },
  dark: {
    theme: {
      mode: "dark",
      colors: {
        accent: "#111827",
        locationButtonBackground: "#111827",
        locationButtonForeground: "#ffffff",
        pickupRadiusFill: "#4b5563",
      },
    },
  },
};

export type Theme = "light" | "dark";

export type MapQueryParams = {
  lat?: number;
  lon?: number;
  zoom?: number;
};

export type PendingMapCommand =
  | {
      type: "viewport";
      center: {
        latitude: number;
        longitude: number;
      };
      zoom?: number;
    }
  | {
      type: "user-location";
      zoom?: number;
    };

export type BootMode = "access-token" | "refresh-token";

interface AppContextType {
  language: string;
  setLanguage: (language: string) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  tenant: Tenant;
  setTenant: (tenant: Tenant) => void;
  bootMode: BootMode;
  setBootMode: (mode: BootMode) => void;
  suppressReferrer: boolean;
  setSuppressReferrer: (suppress: boolean) => void;
  smartComponentsHost: string;
  legacyComponentsHost: string;
  embeddedViewerHost?: string;
  mapComponentConfig: MapComponentConfig;
  mapQueryParams: MapQueryParams;
  setMapQueryParams: (params: MapQueryParams) => void;
  pendingMapCommand: PendingMapCommand | null;
  setPendingMapCommand: (command: PendingMapCommand | null) => void;
  clearPendingMapCommand: () => void;
  mapIframeHandle: BridgedIframeHandle | null;
  setMapIframeHandle: (handle: BridgedIframeHandle | null) => void;
  currentIframeUrl: string | null;
  setCurrentIframeUrl: (url: string | null) => void;
  /** The lang/theme values currently present in component URLs (null = not yet set). */
  explicitLang: string | null;
  explicitTheme: Theme | null;
  /** Appends only explicitly-set params (lang, theme) plus any extra params to a base URL. */
  appendUrlParams: (base: string, extra?: Record<string, string | undefined>) => string;
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
  const [language, setLanguageState] = useState("en");
  const [theme, setThemeState] = useState<Theme>("dark");
  const [tenant, setTenant] = useState<Tenant>(
    process.env.NODE_ENV === "production" ? "fifasandboxsmt" : "localhost"
  );
  const [bootMode, setBootMode] = useState<BootMode>("access-token");
  const [suppressReferrer, setSuppressReferrer] = useState(false);
  const [explicitLang, setExplicitLang] = useState<string | null>(null);
  const [explicitTheme, setExplicitTheme] = useState<Theme | null>(null);
  const [mapQueryParams, setMapQueryParams] = useState<MapQueryParams>({});
  const [pendingMapCommand, setPendingMapCommandState] =
    useState<PendingMapCommand | null>(null);

  const setPendingMapCommand = useCallback((command: PendingMapCommand | null) => {
    setPendingMapCommandState(command);
  }, []);
  const clearPendingMapCommand = useCallback(() => {
    setPendingMapCommandState(null);
  }, []);
  const [mapIframeHandle, setMapIframeHandle] =
    useState<BridgedIframeHandle | null>(null);
  const [currentIframeUrl, setCurrentIframeUrl] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const setLanguage = useCallback((lang: string) => {
    setLanguageState(lang);
    setExplicitLang(lang);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    setExplicitTheme(t);
  }, []);

  const appendUrlParams = useCallback(
    (base: string, extra?: Record<string, string | undefined>): string => {
      const params = new URLSearchParams();
      if (explicitLang) params.set("lang", explicitLang);
      if (explicitTheme) params.set("theme", explicitTheme);
      if (extra) {
        for (const [k, v] of Object.entries(extra)) {
          if (v != null) params.set(k, v);
        }
      }
      const qs = params.toString();
      if (!qs) return base;
      return base.includes("?") ? `${base}&${qs}` : `${base}?${qs}`;
    },
    [explicitLang, explicitTheme],
  );

  const value: AppContextType = {
    language,
    setLanguage,
    theme,
    setTheme,
    tenant,
    setTenant,
    bootMode,
    setBootMode,
    suppressReferrer,
    setSuppressReferrer,
    smartComponentsHost: TENANTS[tenant].smartComponentsHost,
    legacyComponentsHost: TENANTS[tenant].legacyComponentsHost,
    embeddedViewerHost: TENANTS[tenant].embeddedViewerHost,
    explicitLang,
    explicitTheme,
    mapComponentConfig: MAP_THEMES[theme],
    mapQueryParams,
    setMapQueryParams,
    pendingMapCommand,
    setPendingMapCommand,
    clearPendingMapCommand,
    mapIframeHandle,
    setMapIframeHandle,
    currentIframeUrl,
    setCurrentIframeUrl,
    appendUrlParams,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
