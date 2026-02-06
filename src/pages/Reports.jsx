import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Download, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

const Reports = () => {
  const [reportType, setReportType] = useState('daily');
  const [dailyReport, setDailyReport] = useState(null);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [reportType, selectedDate, selectedYear, selectedMonth]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      if (reportType === 'daily') {
        const response = await api.get(`/reports/daily?date=${selectedDate}`);
        setDailyReport(response.data.data);
      } else {
        const response = await api.get(
          `/reports/monthly?year=${selectedYear}&month=${selectedMonth}`
        );
        setMonthlyReport(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      let url = '/reports/export?';
      if (reportType === 'daily') {
        url += `type=daily&date=${selectedDate}`;
      } else {
        url += `type=monthly&year=${selectedYear}&month=${selectedMonth}`;
      }

      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute(
        'download',
        `report-${reportType}-${selectedDate || `${selectedYear}-${selectedMonth}`}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
        Reports
      </h1>

      {/* Report Type Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setReportType('daily')}
            className={`px-4 py-2 rounded-lg ${
              reportType === 'daily'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'
            }`}
          >
            Daily Report
          </button>
          <button
            onClick={() => setReportType('monthly')}
            className={`px-4 py-2 rounded-lg ${
              reportType === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'
            }`}
          >
            Monthly Report
          </button>
        </div>

        <div className="flex space-x-4 items-end">
          {reportType === 'daily' ? (
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          ) : (
            <>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(
                    (year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    )
                  )}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {format(new Date(2000, month - 1, 1), 'MMMM')}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          <button
            onClick={handleExportCSV}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <Download size={20} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="text-center py-12">Loading report...</div>
      ) : (
        <>
          {reportType === 'daily' && dailyReport ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Total Invoices
                      </p>
                      <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                        {dailyReport.summary.totalInvoices}
                      </p>
                    </div>
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                      <Calendar className="text-blue-600 dark:text-blue-400" size={24} />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Total Revenue
                      </p>
                      <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                        ₹{dailyReport.summary.totalRevenue.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                      <TrendingUp className="text-green-600 dark:text-green-400" size={24} />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Total Discount
                      </p>
                      <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                        ₹{dailyReport.summary.totalDiscount.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
                      <TrendingUp className="text-yellow-600 dark:text-yellow-400" size={24} />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">GST Collected</p>
                      <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                        ₹{dailyReport.summary.totalGST.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                      <TrendingUp className="text-purple-600 dark:text-purple-400" size={24} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                    Day-wise Breakdown
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Invoice Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Base Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Discount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          GST
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {dailyReport.breakdown.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {item.invoiceNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {item.customerName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            ₹{item.baseAmount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            ₹{item.discount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            ₹{item.gst.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                            ₹{item.total.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.status === 'paid' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {item.status === 'paid' ? 'Paid' : 'Pending'}
                              {item.status === 'paid' && item.paymentMode && (
                                <span className="ml-1">({item.paymentMode.replace('_', ' ')})</span>
                              )}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : reportType === 'monthly' && monthlyReport ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Total Invoices
                      </p>
                      <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                        {monthlyReport.totalInvoices}
                      </p>
                    </div>
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                      <Calendar className="text-blue-600 dark:text-blue-400" size={24} />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Total Revenue
                      </p>
                      <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                        ₹{monthlyReport.totalRevenue.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                      <TrendingUp className="text-green-600 dark:text-green-400" size={24} />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Total Discount
                      </p>
                      <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                        ₹{monthlyReport.totalDiscount.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
                      <TrendingUp className="text-yellow-600 dark:text-yellow-400" size={24} />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">GST Total</p>
                      <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                        ₹{monthlyReport.totalGST.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                      <TrendingUp className="text-purple-600 dark:text-purple-400" size={24} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice List */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                    Month-wise Summary
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Invoice Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Base Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Discount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          GST
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {monthlyReport.invoices.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {item.invoiceNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {item.customerName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            ₹{item.baseAmount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            ₹{item.discount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            ₹{item.gst.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                            ₹{item.total.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.status === 'paid' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {item.status === 'paid' ? 'Paid' : 'Pending'}
                              {item.status === 'paid' && item.paymentMode && (
                                <span className="ml-1">({item.paymentMode.replace('_', ' ')})</span>
                              )}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No data available for selected period
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;

