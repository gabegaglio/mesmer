import { useAuth } from "../../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { type ReactNode, useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = useState<string>("user");
  const [roleLoading, setRoleLoading] = useState(true);

  // Fetch user role from Edge Function
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user && supabase) {
        try {
          console.log("🔒 ProtectedRoute: Fetching role for user:", user.id);

          const { data, error } = await supabase.functions.invoke('getUserRole');

          console.log("🔒 ProtectedRoute: Edge Function response:", { data, error });

          if (data && !error) {
            console.log("🔒 ProtectedRoute: User role set to:", data.data.role);
            setUserRole(data.data.role);
          } else {
            console.log(
              "🔒 ProtectedRoute: Error or no data, defaulting to 'user'"
            );
            setUserRole("user");
          }
        } catch (error) {
          console.error("🔒 ProtectedRoute: Error fetching user role:", error);
          setUserRole("user");
        }
      } else {
        console.log("🔒 ProtectedRoute: No user, defaulting to 'user'");
        setUserRole("user");
      }
      setRoleLoading(false);
    };

    if (user) {
      fetchUserRole();
    } else {
      setRoleLoading(false);
    }
  }, [user]);

  // Show loading spinner while checking authentication or role
  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check role-based access if required
  if (requiredRole) {
    console.log("🔒 ProtectedRoute: Checking access:", {
      userRole,
      requiredRole,
      hasAccess: userRole === requiredRole || userRole === "admin",
    });

    if (userRole !== requiredRole && userRole !== "admin") {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
          <div className="text-white text-xl">
            Access Denied - Role: {userRole}, Required: {requiredRole}
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
