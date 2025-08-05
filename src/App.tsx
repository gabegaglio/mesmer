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
import React, { Component, type ReactNode } from "react";

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-900 to-red-700 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 text-white text-center">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="mb-4">The application encountered an error.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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
      <Router basename="/mesmer">
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
    <ErrorBoundary>
      <AuthProvider>
        <SoundProvider>
          <AppContent />
        </SoundProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
