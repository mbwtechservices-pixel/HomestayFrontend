import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Save, Upload, X } from 'lucide-react';
import DragDrop from '../components/DragDrop';

const InvoiceSettings = () => {
  const [settings, setSettings] = useState({
    homestayName: '',
    address: '',
    phone: '',
    email: '',
    gstNumber: '',
    cgstPercentage: 0,
    sgstPercentage: 0,
    igstPercentage: 0,
    extraNotes: '',
    termsAndConditions: '',
    logo: '',
    signature: '',
    homestaySeal: '',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [homestaySealFile, setHomestaySealFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      setSettings(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('homestayName', settings.homestayName);
      formData.append('address', settings.address);
      formData.append('phone', settings.phone);
      formData.append('email', settings.email);
      formData.append('gstNumber', settings.gstNumber);
      formData.append('cgstPercentage', settings.cgstPercentage.toString());
      formData.append('sgstPercentage', settings.sgstPercentage.toString());
      formData.append('igstPercentage', settings.igstPercentage.toString());
      formData.append('extraNotes', settings.extraNotes);
      formData.append('termsAndConditions', settings.termsAndConditions);

      if (logoFile) {
        formData.append('logo', logoFile);
      } else if (settings.logo) {
        formData.append('existingLogo', settings.logo);
      } else {
        formData.append('existingLogo', '');
      }

      if (signatureFile) {
        formData.append('signature', signatureFile);
      } else if (settings.signature) {
        formData.append('existingSignature', settings.signature);
      } else {
        formData.append('existingSignature', '');
      }

      if (homestaySealFile) {
        formData.append('homestaySeal', homestaySealFile);
      } else if (settings.homestaySeal) {
        formData.append('existingHomestaySeal', settings.homestaySeal);
      } else {
        formData.append('existingHomestaySeal', '');
      }

      await api.put('/settings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Settings saved successfully');
      setLogoFile(null);
      setSignatureFile(null);
      setHomestaySealFile(null);
      fetchSettings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const removeLogo = () => {
    setSettings({ ...settings, logo: '' });
    setLogoFile(null);
  };

  const removeSignature = () => {
    setSettings({ ...settings, signature: '' });
    setSignatureFile(null);
  };

  const removeHomestaySeal = () => {
    setSettings({ ...settings, homestaySeal: '' });
    setHomestaySealFile(null);
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
        Invoice Settings
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Basic Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Homestay Name *
              </label>
              <input
                type="text"
                value={settings.homestayName}
                onChange={(e) =>
                  setSettings({ ...settings, homestayName: e.target.value })
                }
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Address
              </label>
              <textarea
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            GST Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                GST Number
              </label>
              <input
                type="text"
                value={settings.gstNumber}
                onChange={(e) =>
                  setSettings({ ...settings, gstNumber: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CGST Percentage (%)
                </label>
                <input
                  type="number"
                  value={settings.cgstPercentage}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      cgstPercentage: parseFloat(e.target.value) || 0,
                    })
                  }
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="e.g., 9"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  For domestic invoices
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  SGST Percentage (%)
                </label>
                <input
                  type="number"
                  value={settings.sgstPercentage}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      sgstPercentage: parseFloat(e.target.value) || 0,
                    })
                  }
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="e.g., 9"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  For domestic invoices
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  IGST Percentage (%)
                </label>
                <input
                  type="number"
                  value={settings.igstPercentage}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      igstPercentage: parseFloat(e.target.value) || 0,
                    })
                  }
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="e.g., 18"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  For international invoices
                </p>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Note:</strong> GST will be calculated automatically based on invoice value:
                <br />
                • If invoice value &gt; ₹7,500: GST rate is 18%
                <br />
                • If invoice value ≤ ₹7,500: GST rate is 5%
                <br />
                • For international invoices, IGST will be used
                <br />
                • For domestic invoices, CGST and SGST will be split equally
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Logo
          </h2>
          {settings.logo && !logoFile && (
            <div className="mb-4">
              <div className="relative inline-block">
                <img
                  src={`/api/uploads/${settings.logo}`}
                  alt="Logo"
                  className="h-24 border border-gray-300 dark:border-gray-600 rounded"
                  onError={(e) => {
                    console.error('Error loading logo:', settings.logo);
                    e.target.style.display = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={removeLogo}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
          {logoFile && (
            <div className="mb-4">
              <div className="relative inline-block">
                <img
                  src={URL.createObjectURL(logoFile)}
                  alt="New Logo"
                  className="h-24 border border-gray-300 dark:border-gray-600 rounded"
                />
                <button
                  type="button"
                  onClick={() => setLogoFile(null)}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
          {!logoFile && (
            <DragDrop
              onFilesSelected={(files) => setLogoFile(files[0])}
              accept="image/*"
              multiple={false}
            />
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Signature
          </h2>
          {settings.signature && !signatureFile && (
            <div className="mb-4">
              <div className="relative inline-block">
                <img
                  src={`/api/uploads/${settings.signature}`}
                  alt="Signature"
                  className="h-24 border border-gray-300 dark:border-gray-600 rounded"
                  onError={(e) => {
                    console.error('Error loading signature:', settings.signature);
                    e.target.style.display = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={removeSignature}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
          {signatureFile && (
            <div className="mb-4">
              <div className="relative inline-block">
                <img
                  src={URL.createObjectURL(signatureFile)}
                  alt="New Signature"
                  className="h-24 border border-gray-300 dark:border-gray-600 rounded"
                />
                <button
                  type="button"
                  onClick={() => setSignatureFile(null)}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
          {!signatureFile && (
            <DragDrop
              onFilesSelected={(files) => setSignatureFile(files[0])}
              accept="image/*"
              multiple={false}
            />
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Homestay Seal
          </h2>
          {settings.homestaySeal && !homestaySealFile && (
            <div className="mb-4">
              <div className="relative inline-block">
                <img
                  src={`/api/uploads/${settings.homestaySeal}`}
                  alt="Homestay Seal"
                  className="h-24 border border-gray-300 dark:border-gray-600 rounded"
                  onError={(e) => {
                    console.error('Error loading homestay seal:', settings.homestaySeal);
                    e.target.style.display = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={removeHomestaySeal}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
          {homestaySealFile && (
            <div className="mb-4">
              <div className="relative inline-block">
                <img
                  src={URL.createObjectURL(homestaySealFile)}
                  alt="New Homestay Seal"
                  className="h-24 border border-gray-300 dark:border-gray-600 rounded"
                />
                <button
                  type="button"
                  onClick={() => setHomestaySealFile(null)}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
          {!homestaySealFile && (
            <DragDrop
              onFilesSelected={(files) => setHomestaySealFile(files[0])}
              accept="image/*"
              multiple={false}
            />
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Additional Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Extra Notes
              </label>
              <textarea
                value={settings.extraNotes}
                onChange={(e) =>
                  setSettings({ ...settings, extraNotes: e.target.value })
                }
                rows={4}
                placeholder="Additional notes to appear on invoice..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Terms & Conditions
              </label>
              <textarea
                value={settings.termsAndConditions}
                onChange={(e) =>
                  setSettings({ ...settings, termsAndConditions: e.target.value })
                }
                rows={4}
                placeholder="Terms and conditions to appear on invoice..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Save size={20} />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceSettings;

