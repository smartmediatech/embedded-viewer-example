import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BridgedIframe, BridgedIframeHandle } from '../components/BridgedIframe';

export const Main = () => {
  const [loading, setLoading] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const iframeRef = useRef<BridgedIframeHandle>(null);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToMap = async () => {
    try {
      await iframeRef.current?.goTo({ feature: 'map' });
    } catch (error) {
      console.error('Navigation to map failed:', error);
    }
  };

  const handleGoToInventory = async () => {
    try {
      await iframeRef.current?.goTo({ feature: 'inventory' });
    } catch (error) {
      console.error('Navigation to inventory failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-800">{user?.name}</span>
              <span className="text-xs text-gray-500">{user?.email}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleGoToMap}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-900 text-white rounded-lg text-sm font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/40"
            >
              Go to Map
            </button>
            <button
              onClick={handleGoToInventory}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-900 text-white rounded-lg text-sm font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-500/40"
            >
              Go to Inventory
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-900 text-white rounded-lg text-sm font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              disabled={loading}
            >
              {loading ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Iframe */}
      <main className="flex flex-col flex-1 p-4 h-full">
        <div className="flex flex-col flex-1 w-full max-w-7xl mx-auto h-full">
          <BridgedIframe
            ref={iframeRef}
            src="https://embedded.smartmedialabs.io/testing.alpha/#/inventory"
            className="w-full h-full rounded-lg shadow-lg border-0 flex-1"
          />
        </div>
      </main>
    </div>
  );
};
