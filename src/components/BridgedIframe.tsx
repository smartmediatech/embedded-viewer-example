import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bridge } from "../types/bridge.types";
import { authService } from "../services/authService";

interface BridgedIframeProps {
  src: string;
  className?: string;
}

export interface BridgedIframeHandle {
  goTo: (params: {
    feature: string;
    focus?: string;
    extra?: string;
    params?: Record<string, any>;
  }) => Promise<unknown>;
}

export const BridgedIframe = forwardRef<BridgedIframeHandle, BridgedIframeProps>(({ src, className }, ref) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const bridgeRef = useRef<Bridge | null>(null);
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const iframe = iframeRef.current;
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
            k.toLowerCase().includes("smt")
        )
      );
      return;
    }

    const childOrigin = new URL(src);
    console.log("parent", childOrigin.origin);
    // Create bridge using ParentBridge constructor
    const bridge = new window.SMTBaseBridge.ParentBridge(iframe, {
      origin: childOrigin.origin,
      meta: {},
    });
    bridgeRef.current = bridge;

    // Register session.get handler
    bridge.addRequestHandler("session.get", async () => {
      const refreshToken = authService.getRefreshToken();
      console.log(
        "session.get called, returning refreshToken:",
        refreshToken ? "present" : "null"
      );
      return { refreshToken };
    });

    // Register session.clear handler
    bridge.addRequestHandler("session.clear", async () => {
      console.log("session.clear called");
      await authService.logout();
      navigate("/login");
      return {};
    });

    bridge.addRequestHandler("navigation.go", async ({ payload }) => {
      const { feature, focus, extra, params } = payload;
      //supported route

      if (feature === "vatom") {
        return { feature, focus, extra, params };
      }

      alert("Request to goto " + feature + " rejected");

      //override route response and handle 
      return {};
    });

    console.log("Bridge handlers registered successfully");

    // Now that bridge is configured, set the iframe src
    setIframeSrc(src);

    // Cleanup
    return () => {
      if (bridgeRef.current) {
        bridgeRef.current.removeRequestHandler("session.get");
        bridgeRef.current.removeRequestHandler("session.clear");
      }
    };
  }, [src, navigate]);

  // Expose goTo function via ref
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
  }));

  return (
    <iframe
      ref={iframeRef}
      src={iframeSrc || undefined}
      className={className}
      title="Embedded Content"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    />
  );
});

BridgedIframe.displayName = "BridgedIframe";
