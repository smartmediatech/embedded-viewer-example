import { useState, useRef, useEffect, useCallback } from "react";
import {
  BridgedIframe,
  BridgedIframeHandle,
} from "../components/BridgedIframe";
import { useApp } from "../context/AppContext";

export const Discover = () => {
  const [showModal, setShowModal] = useState(false);
  const [modalFocus, setModalFocus] = useState<{
    id: string;
    type: "card" | "reward" | "wearable";
  }>();
  const [modalDimensions, setModalDimensions] = useState({
    width: 0,
    height: 0,
  });

  const { language, componentsHost } = useApp();
  const iframeRef = useRef<BridgedIframeHandle>(null);

  // Calculate modal dimensions with 16:10 aspect ratio
  useEffect(() => {
    const calculateDimensions = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const aspectRatio = 10 / 16;

      // Check if mobile (typically < 768px width)
      const isMobile = windowWidth < 768;

      // Use 10px padding on mobile, 80px on desktop
      const padding = isMobile ? 10 : 80;
      const maxWidth = windowWidth - padding * 2;
      const maxHeight = windowHeight - padding * 2;

      let width = maxWidth;
      let height = width / aspectRatio;

      // If height exceeds available space, constrain by height instead
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }

      setModalDimensions({ width, height });
    };

    calculateDimensions();
    window.addEventListener("resize", calculateDimensions);

    return () => window.removeEventListener("resize", calculateDimensions);
  }, []);

  const onNavigation = useCallback(async (feature: string, focus?: string) => {
    if (feature === "discover") {
      setModalFocus(undefined);
      setShowModal(false);
    } else if (feature === "engaged" && focus) {
      setModalFocus({ id: focus, type: "card" });
      setShowModal(true);
    } else if (feature === "reward" && focus) {
      setModalFocus({ id: focus, type: "reward" });
      setShowModal(true);
    } else if (feature === "ar-face-filter" && focus) {
      setModalFocus({ id: focus, type: "wearable" });
      setShowModal(true);
    }

    return undefined;
  }, []);
  return (
    <>
      <BridgedIframe
        ref={iframeRef}
        src={`${componentsHost}/discover/?lang=${language}`}
        className="w-full h-full rounded-lg shadow-lg border-0 grow"
        onNavigation={onNavigation}
        sizeToContent
      />

      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative"
            style={{
              width: `${modalDimensions.width}px`,
              height: `${modalDimensions.height}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-2xl font-bold z-10"
              aria-label="Close modal"
            >
              ✕
            </button>

            {modalFocus?.type === "card" && (
              <BridgedIframe
                src={`${componentsHost}/card/?id=${modalFocus.id}&lang=${language}`}
                className="w-full h-full rounded-lg shadow-2xl border-0"
                onNavigation={onNavigation}
              />
            )}
            {modalFocus?.type === "reward" && (
              <BridgedIframe
                src={`${componentsHost}/reward/?id=${modalFocus.id}&lang=${language}`}
                className="w-full h-full rounded-lg shadow-2xl border-0"
                onNavigation={onNavigation}
              />
            )}
            {modalFocus?.type === "wearable" && (
              <BridgedIframe
                src={`${componentsHost}/wearable/?id=${modalFocus.id}&lang=${language}`}
                className="w-full h-full rounded-lg shadow-2xl border-0"
                onNavigation={onNavigation}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};
