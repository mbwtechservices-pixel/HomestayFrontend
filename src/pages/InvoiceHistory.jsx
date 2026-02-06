import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Search, Download, Mail, Eye, Filter, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import InvoicePreview from '../components/InvoicePreview';

const InvoiceHistory = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [settings, setSettings] = useState(null);
  const [sendingEmailId, setSendingEmailId] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [invoiceToUpdate, setInvoiceToUpdate] = useState(null);
  const [paymentMode, setPaymentMode] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchInvoices();
    fetchSettings();
  }, [filter, startDate, endDate]);

  useEffect(() => {
    if (search) {
      const timeoutId = setTimeout(() => {
        fetchInvoices();
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      fetchInvoices();
    }
  }, [search]);

  const fetchInvoices = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filter !== 'all') params.append('filter', filter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get(`/invoices?${params.toString()}`);
      setInvoices(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      setSettings(response.data.data);
    } catch (error) {
      console.error('Failed to fetch settings');
    }
  };

  const handleDownloadPDF = async (invoiceId) => {
    try {
      const invoice = invoices.find((inv) => inv._id === invoiceId);
      const token = localStorage.getItem('token');
      
      // Method 1: Try fetch API with blob
      try {
        const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
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
        link.download = `Invoice-${invoice.invoiceNumber}.pdf`;
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

      // Method 2: Fallback - Use window.open with token in URL (less secure but works)
      const url = `/api/invoices/${invoiceId}/pdf?token=${encodeURIComponent(token)}`;
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

  const handleSendEmail = async (invoiceId) => {
    setSendingEmailId(invoiceId);
    try {
      await api.post(`/invoices/${invoiceId}/send-email`);
      toast.success('Invoice sent via email successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleView = async (invoiceId) => {
    try {
      const response = await api.get(`/invoices/${invoiceId}`);
      setSelectedInvoice(response.data.data);
      setShowPreview(true);
    } catch (error) {
      toast.error('Failed to fetch invoice');
    }
  };

  const handleStatusChange = (invoice) => {
    setInvoiceToUpdate(invoice);
    setPaymentMode(invoice.paymentMode || '');
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!invoiceToUpdate) return;

    if (invoiceToUpdate.status === 'pending' && !paymentMode) {
      toast.error('Please select a payment mode');
      return;
    }

    setUpdatingStatus(true);
    try {
      const response = await api.put(`/invoices/${invoiceToUpdate._id}/status`, {
        status: invoiceToUpdate.status === 'pending' ? 'paid' : 'pending',
        paymentMode: invoiceToUpdate.status === 'pending' ? paymentMode : null,
      });

      // Update the invoice in the list
      setInvoices(invoices.map(inv => 
        inv._id === invoiceToUpdate._id ? response.data.data : inv
      ));

      toast.success('Payment status updated successfully');
      setShowStatusModal(false);
      setInvoiceToUpdate(null);
      setPaymentMode('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
        Invoice History
      </h1>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by invoice number or customer..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Invoices</option>
              <option value="daily">Today</option>
              <option value="monthly">This Month</option>
            </select>
          </div>
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start Date"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End Date"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Invoice Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Customer Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Base Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  GST
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No invoices found
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {invoice.customer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      ₹{invoice.pricing.baseAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {invoice.pricing.discount.enabled && invoice.pricing.discount.amount > 0
                        ? `-₹${invoice.pricing.discount.amount.toFixed(2)}`
                        : '₹0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      ₹{invoice.pricing.gstAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                      ₹{invoice.pricing.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        {invoice.status === 'paid' ? (
                          <button
                            onClick={() => handleStatusChange(invoice)}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800 cursor-pointer"
                            title="Click to change status"
                          >
                            <CheckCircle size={14} className="mr-1" />
                            Paid
                            {invoice.paymentMode && (
                              <span className="ml-1">({invoice.paymentMode.replace('_', ' ')})</span>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(invoice)}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800 cursor-pointer"
                            title="Click to mark as paid"
                          >
                            <XCircle size={14} className="mr-1" />
                            Pending
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(invoice._id)}
                          className="text-blue-600 hover:text-blue-700"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(invoice._id)}
                          className="text-green-600 hover:text-green-700"
                          title="Download PDF"
                        >
                          <Download size={18} />
                        </button>
                        <button
                          onClick={() => handleSendEmail(invoice._id)}
                          disabled={sendingEmailId === invoice._id}
                          className="text-purple-600 hover:text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Send Email"
                        >
                          {sendingEmailId === invoice._id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                          ) : (
                            <Mail size={18} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Invoice Preview
              </h2>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setSelectedInvoice(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <InvoicePreview invoice={selectedInvoice} settings={settings} />
            <div className="mt-4 flex space-x-3">
              <button
                onClick={() => handleDownloadPDF(selectedInvoice._id)}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
              >
                <Download size={16} />
                <span>Download PDF</span>
              </button>
              <button
                onClick={() => handleSendEmail(selectedInvoice._id)}
                disabled={sendingEmailId === selectedInvoice._id}
                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {sendingEmailId === selectedInvoice._id ? (
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
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && invoiceToUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Update Payment Status
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Invoice: <strong>{invoiceToUpdate.invoiceNumber}</strong>
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Current Status: <strong className="capitalize">{invoiceToUpdate.status}</strong>
            </p>
            {invoiceToUpdate.status === 'pending' ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Mode <span className="text-red-500">*</span>
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select Payment Mode</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="airbnb">Airbnb</option>
                  <option value="other">Other</option>
                </select>
              </div>
            ) : (
              <div className="mb-4">
                <p className="text-gray-600 dark:text-gray-400">
                  Current Payment Mode: <strong className="capitalize">{invoiceToUpdate.paymentMode?.replace('_', ' ') || 'N/A'}</strong>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Changing status to "Pending" will clear the payment mode.
                </p>
              </div>
            )}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setInvoiceToUpdate(null);
                  setPaymentMode('');
                }}
                className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={updatingStatus || (invoiceToUpdate.status === 'pending' && !paymentMode)}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {updatingStatus ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Mark as {invoiceToUpdate.status === 'pending' ? 'Paid' : 'Pending'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceHistory;

