import { useRef, useEffect } from "react";
import {
  BridgedIframe,
  BridgedIframeHandle,
} from "../components/BridgedIframe";
import { useApp } from "../context/AppContext";

export const Main = () => {
  const iframeRef = useRef<BridgedIframeHandle>(null);
  const { language, embeddedViewerHost, setCurrentIframeUrl } = useApp();

  const src = `${embeddedViewerHost}/?lang=${language}#/discover`;
  useEffect(() => {
    setCurrentIframeUrl(src);
    return () => setCurrentIframeUrl(null);
  }, [src, setCurrentIframeUrl]);

  const handleGoToMap = async () => {
    try {
      await iframeRef.current?.goTo({ feature: "map" });
    } catch (error) {
      console.error("Navigation to map failed:", error);
    }
  };

  const handleGoToDiscover = async () => {
    try {
      await iframeRef.current?.goTo({ feature: "discover" });
    } catch (error) {
      console.error("Navigation to discover failed:", error);
    }
  };

  const handleGoToInventory = async () => {
    try {
      await iframeRef.current?.goTo({ feature: "inventory" });
    } catch (error) {
      console.error("Navigation to inventory failed:", error);
    }
  };

  return (
    <>
      <div className="flex justify-center gap-2 pb-4">
        <button
          onClick={handleGoToDiscover}
          className="px-4 py-1.5 rounded-full text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          Discover
        </button>
        <button
          onClick={handleGoToMap}
          className="px-4 py-1.5 rounded-full text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          Map
        </button>
        <button
          onClick={handleGoToInventory}
          className="px-4 py-1.5 rounded-full text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          Inventory
        </button>
      </div>

      <BridgedIframe
        useRefreshToken
        ref={iframeRef}
        src={src}
        className="w-full h-full rounded-lg shadow-lg border-0 flex-1"
      />
    </>
  );
};
