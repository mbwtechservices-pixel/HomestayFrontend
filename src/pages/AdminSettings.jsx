import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Save, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminSettings = () => {
  const { admin } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    currentPassword: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (admin) {
      setFormData({ ...formData, email: admin.email });
      setLoading(false);
    }
  }, [admin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData = {
        email: formData.email,
      };

      if (formData.password) {
        if (!formData.currentPassword) {
          toast.error('Please enter current password to change password');
          setSaving(false);
          return;
        }
        updateData.password = formData.password;
        updateData.currentPassword = formData.currentPassword;
      }

      await api.put('/auth/update', updateData);
      toast.success('Settings updated successfully');
      setFormData({ ...formData, password: '', currentPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
        Admin Settings
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Mail className="text-gray-600 dark:text-gray-400" size={20} />
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                Email Settings
              </h2>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Password Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Lock className="text-gray-600 dark:text-gray-400" size={20} />
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                Change Password
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, currentPassword: e.target.value })
                  }
                  placeholder="Enter current password to change password"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Leave empty to keep current password"
                  minLength={6}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Minimum 6 characters. Leave empty if you don't want to change password.
                </p>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> To change your password, you must provide your current
              password. Email can be changed without providing current password.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Save size={20} />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;

