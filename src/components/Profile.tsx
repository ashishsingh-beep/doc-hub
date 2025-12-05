import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Shield, Calendar, Edit2, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { usersAPI, statsAPI, documentsAPI } from '../services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const Profile = () => {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || 'John Doe',
    email: user?.email || 'john.doe@company.com'
  });
  const [userStats, setUserStats] = useState({ documentsUploaded: 0, storageUsed: 0, lastLogin: '', loading: true, error: null });
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [allDocsStats, setAllDocsStats] = useState({ documentsUploaded: 0, storageUsed: 0 });

  const userInfo = {
    name: user?.name || 'John Doe',
    email: user?.email || 'john.doe@company.com',
    role: user?.role || 'Administrator',
    joinDate: 'January 15, 2023',
    lastLogin: 'January 15, 2024 at 2:30 PM',
    documentsUploaded: 127,
    storageUsed: '2.4 GB',
    storageLimit: '10 GB'
  };

  useEffect(() => {
    if (!user?.id) return;
    setUserStats((s) => ({ ...s, loading: true, error: null }));
    statsAPI.getUserStats(user.id)
      .then(res => {
        const stats = res.data.stats;
        setUserStats({
          documentsUploaded: stats.documentsUploaded,
          storageUsed: stats.storageUsed,
          lastLogin: stats.lastLogin || '',
          loading: false,
          error: null
        });
      })
      .catch(err => {
        setUserStats((s) => ({ ...s, loading: false, error: 'Failed to load stats' }));
      });
  }, [user?.id]);

  // Function to fetch and update all docs stats
  const fetchAllDocsStats = useCallback(() => {
    documentsAPI.getDocuments()
      .then(res => {
        if (res.data.success) {
          const docs = res.data.documents;
          setAllDocsStats({
            documentsUploaded: docs.length,
            storageUsed: docs.reduce((sum, doc) => sum + (doc.file_size || 0), 0)
          });
        }
      });
  }, []);

  useEffect(() => {
    fetchAllDocsStats();
  }, [fetchAllDocsStats]);

  // Listen for custom events to trigger stats update
  useEffect(() => {
    const handler = () => fetchAllDocsStats();
    window.addEventListener('docs-updated', handler);
    return () => window.removeEventListener('docs-updated', handler);
  }, [fetchAllDocsStats]);

  const handleSaveProfile = async () => {
    // Validate form
    if (!editForm.name.trim()) {
      toast({ title: 'Name required', description: 'Please enter your name', variant: 'destructive' });
      return;
    }
    if (!editForm.email.trim()) {
      toast({ title: 'Email required', description: 'Please enter your email', variant: 'destructive' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editForm.email)) {
      toast({ title: 'Invalid email', description: 'Please enter a valid email address', variant: 'destructive' });
      return;
    }
    try {
      await usersAPI.updateProfile(user.id, { name: editForm.name, email: editForm.email, role: user.role });
      const updated = { ...user, name: editForm.name, email: editForm.email };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      toast({ title: 'Profile updated', description: 'Your profile has been updated successfully' });
      setIsEditing(false);
    } catch (err) {
      toast({ title: 'Error', description: err?.response?.data?.error || 'Failed to update profile', variant: 'destructive' });
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      name: userInfo.name,
      email: userInfo.email
    });
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    setShowPasswordDialog(true);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    try {
      await usersAPI.changePassword(user.id, passwordForm.oldPassword, passwordForm.newPassword);
      toast({ title: 'Password changed', description: 'Your password has been updated.' });
      setShowPasswordDialog(false);
      setPasswordForm({ oldPassword: '', newPassword: '' });
    } catch (err) {
      toast({ title: 'Error', description: err?.response?.data?.error || 'Failed to change password', variant: 'destructive' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEnableTwoFactor = () => {
    toast({
      title: "Two-Factor Authentication",
      description: "2FA setup wizard would start here. This would guide you through QR code setup.",
    });
  };

  const handleUploadPhoto = () => {
    toast({
      title: "Upload Photo",
      description: "Photo upload functionality would be implemented here",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        {!isEditing ? (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex space-x-2">
            <Button onClick={handleSaveProfile} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
            <Button variant="outline" onClick={handleCancelEdit}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  {isEditing ? (
                    <Input 
                      id="fullName" 
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <Input id="fullName" value={userInfo.name} readOnly className="bg-gray-50" />
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  {isEditing ? (
                    <Input 
                      id="email" 
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      placeholder="Enter your email"
                    />
                  ) : (
                    <Input id="email" value={userInfo.email} readOnly className="bg-gray-50" />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" value={userInfo.role} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <Label htmlFor="joinDate">Join Date</Label>
                  <Input id="joinDate" value={userInfo.joinDate} readOnly className="bg-gray-50" />
                </div>
              </div>
              
              {isEditing && (
                <div className="flex justify-start pt-4">
                  <Button variant="outline" onClick={handleUploadPhoto}>
                    <User className="w-4 h-4 mr-2" />
                    Upload Profile Photo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="w-full" onClick={handleChangePassword}>
                  <Shield className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
                <Button variant="outline" className="w-full" onClick={handleEnableTwoFactor}>
                  <Shield className="w-4 h-4 mr-2" />
                  Enable 2FA
                </Button>
              </div>
              
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Last login: {userStats.loading ? 'Loading...' : userStats.lastLogin || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Email verified: ✓</span>
                </div>
                {userStats.error && <div className="text-red-500">{userStats.error}</div>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats and Quick Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-200 transition-colors" onClick={handleUploadPhoto}>
                  <User className="w-10 h-10 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{isEditing ? editForm.name : userInfo.name}</h3>
                  <p className="text-gray-600">{userInfo.role}</p>
                  <p className="text-sm text-gray-500">{isEditing ? editForm.email : userInfo.email}</p>
                </div>
                {!isEditing && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Quick Edit
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Documents Uploaded</span>
                <span className="font-semibold">{allDocsStats.documentsUploaded}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Storage Used</span>
                <span className="font-semibold">{(allDocsStats.storageUsed / (1024*1024*1024)).toFixed(2)} GB</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{width: `${Math.min(100, (allDocsStats.storageUsed/(10*1024*1024*1024))*100)}%`}}></div>
              </div>
              <div className="text-sm text-gray-500 text-center">
                {(allDocsStats.storageUsed / (1024*1024*1024)).toFixed(2)} GB of 10 GB used
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Account Status</span>
                  <span className="text-green-600 font-medium">Active</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-medium">{userInfo.joinDate}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <Label htmlFor="oldPassword">Current Password</Label>
              <Input id="oldPassword" type="password" value={passwordForm.oldPassword} onChange={e => setPasswordForm(f => ({ ...f, oldPassword: e.target.value }))} required />
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))} required />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={passwordLoading}>{passwordLoading ? 'Saving...' : 'Change Password'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { Profile };
