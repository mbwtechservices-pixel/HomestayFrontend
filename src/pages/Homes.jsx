import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Home as HomeIcon } from 'lucide-react';
import DragDrop from '../components/DragDrop';

const Homes = () => {
  const [homes, setHomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingHome, setEditingHome] = useState(null);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    bhk: '1BHK',
    pricePerDay: '',
    maxNumbers: '',
    amenities: '',
    notes: '',
  });

  useEffect(() => {
    fetchHomes();
  }, []);

  const fetchHomes = async () => {
    try {
      const response = await api.get('/homes');
      setHomes(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch homes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });

      if (editingHome && existingImages.length > 0) {
        formDataToSend.append('existingImages', JSON.stringify(existingImages));
      }

      images.forEach((file) => {
        formDataToSend.append('images', file);
      });

      if (editingHome) {
        await api.put(`/homes/${editingHome._id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Home updated successfully');
      } else {
        await api.post('/homes', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Home created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchHomes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const resetForm = () => {
    setEditingHome(null);
    setFormData({
      name: '',
      address: '',
      bhk: '1BHK',
      pricePerDay: '',
      maxNumbers: '',
      amenities: '',
      notes: '',
    });
    setImages([]);
    setExistingImages([]);
  };

  const handleEdit = (home) => {
    setEditingHome(home);
    setFormData({
      name: home.name,
      address: home.address,
      bhk: home.bhk || '1BHK',
      pricePerDay: home.pricePerDay?.toString() || '',
      maxNumbers: home.maxNumbers?.toString() || '',
      amenities: Array.isArray(home.amenities) ? home.amenities.join(', ') : '',
      notes: home.notes || '',
    });
    setExistingImages(home.images || []);
    setImages([]);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this home?')) return;

    try {
      await api.delete(`/homes/${id}`);
      toast.success('Home deleted successfully');
      fetchHomes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete home');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Homes</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Add Home</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {homes.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
            No homes found. Add your first home!
          </div>
        ) : (
          homes.map((home) => (
            <div
              key={home._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                    <HomeIcon className="text-blue-600 dark:text-blue-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                      {home.name}
                    </h3>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-2">{home.address}</p>
              <div className="space-y-1 mb-4">
                <p className="text-sm">
                  <span className="text-gray-600 dark:text-gray-400">BHK:</span>{' '}
                  <span className="font-semibold text-gray-800 dark:text-white">{home.bhk}</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Price/Day:</span>{' '}
                  <span className="font-semibold text-gray-800 dark:text-white">₹{home.pricePerDay}</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Max Members:</span>{' '}
                  <span className="font-semibold text-gray-800 dark:text-white">{home.maxNumbers}</span>
                </p>
                {home.amenities && home.amenities.length > 0 && (
                  <p className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Amenities:</span>{' '}
                    <span className="font-semibold text-gray-800 dark:text-white">{home.amenities.join(', ')}</span>
                  </p>
                )}
              </div>
              {home.images && home.images.length > 0 && (
                <div className="mb-4">
                  <img
                    src={`/api/uploads/${home.images[0]}`}
                    alt={home.name}
                    className="w-full h-32 object-cover rounded"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(home)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center space-x-2"
                >
                  <Edit size={16} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(home._id)}
                  className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center justify-center space-x-2"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              {editingHome ? 'Edit Home' : 'Add New Home'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Home Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address *
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    BHK *
                  </label>
                  <select
                    value={formData.bhk}
                    onChange={(e) => setFormData({ ...formData, bhk: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="1BHK">1BHK</option>
                    <option value="2BHK">2BHK</option>
                    <option value="3BHK">3BHK</option>
                    <option value="4BHK">4BHK</option>
                    <option value="5BHK">5BHK</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price Per Day (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.pricePerDay}
                    onChange={(e) => setFormData({ ...formData, pricePerDay: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Numbers Allowed *
                </label>
                <input
                  type="number"
                  value={formData.maxNumbers}
                  onChange={(e) => setFormData({ ...formData, maxNumbers: e.target.value })}
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amenities (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.amenities}
                  onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                  placeholder="WiFi, AC, TV, Parking, etc."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Home Images
                </label>
                <DragDrop
                  onFilesSelected={setImages}
                  accept="image/*"
                  multiple={true}
                  maxFiles={10}
                />
                {editingHome && existingImages.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Existing Images:</p>
                    <div className="grid grid-cols-4 gap-2">
                      {existingImages.map((img, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={`/api/uploads/${img}`}
                            alt={`Existing ${idx + 1}`}
                            className="w-full h-20 object-cover rounded"
                            onError={(e) => {
                              e.target.src = '/placeholder-image.png';
                              e.target.alt = 'Image not found';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setExistingImages(existingImages.filter((_, i) => i !== idx));
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  {editingHome ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Homes;

