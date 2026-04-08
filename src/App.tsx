import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import { AppLayout } from "./components/AppLayout";
import { Login } from "./pages/Login";
import { Main } from "./pages/Main";
import { Challenges } from "./pages/Challenges";
import { Discover } from "./pages/Discover";
import { Rewards } from "./pages/Rewards";

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/rewards" replace />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/rewards" element={<Rewards />} />
              <Route path="/challenges" element={<Challenges />} />
              <Route path="/main" element={<Main />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </HashRouter>
  );
}

export default App;
