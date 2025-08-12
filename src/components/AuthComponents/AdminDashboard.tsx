import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { Link } from "react-router-dom";

interface UserData {
  id: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in_at?: string;
}

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('getAllUsers');

      if (error) {
        throw error;
      }

      setUsers(data.data || []);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('updateUserRole', {
        body: { userId, newRole }
      });

      if (error) throw error;

      // Update local state
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-300">Manage users and roles</p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-purple-300 hover:text-purple-200 transition-colors"
          >
            ← Back to Home
          </Link>
          <span className="text-gray-300">{user?.email}</span>
          <button
            onClick={signOut}
            className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
        <div className="p-6 border-b border-white/20">
          <h2 className="text-xl font-semibold text-white">
            Users ({users.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left p-4 text-gray-300 font-medium">
                  Email
                </th>
                <th className="text-left p-4 text-gray-300 font-medium">
                  Role
                </th>
                <th className="text-left p-4 text-gray-300 font-medium">
                  Created
                </th>
                <th className="text-left p-4 text-gray-300 font-medium">
                  Last Sign In
                </th>
                <th className="text-left p-4 text-gray-300 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((userData) => (
                <tr
                  key={userData.id}
                  className="border-t border-white/10 hover:bg-white/5"
                >
                  <td className="p-4 text-white">{userData.email}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        userData.role === "admin"
                          ? "bg-red-500/20 text-red-300"
                          : "bg-blue-500/20 text-blue-300"
                      }`}
                    >
                      {userData.role}
                    </span>
                  </td>
                  <td className="p-4 text-gray-300">
                    {new Date(userData.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-gray-300">
                    {userData.last_sign_in_at
                      ? new Date(userData.last_sign_in_at).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td className="p-4">
                    <select
                      value={userData.role}
                      onChange={(e) =>
                        updateUserRole(userData.id, e.target.value)
                      }
                      className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                      disabled={userData.id === user?.id} // Prevent self-role change
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
          <h3 className="text-gray-300 text-sm font-medium">Total Users</h3>
          <p className="text-2xl font-bold text-white mt-2">{users.length}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
          <h3 className="text-gray-300 text-sm font-medium">Admins</h3>
          <p className="text-2xl font-bold text-white mt-2">
            {users.filter((u) => u.role === "admin").length}
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
          <h3 className="text-gray-300 text-sm font-medium">Regular Users</h3>
          <p className="text-2xl font-bold text-white mt-2">
            {users.filter((u) => u.role === "user").length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
