import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Dashboard } from '../components/Dashboard';
import { Documents } from '../components/Documents';
import { Users } from '../components/Users';
import { Categories } from '../components/Categories';
import { Profile } from '../components/Profile';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI } from '../services/api';
import { toast } from '@/hooks/use-toast';

const Settings = () => {
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notifEnabled, setNotifEnabled] = useState(() => localStorage.getItem('notifications') !== 'off');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast({ title: 'Error', description: 'All password fields are required', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'New passwords do not match', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await usersAPI.changePassword(user.id, oldPassword, newPassword);
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
      toast({ title: 'Success', description: 'Password changed successfully' });
    } catch (err) {
      toast({ title: 'Error', description: err?.response?.data?.error || 'Failed to change password', variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleNotifToggle = () => {
    setNotifEnabled((prev) => {
      localStorage.setItem('notifications', prev ? 'off' : 'on');
      return !prev;
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div>
        <h3 className="text-lg font-semibold mb-2">Change Password</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input type="password" placeholder="Old Password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
          <Input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          <Input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
        </div>
        <div className="flex justify-end mt-2">
          <Button onClick={handleChangePassword} disabled={loading}>{loading ? 'Saving...' : 'Change Password'}</Button>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Notifications</h3>
        <div className="flex items-center space-x-4">
          <span>Email Notifications</span>
          <Button variant={notifEnabled ? 'default' : 'outline'} onClick={handleNotifToggle}>
            {notifEnabled ? 'Enabled' : 'Disabled'}
          </Button>
        </div>
      </div>
    </div>
  );
};

const Index = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <main className="flex-1 ml-16 md:ml-64 p-8 bg-gray-50">
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'documents' && <Documents />}
        {currentPage === 'users' && <Users />}
        {currentPage === 'categories' && <Categories />}
        {currentPage === 'profile' && <Profile />}
        {currentPage === 'settings' && <Settings />}
      </main>
    </div>
  );
};

export default Index;
