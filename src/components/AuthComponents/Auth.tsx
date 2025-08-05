import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import GoogleIcon from "./GoogleIcon";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signUp, signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Check if authentication is available
  const isAuthAvailable =
    supabase && supabase.auth && typeof supabase.auth.getSession === "function";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setError(error.message);
      }
      // Note: Google OAuth will redirect, so no need to navigate manually
    } catch (err) {
      setError("An unexpected error occurred with Google sign-in");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        // Sign in
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          setError(error.message);
        } else {
          navigate("/"); // Redirect to home on successful login
        }
      } else {
        // Sign up
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          setError("Password must be at least 6 characters");
          setLoading(false);
          return;
        }

        const { error } = await signUp(formData.email, formData.password);
        if (error) {
          setError(error.message);
        } else {
          setError("Check your email for a confirmation link!");
          // Optionally clear the form
          setFormData({ email: "", password: "", confirmPassword: "" });
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-black flex items-center justify-center p-4">
      {/* Main Container */}
      <div className="w-full max-w-7xl bg-black/80 backdrop-blur-xl border border-purple-900/30 rounded-3xl shadow-2xl overflow-hidden relative">
        {/* Back Button */}
        <Link
          to="/"
          className="absolute top-6 left-6 flex items-center justify-center w-10 h-10 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 hover:bg-gray-700/50 hover:scale-110 transition-all duration-200 z-50 cursor-pointer"
          aria-label="Back to Home"
        >
          <svg
            className="w-5 h-5 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>

        <div className="flex min-h-[600px] lg:min-h-[700px]">
          {/* Left Section - Form */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 lg:p-16 relative z-10">
            <div className="max-w-md w-full mx-auto lg:mx-0">
              {/* Logo */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <svg
                      viewBox="0 0 262.19 105.03"
                      className="w-12 h-6"
                      style={{ filter: "invert(1)" }}
                    >
                      <path
                        fill="currentColor"
                        className="text-white"
                        d="M97.6.12c17.91-2.44,27.4,33.75,30.18,46.64,1.64,7.59,7.44,47.59,4.06,52.25-1.95,2.69-3.63-3.75-4.06-5.01-4.73-14.03-12.7-64.13-24.22-70.98-9.12-5.42-16.12,12.9-18.73,19.21-4.48,10.83-13.84,45.76-23.26,50.94-8.14,4.48-25.82-7.58-36.26-8.11s-14.14,3.66-22.43,5.49c-5.86,1.29-1.2-7.18.12-9.42,9.67-16.37,22.27-19.68,39.72-13.96,4.27,1.4,11.99,6.13,16.22,3.82,5.22-2.85,14.49-34.94,17.54-42.35,3.23-7.86,11.71-27.23,21.11-28.51Z"
                      />
                      <path
                        fill="currentColor"
                        className="text-white"
                        d="M131.03,5.74c1.73-.43,3,4.65,3.46,6.08,5.72,17.74,7.79,37.25,14.55,54.87,17.52,45.69,32.18-16.3,38.17-31.73,2.46-6.33,8.84-22.91,16.34-23.98,10.19-1.45,24.06,10.2,38.65,9.07,6.49-.5,13.41-5.06,17.66-5.49,4.93-.5.69,7.23-.6,9.42-8.3,14.19-20.48,19.61-36.38,15.15-5.21-1.46-15.62-7.61-20.28-4.53-5.05,3.33-13.02,31.76-15.87,39.01-4.61,11.73-15.49,40.61-32.33,28.51-17.39-12.5-26.35-70.28-24.93-90.54.08-1.1.42-5.56,1.55-5.85Z"
                      />
                    </svg>
                  </div>
                </div>

                <div>
                  <h1 className="text-4xl font-bold text-white mb-3">
                    {isLogin ? "Welcome Back!" : "Welcome to Mesmer"}
                  </h1>
                </div>
              </div>

              {error && (
                <div
                  className={`mb-6 p-4 rounded-lg text-sm border ${
                    error.includes("Check your email")
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}
                >
                  {error}
                </div>
              )}

              {!isAuthAvailable && (
                <div className="mb-6 p-4 rounded-lg text-sm border bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-semibold">
                      Authentication Not Available
                    </span>
                  </div>
                  <p className="text-xs opacity-90">
                    Authentication is currently disabled. This may be due to
                    missing environment variables in the deployment. The app
                    will work in demo mode without user features.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                <div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-4 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all duration-200 cursor-text"
                    placeholder="Email address"
                    required
                    disabled={loading || !isAuthAvailable}
                  />
                </div>

                <div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-4 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all duration-200 cursor-text"
                    placeholder="Enter your password"
                    required
                    disabled={loading || !isAuthAvailable}
                  />
                </div>

                {!isLogin && (
                  <div>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-4 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all duration-200 cursor-text"
                      placeholder="Confirm your password"
                      required
                      disabled={loading || !isAuthAvailable}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !isAuthAvailable}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-4 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg cursor-pointer"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {isLogin ? "Signing in..." : "Creating account..."}
                    </div>
                  ) : !isAuthAvailable ? (
                    "Authentication Disabled"
                  ) : isLogin ? (
                    "Sign in"
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-black/80 text-gray-500">Or</span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="space-y-3 mb-8">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading || !isAuthAvailable}
                  className="w-full bg-gray-900/50 hover:bg-gray-800/50 border border-gray-700/50 text-white font-medium py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <GoogleIcon className="w-5 h-5" />
                  <span>Google</span>
                </button>
              </div>

              {/* Sign up/Sign in toggle */}
              <div className="text-center text-sm">
                <span className="text-gray-500">
                  {isLogin
                    ? "Don't have an account? "
                    : "Already have an account? "}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError("");
                    setFormData({
                      email: "",
                      password: "",
                      confirmPassword: "",
                    });
                  }}
                  className="text-purple-400 hover:text-purple-300 transition-colors cursor-pointer underline-offset-4 hover:underline"
                  disabled={loading}
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </div>
            </div>
          </div>

          {/* Right Section - Visual */}
          <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600"></div>

            {/* Animated Orbs */}
            <div className="absolute inset-0">
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
              <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white/15 rounded-full blur-3xl animate-pulse delay-2000"></div>
            </div>

            {/* Large Logo/Silhouette */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-96 h-48 opacity-20">
                <svg
                  viewBox="0 0 262.19 105.03"
                  className="w-full h-full drop-shadow-2xl"
                  style={{ filter: "invert(1)" }}
                >
                  <path
                    fill="currentColor"
                    className="text-white"
                    d="M97.6.12c17.91-2.44,27.4,33.75,30.18,46.64,1.64,7.59,7.44,47.59,4.06,52.25-1.95,2.69-3.63-3.75-4.06-5.01-4.73-14.03-12.7-64.13-24.22-70.98-9.12-5.42-16.12,12.9-18.73,19.21-4.48,10.83-13.84,45.76-23.26,50.94-8.14,4.48-25.82-7.58-36.26-8.11s-14.14,3.66-22.43,5.49c-5.86,1.29-1.2-7.18.12-9.42,9.67-16.37,22.27-19.68,39.72-13.96,4.27,1.4,11.99,6.13,16.22,3.82,5.22-2.85,14.49-34.94,17.54-42.35,3.23-7.86,11.71-27.23,21.11-28.51Z"
                  />
                  <path
                    fill="currentColor"
                    className="text-white"
                    d="M97.84,3.22c14.34-2.06,23.03,26.84,25.65,37.34,3.91,15.67,5.42,31.94,5.85,48.07-3.2-11.56-5.42-23.42-8.71-34.95-4.08-14.34-15.81-53.38-32.92-23.86-6.41,11.06-19.14,55.57-26.6,60.24-6.16,3.86-20.55-4.76-27.44-6.44-10.43-2.55-20.14-1.01-29.94,2.98,6.5-13.05,15.79-21.77,31.37-18.73,8.06,1.57,19.26,10.17,26.48,4.29,6.31-5.14,12.69-30.47,16.1-39.25,2.89-7.43,11.49-28.46,20.16-29.7Z"
                  />
                  <path
                    fill="currentColor"
                    className="text-white"
                    d="M131.03,5.74c1.73-.43,3,4.65,3.46,6.08,5.72,17.74,7.79,37.25,14.55,54.87,17.52,45.69,32.18-16.3,38.17-31.73,2.46-6.33,8.84-22.91,16.34-23.98,10.19-1.45,24.06,10.2,38.65,9.07,6.49-.5,13.41-5.06,17.66-5.49,4.93-.5.69,7.23-.6,9.42-8.3,14.19-20.48,19.61-36.38,15.15-5.21-1.46-15.62-7.61-20.28-4.53-5.05,3.33-13.02,31.76-15.87,39.01-4.61,11.73-15.49,40.61-32.33,28.51-17.39-12.5-26.35-70.28-24.93-90.54.08-1.1.42-5.56,1.55-5.85Z"
                  />
                  <path
                    fill="currentColor"
                    className="text-white"
                    d="M203.32,14.09c6.53-1.1,17.1,5.11,23.62,6.92,10.72,2.97,21.08,1.87,31.25-2.39.51.48-.36,1.78-.6,2.27-5.13,10.29-14.94,17.98-26.84,17.06-15.47-1.19-26.47-17.53-35.91,3.94-5.61,12.76-15.38,54.16-28.51,59.53-13.36,5.46-22.55-19.44-25.41-28.75-5.43-17.63-7.45-36.22-8.11-54.64l1.67,4.77c4.37,15.91,7.04,33.86,13.84,48.91,19.3,42.7,35.29-20.21,41.04-34.59,2-5,8.6-22.12,13.96-23.02Z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
