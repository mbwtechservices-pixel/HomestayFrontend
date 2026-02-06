import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, X, Eye, Download, Mail, Calculator, Save, Check } from 'lucide-react';
import InvoicePreview from '../components/InvoicePreview';

const InvoiceGenerator = () => {
  const [homes, setHomes] = useState([]);
  const [selectedHome, setSelectedHome] = useState('');
  const [selectedHomeData, setSelectedHomeData] = useState(null);
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [stayDetails, setStayDetails] = useState({
    checkInDate: '',
    checkInTime: '',
    checkOutDate: '',
    checkOutTime: '',
    adults: 1,
    children: 0,
  });
  const [aadharDetails, setAadharDetails] = useState([]);
  const [customerGstNumber, setCustomerGstNumber] = useState('');
  const [isInternational, setIsInternational] = useState(false);
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discount, setDiscount] = useState({ type: 'flat', value: 0 });
  const [extraGuestCharges, setExtraGuestCharges] = useState(0);
  const [cleaningServiceCharges, setCleaningServiceCharges] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [pricing, setPricing] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchHomes();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (selectedHome) {
      const home = homes.find(h => h._id === selectedHome);
      setSelectedHomeData(home);
    } else {
      setSelectedHomeData(null);
    }
  }, [selectedHome, homes]);

  useEffect(() => {
    calculatePricing();
  }, [selectedHome, stayDetails, discountEnabled, discount, isInternational, extraGuestCharges, cleaningServiceCharges, otherCharges]);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      setSettings(response.data.data);
    } catch (error) {
      console.error('Failed to fetch settings');
    }
  };

  const fetchHomes = async () => {
    try {
      const response = await api.get('/homes');
      setHomes(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch homes');
    }
  };

  const calculatePricing = async () => {
    if (!selectedHomeData || !stayDetails.checkInDate || !stayDetails.checkOutDate) {
      setPricing(null);
      return;
    }

    try {
      const settingsRes = await api.get('/settings');
      const settings = settingsRes.data.data;

      const checkIn = new Date(`${stayDetails.checkInDate}T${stayDetails.checkInTime || '00:00'}`);
      const checkOut = new Date(`${stayDetails.checkOutDate}T${stayDetails.checkOutTime || '00:00'}`);
      const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

      if (days < 1) {
        setPricing(null);
        return;
      }

      let baseAmount = selectedHomeData.pricePerDay * days;

      // Calculate subtotal with all charges
      let subtotal = baseAmount + (parseFloat(extraGuestCharges) || 0) + (parseFloat(cleaningServiceCharges) || 0) + (parseFloat(otherCharges) || 0);

      let discountAmount = 0;
      if (discountEnabled && discount.value > 0) {
        if (discount.type === 'percentage') {
          discountAmount = (subtotal * discount.value) / 100;
        } else {
          discountAmount = discount.value;
        }
        discountAmount = Math.min(discountAmount, subtotal);
      }

      const amountAfterDiscount = subtotal - discountAmount;
      
      // Determine GST percentage based on invoice value
      const gstRate = amountAfterDiscount > 7500 ? 18 : 5;
      
      let cgstPercentage = 0;
      let sgstPercentage = 0;
      let igstPercentage = 0;
      let cgstAmount = 0;
      let sgstAmount = 0;
      let igstAmount = 0;
      let gstAmount = 0;
      let gstPercentage = gstRate;

      if (isInternational) {
        igstPercentage = settings.igstPercentage || gstRate;
        igstAmount = (amountAfterDiscount * igstPercentage) / 100;
        gstAmount = igstAmount;
        gstPercentage = igstPercentage;
      } else {
        cgstPercentage = settings.cgstPercentage || (gstRate / 2);
        sgstPercentage = settings.sgstPercentage || (gstRate / 2);
        cgstAmount = (amountAfterDiscount * cgstPercentage) / 100;
        sgstAmount = (amountAfterDiscount * sgstPercentage) / 100;
        gstAmount = cgstAmount + sgstAmount;
        gstPercentage = cgstPercentage + sgstPercentage;
      }

      const total = amountAfterDiscount + gstAmount;

      setPricing({
        baseAmount: parseFloat(baseAmount.toFixed(2)),
        extraGuestCharges: parseFloat((extraGuestCharges || 0).toFixed(2)),
        cleaningServiceCharges: parseFloat((cleaningServiceCharges || 0).toFixed(2)),
        otherCharges: parseFloat((otherCharges || 0).toFixed(2)),
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount: {
          enabled: discountEnabled,
          type: discount.type,
          value: discount.value,
          amount: parseFloat(discountAmount.toFixed(2)),
        },
        cgstPercentage: parseFloat(cgstPercentage),
        cgstAmount: parseFloat(cgstAmount.toFixed(2)),
        sgstPercentage: parseFloat(sgstPercentage),
        sgstAmount: parseFloat(sgstAmount.toFixed(2)),
        igstPercentage: parseFloat(igstPercentage),
        igstAmount: parseFloat(igstAmount.toFixed(2)),
        gstPercentage: parseFloat(gstPercentage),
        gstAmount: parseFloat(gstAmount.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
      });
    } catch (error) {
      console.error('Error calculating pricing:', error);
    }
  };

  const addAadharDetail = () => {
    setAadharDetails([
      ...aadharDetails,
      { personName: '', aadharNumber: '' },
    ]);
  };

  const removeAadharDetail = (index) => {
    setAadharDetails(aadharDetails.filter((_, i) => i !== index));
  };

  const updateAadharDetail = (index, field, value) => {
    const updated = [...aadharDetails];
    updated[index][field] = value;
    setAadharDetails(updated);
  };

  const handleGenerate = async () => {
    if (!selectedHome) {
      toast.error('Please select a home');
      return;
    }
    if (!customer.name || !customer.email || !customer.phone) {
      toast.error('Please fill in all required customer details');
      return;
    }
    if (!stayDetails.checkInDate || !stayDetails.checkOutDate) {
      toast.error('Please select check-in and check-out dates');
      return;
    }
    if (stayDetails.adults < 1) {
      toast.error('At least 1 adult is required');
      return;
    }

    const totalMembers = stayDetails.adults + (stayDetails.children || 0);
    if (selectedHomeData && totalMembers > selectedHomeData.maxNumbers) {
      toast.error(`Maximum ${selectedHomeData.maxNumbers} members allowed for this home`);
      return;
    }

    if (!pricing) {
      toast.error('Please wait for pricing calculation');
      return;
    }

    // Create preview invoice object (not saved to database)
    const checkInDateTime = new Date(`${stayDetails.checkInDate}T${stayDetails.checkInTime || '00:00'}`);
    const checkOutDateTime = new Date(`${stayDetails.checkOutDate}T${stayDetails.checkOutTime || '00:00'}`);
    const numberOfNights = Math.ceil((checkOutDateTime - checkInDateTime) / (1000 * 60 * 60 * 24));
    const numberOfGuests = stayDetails.adults + (stayDetails.children || 0);

    const previewInvoice = {
      _id: 'preview-' + Date.now(), // Temporary ID for preview
      invoiceNumber: 'PREVIEW-' + new Date().getTime(), // Temporary invoice number
      invoiceDate: invoiceDate || new Date().toISOString(),
      customer,
      stayDetails: {
        homeId: selectedHomeData,
        checkInDate: checkInDateTime.toISOString(),
        checkOutDate: checkOutDateTime.toISOString(),
        adults: parseInt(stayDetails.adults),
        children: parseInt(stayDetails.children || 0),
        numberOfNights,
        numberOfGuests,
      },
      aadharDetails: aadharDetails.filter(ad => ad.personName && ad.aadharNumber),
      customerGstNumber: customerGstNumber || '',
      isInternational: isInternational,
      pricing,
      status: 'pending',
      paymentMode: null,
      createdAt: new Date().toISOString(),
    };

    setGeneratedInvoice(previewInvoice);
    setSaved(false);
    setShowPreview(true);
    toast.success('Invoice preview generated! Click Save to store it.');
  };

  const handleSave = async () => {
    if (!generatedInvoice || !selectedHome) {
      toast.error('Please generate invoice preview first');
      return;
    }

    setSaving(true);
    try {
    const checkInDateTime = new Date(`${stayDetails.checkInDate}T${stayDetails.checkInTime || '00:00'}`);
    const checkOutDateTime = new Date(`${stayDetails.checkOutDate}T${stayDetails.checkOutTime || '00:00'}`);

    const invoiceData = {
      customer,
      stayDetails: {
        homeId: selectedHome,
        checkInDate: checkInDateTime.toISOString(),
        checkOutDate: checkOutDateTime.toISOString(),
        adults: parseInt(stayDetails.adults),
        children: parseInt(stayDetails.children || 0),
      },
      aadharDetails: aadharDetails.filter(ad => ad.personName && ad.aadharNumber),
      customerGstNumber: customerGstNumber || '',
      isInternational: isInternational,
      discount: discountEnabled ? { ...discount, enabled: true } : null,
      extraGuestCharges: parseFloat(extraGuestCharges) || 0,
      cleaningServiceCharges: parseFloat(cleaningServiceCharges) || 0,
      otherCharges: parseFloat(otherCharges) || 0,
      invoiceDate: invoiceDate || new Date().toISOString().split('T')[0],
    };

      const response = await api.post('/invoices', invoiceData);
      setGeneratedInvoice(response.data.data);
      setSaved(true);
      toast.success('Invoice saved successfully!');
      
      // Reset saved state after 3 seconds
      setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!generatedInvoice) return;
    // Can only download if invoice is saved (has real ID)
    if (generatedInvoice.invoiceNumber?.startsWith('PREVIEW-')) {
      toast.error('Please save the invoice first to download PDF');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      
      // Method 1: Try fetch API with blob
      try {
        const response = await fetch(`/api/invoices/${generatedInvoice._id}/pdf`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        
        // Verify it's a PDF by checking the first bytes
        const blobSlice = blob.slice(0, 4);
        const arrayBuffer = await blobSlice.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const isPDF = uint8Array[0] === 0x25 && uint8Array[1] === 0x50 && uint8Array[2] === 0x44 && uint8Array[3] === 0x46; // %PDF
        
        if (!isPDF) {
          // Might be JSON error
          const text = await blob.text();
          try {
            const errorData = JSON.parse(text);
            toast.error(errorData.message || 'Invalid PDF response');
            return;
          } catch {
            throw new Error('Invalid PDF file received');
          }
        }

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Invoice-${generatedInvoice.invoiceNumber}.pdf`;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
          window.URL.revokeObjectURL(url);
        }, 100);
        
        toast.success('PDF downloaded successfully');
        return;
      } catch (fetchError) {
        console.warn('Fetch method failed, trying alternative:', fetchError);
        // Fallback to window.open method
      }

      // Method 2: Fallback - Use window.open with token in URL
      const url = `/api/invoices/${generatedInvoice._id}/pdf?token=${encodeURIComponent(token)}`;
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        toast.error('Please allow popups to download PDF');
        return;
      }
      
      // Check if download started
      setTimeout(() => {
        toast.success('PDF download initiated');
      }, 500);
      
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error(error.message || 'Failed to download PDF');
    }
  };

  const handleSendEmail = async () => {
    if (!generatedInvoice) return;
    // Can only send email if invoice is saved (has real ID)
    if (generatedInvoice.invoiceNumber?.startsWith('PREVIEW-')) {
      toast.error('Please save the invoice first to send email');
      return;
    }
    setSendingEmail(true);
    try {
      await api.post(`/invoices/${generatedInvoice._id}/send-email`);
      toast.success('Invoice sent via email successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
        Invoice Generator
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Section */}
        <div className="space-y-6">
          {/* Customer Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Customer Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address
                </label>
                <textarea
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Customer GST Number (Optional)
                </label>
                <input
                  type="text"
                  value={customerGstNumber}
                  onChange={(e) => setCustomerGstNumber(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Stay Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Stay Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Home *
                </label>
                <select
                  value={selectedHome}
                  onChange={(e) => setSelectedHome(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select Home</option>
                  {homes.map((home) => (
                    <option key={home._id} value={home._id}>
                      {home.name} ({home.bhk}) - ₹{home.pricePerDay}/day
                    </option>
                  ))}
                </select>
                {selectedHomeData && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Max Members: {selectedHomeData.maxNumbers}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Check-in Date *
                  </label>
                  <input
                    type="date"
                    value={stayDetails.checkInDate}
                    onChange={(e) => setStayDetails({ ...stayDetails, checkInDate: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Check-in Time
                  </label>
                  <input
                    type="time"
                    value={stayDetails.checkInTime}
                    onChange={(e) => setStayDetails({ ...stayDetails, checkInTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Check-out Date *
                  </label>
                  <input
                    type="date"
                    value={stayDetails.checkOutDate}
                    onChange={(e) => setStayDetails({ ...stayDetails, checkOutDate: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Check-out Time
                  </label>
                  <input
                    type="time"
                    value={stayDetails.checkOutTime}
                    onChange={(e) => setStayDetails({ ...stayDetails, checkOutTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Number of Adults *
                  </label>
                  <input
                    type="number"
                    value={stayDetails.adults}
                    onChange={(e) => setStayDetails({ ...stayDetails, adults: Math.max(1, parseInt(e.target.value) || 1) })}
                    required
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Number of Children
                  </label>
                  <input
                    type="number"
                    value={stayDetails.children}
                    onChange={(e) => setStayDetails({ ...stayDetails, children: Math.max(0, parseInt(e.target.value) || 0) })}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isInternational}
                  onChange={(e) => setIsInternational(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  International Invoice (Use IGST)
                </label>
              </div>
            </div>
          </div>

          {/* Aadhar Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                Aadhar Details
              </h2>
              <button
                type="button"
                onClick={addAadharDetail}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center space-x-1"
              >
                <Plus size={16} />
                <span>Add</span>
              </button>
            </div>
            {aadharDetails.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No Aadhar details added. Click "Add" to add.
              </p>
            ) : (
              <div className="space-y-3">
                {aadharDetails.map((detail, index) => (
                  <div
                    key={index}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={detail.personName}
                          onChange={(e) => updateAadharDetail(index, 'personName', e.target.value)}
                          placeholder="Person Name"
                          className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <input
                          type="text"
                          value={detail.aadharNumber}
                          onChange={(e) => updateAadharDetail(index, 'aadharNumber', e.target.value)}
                          placeholder="Aadhar Number"
                          className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAadharDetail(index)}
                        className="ml-2 text-red-600 hover:text-red-700"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Additional Charges Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Additional Charges
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Invoice Date *
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Extra Guest Charges (₹)
                </label>
                <input
                  type="number"
                  value={extraGuestCharges}
                  onChange={(e) => setExtraGuestCharges(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cleaning / Service Charges (₹)
                </label>
                <input
                  type="number"
                  value={cleaningServiceCharges}
                  onChange={(e) => setCleaningServiceCharges(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Other Charges (₹)
                </label>
                <input
                  type="number"
                  value={otherCharges}
                  onChange={(e) => setOtherCharges(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Discount Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                Discount
              </h2>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={discountEnabled}
                  onChange={(e) => setDiscountEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Enable Discount
                </span>
              </label>
            </div>
            {discountEnabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Discount Type
                  </label>
                  <select
                    value={discount.type}
                    onChange={(e) =>
                      setDiscount({ ...discount, type: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="flat">Flat Amount (₹)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Discount Value
                  </label>
                  <input
                    type="number"
                    value={discount.value}
                    onChange={(e) =>
                      setDiscount({ ...discount, value: parseFloat(e.target.value) || 0 })
                    }
                    min="0"
                    step={discount.type === 'percentage' ? '0.01' : '1'}
                    max={discount.type === 'percentage' ? 100 : undefined}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Pricing Summary */}
          {pricing && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center space-x-2">
                <Calculator size={20} />
                <span>Pricing Summary</span>
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Room Tariff:</span>
                  <span className="font-semibold text-gray-800 dark:text-white">
                    ₹{pricing.baseAmount.toFixed(2)}
                  </span>
                </div>
                {pricing.extraGuestCharges > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Extra Guest Charges:</span>
                    <span className="font-semibold text-gray-800 dark:text-white">
                      ₹{pricing.extraGuestCharges.toFixed(2)}
                    </span>
                  </div>
                )}
                {pricing.cleaningServiceCharges > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Cleaning / Service Charges:</span>
                    <span className="font-semibold text-gray-800 dark:text-white">
                      ₹{pricing.cleaningServiceCharges.toFixed(2)}
                    </span>
                  </div>
                )}
                {pricing.otherCharges > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Other Charges:</span>
                    <span className="font-semibold text-gray-800 dark:text-white">
                      ₹{pricing.otherCharges.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-300 dark:border-gray-600 pt-2">
                  <span className="text-gray-600 dark:text-gray-400 font-semibold">Subtotal:</span>
                  <span className="font-semibold text-gray-800 dark:text-white">
                    ₹{pricing.subtotal.toFixed(2)}
                  </span>
                </div>
                {pricing.discount.enabled && pricing.discount.amount > 0 && (
                  <div className="flex justify-between text-red-600 dark:text-red-400">
                    <span>Discount:</span>
                    <span className="font-semibold">
                      -₹{pricing.discount.amount.toFixed(2)}
                    </span>
                  </div>
                )}
                {isInternational && pricing.igstAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      IGST ({pricing.igstPercentage}%):
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-white">
                      ₹{pricing.igstAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                {!isInternational && (
                  <>
                    {pricing.cgstAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          CGST ({pricing.cgstPercentage}%):
                        </span>
                        <span className="font-semibold text-gray-800 dark:text-white">
                          ₹{pricing.cgstAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {pricing.sgstAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          SGST ({pricing.sgstPercentage}%):
                        </span>
                        <span className="font-semibold text-gray-800 dark:text-white">
                          ₹{pricing.sgstAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </>
                )}
                <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-800 dark:text-white">
                      Total:
                    </span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      ₹{pricing.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Generate Preview Button */}
          <button
            onClick={handleGenerate}
            disabled={!pricing}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            Generate Preview
          </button>
        </div>

        {/* Preview Section */}
        <div className="lg:sticky lg:top-6 lg:h-screen lg:overflow-y-auto">
          {generatedInvoice && showPreview ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  Invoice Preview
                </h2>
                {generatedInvoice.invoiceNumber?.startsWith('PREVIEW-') && (
                  <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                    Preview Only
                  </span>
                )}
              </div>
              
              <InvoicePreview invoice={generatedInvoice} settings={settings} />
              
              <div className="mt-4 flex flex-col space-y-2">
                {generatedInvoice.invoiceNumber?.startsWith('PREVIEW-') ? (
                  <button
                    onClick={handleSave}
                    disabled={saving || saved}
                    className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : saved ? (
                      <>
                        <Check size={16} className="text-green-300" />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>Save Invoice</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleDownloadPDF}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
                    >
                      <Download size={16} />
                      <span>Download PDF</span>
                    </button>
                    <button
                      onClick={handleSendEmail}
                      disabled={sendingEmail}
                      className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {sendingEmail ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Mail size={16} />
                          <span>Send Email</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Eye size={48} className="mx-auto mb-4 opacity-50" />
                <p>Invoice preview will appear here</p>
                <p className="text-sm mt-2">Generate an invoice to see preview</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerator;
