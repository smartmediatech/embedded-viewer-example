import { useState, useRef, useEffect } from "react";
import {
  BridgedIframe,
  BridgedIframeHandle,
} from "../components/BridgedIframe";
import { useApp } from "../context/AppContext";

export const Challenges = () => {
  const [showModal, setShowModal] = useState(false);
  const [modalFocus, setModalFocus] = useState<string>("");
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

      // Leave some padding (e.g., 80px on each side)
      const maxWidth = windowWidth - 160;
      const maxHeight = windowHeight - 160;

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

  return (
    <>
      <BridgedIframe
        ref={iframeRef}
        src={`${componentsHost}/challenges/?lang=${language}`}
        className="w-full h-full rounded-lg shadow-lg border-0 flex-1"
        onNavigation={async (feature, focus) => {
          console.log("on navigation", feature, focus);
          if (feature === "engaged" && focus) {
            setModalFocus(focus);
            setShowModal(true);
          }
          return undefined;
        }}
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

            <BridgedIframe
              src={`${componentsHost}/card/?id=${modalFocus}&lang=${language}`}
              className="w-full h-full rounded-lg shadow-2xl border-0"
            />
          </div>
        </div>
      )}
    </>
  );
};
