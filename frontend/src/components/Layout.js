import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  CreditCard, 
  Lock, 
  ArrowUpRight, 
  ArrowDownLeft,
  FileText,
  Menu,
  X,
  LogOut,
  Shield,
  Users,
  Settings,
  Building
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Define navigation based on user role
  const getNavigation = () => {
    if (user?.role === 'admin') {
      return [
        { name: 'Admin Dashboard', href: '/admin', icon: Shield },
        { name: 'Settings', href: '/settings', icon: Settings },
      ];
    } else if (user?.role === 'enterprise_admin') {
      return [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'User Management', href: '/enterprise/users', icon: Users },
        { name: 'Subsidiaries', href: '/subsidiaries', icon: Building },
        { name: 'Payments', href: '/payments', icon: CreditCard },
        { name: 'Stakes', href: '/stakes', icon: Lock },
        { name: 'Deposits', href: '/deposits', icon: ArrowDownLeft },
        { name: 'Withdrawals', href: '/withdrawals', icon: ArrowUpRight },
        { name: 'KYC', href: '/kyc', icon: FileText },
        { name: 'Settings', href: '/settings', icon: Settings },
      ];
    } else if (user?.role === 'enterprise_finance_manager') {
      return [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Payments', href: '/payments', icon: CreditCard },
        { name: 'Stakes', href: '/stakes', icon: Lock },
        { name: 'Deposits', href: '/deposits', icon: ArrowDownLeft },
        { name: 'Withdrawals', href: '/withdrawals', icon: ArrowUpRight },
        { name: 'KYC', href: '/kyc', icon: FileText },
        { name: 'Settings', href: '/settings', icon: Settings },
      ];
    } else if (user?.role === 'enterprise_finance_operator') {
      return [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Payments', href: '/payments', icon: CreditCard },
        { name: 'Stakes', href: '/stakes', icon: Lock },
        { name: 'Deposits', href: '/deposits', icon: ArrowDownLeft },
        { name: 'Withdrawals', href: '/withdrawals', icon: ArrowUpRight },
        { name: 'KYC', href: '/kyc', icon: FileText },
        { name: 'Settings', href: '/settings', icon: Settings },
      ];
    } else if (user?.role === 'enterprise_user') {
      return [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Payments', href: '/payments', icon: CreditCard },
        { name: 'Stakes', href: '/stakes', icon: Lock },
        { name: 'Deposits', href: '/deposits', icon: ArrowDownLeft },
        { name: 'Withdrawals', href: '/withdrawals', icon: ArrowUpRight },
        { name: 'KYC', href: '/kyc', icon: FileText },
        { name: 'Settings', href: '/settings', icon: Settings },
      ];
    } else {
      // Default navigation for any other role or no role
      return [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Payments', href: '/payments', icon: CreditCard },
        { name: 'Stakes', href: '/stakes', icon: Lock },
        { name: 'Deposits', href: '/deposits', icon: ArrowDownLeft },
        { name: 'Withdrawals', href: '/withdrawals', icon: ArrowUpRight },
        { name: 'KYC', href: '/kyc', icon: FileText },
        { name: 'Settings', href: '/settings', icon: Settings },
      ];
    }
  };

  const navigation = getNavigation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (href) => location.pathname === href;

  return (
    <div className="flex h-screen bg-secondary-light">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
          <div className="flex items-center justify-between p-4 border-b border-secondary-lighter">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">U</span>
              </div>
              <span className="text-lg font-semibold text-secondary-dark">USDE</span>
            </div>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="w-6 h-6 text-secondary-dark" />
            </button>
          </div>
          <nav className="mt-4 px-4">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg mb-1 transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary text-white'
                    : 'text-secondary-dark hover:bg-secondary-light'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-white lg:border-r lg:border-secondary-lighter">
        <div className="flex items-center justify-between p-4 border-b border-secondary-lighter">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">U</span>
            </div>
            <span className="text-lg font-semibold text-secondary-dark">USDE</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive(item.href)
                  ? 'bg-primary text-white'
                  : 'text-secondary-dark hover:bg-secondary-light'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </a>
          ))}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-secondary-lighter">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-secondary-dark truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-secondary-dark/70 truncate">
                {user?.email || 'user@example.com'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-secondary-dark hover:bg-secondary-light rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-secondary-lighter">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">U</span>
            </div>
            <span className="text-lg font-semibold text-secondary-dark">USDE</span>
          </div>
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6 text-secondary-dark" />
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout; 