import { useState, useEffect } from 'react';
import api from '../services/api';
import { Home, FileText, DollarSign, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalHomes: 0,
    totalRooms: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    allTimeInvoices: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [homesRes, invoicesRes] = await Promise.all([
        api.get('/homes'),
        api.get('/invoices?filter=daily'),
      ]);

      const homes = homesRes.data.data || [];
      const invoices = invoicesRes.data.data || [];

      const totalRevenue = invoices.reduce((sum, inv) => sum + inv.pricing.total, 0);

      setStats({
        totalHomes: homes.length,
        totalRooms: 0, // Rooms removed, keeping for compatibility
        totalInvoices: invoices.length,
        totalRevenue: totalRevenue,
      });

      // Get recent invoices (last 5) and total count
      try {
        const allInvoicesRes = await api.get('/invoices');
        const allInvoices = allInvoicesRes.data.data || [];
        setRecentInvoices(allInvoices.slice(0, 5));
        setStats(prev => ({ ...prev, allTimeInvoices: allInvoices.length }));
      } catch (error) {
        console.error('Error fetching all invoices:', error);
        setRecentInvoices([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Handle error gracefully - don't fail if rooms endpoint doesn't exist
      if (error.response?.status !== 404) {
        console.error('Error fetching dashboard data:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Homes</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                {stats.totalHomes}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
              <Home className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Today's Invoices</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                {stats.totalInvoices}
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
              <Calendar className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Today's Revenue</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                ₹{stats.totalRevenue.toFixed(2)}
              </p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
              <DollarSign className="text-yellow-600 dark:text-yellow-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">All Time Invoices</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                {stats.allTimeInvoices}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
              <FileText className="text-green-600 dark:text-green-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Recent Invoices</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Invoice Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {recentInvoices.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No invoices found
                  </td>
                </tr>
              ) : (
                recentInvoices.map((invoice) => (
                  <tr key={invoice._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {invoice.customer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      ₹{invoice.pricing.total.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

