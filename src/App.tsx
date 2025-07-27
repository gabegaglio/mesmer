import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./components/Home";
import {
  Auth,
  AdminDashboard,
  ProtectedRoute,
} from "./components/AuthComponents";
import { AuthProvider } from "./contexts/AuthContext";
import { useNightMode, type ThemeMode } from "./hooks/useTheme";
import { SoundProvider } from "./contexts/SoundContext";

// Inner component that has access to AuthProvider
function AppContent() {
  const { themeMode } = useNightMode();

  const getThemeBackgroundClass = (mode: ThemeMode) => {
    switch (mode) {
      case "slate":
        return "bg-gradient-to-br from-[#8e9eab] to-[#eef2f3]";
      case "day":
        return "bg-gradient-to-br from-[#56ccf2] to-[#2f80ed]";
      case "night":
        return "bg-gradient-to-br from-[#000000] to-[#434343]";
      case "midnight":
        return "bg-gradient-to-br from-[#8e2de2] to-[#4a00e0]";
      default:
        return "bg-gradient-to-br from-slate-400 to-slate-100";
    }
  };

  const backgroundClass = `min-h-screen transition-colors duration-800 ${getThemeBackgroundClass(
    themeMode
  )}`;

  return (
    <div className={backgroundClass}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </div>
  );
}

// Main App component with providers
function App() {
  return (
    <AuthProvider>
      <SoundProvider>
        <AppContent />
      </SoundProvider>
    </AuthProvider>
  );
}

export default App;
