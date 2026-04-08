import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LanguageSelect } from "./LanguageSelect";

const COMPONENT_ROUTES = ["/discover", "/rewards", "/challenges"];

const COMPONENT_TABS = [
  { path: "/discover", label: "Discover" },
  { path: "/rewards", label: "Rewards" },
  { path: "/challenges", label: "Challenges" },
];

export const AppHeader = () => {
  const [loading, setLoading] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isComponents = COMPONENT_ROUTES.includes(location.pathname);
  const isViewer = location.pathname === "/main";

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

  return (
    <header className="bg-black border-b border-white/10">
      {/* Primary bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-4">
        {/* User info */}
        <div className="flex flex-col min-w-0 mr-auto sm:mr-0">
          <span className="text-sm font-medium text-white truncate">
            {user?.name}
          </span>
          <span className="text-xs text-white/60 truncate">{user?.email}</span>
        </div>

        {/* Primary tabs */}
        <nav className="flex items-center gap-1 mx-auto">
          <button
            onClick={() => navigate("/discover")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
              isComponents
                ? "bg-white text-black"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            Components
          </button>
          <button
            onClick={() => navigate("/main")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
              isViewer
                ? "bg-white text-black"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            Viewer
          </button>
        </nav>

        {/* Settings & actions */}
        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <LanguageSelect />
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm font-medium text-white/70 hover:text-white transition-colors cursor-pointer"
            disabled={loading}
          >
            {loading ? "..." : "Logout"}
          </button>
        </div>
      </div>

      {/* Secondary tabs — only when on Components */}
      {isComponents && (
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex gap-1 justify-center">
            {COMPONENT_TABS.map((tab) => {
              const isActive = location.pathname === tab.path;
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? "bg-white/15 text-white"
                      : "text-white/50 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
