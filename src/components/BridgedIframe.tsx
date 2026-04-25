import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { authService } from "../services/authService";
import ParentBridge from "@/types/smt-base-bridge/parent-bridge";
import Swal from "sweetalert2";

// Extend Window interface to include OneTrust
declare global {
  interface Window {
    OneTrust?: {
      OnConsentChanged: (callback: () => void) => void;
      IsAlertBoxClosed: () => boolean;
    };
    OnetrustActiveGroups?: string;
  }
}

interface BridgedIframeProps {
  src: string;
  className?: string;
  useRefreshToken?: boolean;
  sizeToContent?: boolean;
  componentConfig?: Record<string, unknown>;
  onNavigation?: (
    feature: string,
    focus?: string,
    extra?: string,
    params?: Record<string, string | boolean | number>,
  ) => Promise<
    | {
        feature: string;
        focus?: string;
        extra?: string;
        params: Record<string, string | boolean | number>;
      }
    | undefined
  >;
}

export interface BridgedIframeHandle {
  goTo: (params: {
    feature: string;
    focus?: string;
    extra?: string;
    params?: Record<string, any>;
  }) => Promise<unknown>;
}

export const BridgedIframe = forwardRef<
  BridgedIframeHandle,
  BridgedIframeProps
>(
  ({ src, className, onNavigation, useRefreshToken, sizeToContent, componentConfig }, ref) => {
  const { suppressReferrer } = useApp();
  const [iframe, setIframe] = useState<HTMLIFrameElement | null>(null);
  const bridgeRef = useRef<ParentBridge | null>(null);
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const navigate = useNavigate();
  const onNavigationRef = useRef(onNavigation);
  const useRefreshTokenRef = useRef(useRefreshToken);
  const componentConfigRef = useRef(componentConfig);
  useEffect(() => {
    onNavigationRef.current = onNavigation;
  }, [onNavigation]);
  useEffect(() => {
    useRefreshTokenRef.current = useRefreshToken;
  }, [useRefreshToken]);
  useEffect(() => {
    componentConfigRef.current = componentConfig;
  }, [componentConfig]);

 const getCookie = (name: string): string | null => {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`)
  );

  return match ? decodeURIComponent(match[1]) : null;
};

// Helper function to check OneTrust consent
const checkOneTrustConsent = useCallback((): {
  canTrack: boolean;
  isReady: boolean;
} => {
  // OneTrust script not loaded yet
  if (!window.OneTrust) {
    return { canTrack: false, isReady: false };
  }

  // True once user has interacted with banner / preference center
  const hasInteracted = !!getCookie("OptanonAlertBoxClosed");

  // Active consent groups
  const activeGroups = window.OnetrustActiveGroups || "";
  const activeGroupList = activeGroups
      .split(",")
      .map((group) => group.trim())
      .filter((group) => group.length > 0);
    const canTrack = activeGroupList.includes("C0002");

  return {
    canTrack,
    isReady: hasInteracted,
  };
}, []);
  // Send consent update to child iframe
  const sendConsentUpdate = useCallback(() => {
    if (!bridgeRef.current) return;

    const consentStatus = checkOneTrustConsent();
    console.log("Sending consent update to child:", consentStatus);

    try {
      bridgeRef.current.sendRequest("tracking.consent.update", consentStatus);
    } catch (error) {
      console.error("Error sending consent update:", error);
    }
  }, [checkOneTrustConsent]);

  const setIframeRef = useCallback(
    (element: HTMLIFrameElement | null) => {
      if (element !== iframe) {
        setIframe(element);
      }
    },
    [iframe],
  );

  // Set up OneTrust consent change listener
  useEffect(() => {
    if (!window.OneTrust) {
      console.warn("OneTrust not available");
      return;
    }

    // Register callback for consent changes
    window.OneTrust.OnConsentChanged(() => {
      console.log("OneTrust consent changed");
      sendConsentUpdate();
    });

    console.log("OneTrust consent listener registered");
  }, [sendConsentUpdate]);

  useEffect(() => {
    if (!iframe) {
      console.error("Iframe not available");
      return;
    }

    if (!window.SMTBaseBridge) {
      console.error("SMTBaseBridge not available on window object");
      console.log(
        "Available window properties:",
        Object.keys(window).filter(
          (k) =>
            k.toLowerCase().includes("bridge") ||
            k.toLowerCase().includes("smt"),
        ),
      );
      return;
    }

    const BridgeError = window.SMTBaseBridge.BridgeError;
    const childOrigin = new URL(src);
    console.log("parent", childOrigin.origin);
    // Create bridge using ParentBridge constructor
    const bridge = new window.SMTBaseBridge.ParentBridge(iframe, {
      origin: childOrigin.origin,
      meta: {},
    });
    bridgeRef.current = bridge;

    // Register tracking.consent.request handler
    bridge.addRequestHandler("tracking.consent.request", async () => {
      const consentStatus = checkOneTrustConsent();
      console.log("tracking.consent.request called, returning:", consentStatus);
      return consentStatus;
    });

    bridge.addRequestHandler("component.config.get", async () => {
      return componentConfigRef.current ?? {};
    });

    // Register session.get handler
    bridge.addRequestHandler("session.get", async () => {
      // Access token or refresh token is supported
      if (useRefreshTokenRef.current) {
        const refreshToken = authService.getRefreshToken();
        console.log(
          "session.get called, returning refreshToken:",
          refreshToken ? "present" : "null",
        );
        return { refreshToken };
      } else {
        //If returning Access token, you are expected to manage the refresh token life cycle
        const accessToken = await authService.getAccessToken();
        console.log(
          "session.get called, returning accessToken:",
          accessToken ? "present" : "null",
        );
        return { accessToken };
      }
    });

    // Register session.clear handler
    bridge.addRequestHandler("session.clear", async () => {
      console.log("session.clear called");
      await authService.logout();
      navigate("/login");
      return {};
    });

    bridge.addRequestHandler("navigation.go", async ({ payload }) => {
      const { feature, focus, extra, params } = payload as {
        feature: string;
        focus: string;
        extra: string;
        params: Record<string, any>;
      };
      if (onNavigationRef.current) {
        return (await onNavigationRef.current(feature, focus, extra, params)) ?? {};
      }
      if (
        feature === "ar" ||
        feature === "ar-face-filter" ||
        feature === "ar-wearable" ||
        feature === "ar-engaged" ||
        feature === "eight-wall"
      ) {
        alert("Request to goto " + feature + " rejected");
        return {};
      }
      //supported route
      return { feature, focus, extra, params };
    });

    bridge.addRequestHandler("navigation.open", async ({ payload }) => {
      const { url } = payload ?? {};
      window.open(url, "_blank");
      return {};
    });

    // Register alert handlers - not supported, return bridge error
    bridge.addRequestHandler("alert.notify", async () => {
      return new BridgeError("NOT_SUPPORTED", "alert.notify is not supported");
    });

    bridge.addRequestHandler("alert.notifyDetail", async () => {
      return new BridgeError(
        "NOT_SUPPORTED",
        "alert.notifyDetail is not supported",
      );
    });

    bridge.addRequestHandler("alert.confirm", async () => {
      return new BridgeError("NOT_SUPPORTED", "alert.confirm is not supported");
    });

    bridge.addRequestHandler("alert.inform", async () => {
      return new BridgeError("NOT_SUPPORTED", "alert.inform is not supported");
    });

    // Register loader handlers
    bridge.addRequestHandler("loader.show", async ({ payload }) => {
      const { label } = payload as { label: string };

      Swal.fire({
        title: label || "Loading...",
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      return {};
    });

    bridge.addRequestHandler("loader.hide", async () => {
      Swal.close();
      return {};
    });

    // Register frame.resize handler
    bridge.addRequestHandler("frame.resize", async ({ payload }) => {
      if (!sizeToContent) {
        return new BridgeError(
          "NOT_SUPPORTED",
          "frame.resize is not supported when sizeToContent is disabled",
        );
      }

      const { height } = payload as { height: number };
      if (typeof height !== "number" || height < 0) {
        return new BridgeError(
          "INVALID_PARAMETER",
          "height must be a positive number",
        );
      }

      if (iframe) {
        iframe.style.height = `${height}px`;
        console.log(`Iframe height resized to ${height}px`);
      }

      return {};
    });

    console.log("Bridge handlers registered successfully");

    // Now that bridge is configured, set the iframe src (reset loaded flag first)
    setIframeLoaded(false);
    setIframeSrc(src);

    // Send initial consent status once bridge is ready
    // Use a small delay to ensure child is ready to receive
    const consentTimer = setTimeout(() => {
      sendConsentUpdate();
    }, 1000);

    // Cleanup
    return () => {
      clearTimeout(consentTimer);
      if (bridge) {
        bridge.sendRequest("session.clear", {}).catch(() => {});
        bridge.removeRequestHandler("tracking.consent.request");
        bridge.removeRequestHandler("component.config.get");
        bridge.removeRequestHandler("session.get");
        bridge.removeRequestHandler("session.clear");
        bridge.removeRequestHandler("navigation.go");
        bridge.removeRequestHandler("navigation.open");
        bridge.removeRequestHandler("alert.notify");
        bridge.removeRequestHandler("alert.notifyDetail");
        bridge.removeRequestHandler("alert.confirm");
        bridge.removeRequestHandler("alert.inform");
        bridge.removeRequestHandler("loader.show");
        bridge.removeRequestHandler("loader.hide");
        bridge.removeRequestHandler("frame.resize");
        bridge.dispose();
        if (bridgeRef.current === bridge) {
          bridgeRef.current = null;
        }
      }
      // Close any open SweetAlert modals on cleanup
      Swal.close();
    };
  }, [
    src,
    navigate,
    iframe,
    sizeToContent,
    useRefreshToken,
    checkOneTrustConsent,
    sendConsentUpdate,
  ]);

  useEffect(() => {
    if (!bridgeRef.current || !iframeSrc || !iframeLoaded) {
      return;
    }

    bridgeRef.current
      .sendRequest("component.config.update", componentConfig ?? {})
      .catch((error) => {
        console.warn("component.config.update failed", error);
      });
  }, [componentConfig, iframeSrc, iframeLoaded]);

  useImperativeHandle(ref, () => ({
    goTo: async (params: {
      feature: string;
      focus?: string;
      extra?: string;
      params?: Record<string, any>;
    }) => {
      if (!bridgeRef.current) {
        throw new Error("Bridge not initialized");
      }
      return bridgeRef.current.sendRequest("navigation.go", params);
    },
  }), []);

  return (
    <iframe
      key={`${String(useRefreshToken)}-${String(suppressReferrer)}`}
      ref={setIframeRef}
      src={iframeSrc || undefined}
      className={className}
      title="Embedded Content"
      onLoad={() => setIframeLoaded(true)}
      allow="geolocation; camera; microphone; fullscreen; autoplay; clipboard-write; encrypted-media; gyroscope; accelerometer; web-share; xr-spatial-tracking"
      referrerPolicy={suppressReferrer ? "no-referrer" : undefined}
    />
  );
  },
);

BridgedIframe.displayName = "BridgedIframe";
