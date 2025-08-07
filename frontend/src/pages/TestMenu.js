import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const TestMenu = () => {
  const { user } = useAuth();

  // 模拟Layout组件中的菜单逻辑
  const getNavigation = () => {
    if (user?.role === 'admin') {
      return [
        { name: 'Admin Dashboard', href: '/admin' },
        { name: 'User Management', href: '/admin/users' },
        { name: 'Withdrawal Approval', href: '/admin/withdrawals' },
        { name: 'Audit Logs', href: '/admin/audit' },
        { name: 'Treasury Control', href: '/treasury' },
      ];
    } else {
      const baseMenu = [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Profile', href: '/profile' },
        { name: 'Payments', href: '/payments' },
        { name: 'Stakes', href: '/stakes' },
        { name: 'Deposits', href: '/deposits' },
        { name: 'Withdrawals', href: '/withdrawals' },
        { name: 'KYC', href: '/kyc' },
      ];

      const enterpriseMenu = user?.isEnterpriseAdmin ? [
        { name: 'Enterprise Users', href: '/enterprise/users' },
        { name: 'Enterprise Settings', href: '/enterprise/settings' },
        { name: 'Treasury Control', href: '/treasury' }
      ] : [];

      const enterpriseUserMenu = user?.isEnterpriseUser && !user?.isEnterpriseAdmin ? [
        { name: 'Treasury Control', href: '/treasury' }
      ] : [];

      return [...baseMenu, ...enterpriseMenu, ...enterpriseUserMenu];
    }
  };

  const navigation = getNavigation();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Menu Test</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Data */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">User Data</h2>
          <div className="space-y-2 text-sm">
            <div><strong>ID:</strong> {user?.id}</div>
            <div><strong>Name:</strong> {user?.name}</div>
            <div><strong>Email:</strong> {user?.email}</div>
            <div><strong>Role:</strong> {user?.role}</div>
            <div><strong>Is Enterprise Admin:</strong> {user?.isEnterpriseAdmin ? '✅ Yes' : '❌ No'}</div>
            <div><strong>Is Enterprise User:</strong> {user?.isEnterpriseUser ? '✅ Yes' : '❌ No'}</div>
            <div><strong>Enterprise Role:</strong> {user?.enterpriseRole}</div>
            <div><strong>Company Name:</strong> {user?.companyName}</div>
            <div><strong>Company Type:</strong> {user?.enterpriseCompanyType}</div>
          </div>
        </div>

        {/* Menu Logic */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Menu Logic</h2>
          <div className="space-y-2 text-sm">
            <div><strong>user?.role === 'admin':</strong> {user?.role === 'admin' ? '✅ Yes' : '❌ No'}</div>
            <div><strong>user?.isEnterpriseAdmin:</strong> {user?.isEnterpriseAdmin ? '✅ Yes' : '❌ No'}</div>
            <div><strong>user?.isEnterpriseUser && !user?.isEnterpriseAdmin:</strong> {(user?.isEnterpriseUser && !user?.isEnterpriseAdmin) ? '✅ Yes' : '❌ No'}</div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Navigation Menu ({navigation.length} items)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {navigation.map((item, index) => (
            <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <span className="text-blue-600 font-medium">{index + 1}.</span>
              <span className="font-medium">{item.name}</span>
              <span className="text-gray-500 text-sm">({item.href})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Expected Menu for Enterprise Admin */}
      {user?.isEnterpriseAdmin && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-green-800 mb-4">✅ Expected Menu for Enterprise Admin</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>✅ Dashboard</div>
            <div>✅ Profile</div>
            <div>✅ Payments</div>
            <div>✅ Stakes</div>
            <div>✅ Deposits</div>
            <div>✅ Withdrawals</div>
            <div>✅ KYC</div>
            <div>✅ Enterprise Users</div>
            <div>✅ Enterprise Settings</div>
            <div>✅ Treasury Control</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestMenu; 