import React from 'react';
import Sidebar from '../components/Sidebar';
import ChartSection from '../components/ChartSection';
import { Users, Bell, MessageSquare } from 'lucide-react';

const AdminDashboard = () => {
  // Mock data for admin dashboard
  const userStats = [
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 600 },
    { name: 'Apr', value: 800 },
    { name: 'May', value: 500 },
  ];

  const reminderStats = [
    { name: 'Mon', value: 120 },
    { name: 'Tue', value: 132 },
    { name: 'Wed', value: 101 },
    { name: 'Thu', value: 134 },
    { name: 'Fri', value: 90 },
    { name: 'Sat', value: 230 },
    { name: 'Sun', value: 210 },
  ];

  return (
    <div className="p-8 w-full">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Admin Dashboard</h1>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card bg-white">
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 p-3 rounded-full">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">1,234</p>
                </div>
              </div>
            </div>
            
            <div className="card bg-white">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Bell className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Reminders Sent</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">45.2k</p>
                </div>
              </div>
            </div>

            <div className="card bg-white">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <MessageSquare className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Support Messages</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">28</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="h-80">
              <ChartSection title="User Growth" data={userStats} type="bar" />
            </div>
            <div className="h-80">
              <ChartSection title="Daily Reminders" data={reminderStats} type="bar" />
            </div>
          </div>
        </div>
      </div>

  );
};

export default AdminDashboard;
