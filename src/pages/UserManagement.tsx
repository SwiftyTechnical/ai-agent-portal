import { useState, useEffect } from 'react';
import { Users, Edit2, Save, X, Shield, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth, UserRole } from '../contexts/AuthContext';
import type { User } from '../types/database';

const roleColors: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-800',
  viewer: 'bg-gray-100 text-gray-800',
  editor: 'bg-blue-100 text-blue-800',
  reviewer: 'bg-yellow-100 text-yellow-800',
  approver: 'bg-green-100 text-green-800',
};

const roleDescriptions: Record<UserRole, string> = {
  admin: 'Full access to all features',
  viewer: 'Can view policies only',
  editor: 'Can view and edit policies',
  reviewer: 'Can review submitted policies',
  approver: 'Can approve reviewed policies',
};

export function UserManagement() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('viewer');
  const [editName, setEditName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name');

    if (!error && data) {
      setUsers(data as User[]);
    }
    setLoading(false);
  };

  const startEditing = (user: User) => {
    setEditingId(user.id);
    setEditRole(user.role as UserRole);
    setEditName(user.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditRole('viewer');
    setEditName('');
  };

  const saveUser = async (userId: string) => {
    const { error } = await supabase
      .from('users')
      .update({ role: editRole, name: editName })
      .eq('id', userId);

    if (!error) {
      await fetchUsers();
      cancelEditing();
    }
  };

  const deleteUser = async (userId: string) => {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (!error) {
      await fetchUsers();
      setDeletingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h2>
        <p className="text-red-600">You need admin privileges to access user management.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-1">Manage user roles and permissions</p>
      </div>

      {/* Role Legend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Role Permissions</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {(Object.keys(roleDescriptions) as UserRole[]).map((role) => (
            <div key={role} className="text-center">
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${roleColors[role]}`}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </span>
              <p className="text-xs text-gray-500 mt-1">{roleDescriptions[role]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center space-x-2">
          <Users className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Users ({users.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === user.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="ml-3 font-medium text-gray-900">{user.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === user.id ? (
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value as UserRole)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="admin">Admin</option>
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                        <option value="reviewer">Reviewer</option>
                        <option value="approver">Approver</option>
                      </select>
                    ) : (
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${roleColors[user.role as UserRole]}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {deletingId === user.id ? (
                      <div className="flex items-center justify-end space-x-2">
                        <span className="text-xs text-gray-500 mr-2">Delete?</span>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="px-2 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="px-2 py-1 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded"
                        >
                          No
                        </button>
                      </div>
                    ) : editingId === user.id ? (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => saveUser(user.id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => startEditing(user)}
                          className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(user.id)}
                          className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
