import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import ParentBridge from "@/types/smt-base-bridge/parent-bridge";
import Swal from "sweetalert2";

interface BridgedIframeProps {
  src: string;
  className?: string;
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
>(({ src, className, onNavigation }, ref) => {
  const [iframe, setIframe] = useState<HTMLIFrameElement | null>(null);
  const bridgeRef = useRef<ParentBridge | null>(null);
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const navigate = useNavigate();

  const setIframeRef = useCallback(
    (element: HTMLIFrameElement | null) => {
      setIframe(element);
    },
    [setIframe],
  );
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

    // Register session.get handler
    bridge.addRequestHandler("session.get", async () => {
      const refreshToken = authService.getRefreshToken();
      console.log(
        "session.get called, returning refreshToken:",
        refreshToken ? "present" : "null",
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
      const { feature, focus, extra, params } = payload as {
        feature: string;
        focus: string;
        extra: string;
        params: Record<string, any>;
      };
      if (onNavigation) {
        return (await onNavigation?.(feature, focus, extra, params)) ?? {};
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

    console.log("Bridge handlers registered successfully");

    // Now that bridge is configured, set the iframe src
    setIframeSrc(src);

    // Cleanup
    return () => {
      if (bridge) {
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
        bridge.dispose();
        if (bridgeRef.current === bridge) {
          bridgeRef.current = null;
        }
      }
      // Close any open SweetAlert modals on cleanup
      Swal.close();
    };
  }, [src, navigate, iframe, onNavigation]);

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
      ref={setIframeRef}
      src={iframeSrc || undefined}
      className={className}
      title="Embedded Content"
      allow="geolocation; camera; microphone; fullscreen; autoplay; clipboard-write; encrypted-media; gyroscope; accelerometer; web-share"
    />
  );
});

BridgedIframe.displayName = "BridgedIframe";
