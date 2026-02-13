import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  BridgedIframe,
  BridgedIframeHandle,
} from "../components/BridgedIframe";

export const Discover = () => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalFocus, setModalFocus] = useState<string>("");
  const [modalDimensions, setModalDimensions] = useState({
    width: 0,
    height: 0,
  });
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const iframeRef = useRef<BridgedIframeHandle>(null);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToMain = () => {
    navigate("/");
  };

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
    <div className="min-h-screen flex flex-col bg-black">
      {/* Header */}
      <header className="bg-black shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">
                {user?.name}
              </span>
              <span className="text-xs text-white">{user?.email}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleGoToMain}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-900 text-white rounded-lg text-sm font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/40"
            >
              Go to Main
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-900 text-white rounded-lg text-sm font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              disabled={loading}
            >
              {loading ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Iframe */}
      <main className="flex flex-col flex-1 p-4 h-full">
        <div className="flex flex-col flex-1 w-full max-w-7xl mx-auto h-full">
          <BridgedIframe
            ref={iframeRef}
            src="https://embedded.smartmedialabs.io/fifasandbox.beta/components/discover/"
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
        </div>
      </main>

      {/* Full-screen Modal */}
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
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-2xl font-bold z-10"
              aria-label="Close modal"
            >
              ✕
            </button>

            {/* BridgedIframe in modal */}
            <BridgedIframe
              src={`https://embedded.smartmedialabs.io/fifasandbox.beta/components/card/?id=${modalFocus}`}
              className="w-full h-full rounded-lg shadow-2xl border-0"
            />
          </div>
        </div>
      )}
    </div>
  );
};
