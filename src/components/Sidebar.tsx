import { useState } from 'react';
import { 
  Home, 
  FileText, 
  Users, 
  FolderOpen, 
  User, 
  Settings,
  LogOut,
  Menu,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Sidebar = ({ currentPage, setCurrentPage, isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'categories', label: 'Categories', icon: FolderOpen },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out successfully",
      description: "See you next time!",
    });
  };

  return (
    <div className={`fixed left-0 top-0 h-full bg-white shadow-lg transition-all duration-300 z-30 ${
      isOpen ? 'w-64' : 'w-16'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {isOpen && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-800">DocHub</span>
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* User Info */}
      {isOpen && user && (
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-500">{user.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="mt-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={`w-full flex items-center px-4 py-3 text-left hover:bg-blue-50 transition-colors ${
              currentPage === item.id ? 'bg-blue-100 border-r-4 border-blue-600 text-blue-600' : 'text-gray-700'
            }`}
          >
            <item.icon className="w-5 h-5 min-w-[20px]" />
            {isOpen && <span className="ml-3">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
        <button 
          onClick={() => setCurrentPage('settings')}
          className={`w-full flex items-center px-4 py-3 hover:bg-gray-100 rounded-lg transition-colors ${
            currentPage === 'settings' ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
          }`}
        >
          <Settings className="w-5 h-5 min-w-[20px]" />
          {isOpen && <span className="ml-3">Settings</span>}
        </button>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-2"
        >
          <LogOut className="w-5 h-5 min-w-[20px]" />
          {isOpen && <span className="ml-3">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export { Sidebar };
