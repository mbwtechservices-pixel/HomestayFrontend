import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, DoorOpen } from 'lucide-react';
import DragDrop from '../components/DragDrop';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [homes, setHomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [formData, setFormData] = useState({
    homeId: '',
    name: '',
    type: '',
    pricePerDay: '',
    pricePerPerson: '',
    maxMembers: '',
    availableRooms: '',
    facilities: '',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [roomsRes, homesRes] = await Promise.all([
        api.get('/rooms'),
        api.get('/homes'),
      ]);
      setRooms(roomsRes.data.data);
      setHomes(homesRes.data.data);
    } catch (error) {
      toast.error('Failed to fetch data');
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

      if (editingRoom && existingImages.length > 0) {
        formDataToSend.append('existingImages', JSON.stringify(existingImages));
      }

      images.forEach((file) => {
        formDataToSend.append('images', file);
      });

      if (editingRoom) {
        await api.put(`/rooms/${editingRoom._id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Room updated successfully');
      } else {
        await api.post('/rooms', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Room created successfully');
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const resetForm = () => {
    setEditingRoom(null);
    setFormData({
      homeId: '',
      name: '',
      type: '',
      pricePerDay: '',
      pricePerPerson: '',
      maxMembers: '',
      availableRooms: '',
      facilities: '',
      description: '',
    });
    setImages([]);
    setExistingImages([]);
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      homeId: room.homeId._id,
      name: room.name,
      type: room.type || '',
      pricePerDay: room.pricePerDay.toString(),
      pricePerPerson: room.pricePerPerson.toString(),
      maxMembers: room.maxMembers.toString(),
      availableRooms: room.availableRooms.toString(),
      facilities: Array.isArray(room.facilities) ? room.facilities.join(', ') : '',
      description: room.description || '',
    });
    setExistingImages(room.images || []);
    setImages([]);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;

    try {
      await api.delete(`/rooms/${id}`);
      toast.success('Room deleted successfully');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete room');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Rooms</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Add Room</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
            No rooms found. Add your first room!
          </div>
        ) : (
          rooms.map((room) => (
            <div
              key={room._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
            >
              {room.images && room.images.length > 0 && (
                <img
                  src={`/api/uploads/${room.images[0]}`}
                  alt={room.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                      {room.name}
                    </h3>
                    {room.type && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{room.type}</p>
                    )}
                  </div>
                  <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
                    <DoorOpen className="text-green-600 dark:text-green-400" size={20} />
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {room.homeId?.name}
                </p>
                <div className="space-y-1 mb-4">
                  <p className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Per Day:</span>{' '}
                    <span className="font-semibold text-gray-800 dark:text-white">
                      ₹{room.pricePerDay}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Per Person:</span>{' '}
                    <span className="font-semibold text-gray-800 dark:text-white">
                      ₹{room.pricePerPerson}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Max Members:</span>{' '}
                    <span className="font-semibold text-gray-800 dark:text-white">
                      {room.maxMembers}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Available:</span>{' '}
                    <span className="font-semibold text-gray-800 dark:text-white">
                      {room.availableRooms}
                    </span>
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(room)}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center space-x-2"
                  >
                    <Edit size={16} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(room._id)}
                    className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center justify-center space-x-2"
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 my-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              {editingRoom ? 'Edit Room' : 'Add New Room'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Home *
                </label>
                <select
                  value={formData.homeId}
                  onChange={(e) => setFormData({ ...formData, homeId: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select Home</option>
                  {homes.map((home) => (
                    <option key={home._id} value={home._id}>
                      {home.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Room Name *
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
                    Room Type
                  </label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price Per Person (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.pricePerPerson}
                    onChange={(e) => setFormData({ ...formData, pricePerPerson: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Members *
                  </label>
                  <input
                    type="number"
                    value={formData.maxMembers}
                    onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value })}
                    required
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Available Rooms *
                  </label>
                  <input
                    type="number"
                    value={formData.availableRooms}
                    onChange={(e) => setFormData({ ...formData, availableRooms: e.target.value })}
                    required
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Facilities (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.facilities}
                  onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                  placeholder="WiFi, AC, TV, etc."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Room Images
                </label>
                <DragDrop
                  onFilesSelected={setImages}
                  accept="image/*"
                  multiple={true}
                  maxFiles={10}
                />
                {editingRoom && existingImages.length > 0 && (
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
                  {editingRoom ? 'Update' : 'Create'}
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

export default Rooms;

